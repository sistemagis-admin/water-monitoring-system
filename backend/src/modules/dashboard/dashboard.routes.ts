import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { query } from '../../infrastructure/db/index.js';
import { dashboardSummarySchema } from './dashboard.schema.js';
import { standardSuccessResponseSchema } from '../../shared/schemas/common.js';
import { z } from 'zod';

export const dashboardRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/v1/dashboard/summary
  fastify.get(
    '/summary',
    {
      onRequest: [fastify.authenticate, fastify.authorize('dashboard.view')],
      schema: {
        tags: ['Dashboard'],
        summary: 'Global Dashboard KPI Summary',
        description: 'Returns real-time aggregated counts for sites, devices, pumps, and active alarms.',
        security: [{ bearerAuth: [] }],
        response: {
          200: dashboardSummarySchema,
        },
      },
    },
    async (_request, reply) => {
      // 1. Total sites
      const sitesCountRes = await query(`SELECT COUNT(*)::int as count FROM sites WHERE status = 'ACTIVE'`);
      const totalSites = sitesCountRes.rows[0].count;

      // 2. Devices status
      const devRes = await query(`
        SELECT status, COUNT(*)::int as count
        FROM mqtt_devices
        GROUP BY status
      `);
      let onlineDevices = 0;
      let offlineDevices = 0;
      let staleDevices = 0;
      let totalDevices = 0;

      for (const row of devRes.rows) {
        totalDevices += row.count;
        if (row.status === 'ONLINE') onlineDevices = row.count;
        else if (row.status === 'OFFLINE') offlineDevices = row.count;
        else if (row.status === 'STALE') staleDevices = row.count;
      }

      // 3. Pumps status
      const pumpRes = await query(`
        SELECT status, COUNT(*)::int as count
        FROM assets
        WHERE asset_type = 'PUMP'
        GROUP BY status
      `);
      let runningPumps = 0;
      let stoppedPumps = 0;
      let faultPumps = 0;
      let totalPumps = 0;
      let offlinePumps = 0;
      let commandingPumps = 0;

      for (const row of pumpRes.rows) {
        totalPumps += row.count;
        if (row.status === 'RUNNING') runningPumps = row.count;
        else if (row.status === 'STOPPED') stoppedPumps = row.count;
        else if (row.status === 'FAULT') faultPumps = row.count;
        else if (row.status === 'OFFLINE') offlinePumps = row.count;
        else if (row.status === 'COMMANDING') commandingPumps = row.count;
      }

      // 4. Alarms active
      const alarmRes = await query(`
        SELECT severity, COUNT(*)::int as count
        FROM alarms
        WHERE status IN ('OPEN', 'ACKNOWLEDGED')
        GROUP BY severity
      `);
      let criticalAlarms = 0;
      let highAlarms = 0;
      let mediumAlarms = 0;
      let lowAlarms = 0;
      let activeAlarms = 0;

      for (const row of alarmRes.rows) {
        activeAlarms += row.count;
        if (row.severity === 'CRITICAL') criticalAlarms = row.count;
        else if (row.severity === 'HIGH') highAlarms = row.count;
        else if (row.severity === 'MEDIUM') mediumAlarms = row.count;
        else if (row.severity === 'LOW') lowAlarms = row.count;
      }

      return reply.send({
        success: true,
        data: {
          sites: totalSites,
          devices: {
            total: totalDevices,
            online: onlineDevices,
            offline: offlineDevices,
            stale: staleDevices,
          },
          pumps: {
            total: totalPumps,
            running: runningPumps,
            stopped: stoppedPumps,
            fault: faultPumps,
            offline: offlinePumps,
            commanding: commandingPumps,
          },
          alarms: {
            active: activeAlarms,
            critical: criticalAlarms,
            high: highAlarms,
            medium: mediumAlarms,
            low: lowAlarms,
          },
        },
      });
    }
  );
};
