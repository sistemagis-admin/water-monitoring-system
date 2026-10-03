import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import bcrypt from 'bcryptjs';
import { query } from '../../infrastructure/db/index.js';
import { AppError } from '../../shared/errors/app-error.js';
import { loginBodySchema, loginResponseSchema, logoutResponseSchema, meResponseSchema } from './auth.schema.js';
import { ROLE_PERMISSIONS, RoleName } from '../../config/constants.js';
import { env } from '../../config/env.js';

export const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // POST /api/v1/auth/login
  fastify.post(
    '/login',
    {
      schema: {
        tags: ['Auth'],
        summary: 'User Login',
        description: 'Authenticate with email and password to receive a JWT Bearer access token.',
        body: loginBodySchema,
        response: {
          200: loginResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const userRes = await query(
        `SELECT id, email, password_hash, full_name, role, status, site_id
         FROM users
         WHERE email = $1`,
        [email.toLowerCase().trim()]
      );

      if (userRes.rows.length === 0) {
        throw AppError.badRequest('Invalid email or password', 'AUTH_INVALID_CREDENTIAL');
      }

      const user = userRes.rows[0];

      if (user.status !== 'ACTIVE') {
        throw AppError.forbidden('User account is disabled', 'AUTH_FORBIDDEN');
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw AppError.badRequest('Invalid email or password', 'AUTH_INVALID_CREDENTIAL');
      }

      const role = user.role as RoleName;
      const permissions = ROLE_PERMISSIONS[role] || [];

      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions,
        site_id: user.site_id,
      };

      const token = fastify.jwt.sign(tokenPayload, { expiresIn: env.ACCESS_TOKEN_TTL });

      // Audit login
      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent)
         VALUES ($1, 'USER_LOGIN', 'USER', $1, $2, $3)`,
        [user.id, request.ip, request.headers['user-agent'] || null]
      );

      return reply.send({
        success: true,
        data: {
          access_token: token,
          token_type: 'Bearer',
          expires_in: env.ACCESS_TOKEN_TTL,
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            permissions,
            site_id: user.site_id,
          },
        },
      });
    }
  );

  // GET /api/v1/auth/me
  fastify.get(
    '/me',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Auth'],
        summary: 'Get Current Authenticated User',
        description: 'Returns the current user profile, assigned role, and permissions from the JWT token.',
        security: [{ bearerAuth: [] }],
        response: {
          200: meResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userRes = await query(
        `SELECT id, email, full_name, role, status, site_id
         FROM users
         WHERE id = $1`,
        [request.user.id]
      );

      if (userRes.rows.length === 0) {
        throw AppError.notFound('User not found');
      }

      const u = userRes.rows[0];
      const permissions = ROLE_PERMISSIONS[u.role as RoleName] || [];

      return reply.send({
        success: true,
        data: {
          id: u.id,
          email: u.email,
          full_name: u.full_name,
          role: u.role,
          permissions,
          site_id: u.site_id,
        },
      });
    }
  );

  // POST /api/v1/auth/logout
  fastify.post(
    '/logout',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Auth'],
        summary: 'User Logout',
        description: 'Invalidates session / logs out the user and records audit log.',
        security: [{ bearerAuth: [] }],
        response: {
          200: logoutResponseSchema,
        },
      },
    },
    async (request, reply) => {
      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
         VALUES ($1, 'USER_LOGOUT', 'USER', $1)`,
        [request.user.id]
      );

      return reply.send({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      });
    }
  );
};
