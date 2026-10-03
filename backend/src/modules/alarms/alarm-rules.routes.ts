import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { query } from '../../infrastructure/db/index.js';
import { AppError } from '../../shared/errors/app-error.js';
import { idParamSchema, paginationQuerySchema } from '../../shared/schemas/common.js';

const createAlarmRuleBodySchema = z.object({
  code: z.string().min(2).max(100),
  name: z.string().min(2).max(255),
  site_id: z.string().uuid().optional(),
  asset_id: z.string().uuid().optional(),
  metric_code: z.string().min(1),
  rule_type: z.enum(['THRESHOLD', 'STATUS_EQUALS', 'DEVIATION', 'OFFLINE']).default('THRESHOLD'),
  operator: z.enum(['>', '>=', '<', '<=', '==', '!=']).default('>'),
  threshold: z.number(),
  secondary_threshold: z.number().optional(),
  severity: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  delay_seconds: z.number().int().default(0),
  recovery_seconds: z.number().int().default(0),
  cooldown_seconds: z.number().int().default(0),
  enabled: z.boolean().default(true),
  config: z.record(z.any()).optional(),
});

const updateAlarmRuleBodySchema = createAlarmRuleBodySchema.partial();

export const alarmRulesRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/v1/alarm-rules
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.view')],
      schema: {
        tags: ['Alarm Rules'],
        summary: 'List Alarm Rules',
        security: [{ bearerAuth: [] }],
        querystring: paginationQuerySchema.extend({
          site_id: z.string().uuid().optional(),
          asset_id: z.string().uuid().optional(),
          severity: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { page, page_size, site_id, asset_id, severity, search } = request.query;
      const offset = (page - 1) * page_size;

      const conditions: string[] = [];
      const params: any[] = [];

      if (site_id) {
        params.push(site_id);
        conditions.push(`ar.site_id = $${params.length}`);
      }
      if (asset_id) {
        params.push(asset_id);
        conditions.push(`ar.asset_id = $${params.length}`);
      }
      if (severity) {
        params.push(severity);
        conditions.push(`ar.severity = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        conditions.push(`(ar.name ILIKE $${params.length} OR ar.code ILIKE $${params.length})`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countRes = await query(`SELECT COUNT(*)::int as total FROM alarm_rules ar ${where}`, params);
      const total = countRes.rows[0].total;

      params.push(page_size, offset);
      const res = await query(
        `SELECT ar.*, s.name as site_name, ast.name as asset_name, ast.code as asset_code
         FROM alarm_rules ar
         LEFT JOIN sites s ON ar.site_id = s.id
         LEFT JOIN assets ast ON ar.asset_id = ast.id
         ${where}
         ORDER BY ar.created_at DESC
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

  // POST /api/v1/alarm-rules
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('alarm.manage')],
      schema: {
        tags: ['Alarm Rules'],
        summary: 'Create Alarm Rule',
        security: [{ bearerAuth: [] }],
        body: createAlarmRuleBodySchema,
      },
    },
    async (request, reply) => {
      const b = request.body;

      const insRes = await query(
        `INSERT INTO alarm_rules (
           code, name, site_id, asset_id, metric_code, rule_type,
           operator, threshold, secondary_threshold, severity,
           delay_seconds, recovery_seconds, cooldown_seconds, enabled, config
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [
          b.code,
          b.name,
          b.site_id || null,
          b.asset_id || null,
          b.metric_code,
          b.rule_type,
          b.operator,
          b.threshold,
          b.secondary_threshold ?? null,
          b.severity,
          b.delay_seconds ?? 0,
          b.recovery_seconds ?? 0,
          b.cooldown_seconds ?? 0,
          b.enabled ?? true,
          JSON.stringify(b.config || {}),
        ]
      );
      const rule = insRes.rows[0];

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
         VALUES ($1, 'ALARM_RULE_CREATED', 'ALARM_RULE', $2, $3)`,
        [request.user.id, rule.id, JSON.stringify(rule)]
      );

      return reply.status(201).send({ success: true, data: rule });
    }
  );

  // GET /api/v1/alarm-rules/:id
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.view')],
      schema: {
        tags: ['Alarm Rules'],
        summary: 'Get Alarm Rule Detail',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const res = await query(`SELECT * FROM alarm_rules WHERE id = $1`, [request.params.id]);
      if (res.rows.length === 0) throw AppError.notFound('Alarm rule not found');
      return reply.send({ success: true, data: res.rows[0] });
    }
  );

  // PATCH /api/v1/alarm-rules/:id
  fastify.patch(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('alarm.manage')],
      schema: {
        tags: ['Alarm Rules'],
        summary: 'Update Alarm Rule',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateAlarmRuleBodySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const b = request.body;

      const res = await query(
        `UPDATE alarm_rules
         SET name = COALESCE($1, name),
             threshold = COALESCE($2, threshold),
             operator = COALESCE($3, operator),
             severity = COALESCE($4, severity),
             delay_seconds = COALESCE($5, delay_seconds),
             recovery_seconds = COALESCE($6, recovery_seconds),
             enabled = COALESCE($7, enabled),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [b.name, b.threshold, b.operator, b.severity, b.delay_seconds, b.recovery_seconds, b.enabled, id]
      );
      if (res.rows.length === 0) throw AppError.notFound('Alarm rule not found');

      return reply.send({ success: true, data: res.rows[0] });
    }
  );

  // DELETE /api/v1/alarm-rules/:id
  fastify.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('alarm.manage')],
      schema: {
        tags: ['Alarm Rules'],
        summary: 'Delete Alarm Rule',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(`DELETE FROM alarm_rules WHERE id = $1 RETURNING id`, [id]);
      if (res.rows.length === 0) throw AppError.notFound('Alarm rule not found');
      return reply.send({ success: true, data: { id, deleted: true } });
    }
  );

  // POST /api/v1/alarm-rules/:id/enable (PRD Section 37)
  fastify.post(
    '/:id/enable',
    {
      onRequest: [fastify.authenticate, fastify.authorize('alarm.manage')],
      schema: {
        tags: ['Alarm Rules'],
        summary: 'Enable Alarm Rule',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(
        `UPDATE alarm_rules SET enabled = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id]
      );
      if (res.rows.length === 0) throw AppError.notFound('Alarm rule not found');
      return reply.send({ success: true, data: res.rows[0] });
    }
  );

  // POST /api/v1/alarm-rules/:id/disable (PRD Section 37)
  fastify.post(
    '/:id/disable',
    {
      onRequest: [fastify.authenticate, fastify.authorize('alarm.manage')],
      schema: {
        tags: ['Alarm Rules'],
        summary: 'Disable Alarm Rule',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(
        `UPDATE alarm_rules SET enabled = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id]
      );
      if (res.rows.length === 0) throw AppError.notFound('Alarm rule not found');
      return reply.send({ success: true, data: res.rows[0] });
    }
  );
};
