import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import bcrypt from 'bcryptjs';
import { query } from '../../infrastructure/db/index.js';
import { AppError } from '../../shared/errors/app-error.js';
import {
  loginBodySchema,
  registerBodySchema,
  loginResponseSchema,
  logoutResponseSchema,
  meResponseSchema,
  refreshTokenBodySchema,
  refreshResponseSchema,
} from './auth.schema.js';
import { ROLE_PERMISSIONS, RoleName } from '../../config/constants.js';
import { env } from '../../config/env.js';

export const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // POST /api/v1/auth/register (or /signup)
  const handleRegister = async (request: any, reply: any) => {
    const { email, password, full_name, role = 'OPERATOR' } = request.body;

    const existing = await query(
      `SELECT id FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    if (existing.rows.length > 0) {
      throw AppError.conflict('Email is already registered', 'DUPLICATE_RESOURCE');
    }

    // Get default site for assignment
    const siteRes = await query(`SELECT id FROM sites LIMIT 1`);
    const siteId = siteRes.rows[0]?.id || null;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRes = await query(
      `INSERT INTO users (email, password_hash, full_name, role, status, site_id)
       VALUES ($1, $2, $3, $4, 'ACTIVE', $5)
       RETURNING id, email, full_name, role, site_id`,
      [email.toLowerCase().trim(), passwordHash, full_name.trim(), role, siteId]
    );

    const newUser = userRes.rows[0];

    // Assign role in user_roles table
    const roleRes = await query(`SELECT id FROM roles WHERE name = $1`, [role]);
    if (roleRes.rows[0]) {
      await query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [newUser.id, roleRes.rows[0].id]
      );
    }

    const permissions = ROLE_PERMISSIONS[role as RoleName] || [];

    const tokenPayload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      permissions,
      site_id: newUser.site_id,
    };

    const token = fastify.jwt.sign(tokenPayload, { expiresIn: env.ACCESS_TOKEN_TTL });
    const refreshToken = fastify.jwt.sign(
      { id: newUser.id, type: 'refresh' },
      { expiresIn: env.REFRESH_TOKEN_TTL }
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent)
       VALUES ($1, 'USER_REGISTER', 'USER', $1, $2, $3)`,
      [newUser.id, request.ip, request.headers['user-agent'] || null]
    );

    return reply.status(201).send({
      success: true,
      data: {
        access_token: token,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: env.ACCESS_TOKEN_TTL,
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          permissions,
          site_id: newUser.site_id,
        },
      },
    });
  };

  fastify.post(
    '/register',
    {
      schema: {
        tags: ['Auth'],
        summary: 'User Registration / Signup',
        description: 'Register a new user account with email, password, and role. Returns an access token immediately.',
        body: registerBodySchema,
        response: {
          201: loginResponseSchema,
        },
      },
    },
    handleRegister
  );

  fastify.post(
    '/signup',
    {
      schema: {
        tags: ['Auth'],
        summary: 'User Signup (Alias)',
        description: 'Alias endpoint for registration.',
        body: registerBodySchema,
        response: {
          201: loginResponseSchema,
        },
      },
    },
    handleRegister
  );
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
      const refreshToken = fastify.jwt.sign(
        { id: user.id, type: 'refresh' },
        { expiresIn: env.REFRESH_TOKEN_TTL }
      );

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
          refresh_token: refreshToken,
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

  // POST /api/v1/auth/refresh
  fastify.post(
    '/refresh',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Refresh Access Token',
        description: 'Submit a valid refresh token to get a new access token and refresh token.',
        body: refreshTokenBodySchema,
        response: {
          200: refreshResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { refresh_token } = request.body;

      let decoded: any;
      try {
        decoded = fastify.jwt.verify(refresh_token);
      } catch (err: any) {
        throw AppError.unauthorized('Invalid or expired refresh token', 'AUTH_UNAUTHORIZED');
      }

      if (!decoded || decoded.type !== 'refresh' || !decoded.id) {
        throw AppError.unauthorized('Invalid refresh token type', 'AUTH_UNAUTHORIZED');
      }

      const userRes = await query(
        `SELECT id, email, full_name, role, status, site_id
         FROM users
         WHERE id = $1`,
        [decoded.id]
      );

      if (userRes.rows.length === 0) {
        throw AppError.unauthorized('User not found', 'AUTH_UNAUTHORIZED');
      }

      const user = userRes.rows[0];

      if (user.status !== 'ACTIVE') {
        throw AppError.forbidden('User account is disabled', 'AUTH_FORBIDDEN');
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

      const newAccessToken = fastify.jwt.sign(tokenPayload, { expiresIn: env.ACCESS_TOKEN_TTL });
      const newRefreshToken = fastify.jwt.sign(
        { id: user.id, type: 'refresh' },
        { expiresIn: env.REFRESH_TOKEN_TTL }
      );

      return reply.send({
        success: true,
        data: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
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
