import fastify, { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { swaggerPlugin } from './plugins/swagger.js';
import { authPlugin } from './plugins/auth.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';

import { testConnection } from './infrastructure/db/index.js';
import { mqttManager } from './infrastructure/mqtt/mqtt-client.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { sitesRoutes } from './modules/sites/sites.routes.js';
import { areasRoutes } from './modules/areas/areas.routes.js';
import { devicesRoutes } from './modules/devices/devices.routes.js';
import { assetsRoutes } from './modules/assets/assets.routes.js';
import { commandsRoutes } from './modules/assets/commands.routes.js';
import { sensorsRoutes } from './modules/sensors/sensors.routes.js';
import { metricsRoutes } from './modules/metrics/metrics.routes.js';
import { telemetryRoutes } from './modules/telemetry/telemetry.routes.js';
import { alarmsRoutes } from './modules/alarms/alarms.routes.js';
import { alarmRulesRoutes } from './modules/alarms/alarm-rules.routes.js';
import { eventsRoutes } from './modules/events/events.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';
import { reportsRoutes } from './modules/reports/reports.routes.js';
import { realtimeRoutes } from './modules/realtime/realtime.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: false,
    trustProxy: true,
  });

  // Zod Compilers
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Security Headers & CORS
  await app.register(fastifyCors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    hsts: false,
  });

  await app.register(fastifyRateLimit, {
    max: 500,
    timeWindow: '1 minute',
  });

  // Custom Plugins
  await app.register(errorHandlerPlugin);
  await app.register(swaggerPlugin);
  await app.register(authPlugin);

  // Health Endpoints (PRD Section 62)
  app.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Basic Service Health Check',
      response: {
        200: z.object({
          status: z.string(),
          timestamp: z.string(),
          service: z.string(),
        }),
      },
    },
    handler: async () => {
      return { status: 'ok', timestamp: new Date().toISOString(), service: 'swpm-backend' };
    },
  });

  app.get('/health/live', {
    schema: {
      tags: ['Health'],
      summary: 'Liveness Probe',
      response: {
        200: z.object({
          live: z.boolean(),
        }),
      },
    },
    handler: async () => {
      return { live: true };
    },
  });

  app.get('/health/ready', {
    schema: {
      tags: ['Health'],
      summary: 'Readiness Probe',
      description: 'Checks database connectivity and MQTT broker connection status.',
      response: {
        200: z.object({
          ready: z.boolean(),
          database: z.boolean(),
          mqtt: z.object({
            connected: z.boolean(),
          }),
        }),
        503: z.object({
          ready: z.boolean(),
          database: z.boolean(),
          error: z.string(),
        }),
      },
    },
    handler: async (_req, reply) => {
      const dbConnected = await testConnection();
      const mqttStatus = mqttManager.getStatus();

      if (!dbConnected) {
        return reply.status(503).send({
          ready: false,
          database: false,
          error: 'Database connection failed',
        });
      }

      return reply.send({
        ready: true,
        database: true,
        mqtt: mqttStatus,
      });
    },
  });

  // Register API v1 Route Modules
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });
  await app.register(sitesRoutes, { prefix: '/api/v1/sites' });
  await app.register(areasRoutes, { prefix: '/api/v1/areas' });
  await app.register(devicesRoutes, { prefix: '/api/v1/devices' });
  await app.register(assetsRoutes, { prefix: '/api/v1/assets' });
  await app.register(commandsRoutes, { prefix: '/api/v1/commands' });
  await app.register(sensorsRoutes, { prefix: '/api/v1/sensors' });
  await app.register(metricsRoutes, { prefix: '/api/v1/metrics' });
  await app.register(telemetryRoutes, { prefix: '/api/v1' });
  await app.register(alarmsRoutes, { prefix: '/api/v1/alarms' });
  await app.register(alarmRulesRoutes, { prefix: '/api/v1/alarm-rules' });
  await app.register(eventsRoutes, { prefix: '/api/v1/events' });
  await app.register(auditRoutes, { prefix: '/api/v1/audit-logs' });
  await app.register(reportsRoutes, { prefix: '/api/v1/reports' });
  await app.register(realtimeRoutes, { prefix: '/api/v1/realtime' });
  await app.register(usersRoutes, { prefix: '/api/v1/users' });

  return app;
}
