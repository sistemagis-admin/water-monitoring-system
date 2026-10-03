import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query, transaction } from '../../infrastructure/db/index.js';
import { AppError } from '../../shared/errors/app-error.js';
import { idParamSchema, paginationQuerySchema } from '../../shared/schemas/common.js';
import { env } from '../../config/env.js';

const createDeviceBodySchema = z.object({
  site_id: z.string().uuid(),
  area_id: z.string().uuid().optional(),
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(255),
  device_type: z.string().default('GATEWAY'),
  firmware_version: z.string().optional(),
  config: z.record(z.any()).optional(),
  mqtt_username: z.string().optional(),
  mqtt_password: z.string().optional(),
});

const updateDeviceBodySchema = createDeviceBodySchema.partial();

export const devicesRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/v1/devices
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('device.view')],
      schema: {
        tags: ['Devices'],
        summary: 'List Devices',
        description: 'Returns all MQTT gateways/devices with connectivity status and site metadata.',
        security: [{ bearerAuth: [] }],
        querystring: paginationQuerySchema.extend({
          site_id: z.string().uuid().optional(),
          status: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { page, page_size, site_id, status, search } = request.query;
      const offset = (page - 1) * page_size;

      const conditions: string[] = [];
      const params: any[] = [];

      if (site_id) {
        params.push(site_id);
        conditions.push(`d.site_id = $${params.length}`);
      }
      if (status) {
        params.push(status);
        conditions.push(`d.status = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        conditions.push(`(d.name ILIKE $${params.length} OR d.code ILIKE $${params.length})`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countRes = await query(`SELECT COUNT(*)::int as total FROM mqtt_devices d ${where}`, params);
      const total = countRes.rows[0].total;

      params.push(page_size, offset);
      const res = await query(
        `SELECT d.*, s.name as site_name, s.code as site_code, a.name as area_name,
                cs.last_telemetry_at, cs.metadata as live_metadata
         FROM mqtt_devices d
         JOIN sites s ON d.site_id = s.id
         LEFT JOIN areas a ON d.area_id = a.id
         LEFT JOIN device_current_state cs ON d.id = cs.device_id
         ${where}
         ORDER BY d.code ASC
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

  // POST /api/v1/devices
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('device.manage')],
      schema: {
        tags: ['Devices'],
        summary: 'Register Device / Gateway',
        security: [{ bearerAuth: [] }],
        body: createDeviceBodySchema,
      },
    },
    async (request, reply) => {
      const b = request.body;

      const result = await transaction(async (client) => {
        const insRes = await client.query(
          `INSERT INTO mqtt_devices (site_id, area_id, code, name, device_type, firmware_version, config)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            b.site_id,
            b.area_id || null,
            b.code,
            b.name,
            b.device_type || 'GATEWAY',
            b.firmware_version || null,
            JSON.stringify(b.config || {}),
          ]
        );
        const device = insRes.rows[0];

        // Seed credential if provided
        if (b.mqtt_username && b.mqtt_password) {
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(b.mqtt_password, salt);
          await client.query(
            `INSERT INTO device_credentials (device_id, username, password_hash)
             VALUES ($1, $2, $3)`,
            [device.id, b.mqtt_username, hash]
          );
        }

        // Initialize state
        await client.query(
          `INSERT INTO device_current_state (device_id, status) VALUES ($1, 'UNKNOWN')`,
          [device.id]
        );

        return device;
      });

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
         VALUES ($1, 'DEVICE_REGISTERED', 'DEVICE', $2, $3)`,
        [request.user.id, result.id, JSON.stringify(result)]
      );

      return reply.status(201).send({ success: true, data: result });
    }
  );

  // GET /api/v1/devices/:id
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('device.view')],
      schema: {
        tags: ['Devices'],
        summary: 'Get Device Detail',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const res = await query(
        `SELECT d.*, s.name as site_name, a.name as area_name, cs.last_telemetry_at, cs.last_status_at
         FROM mqtt_devices d
         JOIN sites s ON d.site_id = s.id
         LEFT JOIN areas a ON d.area_id = a.id
         LEFT JOIN device_current_state cs ON d.id = cs.device_id
         WHERE d.id = $1`,
        [request.params.id]
      );
      if (res.rows.length === 0) throw AppError.notFound('Device not found');
      return reply.send({ success: true, data: res.rows[0] });
    }
  );

  // PATCH /api/v1/devices/:id
  fastify.patch(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('device.manage')],
      schema: {
        tags: ['Devices'],
        summary: 'Update Device',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateDeviceBodySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const b = request.body;

      const res = await query(
        `UPDATE mqtt_devices
         SET name = COALESCE($1, name),
             area_id = COALESCE($2, area_id),
             firmware_version = COALESCE($3, firmware_version),
             config = COALESCE($4, config),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [b.name, b.area_id, b.firmware_version, b.config ? JSON.stringify(b.config) : null, id]
      );
      if (res.rows.length === 0) throw AppError.notFound('Device not found');

      return reply.send({ success: true, data: res.rows[0] });
    }
  );

  // DELETE /api/v1/devices/:id
  fastify.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('device.manage')],
      schema: {
        tags: ['Devices'],
        summary: 'Delete Device',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(`DELETE FROM mqtt_devices WHERE id = $1 RETURNING id`, [id]);
      if (res.rows.length === 0) throw AppError.notFound('Device not found');
      return reply.send({ success: true, data: { id, deleted: true } });
    }
  );

  // GET /api/v1/devices/:id/health (PRD Section 22)
  fastify.get(
    '/:id/health',
    {
      onRequest: [fastify.authenticate, fastify.authorize('device.view')],
      schema: {
        tags: ['Devices'],
        summary: 'Get Device Health & Connectivity Diagnostics',
        description: 'Calculates real-time health (ONLINE, STALE, OFFLINE) based on last_seen_at timestamp.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(
        `SELECT d.id, d.code, d.name, d.status, d.last_seen_at, d.firmware_version,
                d.ip_address, d.rssi, d.uptime_s, cs.last_telemetry_at
         FROM mqtt_devices d
         LEFT JOIN device_current_state cs ON d.id = cs.device_id
         WHERE d.id = $1`,
        [id]
      );
      if (res.rows.length === 0) throw AppError.notFound('Device not found');
      const dev = res.rows[0];

      // Calculate health state per Section 22
      const now = Date.now();
      const lastSeen = dev.last_seen_at ? new Date(dev.last_seen_at).getTime() : 0;
      const diffMs = now - lastSeen;

      let calculatedStatus: 'ONLINE' | 'STALE' | 'OFFLINE' = 'OFFLINE';
      if (dev.last_seen_at) {
        if (diffMs <= 15000) calculatedStatus = 'ONLINE';
        else if (diffMs <= env.DEVICE_OFFLINE_TIMEOUT) calculatedStatus = 'STALE';
        else calculatedStatus = 'OFFLINE';
      }

      return reply.send({
        success: true,
        data: {
          device: dev,
          health: {
            calculated_status: calculatedStatus,
            last_seen_diff_seconds: Math.floor(diffMs / 1000),
            online_threshold_seconds: 15,
            offline_timeout_seconds: Math.floor(env.DEVICE_OFFLINE_TIMEOUT / 1000),
            is_healthy: calculatedStatus === 'ONLINE',
          },
        },
      });
    }
  );

  // GET /api/v1/devices/:id/events (PRD Section 31)
  fastify.get(
    '/:id/events',
    {
      onRequest: [fastify.authenticate, fastify.authorize('device.view')],
      schema: {
        tags: ['Devices'],
        summary: 'Get Device Events',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        querystring: paginationQuerySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { page, page_size } = request.query;
      const offset = (page - 1) * page_size;

      const countRes = await query(`SELECT COUNT(*)::int as total FROM events WHERE device_id = $1`, [id]);
      const total = countRes.rows[0].total;

      const res = await query(
        `SELECT * FROM events WHERE device_id = $1 ORDER BY occurred_at DESC LIMIT $2 OFFSET $3`,
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
