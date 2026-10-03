import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { stringify } from 'csv-stringify';
import { query } from '../../infrastructure/db/index.js';

export const reportsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/v1/reports/telemetry.csv
  fastify.get(
    '/telemetry.csv',
    {
      onRequest: [fastify.authenticate, fastify.authorize('report.export')],
      schema: {
        tags: ['Reports'],
        summary: 'Export Telemetry Samples to CSV',
        description: 'Streams historical telemetry data as CSV file with custom date range and asset filters.',
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          site_id: z.string().uuid().optional(),
          asset_id: z.string().uuid().optional(),
          from: z.string().optional(),
          to: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { site_id, asset_id, from, to } = request.query;

      const toDate = to ? new Date(to) : new Date();
      const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 24 * 3600 * 1000);

      const conditions = [`ts.received_at >= $1`, `ts.received_at <= $2`];
      const params: any[] = [fromDate, toDate];

      if (site_id) {
        params.push(site_id);
        conditions.push(`ts.site_id = $${params.length}`);
      }
      if (asset_id) {
        params.push(asset_id);
        conditions.push(`ts.asset_id = $${params.length}`);
      }

      const res = await query(
        `SELECT ts.id, s.name as site_name, d.code as device_code, a.code as asset_code,
                ts.device_timestamp, ts.received_at, ts.quality,
                ts.payload->'metrics'->>'flow_m3h' as flow_m3h,
                ts.payload->'metrics'->>'pressure_bar' as pressure_bar,
                ts.payload->'metrics'->>'power_kw' as power_kw,
                ts.payload->'metrics'->>'current_a' as current_a,
                ts.payload->'metrics'->>'motor_temp_c' as motor_temp_c,
                ts.payload->'metrics'->>'pump_running' as pump_running
         FROM telemetry_samples ts
         JOIN sites s ON ts.site_id = s.id
         JOIN mqtt_devices d ON ts.source_device_id = d.id
         LEFT JOIN assets a ON ts.asset_id = a.id
         WHERE ${conditions.join(' AND ')}
         ORDER BY ts.received_at ASC
         LIMIT 10000`,
        params
      );

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="telemetry_${Date.now()}.csv"`);

      const csvStream = stringify({
        header: true,
        columns: [
          'id',
          'site_name',
          'device_code',
          'asset_code',
          'device_timestamp',
          'received_at',
          'quality',
          'pump_running',
          'flow_m3h',
          'pressure_bar',
          'power_kw',
          'current_a',
          'motor_temp_c',
        ],
      });

      for (const row of res.rows) {
        csvStream.write(row);
      }
      csvStream.end();

      return reply.send(csvStream);
    }
  );

  // GET /api/v1/reports/alarms.csv
  fastify.get(
    '/alarms.csv',
    {
      onRequest: [fastify.authenticate, fastify.authorize('report.export')],
      schema: {
        tags: ['Reports'],
        summary: 'Export Alarms to CSV',
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          site_id: z.string().uuid().optional(),
          status: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { site_id, status } = request.query;

      const conditions: string[] = [];
      const params: any[] = [];

      if (site_id) {
        params.push(site_id);
        conditions.push(`a.site_id = $${params.length}`);
      }
      if (status) {
        params.push(status);
        conditions.push(`a.status = $${params.length}`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const res = await query(
        `SELECT a.id, s.name as site_name, ast.code as asset_code, ar.name as rule_name,
                a.severity, a.status, a.opened_at, a.acknowledged_at, a.resolved_at,
                a.last_value, a.message, a.acknowledgement_note, u.full_name as acknowledged_by_name
         FROM alarms a
         JOIN sites s ON a.site_id = s.id
         JOIN alarm_rules ar ON a.rule_id = ar.id
         LEFT JOIN assets ast ON a.asset_id = ast.id
         LEFT JOIN users u ON a.acknowledged_by = u.id
         ${where}
         ORDER BY a.opened_at DESC`,
        params
      );

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="alarms_${Date.now()}.csv"`);

      const csvStream = stringify({
        header: true,
        columns: [
          'id',
          'site_name',
          'asset_code',
          'rule_name',
          'severity',
          'status',
          'opened_at',
          'acknowledged_at',
          'acknowledged_by_name',
          'resolved_at',
          'last_value',
          'message',
          'acknowledgement_note',
        ],
      });

      for (const row of res.rows) {
        csvStream.write(row);
      }
      csvStream.end();

      return reply.send(csvStream);
    }
  );

  // GET /api/v1/reports/events.csv
  fastify.get(
    '/events.csv',
    {
      onRequest: [fastify.authenticate, fastify.authorize('report.export')],
      schema: {
        tags: ['Reports'],
        summary: 'Export Events to CSV',
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          site_id: z.string().uuid().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { site_id } = request.query;

      let q = `
        SELECT e.id, s.name as site_name, a.code as asset_code, d.code as device_code,
               e.event_type, e.event_code, e.severity, e.message, e.occurred_at
        FROM events e
        JOIN sites s ON e.site_id = s.id
        LEFT JOIN assets a ON e.asset_id = a.id
        LEFT JOIN mqtt_devices d ON e.device_id = d.id
      `;
      const params: any[] = [];
      if (site_id) {
        q += ` WHERE e.site_id = $1`;
        params.push(site_id);
      }
      q += ` ORDER BY e.occurred_at DESC LIMIT 5000`;

      const res = await query(q, params);

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="events_${Date.now()}.csv"`);

      const csvStream = stringify({
        header: true,
        columns: [
          'id',
          'site_name',
          'asset_code',
          'device_code',
          'event_type',
          'event_code',
          'severity',
          'message',
          'occurred_at',
        ],
      });

      for (const row of res.rows) {
        csvStream.write(row);
      }
      csvStream.end();

      return reply.send(csvStream);
    }
  );
};
