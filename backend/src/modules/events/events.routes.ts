import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { query } from '../../infrastructure/db/index.js';
import { paginationQuerySchema } from '../../shared/schemas/common.js';

export const eventsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/v1/events
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.view')],
      schema: {
        tags: ['Events'],
        summary: 'List Operational Events',
        description: 'Returns system, device, and pump event logs with filtering by severity and site.',
        security: [{ bearerAuth: [] }],
        querystring: paginationQuerySchema.extend({
          site_id: z.string().uuid().optional(),
          asset_id: z.string().uuid().optional(),
          device_id: z.string().uuid().optional(),
          event_type: z.string().optional(),
          severity: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { page, page_size, site_id, asset_id, device_id, event_type, severity, search } = request.query;
      const offset = (page - 1) * page_size;

      const conditions: string[] = [];
      const params: any[] = [];

      if (site_id) {
        params.push(site_id);
        conditions.push(`e.site_id = $${params.length}`);
      }
      if (asset_id) {
        params.push(asset_id);
        conditions.push(`e.asset_id = $${params.length}`);
      }
      if (device_id) {
        params.push(device_id);
        conditions.push(`e.device_id = $${params.length}`);
      }
      if (event_type) {
        params.push(event_type);
        conditions.push(`e.event_type = $${params.length}`);
      }
      if (severity) {
        params.push(severity);
        conditions.push(`e.severity = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        conditions.push(`(e.message ILIKE $${params.length} OR e.event_code ILIKE $${params.length})`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countRes = await query(`SELECT COUNT(*)::int as total FROM events e ${where}`, params);
      const total = countRes.rows[0].total;

      params.push(page_size, offset);
      const res = await query(
        `SELECT e.*, s.name as site_name, a.name as asset_name, d.name as device_name
         FROM events e
         JOIN sites s ON e.site_id = s.id
         LEFT JOIN assets a ON e.asset_id = a.id
         LEFT JOIN mqtt_devices d ON e.device_id = d.id
         ${where}
         ORDER BY e.occurred_at DESC
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
