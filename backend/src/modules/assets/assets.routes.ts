import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { query } from '../../infrastructure/db/index.js';
import { AppError } from '../../shared/errors/app-error.js';
import { idParamSchema, paginationQuerySchema } from '../../shared/schemas/common.js';
import { pumpCommandService } from './pump-command.service.js';

const createAssetBodySchema = z.object({
  site_id: z.string().uuid(),
  area_id: z.string().uuid().optional(),
  device_id: z.string().uuid().optional(),
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(255),
  asset_type: z.enum(['PUMP', 'TANK', 'VALVE', 'MOTOR', 'SENSOR_DEVICE', 'OTHER']).default('PUMP'),
  asset_subtype: z.string().default('MAIN_PUMP'),
  metadata: z.record(z.any()).optional(),
});

const updateAssetBodySchema = createAssetBodySchema.partial();

const powerCommandBodySchema = z.object({
  desired_state: z.enum(['ON', 'OFF']),
  confirmation: z.boolean().refine((val) => val === true, {
    message: 'confirmation must be true to execute command',
  }),
  idempotency_key: z.string().optional(),
  note: z.string().optional(),
});

export const assetsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/v1/assets
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('asset.view')],
      schema: {
        tags: ['Assets & Pumps'],
        summary: 'List Assets / Pumps',
        description: 'Returns all assets/pumps with their live state, area, and device mapping.',
        security: [{ bearerAuth: [] }],
        querystring: paginationQuerySchema.extend({
          site_id: z.string().uuid().optional(),
          area_id: z.string().uuid().optional(),
          asset_type: z.string().optional(),
          status: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { page, page_size, site_id, area_id, asset_type, status, search } = request.query;
      const offset = (page - 1) * page_size;

      const conditions: string[] = [];
      const params: any[] = [];

      if (site_id) {
        params.push(site_id);
        conditions.push(`a.site_id = $${params.length}`);
      }
      if (area_id) {
        params.push(area_id);
        conditions.push(`a.area_id = $${params.length}`);
      }
      if (asset_type) {
        params.push(asset_type);
        conditions.push(`a.asset_type = $${params.length}`);
      }
      if (status) {
        params.push(status);
        conditions.push(`a.status = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        conditions.push(`(a.name ILIKE $${params.length} OR a.code ILIKE $${params.length})`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countRes = await query(`SELECT COUNT(*)::int as total FROM assets a ${where}`, params);
      const total = countRes.rows[0].total;

      params.push(page_size, offset);
      const res = await query(
        `SELECT a.*, s.name as site_name, ar.name as area_name, ar.code as area_code,
                d.name as device_name, d.code as device_code, d.status as device_status,
                cs.status as live_status, cs.metrics, cs.quality, cs.last_timestamp,
                cs.control_enabled, cs.commandable, cs.desired_state
         FROM assets a
         JOIN sites s ON a.site_id = s.id
         LEFT JOIN areas ar ON a.area_id = ar.id
         LEFT JOIN mqtt_devices d ON a.device_id = d.id
         LEFT JOIN asset_current_state cs ON a.id = cs.asset_id
         ${where}
         ORDER BY a.code ASC
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

  // POST /api/v1/assets
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.manage')],
      schema: {
        tags: ['Assets & Pumps'],
        summary: 'Create Asset / Pump',
        security: [{ bearerAuth: [] }],
        body: createAssetBodySchema,
      },
    },
    async (request, reply) => {
      const b = request.body;

      const insRes = await query(
        `INSERT INTO assets (site_id, area_id, device_id, code, name, asset_type, asset_subtype, status, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'STOPPED', $8)
         RETURNING *`,
        [
          b.site_id,
          b.area_id || null,
          b.device_id || null,
          b.code,
          b.name,
          b.asset_type || 'PUMP',
          b.asset_subtype || 'MAIN_PUMP',
          JSON.stringify(b.metadata || { control_enabled: true, power_command: true }),
        ]
      );
      const asset = insRes.rows[0];

      // Init current state
      await query(
        `INSERT INTO asset_current_state (asset_id, status, control_enabled, commandable)
         VALUES ($1, 'STOPPED', true, true)`,
        [asset.id]
      );

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
         VALUES ($1, 'ASSET_CREATED', 'ASSET', $2, $3)`,
        [request.user.id, asset.id, JSON.stringify(asset)]
      );

      return reply.status(201).send({ success: true, data: asset });
    }
  );

  // GET /api/v1/assets/:id
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('asset.view')],
      schema: {
        tags: ['Assets & Pumps'],
        summary: 'Get Asset Detail',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const res = await query(
        `SELECT a.*, s.name as site_name, ar.name as area_name, d.name as device_name,
                cs.status as live_status, cs.metrics, cs.quality, cs.last_timestamp,
                cs.control_enabled, cs.commandable, cs.desired_state
         FROM assets a
         JOIN sites s ON a.site_id = s.id
         LEFT JOIN areas ar ON a.area_id = ar.id
         LEFT JOIN mqtt_devices d ON a.device_id = d.id
         LEFT JOIN asset_current_state cs ON a.id = cs.asset_id
         WHERE a.id = $1`,
        [request.params.id]
      );
      if (res.rows.length === 0) throw AppError.notFound('Asset not found');
      return reply.send({ success: true, data: res.rows[0] });
    }
  );

  // PATCH /api/v1/assets/:id
  fastify.patch(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.manage')],
      schema: {
        tags: ['Assets & Pumps'],
        summary: 'Update Asset',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateAssetBodySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const b = request.body;

      const res = await query(
        `UPDATE assets
         SET name = COALESCE($1, name),
             area_id = COALESCE($2, area_id),
             device_id = COALESCE($3, device_id),
             asset_subtype = COALESCE($4, asset_subtype),
             metadata = COALESCE($5, metadata),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [b.name, b.area_id, b.device_id, b.asset_subtype, b.metadata ? JSON.stringify(b.metadata) : null, id]
      );
      if (res.rows.length === 0) throw AppError.notFound('Asset not found');

      return reply.send({ success: true, data: res.rows[0] });
    }
  );

  // DELETE /api/v1/assets/:id
  fastify.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.manage')],
      schema: {
        tags: ['Assets & Pumps'],
        summary: 'Delete Asset',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(`DELETE FROM assets WHERE id = $1 RETURNING id`, [id]);
      if (res.rows.length === 0) throw AppError.notFound('Asset not found');
      return reply.send({ success: true, data: { id, deleted: true } });
    }
  );

  // GET /api/v1/assets/:id/state (PRD Section 32 & 24.15)
  fastify.get(
    '/:id/state',
    {
      onRequest: [fastify.authenticate, fastify.authorize('asset.view')],
      schema: {
        tags: ['Assets & Pumps'],
        summary: 'Get Asset Live Current State',
        description: 'Returns real-time operational status, latest telemetry metrics, quality, and control states.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(
        `SELECT cs.*, a.code, a.name, a.asset_type, a.status as asset_status
         FROM asset_current_state cs
         JOIN assets a ON cs.asset_id = a.id
         WHERE cs.asset_id = $1`,
        [id]
      );
      if (res.rows.length === 0) throw AppError.notFound('Asset state not found');
      return reply.send({ success: true, data: res.rows[0] });
    }
  );

  // GET /api/v1/assets/:id/control (PRD Section 34 & 17.2)
  fastify.get(
    '/:id/control',
    {
      onRequest: [fastify.authenticate, fastify.authorize('command.view')],
      schema: {
        tags: ['Pump Control'],
        summary: 'Get Pump Remote Control Capabilities & Availability',
        description: 'Checks if remote control is enabled, device online status, and any command currently in progress.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(
        `SELECT a.id, a.code, a.name, a.status, a.metadata,
                d.code as device_code, d.status as device_status,
                cs.status as live_status, cs.control_enabled, cs.desired_state
         FROM assets a
         LEFT JOIN mqtt_devices d ON a.device_id = d.id
         LEFT JOIN asset_current_state cs ON a.id = cs.asset_id
         WHERE a.id = $1`,
        [id]
      );
      if (res.rows.length === 0) throw AppError.notFound('Asset not found');
      const asset = res.rows[0];

      // Check active command
      const cmdRes = await query(
        `SELECT * FROM pump_commands WHERE asset_id = $1 AND status IN ('PENDING', 'SENT') LIMIT 1`,
        [id]
      );

      const metadata = asset.metadata || {};
      const controlEnabled = metadata.control_enabled === true;
      const isDeviceOnline = asset.device_status === 'ONLINE';

      return reply.send({
        success: true,
        data: {
          asset_id: asset.id,
          asset_code: asset.code,
          control_enabled: controlEnabled,
          remote_control_allowed: controlEnabled && isDeviceOnline,
          device_online: isDeviceOnline,
          commands: ['PUMP_POWER'],
          active_command: cmdRes.rows[0] || null,
        },
      });
    }
  );

  // POST /api/v1/assets/:id/commands/power (PRD Section 34 & 10.2)
  fastify.post(
    '/:id/commands/power',
    {
      onRequest: [fastify.authenticate, fastify.authorize('pump.control')],
      schema: {
        tags: ['Pump Control'],
        summary: 'Issue Pump Power ON/OFF Command',
        description: 'Sends a commanded ON/OFF request to the PLC/Gateway with acknowledgement tracking and timeout safety.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: powerCommandBodySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { desired_state, confirmation, idempotency_key, note } = request.body;

      const command = await pumpCommandService.issuePowerCommand({
        assetId: id,
        desiredState: desired_state,
        confirmation,
        idempotencyKey: idempotency_key,
        note,
        userId: request.user.id,
      });

      return reply.status(202).send({
        success: true,
        data: {
          command_id: command.command_id,
          status: command.status,
          desired_state: command.desired_state,
          requested_at: command.requested_at,
          timeout_at: command.timeout_at,
        },
      });
    }
  );

  // GET /api/v1/assets/:id/commands (PRD Section 34)
  fastify.get(
    '/:id/commands',
    {
      onRequest: [fastify.authenticate, fastify.authorize('command.view')],
      schema: {
        tags: ['Pump Control'],
        summary: 'Get Pump Commands History',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        querystring: paginationQuerySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { page, page_size } = request.query;
      const offset = (page - 1) * page_size;

      const countRes = await query(`SELECT COUNT(*)::int as total FROM pump_commands WHERE asset_id = $1`, [id]);
      const total = countRes.rows[0].total;

      const res = await query(
        `SELECT pc.*, u.email as requested_by_email, u.full_name as requested_by_name
         FROM pump_commands pc
         LEFT JOIN users u ON pc.requested_by = u.id
         WHERE pc.asset_id = $1
         ORDER BY pc.requested_at DESC
         LIMIT $2 OFFSET $3`,
        [id, page_size, offset]
      );

      return reply.send({
        success: true,
        data: res.rows,
        meta: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
      });
    }
  );

  // GET /api/v1/assets/:id/sensors (PRD Section 33)
  fastify.get(
    '/:id/sensors',
    {
      onRequest: [fastify.authenticate, fastify.authorize('asset.view')],
      schema: {
        tags: ['Assets & Pumps'],
        summary: 'Get Sensors Bound to Asset',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(
        `SELECT s.*, sb.role as binding_role, sb.active as binding_active, m.label as metric_label
         FROM sensors s
         JOIN sensor_bindings sb ON s.id = sb.sensor_id
         JOIN metric_definitions m ON s.metric_code = m.code
         WHERE sb.asset_id = $1 AND sb.active = true`,
        [id]
      );
      return reply.send({ success: true, data: res.rows });
    }
  );

  // GET /api/v1/assets/:id/events (PRD Section 32)
  fastify.get(
    '/:id/events',
    {
      onRequest: [fastify.authenticate, fastify.authorize('asset.view')],
      schema: {
        tags: ['Assets & Pumps'],
        summary: 'Get Asset Events History',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        querystring: paginationQuerySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { page, page_size } = request.query;
      const offset = (page - 1) * page_size;

      const countRes = await query(`SELECT COUNT(*)::int as total FROM events WHERE asset_id = $1`, [id]);
      const total = countRes.rows[0].total;

      const res = await query(
        `SELECT * FROM events WHERE asset_id = $1 ORDER BY occurred_at DESC LIMIT $2 OFFSET $3`,
        [id, page_size, offset]
      );

      return reply.send({
        success: true,
        data: res.rows,
        meta: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
      });
    }
  );
};
