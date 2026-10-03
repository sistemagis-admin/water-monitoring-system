import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { query } from '../../infrastructure/db/index.js';
import { AppError } from '../../shared/errors/app-error.js';
import { idParamSchema, siteIdParamSchema } from '../../shared/schemas/common.js';

const telemetryQuerySchema = z.object({
  from: z.string().optional().describe('Start ISO timestamp (defaults to last 1 hour)'),
  to: z.string().optional().describe('End ISO timestamp (defaults to now)'),
  metrics: z.string().optional().describe('Comma-separated metric codes, e.g. flow_m3h,pressure_bar'),
  granularity: z.enum(['auto', 'raw', '5m', '1h', '1d']).default('auto'),
});

export const telemetryRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/v1/assets/:id/telemetry
  fastify.get(
    '/assets/:id/telemetry',
    {
      onRequest: [fastify.authenticate, fastify.authorize('telemetry.view')],
      schema: {
        tags: ['Telemetry'],
        summary: 'Query Historical Asset Telemetry',
        description: 'Returns time-series telemetry samples formatted as chart points per metric.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        querystring: telemetryQuerySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { from, to, metrics, granularity } = request.query;

      // Verify asset exists
      const astRes = await query(`SELECT id, code, name FROM assets WHERE id = $1`, [id]);
      if (astRes.rows.length === 0) throw AppError.notFound('Asset not found');
      const asset = astRes.rows[0];

      const toDate = to ? new Date(to) : new Date();
      const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 3600 * 1000); // default last 1 hour

      // Parse metric list
      const metricList = metrics
        ? metrics.split(',').map((m) => m.trim())
        : ['flow_m3h', 'pressure_bar', 'power_kw', 'current_a', 'motor_temp_c'];

      // Query raw telemetry samples in range
      const samplesRes = await query(
        `SELECT received_at, payload
         FROM telemetry_samples
         WHERE asset_id = $1
           AND received_at >= $2
           AND received_at <= $3
         ORDER BY received_at ASC
         LIMIT 2000`,
        [id, fromDate, toDate]
      );

      // Fetch units from metric_definitions
      const metricDefRes = await query(
        `SELECT code, unit FROM metric_definitions WHERE code = ANY($1)`,
        [metricList]
      );
      const unitMap = new Map<string, string>();
      for (const m of metricDefRes.rows) {
        unitMap.set(m.code, m.unit || '');
      }

      // Group points by metric code
      const seriesMap: Record<string, [string, number][]> = {};
      for (const code of metricList) {
        seriesMap[code] = [];
      }

      for (const row of samplesRes.rows) {
        const timeIso = new Date(row.received_at).toISOString();
        const payloadMetrics = row.payload?.metrics || {};

        for (const code of metricList) {
          const val = payloadMetrics[code];
          if (typeof val === 'number') {
            seriesMap[code].push([timeIso, val]);
          }
        }
      }

      const responseMetrics = metricList.map((code) => ({
        code,
        unit: unitMap.get(code) || '',
        points: seriesMap[code] || [],
      }));

      return reply.send({
        success: true,
        data: {
          asset_id: asset.id,
          asset_code: asset.code,
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          granularity,
          metrics: responseMetrics,
        },
      });
    }
  );

  // GET /api/v1/sites/:siteId/telemetry
  fastify.get(
    '/sites/:siteId/telemetry',
    {
      onRequest: [fastify.authenticate, fastify.authorize('telemetry.view')],
      schema: {
        tags: ['Telemetry'],
        summary: 'Query Site Aggregate Telemetry',
        security: [{ bearerAuth: [] }],
        params: siteIdParamSchema,
        querystring: telemetryQuerySchema,
      },
    },
    async (request, reply) => {
      const { siteId } = request.params;
      const { from, to, metrics } = request.query;

      const toDate = to ? new Date(to) : new Date();
      const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 3600 * 1000);

      const metricList = metrics
        ? metrics.split(',').map((m) => m.trim())
        : ['flow_m3h', 'pressure_bar'];

      const samplesRes = await query(
        `SELECT received_at, asset_id, payload
         FROM telemetry_samples
         WHERE site_id = $1
           AND received_at >= $2
           AND received_at <= $3
         ORDER BY received_at ASC
         LIMIT 2000`,
        [siteId, fromDate, toDate]
      );

      return reply.send({
        success: true,
        data: {
          site_id: siteId,
          total_samples: samplesRes.rows.length,
          samples: samplesRes.rows,
        },
      });
    }
  );
};
