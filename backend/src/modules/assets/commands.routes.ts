import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { query } from '../../infrastructure/db/index.js';
import { AppError } from '../../shared/errors/app-error.js';

export const commandsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/v1/commands/:commandId
  fastify.get(
    '/:commandId',
    {
      onRequest: [fastify.authenticate, fastify.authorize('command.view')],
      schema: {
        tags: ['Pump Control'],
        summary: 'Get Command Status by Command ID',
        description: 'Returns the execution state, timestamps, and response message of an issued command.',
        security: [{ bearerAuth: [] }],
        params: z.object({
          commandId: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { commandId } = request.params;
      const res = await query(
        `SELECT pc.*, a.name as asset_name, a.code as asset_code, u.email as requested_by_email
         FROM pump_commands pc
         JOIN assets a ON pc.asset_id = a.id
         LEFT JOIN users u ON pc.requested_by = u.id
         WHERE pc.command_id = $1 OR pc.id::text = $1`,
        [commandId]
      );

      if (res.rows.length === 0) {
        throw AppError.notFound('Command not found');
      }

      return reply.send({
        success: true,
        data: res.rows[0],
      });
    }
  );
};
