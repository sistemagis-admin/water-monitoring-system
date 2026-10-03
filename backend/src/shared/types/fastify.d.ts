import { AuthUserPayload } from './domain.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUserPayload;
    user: AuthUserPayload;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUserPayload;
  }
}
