import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { query } from '../../infrastructure/db/index.js';
import { AppError } from '../../shared/errors/app-error.js';
import { idParamSchema, standardSuccessResponseSchema } from '../../shared/schemas/common.js';

const areaSchema = z.object({
  id: z.string().uuid(),
  site_id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  created_at: z.string().or(z.date()),
  updated_at: z.string().or(z.date()),
});

const createAreaBodySchema = z.object({
  site_id: z.string().uuid(),
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(255),
  description: z.string().optional(),
});

const updateAreaBodySchema = createAreaBodySchema.partial();

export const areasRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/v1/areas
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.view')],
      schema: {
        tags: ['Areas'],
        summary: 'List Areas / Pump Rooms',
        description: 'Returns all rooms/areas, optionally filtered by site_id.',
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          site_id: z.string().uuid().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { site_id } = request.query;
      let q = `SELECT a.*, s.name as site_name FROM areas a JOIN sites s ON a.site_id = s.id`;
      const params: any[] = [];
      if (site_id) {
        q += ` WHERE a.site_id = $1`;
        params.push(site_id);
      }
      q += ` ORDER BY a.code ASC`;

      const res = await query(q, params);
      return reply.send({ success: true, data: res.rows });
    }
  );

  // POST /api/v1/areas
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('area.manage')],
      schema: {
        tags: ['Areas'],
        summary: 'Create Area / Pump Room',
        security: [{ bearerAuth: [] }],
        body: createAreaBodySchema,
      },
    },
    async (request, reply) => {
      const b = request.body;
      const res = await query(
        `INSERT INTO areas (site_id, code, name, description)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [b.site_id, b.code, b.name, b.description || null]
      );
      const area = res.rows[0];

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
         VALUES ($1, 'AREA_CREATED', 'AREA', $2, $3)`,
        [request.user.id, area.id, JSON.stringify(area)]
      );

      return reply.status(201).send({ success: true, data: area });
    }
  );

  // GET /api/v1/areas/:id
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.view')],
      schema: {
        tags: ['Areas'],
        summary: 'Get Area Detail',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const res = await query(`SELECT * FROM areas WHERE id = $1`, [request.params.id]);
      if (res.rows.length === 0) throw AppError.notFound('Area not found');
      return reply.send({ success: true, data: res.rows[0] });
    }
  );

  // PATCH /api/v1/areas/:id
  fastify.patch(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('area.manage')],
      schema: {
        tags: ['Areas'],
        summary: 'Update Area',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateAreaBodySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const b = request.body;

      const res = await query(
        `UPDATE areas
         SET name = COALESCE($1, name),
             code = COALESCE($2, code),
             description = COALESCE($3, description),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [b.name, b.code, b.description, id]
      );
      if (res.rows.length === 0) throw AppError.notFound('Area not found');

      return reply.send({ success: true, data: res.rows[0] });
    }
  );

  // DELETE /api/v1/areas/:id
  fastify.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('area.manage')],
      schema: {
        tags: ['Areas'],
        summary: 'Delete Area',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(`DELETE FROM areas WHERE id = $1 RETURNING id`, [id]);
      if (res.rows.length === 0) throw AppError.notFound('Area not found');

      return reply.send({ success: true, data: { id, deleted: true } });
    }
  );

  // GET /api/v1/areas/:id/sensors (PRD Section 33)
  fastify.get(
    '/:id/sensors',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.view')],
      schema: {
        tags: ['Areas'],
        summary: 'Get Sensors Bound to Area',
        description: 'Returns sensors (e.g. water level, room ambient temperature) assigned to this area.',
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
         WHERE sb.area_id = $1 AND sb.active = true`,
        [id]
      );
      return reply.send({ success: true, data: res.rows });
    }
  );
};
