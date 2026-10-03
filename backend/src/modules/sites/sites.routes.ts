import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { query } from '../../infrastructure/db/index.js';
import { AppError } from '../../shared/errors/app-error.js';
import {
  createSiteBodySchema,
  siteDetailResponseSchema,
  siteListResponseSchema,
  updateSiteBodySchema,
} from './sites.schema.js';
import { idParamSchema, paginationQuerySchema, standardSuccessResponseSchema } from '../../shared/schemas/common.js';
import { z } from 'zod';

export const sitesRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/v1/sites
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.view')],
      schema: {
        tags: ['Sites'],
        summary: 'List Sites',
        description: 'Returns a list of all sites with pagination and optional search filter.',
        security: [{ bearerAuth: [] }],
        querystring: paginationQuerySchema,
        response: {
          200: siteListResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { page, page_size, search } = request.query;
      const offset = (page - 1) * page_size;

      let whereClause = '';
      const params: any[] = [];
      if (search) {
        params.push(`%${search}%`);
        whereClause = `WHERE (name ILIKE $1 OR code ILIKE $1)`;
      }

      const countRes = await query(`SELECT COUNT(*)::int as total FROM sites ${whereClause}`, params);
      const total = countRes.rows[0].total;

      params.push(page_size, offset);
      const sitesRes = await query(
        `SELECT * FROM sites ${whereClause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      return reply.send({
        success: true,
        data: sitesRes.rows,
        meta: {
          page,
          page_size,
          total,
          total_pages: Math.ceil(total / page_size),
        },
      });
    }
  );

  // POST /api/v1/sites
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.manage')],
      schema: {
        tags: ['Sites'],
        summary: 'Create Site',
        description: 'Create a new plant/facility site.',
        security: [{ bearerAuth: [] }],
        body: createSiteBodySchema,
        response: {
          201: siteDetailResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const b = request.body;
      const insRes = await query(
        `INSERT INTO sites (project_id, code, name, address, timezone, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [b.project_id, b.code, b.name, b.address || null, b.timezone || 'Asia/Jakarta', b.status || 'ACTIVE']
      );

      const site = insRes.rows[0];
      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
         VALUES ($1, 'SITE_CREATED', 'SITE', $2, $3)`,
        [request.user.id, site.id, JSON.stringify(site)]
      );

      return reply.status(201).send({
        success: true,
        data: site,
      });
    }
  );

  // GET /api/v1/sites/:id
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.view')],
      schema: {
        tags: ['Sites'],
        summary: 'Get Site Detail',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: {
          200: siteDetailResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const siteRes = await query(`SELECT * FROM sites WHERE id = $1`, [request.params.id]);
      if (siteRes.rows.length === 0) {
        throw AppError.notFound('Site not found');
      }
      return reply.send({
        success: true,
        data: siteRes.rows[0],
      });
    }
  );

  // PATCH /api/v1/sites/:id
  fastify.patch(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.manage')],
      schema: {
        tags: ['Sites'],
        summary: 'Update Site',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateSiteBodySchema,
        response: {
          200: siteDetailResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const b = request.body;

      const existingRes = await query(`SELECT * FROM sites WHERE id = $1`, [id]);
      if (existingRes.rows.length === 0) {
        throw AppError.notFound('Site not found');
      }
      const old = existingRes.rows[0];

      const updRes = await query(
        `UPDATE sites
         SET name = COALESCE($1, name),
             code = COALESCE($2, code),
             address = COALESCE($3, address),
             timezone = COALESCE($4, timezone),
             status = COALESCE($5, status),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [b.name, b.code, b.address, b.timezone, b.status, id]
      );
      const updated = updRes.rows[0];

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
         VALUES ($1, 'SITE_UPDATED', 'SITE', $2, $3, $4)`,
        [request.user.id, id, JSON.stringify(old), JSON.stringify(updated)]
      );

      return reply.send({
        success: true,
        data: updated,
      });
    }
  );

  // DELETE /api/v1/sites/:id
  fastify.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.manage')],
      schema: {
        tags: ['Sites'],
        summary: 'Delete Site',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(`DELETE FROM sites WHERE id = $1 RETURNING id`, [id]);
      if (res.rows.length === 0) {
        throw AppError.notFound('Site not found');
      }

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
         VALUES ($1, 'SITE_DELETED', 'SITE', $2)`,
        [request.user.id, id]
      );

      return reply.send({
        success: true,
        data: { id, deleted: true },
      });
    }
  );

  // GET /api/v1/sites/:id/summary (PRD Section 29)
  fastify.get(
    '/:id/summary',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.view')],
      schema: {
        tags: ['Sites'],
        summary: 'Site Operational Summary',
        description: 'Returns device counts, pump status counts, and alarm summary for a specific site.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const siteRes = await query(`SELECT * FROM sites WHERE id = $1`, [id]);
      if (siteRes.rows.length === 0) {
        throw AppError.notFound('Site not found');
      }
      const site = siteRes.rows[0];

      // Devices
      const devRes = await query(
        `SELECT status, COUNT(*)::int as count FROM mqtt_devices WHERE site_id = $1 GROUP BY status`,
        [id]
      );
      let totalDev = 0, onlineDev = 0, offlineDev = 0;
      for (const r of devRes.rows) {
        totalDev += r.count;
        if (r.status === 'ONLINE') onlineDev = r.count;
        else if (r.status === 'OFFLINE') offlineDev = r.count;
      }

      // Pumps
      const pumpRes = await query(
        `SELECT status, COUNT(*)::int as count FROM assets WHERE site_id = $1 AND asset_type = 'PUMP' GROUP BY status`,
        [id]
      );
      let totalPumps = 0, runningPumps = 0, stoppedPumps = 0, faultPumps = 0;
      for (const r of pumpRes.rows) {
        totalPumps += r.count;
        if (r.status === 'RUNNING') runningPumps = r.count;
        else if (r.status === 'STOPPED') stoppedPumps = r.count;
        else if (r.status === 'FAULT') faultPumps = r.count;
      }

      // Alarms
      const alarmRes = await query(
        `SELECT severity, COUNT(*)::int as count FROM alarms WHERE site_id = $1 AND status IN ('OPEN', 'ACKNOWLEDGED') GROUP BY severity`,
        [id]
      );
      let activeAlarms = 0, critAlarms = 0, highAlarms = 0, medAlarms = 0;
      for (const r of alarmRes.rows) {
        activeAlarms += r.count;
        if (r.severity === 'CRITICAL') critAlarms = r.count;
        else if (r.severity === 'HIGH') highAlarms = r.count;
        else if (r.severity === 'MEDIUM') medAlarms = r.count;
      }

      return reply.send({
        success: true,
        data: {
          site,
          devices: { total: totalDev, online: onlineDev, offline: offlineDev },
          pumps: { total: totalPumps, running: runningPumps, stopped: stoppedPumps, fault: faultPumps },
          alarms: { active: activeAlarms, critical: critAlarms, high: highAlarms, medium: medAlarms },
        },
      });
    }
  );

  // GET /api/v1/sites/:id/assets/overview (PRD Section 29)
  fastify.get(
    '/:id/assets/overview',
    {
      onRequest: [fastify.authenticate, fastify.authorize('asset.view')],
      schema: {
        tags: ['Sites'],
        summary: 'Site Assets Overview with Live State',
        description: 'Returns all assets in the site with their current operating state, latest metrics, and area.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(
        `SELECT a.*, ar.name as area_name, ar.code as area_code,
                cs.status as live_status, cs.metrics, cs.quality, cs.last_timestamp,
                cs.control_enabled, cs.commandable, cs.desired_state
         FROM assets a
         LEFT JOIN areas ar ON a.area_id = ar.id
         LEFT JOIN asset_current_state cs ON a.id = cs.asset_id
         WHERE a.site_id = $1
         ORDER BY a.code ASC`,
        [id]
      );

      return reply.send({
        success: true,
        data: res.rows,
      });
    }
  );

  // GET /api/v1/sites/:id/alarms/summary (PRD Section 29)
  fastify.get(
    '/:id/alarms/summary',
    {
      onRequest: [fastify.authenticate, fastify.authorize('alarm.view')],
      schema: {
        tags: ['Sites'],
        summary: 'Site Alarms Summary',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(
        `SELECT a.*, ar.name as rule_name, ast.name as asset_name
         FROM alarms a
         JOIN alarm_rules ar ON a.rule_id = ar.id
         LEFT JOIN assets ast ON a.asset_id = ast.id
         WHERE a.site_id = $1 AND a.status IN ('OPEN', 'ACKNOWLEDGED')
         ORDER BY a.opened_at DESC`,
        [id]
      );

      return reply.send({
        success: true,
        data: res.rows,
      });
    }
  );

  // GET /api/v1/sites/:id/events/recent (PRD Section 29)
  fastify.get(
    '/:id/events/recent',
    {
      onRequest: [fastify.authenticate, fastify.authorize('dashboard.view')],
      schema: {
        tags: ['Sites'],
        summary: 'Site Recent Events',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(
        `SELECT e.*, a.name as asset_name, d.name as device_name
         FROM events e
         LEFT JOIN assets a ON e.asset_id = a.id
         LEFT JOIN mqtt_devices d ON e.device_id = d.id
         WHERE e.site_id = $1
         ORDER BY e.occurred_at DESC
         LIMIT 20`,
        [id]
      );

      return reply.send({
        success: true,
        data: res.rows,
      });
    }
  );
};
