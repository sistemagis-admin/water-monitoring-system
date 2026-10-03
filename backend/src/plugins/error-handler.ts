import { FastifyError, FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../shared/errors/app-error.js';
import { logger } from '../shared/utils/logger.js';

const errorHandlerPluginAsync: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((error: FastifyError | AppError | Error, request: FastifyRequest, reply: FastifyReply) => {
    // 1. Check custom AppError
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    // 2. Check Zod / Fastify Validation Error
    if ((error as any).validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message || 'Request validation failed',
          details: (error as any).validation,
        },
      });
    }

    // 3. Fallback Internal Server Error
    logger.error({
      service: 'api',
      event: 'unhandled_error',
      message: error.message,
      stack: error.stack,
      url: request.raw.url,
      method: request.raw.method,
    });

    const statusCode = (error as any).statusCode || 500;
    return reply.status(statusCode).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: statusCode === 500 ? 'An unexpected server error occurred' : error.message,
      },
    });
  });
};

export const errorHandlerPlugin = fp(errorHandlerPluginAsync);
