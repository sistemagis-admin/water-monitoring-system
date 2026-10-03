import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query } from '../../infrastructure/db/index.js';
import { AppError } from '../../shared/errors/app-error.js';
import { idParamSchema, paginationQuerySchema } from '../../shared/schemas/common.js';
import { PERMISSIONS, ROLES } from '../../config/constants.js';

const createUserBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  role: z.enum(['SUPER_ADMIN', 'ENGINEER', 'OPERATOR', 'VIEWER']).default('OPERATOR'),
  site_id: z.string().uuid().optional(),
});

const updateUserBodySchema = z.object({
  full_name: z.string().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['SUPER_ADMIN', 'ENGINEER', 'OPERATOR', 'VIEWER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  site_id: z.string().uuid().optional(),
});

export const usersRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/v1/users
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('user.view')],
      schema: {
        tags: ['Auth'],
        summary: 'List Users',
        security: [{ bearerAuth: [] }],
        querystring: paginationQuerySchema,
      },
    },
    async (request, reply) => {
      const { page, page_size, search } = request.query;
      const offset = (page - 1) * page_size;

      let where = '';
      const params: any[] = [];
      if (search) {
        params.push(`%${search}%`);
        where = `WHERE u.email ILIKE $1 OR u.full_name ILIKE $1`;
      }

      const countRes = await query(`SELECT COUNT(*)::int as total FROM users u ${where}`, params);
      const total = countRes.rows[0].total;

      params.push(page_size, offset);
      const res = await query(
        `SELECT u.id, u.email, u.full_name, u.role, u.status, u.site_id, s.name as site_name, u.created_at
         FROM users u
         LEFT JOIN sites s ON u.site_id = s.id
         ${where}
         ORDER BY u.created_at DESC
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

  // POST /api/v1/users
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('user.manage')],
      schema: {
        tags: ['Auth'],
        summary: 'Create User',
        security: [{ bearerAuth: [] }],
        body: createUserBodySchema,
      },
    },
    async (request, reply) => {
      const b = request.body;
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(b.password, salt);

      const existing = await query(`SELECT id FROM users WHERE email = $1`, [b.email.toLowerCase()]);
      if (existing.rows.length > 0) {
        throw AppError.conflict('User with this email already exists');
      }

      const insRes = await query(
        `INSERT INTO users (email, password_hash, full_name, role, status, site_id)
         VALUES ($1, $2, $3, $4, 'ACTIVE', $5)
         RETURNING id, email, full_name, role, status, site_id, created_at`,
        [b.email.toLowerCase(), hash, b.full_name, b.role, b.site_id || null]
      );
      const user = insRes.rows[0];

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
         VALUES ($1, 'USER_CREATED', 'USER', $2, $3)`,
        [request.user.id, user.id, JSON.stringify({ email: user.email, role: user.role })]
      );

      return reply.status(201).send({ success: true, data: user });
    }
  );

  // GET /api/v1/users/:id
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('user.view')],
      schema: {
        tags: ['Auth'],
        summary: 'Get User Detail',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const res = await query(
        `SELECT id, email, full_name, role, status, site_id, created_at, updated_at
         FROM users
         WHERE id = $1`,
        [request.params.id]
      );
      if (res.rows.length === 0) throw AppError.notFound('User not found');
      return reply.send({ success: true, data: res.rows[0] });
    }
  );

  // PATCH /api/v1/users/:id
  fastify.patch(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('user.manage')],
      schema: {
        tags: ['Auth'],
        summary: 'Update User',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateUserBodySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const b = request.body;

      let passwordHashUpdate = null;
      if (b.password) {
        const salt = await bcrypt.genSalt(10);
        passwordHashUpdate = await bcrypt.hash(b.password, salt);
      }

      const res = await query(
        `UPDATE users
         SET full_name = COALESCE($1, full_name),
             password_hash = COALESCE($2, password_hash),
             role = COALESCE($3, role),
             status = COALESCE($4, status),
             site_id = COALESCE($5, site_id),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING id, email, full_name, role, status, site_id, updated_at`,
        [b.full_name, passwordHashUpdate, b.role, b.status, b.site_id, id]
      );
      if (res.rows.length === 0) throw AppError.notFound('User not found');

      return reply.send({ success: true, data: res.rows[0] });
    }
  );

  // DELETE /api/v1/users/:id
  fastify.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('user.manage')],
      schema: {
        tags: ['Auth'],
        summary: 'Disable / Delete User',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const res = await query(`UPDATE users SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id`, [id]);
      if (res.rows.length === 0) throw AppError.notFound('User not found');

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
         VALUES ($1, 'USER_DISABLED', 'USER', $2)`,
        [request.user.id, id]
      );

      return reply.send({ success: true, data: { id, disabled: true } });
    }
  );

  // GET /api/v1/roles
  fastify.get(
    '/roles',
    {
      onRequest: [fastify.authenticate, fastify.authorize('user.view')],
      schema: {
        tags: ['Auth'],
        summary: 'List Available Roles',
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, reply) => {
      const res = await query(`SELECT * FROM roles ORDER BY name ASC`);
      return reply.send({ success: true, data: res.rows });
    }
  );

  // GET /api/v1/permissions
  fastify.get(
    '/permissions',
    {
      onRequest: [fastify.authenticate, fastify.authorize('user.view')],
      schema: {
        tags: ['Auth'],
        summary: 'List Available RBAC Permissions',
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, reply) => {
      const res = await query(`SELECT * FROM permissions ORDER BY name ASC`);
      return reply.send({ success: true, data: res.rows });
    }
  );
};
