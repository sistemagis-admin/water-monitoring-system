import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { query } from '../../infrastructure/db/index.js';
import { AppError } from '../../shared/errors/app-error.js';
import { idParamSchema, paginationQuerySchema } from '../../shared/schemas/common.js';
import { sseManager } from '../../infrastructure/realtime/sse-manager.js';

const acknowledgeAlarmBodySchema = z.object({
  note: z.string().optional(),
});

const resolveAlarmBodySchema = z.object({
  reason: z.string().min(1, 'Resolution reason is required'),
});

export const alarmsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/v1/alarms
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('alarm.view')],
      schema: {
        tags: ['Alarms'],
        summary: 'List Alarms',
        description: 'Returns alarms filtered by site, asset, severity, and status.',
        security: [{ bearerAuth: [] }],
        querystring: paginationQuerySchema.extend({
          site_id: z.string().uuid().optional(),
          asset_id: z.string().uuid().optional(),
          status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']).optional(),
          severity: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
        }),
      },
    },
    async (request, reply) => {
      const { page, page_size, site_id, asset_id, status, severity, search } = request.query;
      const offset = (page - 1) * page_size;

      const conditions: string[] = [];
      const params: any[] = [];

      if (site_id) {
        params.push(site_id);
        conditions.push(`a.site_id = $${params.length}`);
      }
      if (asset_id) {
        params.push(asset_id);
        conditions.push(`a.asset_id = $${params.length}`);
      }
      if (status) {
        params.push(status);
        conditions.push(`a.status = $${params.length}`);
      }
      if (severity) {
        params.push(severity);
        conditions.push(`a.severity = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        conditions.push(`(a.message ILIKE $${params.length} OR ar.name ILIKE $${params.length})`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countRes = await query(
        `SELECT COUNT(*)::int as total
         FROM alarms a
         JOIN alarm_rules ar ON a.rule_id = ar.id
         ${where}`,
        params
      );
      const total = countRes.rows[0].total;

      params.push(page_size, offset);
      const res = await query(
        `SELECT a.*, ar.name as rule_name, ar.code as rule_code,
                ast.name as asset_name, ast.code as asset_code,
                s.name as site_name, u.full_name as acknowledged_by_name
         FROM alarms a
         JOIN alarm_rules ar ON a.rule_id = ar.id
         JOIN sites s ON a.site_id = s.id
         LEFT JOIN assets ast ON a.asset_id = ast.id
         LEFT JOIN users u ON a.acknowledged_by = u.id
         ${where}
         ORDER BY (CASE WHEN a.status = 'OPEN' THEN 1 WHEN a.status = 'ACKNOWLEDGED' THEN 2 ELSE 3 END), a.opened_at DESC
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

  // GET /api/v1/alarms/:id
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('alarm.view')],
      schema: {
        tags: ['Alarms'],
        summary: 'Get Alarm Detail',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const res = await query(
        `SELECT a.*, ar.name as rule_name, ar.operator, ar.threshold,
                ast.name as asset_name, ast.code as asset_code,
                s.name as site_name, u.full_name as acknowledged_by_name
         FROM alarms a
         JOIN alarm_rules ar ON a.rule_id = ar.id
         JOIN sites s ON a.site_id = s.id
         LEFT JOIN assets ast ON a.asset_id = ast.id
         LEFT JOIN users u ON a.acknowledged_by = u.id
         WHERE a.id = $1`,
        [request.params.id]
      );
      if (res.rows.length === 0) throw AppError.notFound('Alarm not found');

      // Get alarm history
      const histRes = await query(
        `SELECT ah.*, u.full_name as performed_by_name
         FROM alarm_history ah
         LEFT JOIN users u ON ah.performed_by = u.id
         WHERE ah.alarm_id = $1
         ORDER BY ah.created_at ASC`,
        [request.params.id]
      );

      return reply.send({
        success: true,
        data: {
          ...res.rows[0],
          history: histRes.rows,
        },
      });
    }
  );

  // POST /api/v1/alarms/:id/acknowledge (PRD Section 36 & FR-013)
  fastify.post(
    '/:id/acknowledge',
    {
      onRequest: [fastify.authenticate, fastify.authorize('alarm.ack')],
      schema: {
        tags: ['Alarms'],
        summary: 'Acknowledge Alarm',
        description: 'Operator acknowledges an active alarm with an optional investigation note.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: acknowledgeAlarmBodySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { note } = request.body;

      const alarmRes = await query(`SELECT * FROM alarms WHERE id = $1`, [id]);
      if (alarmRes.rows.length === 0) throw AppError.notFound('Alarm not found');
      const alarm = alarmRes.rows[0];

      if (alarm.status === 'RESOLVED') {
        throw AppError.badRequest('Alarm is already resolved and cannot be acknowledged', 'ALARM_NOT_ACTIVE');
      }

      const updatedRes = await query(
        `UPDATE alarms
         SET status = 'ACKNOWLEDGED', acknowledged_at = CURRENT_TIMESTAMP,
             acknowledged_by = $1, acknowledgement_note = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [request.user.id, note || null, id]
      );
      const updated = updatedRes.rows[0];

      await query(
        `INSERT INTO alarm_history (alarm_id, action, from_status, to_status, note, performed_by)
         VALUES ($1, 'ACKNOWLEDGE', $2, 'ACKNOWLEDGED', $3, $4)`,
        [id, alarm.status, note || 'Operator acknowledged alarm', request.user.id]
      );

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
         VALUES ($1, 'ALARM_ACKNOWLEDGED', 'ALARM', $2, $3)`,
        [request.user.id, id, JSON.stringify({ note })]
      );

      sseManager.broadcast('alarm.updated', updated, alarm.site_id);

      return reply.send({
        success: true,
        data: updated,
      });
    }
  );

  // POST /api/v1/alarms/:id/resolve (PRD Section 36)
  fastify.post(
    '/:id/resolve',
    {
      onRequest: [fastify.authenticate, fastify.authorize('alarm.manage')],
      schema: {
        tags: ['Alarms'],
        summary: 'Manually Resolve Alarm',
        description: 'Engineer/Admin manually marks an alarm as resolved with explanation.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: resolveAlarmBodySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { reason } = request.body;

      const alarmRes = await query(`SELECT * FROM alarms WHERE id = $1`, [id]);
      if (alarmRes.rows.length === 0) throw AppError.notFound('Alarm not found');
      const alarm = alarmRes.rows[0];

      if (alarm.status === 'RESOLVED') {
        return reply.send({ success: true, data: alarm });
      }

      const updatedRes = await query(
        `UPDATE alarms
         SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP,
             resolved_reason = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [reason, id]
      );
      const updated = updatedRes.rows[0];

      await query(
        `INSERT INTO alarm_history (alarm_id, action, from_status, to_status, note, performed_by)
         VALUES ($1, 'MANUAL_RESOLVE', $2, 'RESOLVED', $3, $4)`,
        [id, alarm.status, reason, request.user.id]
      );

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
         VALUES ($1, 'ALARM_RESOLVED', 'ALARM', $2, $3)`,
        [request.user.id, id, JSON.stringify({ reason })]
      );

      sseManager.broadcast('alarm.updated', updated, alarm.site_id);

      return reply.send({
        success: true,
        data: updated,
      });
    }
  );
};
