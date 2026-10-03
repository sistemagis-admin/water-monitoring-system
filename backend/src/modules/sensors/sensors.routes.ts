import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { query, transaction } from '../../infrastructure/db/index.js';
import { AppError } from '../../shared/errors/app-error.js';
import { idParamSchema, paginationQuerySchema } from '../../shared/schemas/common.js';

const createSensorBodySchema = z.object({
  site_id: z.string().uuid(),
  device_id: z.string().uuid().optional(),
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(255),
  sensor_type: z.enum([
    'FLOW_METER',
    'PRESSURE_SENSOR',
    'TEMPERATURE_SENSOR',
    'DISTANCE_SENSOR',
    'LEVEL_SENSOR',
    'CURRENT_SENSOR',
    'VIBRATION_SENSOR',
    'OTHER',
  ]),
  metric_code: z.string().min(1),
  unit: z.string().optional(),
  config: z.record(z.any()).optional(),
});

const updateSensorBodySchema = createSensorBodySchema.partial();

const bindSensorBodySchema = z
  .object({
    asset_id: z.string().uuid().optional(),
    area_id: z.string().uuid().optional(),
    role: z.string().optional(),
    effective_from: z.string().optional(),
  })
  .refine((data) => (data.asset_id && !data.area_id) || (!data.asset_id && data.area_id), {
    message: 'Exactly one target must be provided: either asset_id OR area_id',
  });

export const sensorsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/v1/sensors
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.view')],
      schema: {
        tags: ['Sensors & Bindings'],
        summary: 'List Sensors',
        description: 'Returns all sensor instances with active bindings, metric mappings, and source devices.',
        security: [{ bearerAuth: [] }],
        querystring: paginationQuerySchema.extend({
          site_id: z.string().uuid().optional(),
          sensor_type: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { page, page_size, site_id, sensor_type, search } = request.query;
      const offset = (page - 1) * page_size;

      const conditions: string[] = [];
      const params: any[] = [];

      if (site_id) {
        params.push(site_id);
        conditions.push(`s.site_id = $${params.length}`);
      }
      if (sensor_type) {
        params.push(sensor_type);
        conditions.push(`s.sensor_type = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        conditions.push(`(s.name ILIKE $${params.length} OR s.code ILIKE $${params.length})`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countRes = await query(`SELECT COUNT(*)::int as total FROM sensors s ${where}`, params);
      const total = countRes.rows[0].total;

      params.push(page_size, offset);
      const res = await query(
        `SELECT s.*, m.label as metric_label, m.category as metric_category,
                d.name as device_name, d.code as device_code,
                sb.id as binding_id, sb.asset_id, sb.area_id, sb.role as binding_role,
                a.name as bound_asset_name, ar.name as bound_area_name
         FROM sensors s
         JOIN metric_definitions m ON s.metric_code = m.code
         LEFT JOIN mqtt_devices d ON s.device_id = d.id
         LEFT JOIN sensor_bindings sb ON s.id = sb.sensor_id AND sb.active = true
         LEFT JOIN assets a ON sb.asset_id = a.id
         LEFT JOIN areas ar ON sb.area_id = ar.id
         ${where}
         ORDER BY s.code ASC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      return reply.send({
        success: true,
        data: res.rows,
        meta: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
      });
    }
  );

  // POST /api/v1/sensors
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('sensor.manage')],
      schema: {
        tags: ['Sensors & Bindings'],
        summary: 'Create Sensor Instance',
        security: [{ bearerAuth: [] }],
        body: createSensorBodySchema,
      },
    },
    async (request, reply) => {
      const b = request.body;

      // Verify metric exists
      const mRes = await query(`SELECT code FROM metric_definitions WHERE code = $1`, [b.metric_code]);
      if (mRes.rows.length === 0) {
        throw AppError.badRequest(`Metric definition code '${b.metric_code}' does not exist`);
      }

      const insRes = await query(
        `INSERT INTO sensors (site_id, device_id, code, name, sensor_type, metric_code, unit, config)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          b.site_id,
          b.device_id || null,
          b.code,
          b.name,
          b.sensor_type,
          b.metric_code,
          b.unit || null,
          JSON.stringify(b.config || {}),
        ]
      );
      const sensor = insRes.rows[0];

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
         VALUES ($1, 'SENSOR_CREATED', 'SENSOR', $2, $3)`,
        [request.user.id, sensor.id, JSON.stringify(sensor)]
      );

      return reply.status(201).send({ success: true, data: sensor });
    }
  );

  // GET /api/v1/sensors/topology (PRD Section 20 - Dynamic Configuration Model)
  fastify.get(
    '/topology',
    {
      onRequest: [fastify.authenticate, fastify.authorize('dashboard.view')],
      schema: {
        tags: ['Sensors & Bindings'],
        summary: 'Get Dynamic Plant Topology Model',
        description: 'Returns configuration-driven site -> areas -> assets with sensors and area_sensors as specified in PRD Section 20.',
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          site_id: z.string().uuid().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { site_id } = request.query;

      // 1. Resolve site
      let siteQ = `SELECT id, code, name, address, timezone, status FROM sites`;
      const siteParams: any[] = [];
      if (site_id) {
        siteQ += ` WHERE id = $1`;
        siteParams.push(site_id);
      }
      siteQ += ` LIMIT 1`;
      const sRes = await query(siteQ, siteParams);
      if (sRes.rows.length === 0) throw AppError.notFound('Site not found');
      const site = sRes.rows[0];

      // 2. Resolve areas
      const areasRes = await query(
        `SELECT id, code, name, description FROM areas WHERE site_id = $1 ORDER BY code ASC`,
        [site.id]
      );

      const areas = [];
      for (const area of areasRes.rows) {
        // Area sensors (e.g. water level)
        const areaSensorsRes = await query(
          `SELECT s.code, s.name as label, s.unit,
                  (SELECT ts.payload->'metrics'->>s.metric_code
                   FROM telemetry_samples ts
                   WHERE ts.payload->'metrics' ? s.metric_code
                   ORDER BY ts.received_at DESC LIMIT 1) as value
           FROM sensor_bindings sb
           JOIN sensors s ON sb.sensor_id = s.id
           WHERE sb.area_id = $1 AND sb.active = true`,
          [area.id]
        );

        // Assets in area
        const assetsRes = await query(
          `SELECT a.id, a.code, a.name, a.asset_type as type, a.status, a.metadata,
                  cs.status as live_status, cs.metrics, cs.quality, cs.control_enabled, cs.commandable
           FROM assets a
           LEFT JOIN asset_current_state cs ON a.id = cs.asset_id
           WHERE a.area_id = $1
           ORDER BY a.code ASC`,
          [area.id]
        );

        const assets = [];
        for (const ast of assetsRes.rows) {
          // Sensors bound to this asset
          const astSensorsRes = await query(
            `SELECT s.code, s.name as label, s.unit, s.metric_code
             FROM sensor_bindings sb
             JOIN sensors s ON sb.sensor_id = s.id
             WHERE sb.asset_id = $1 AND sb.active = true`,
            [ast.id]
          );

          const liveMetrics = ast.metrics || {};
          const mappedSensors = astSensorsRes.rows.map((s: any) => ({
            code: s.code,
            label: s.label,
            metric_code: s.metric_code,
            unit: s.unit,
            value: liveMetrics[s.metric_code] !== undefined ? liveMetrics[s.metric_code] : null,
          }));

          assets.push({
            id: ast.id,
            code: ast.code,
            name: ast.name,
            type: ast.type,
            status: ast.live_status || ast.status,
            capabilities: ast.metadata || { control_enabled: true, power_command: true },
            sensors: mappedSensors,
          });
        }

        areas.push({
          id: area.id,
          code: area.code,
          name: area.name,
          assets,
          area_sensors: areaSensorsRes.rows,
        });
      }

      return reply.send({
        success: true,
        data: {
          site: {
            id: site.id,
            code: site.code,
            name: site.name,
          },
          areas,
        },
      });
    }
  );

  // GET /api/v1/sensors/:id
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.view')],
      schema: {
        tags: ['Sensors & Bindings'],
        summary: 'Get Sensor Detail',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const res = await query(
        `SELECT s.*, m.label as metric_label, d.name as device_name,
                sb.asset_id, sb.area_id, sb.role as binding_role
         FROM sensors s
         JOIN metric_definitions m ON s.metric_code = m.code
         LEFT JOIN mqtt_devices d ON s.device_id = d.id
         LEFT JOIN sensor_bindings sb ON s.id = sb.sensor_id AND sb.active = true
         WHERE s.id = $1`,
        [request.params.id]
      );
      if (res.rows.length === 0) throw AppError.notFound('Sensor not found');
      return reply.send({ success: true, data: res.rows[0] });
    }
  );

  // PATCH /api/v1/sensors/:id
  fastify.patch(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('sensor.manage')],
      schema: {
        tags: ['Sensors & Bindings'],
        summary: 'Update Sensor',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateSensorBodySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const b = request.body;

      const res = await query(
        `UPDATE sensors
         SET name = COALESCE($1, name),
             device_id = COALESCE($2, device_id),
             unit = COALESCE($3, unit),
             config = COALESCE($4, config),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [b.name, b.device_id, b.unit, b.config ? JSON.stringify(b.config) : null, id]
      );
      if (res.rows.length === 0) throw AppError.notFound('Sensor not found');

      return reply.send({ success: true, data: res.rows[0] });
    }
  );

  // DELETE /api/v1/sensors/:id
  fastify.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('sensor.manage')],
      schema: {
        tags: ['Sensors & Bindings'],
        summary: 'Delete Sensor',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(`DELETE FROM sensors WHERE id = $1 RETURNING id`, [id]);
      if (res.rows.length === 0) throw AppError.notFound('Sensor not found');
      return reply.send({ success: true, data: { id, deleted: true } });
    }
  );

  // GET /api/v1/sensors/:id/binding (PRD Section 33)
  fastify.get(
    '/:id/binding',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.view')],
      schema: {
        tags: ['Sensors & Bindings'],
        summary: 'Get Sensor Binding',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(
        `SELECT sb.*, a.name as asset_name, ar.name as area_name
         FROM sensor_bindings sb
         LEFT JOIN assets a ON sb.asset_id = a.id
         LEFT JOIN areas ar ON sb.area_id = ar.id
         WHERE sb.sensor_id = $1 AND sb.active = true`,
        [id]
      );
      return reply.send({ success: true, data: res.rows[0] || null });
    }
  );

  // PUT /api/v1/sensors/:id/binding (PRD Section 33)
  fastify.put(
    '/:id/binding',
    {
      onRequest: [fastify.authenticate, fastify.authorize('sensor.manage')],
      schema: {
        tags: ['Sensors & Bindings'],
        summary: 'Bind Sensor to Pump or Area',
        description: 'Binds a sensor to either an asset or an area. Replaces previous active binding.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: bindSensorBodySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { asset_id, area_id, role, effective_from } = request.body;

      const result = await transaction(async (client) => {
        // Deactivate previous binding
        await client.query(
          `UPDATE sensor_bindings
           SET active = false, effective_to = CURRENT_TIMESTAMP
           WHERE sensor_id = $1 AND active = true`,
          [id]
        );

        // Insert new binding
        const insRes = await client.query(
          `INSERT INTO sensor_bindings (sensor_id, asset_id, area_id, role, active, effective_from)
           VALUES ($1, $2, $3, $4, true, COALESCE($5, CURRENT_TIMESTAMP))
           RETURNING *`,
          [id, asset_id || null, area_id || null, role || null, effective_from || null]
        );
        return insRes.rows[0];
      });

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
         VALUES ($1, 'SENSOR_BOUND', 'SENSOR_BINDING', $2, $3)`,
        [request.user.id, result.id, JSON.stringify(result)]
      );

      return reply.send({ success: true, data: result });
    }
  );

  // DELETE /api/v1/sensors/:id/binding (PRD Section 33)
  fastify.delete(
    '/:id/binding',
    {
      onRequest: [fastify.authenticate, fastify.authorize('sensor.manage')],
      schema: {
        tags: ['Sensors & Bindings'],
        summary: 'Unbind Sensor',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      await query(
        `UPDATE sensor_bindings
         SET active = false, effective_to = CURRENT_TIMESTAMP
         WHERE sensor_id = $1 AND active = true`,
        [id]
      );
      return reply.send({ success: true, data: { sensor_id: id, unbind: true } });
    }
  );
};

