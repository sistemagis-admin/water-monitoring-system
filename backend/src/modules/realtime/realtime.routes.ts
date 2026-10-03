import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import crypto from 'crypto';
import { sseManager } from '../../infrastructure/realtime/sse-manager.js';

export const realtimeRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/v1/realtime/stream (PRD Section 39)
  fastify.get(
    '/stream',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Realtime'],
        summary: 'Server-Sent Events (SSE) Stream',
        description: `
Connects browser to the live Server-Sent Events stream.
Pushes \`telemetry.update\`, \`asset.state\`, \`asset.status\`, \`alarm.created\`, \`alarm.updated\`, \`device.status\`, \`command.updated\`, and \`event.created\`.

Authenticate by passing Bearer token in header or as query parameter \`?token=<jwt_token>\`.
        `,
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          site_id: z.string().uuid().optional().describe('Optional filter by site UUID'),
          token: z.string().optional().describe('JWT Bearer token if connecting from browser EventSource'),
        }),
      },
    },
    async (request, reply) => {
      const clientId = `client_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const siteId = request.query.site_id || request.user.site_id || undefined;

      // Disable timeouts and buffer
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('X-Accel-Buffering', 'no');
      reply.raw.flushHeaders?.();

      sseManager.addClient({
        id: clientId,
        siteId,
        userId: request.user.id,
        reply,
      });

      // Send initial welcome event
      const welcomePayload = {
        connected_at: new Date().toISOString(),
        client_id: clientId,
        site_id: siteId || 'ALL',
        message: 'Connected to SWPMS Realtime Event Stream',
      };
      reply.raw.write(`event: system.notification\ndata: ${JSON.stringify(welcomePayload)}\n\n`);

      // Prevent Fastify from closing connection
      await new Promise<void>((resolve) => {
        reply.raw.on('close', () => {
          resolve();
        });
      });
    }
  );
};
