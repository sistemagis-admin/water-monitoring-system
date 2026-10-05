import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env.js';
import { query } from '../infrastructure/db/index.js';
import { AppError } from '../shared/errors/app-error.js';
import { Permission, ROLE_PERMISSIONS, RoleName } from '../config/constants.js';
import { AuthUserPayload } from '../shared/types/domain.js';

const authPluginAsync: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Support token in header OR in query (useful for SSE EventSource)
        let token: string | undefined;
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        } else if ((request.query as any)?.token) {
          token = (request.query as any).token;
        }

        if (!token) {
          throw AppError.unauthorized('No authorization token provided');
        }

        const decoded = fastify.jwt.verify<AuthUserPayload & { type?: string }>(token);

        if (decoded.type === 'refresh') {
          throw AppError.unauthorized('Cannot use refresh token for API access');
        }

        // Verify user is still active in DB
        const userRes = await query(
          `SELECT u.id, u.email, u.role, u.status, u.site_id
           FROM users u
           WHERE u.id = $1`,
          [decoded.id]
        );

        if (userRes.rows.length === 0 || userRes.rows[0].status !== 'ACTIVE') {
          throw AppError.unauthorized('User inactive or not found');
        }

        const dbUser = userRes.rows[0];
        const userRole = dbUser.role as RoleName;
        const permissions = ROLE_PERMISSIONS[userRole] || [];

        request.user = {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
          permissions,
          site_id: dbUser.site_id,
        };
      } catch (err: any) {
        if (err instanceof AppError) throw err;
        throw AppError.unauthorized(err.message || 'Invalid or expired token');
      }
    }
  );

  fastify.decorate(
    'authorize',
    (requiredPermission: Permission) => {
      return async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user) {
          throw AppError.unauthorized();
        }

        if (request.user.role === 'SUPER_ADMIN') {
          return;
        }

        if (!request.user.permissions || !request.user.permissions.includes(requiredPermission)) {
          throw AppError.forbidden(`Missing required permission: ${requiredPermission}`);
        }
      };
    }
  );
};

export const authPlugin = fp(authPluginAsync);

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (permission: Permission) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
