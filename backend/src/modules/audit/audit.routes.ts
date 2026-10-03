import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { query } from '../../infrastructure/db/index.js';
import { paginationQuerySchema } from '../../shared/schemas/common.js';

export const auditRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/v1/audit-logs
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('audit.view')],
      schema: {
        tags: ['Audit Logs'],
        summary: 'List Audit Trail Logs',
        description: 'Returns immutable audit logs of user actions and configuration changes per PRD Section 70.',
        security: [{ bearerAuth: [] }],
        querystring: paginationQuerySchema.extend({
          action: z.string().optional(),
          entity_type: z.string().optional(),
          user_id: z.string().uuid().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { page, page_size, action, entity_type, user_id, search } = request.query;
      const offset = (page - 1) * page_size;

      const conditions: string[] = [];
      const params: any[] = [];

      if (action) {
        params.push(action);
        conditions.push(`al.action = $${params.length}`);
      }
      if (entity_type) {
        params.push(entity_type);
        conditions.push(`al.entity_type = $${params.length}`);
      }
      if (user_id) {
        params.push(user_id);
        conditions.push(`al.user_id = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        conditions.push(`(al.action ILIKE $${params.length} OR al.entity_type ILIKE $${params.length})`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countRes = await query(`SELECT COUNT(*)::int as total FROM audit_logs al ${where}`, params);
      const total = countRes.rows[0].total;

      params.push(page_size, offset);
      const res = await query(
        `SELECT al.*, u.email as user_email, u.full_name as user_full_name
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ${where}
         ORDER BY al.created_at DESC
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
};
