import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

const swaggerPluginAsync: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Smart Water Pump Monitoring System (SWPMS) API',
        description: `
### PT Ascon Multi Pratama - Industrial IoT & Water Pump Monitoring Dashboard

SWPMS is a centralized, real-time, and historical water pump monitoring backend platform.
This API provides full operational telemetry queries, dynamic site/area/device/sensor topology management, alarm rule evaluation, audit logging, CSV reporting, and controlled commanded pump ON/OFF power operations.

#### Authentication
Use the \`/api/v1/auth/login\` endpoint to obtain a JWT Bearer token.
Provide the token in the header:
\`Authorization: Bearer <your_jwt_token>\`

#### Postman Import Instructions
You can import this entire API into Postman directly by choosing **Import -> Link** and pasting:
\`http://localhost:3000/docs/json\` or downloading the OpenAPI specification from \`/docs/json\`.
        `,
        version: '1.1.0',
        contact: {
          name: 'PT Ascon Multi Pratama Automation Team',
          url: 'https://ascon.co.id',
        },
      },
      servers: [
        {
          url: '/',
          description: 'Current Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT access token obtained from /api/v1/auth/login',
          },
        },
      },
      tags: [
        { name: 'Auth', description: 'Authentication, session management, and current user profile' },
        { name: 'Dashboard', description: 'Real-time dashboard KPI summaries, active alarms, and pump statuses' },
        { name: 'Sites', description: 'Physical plant sites and facilities management' },
        { name: 'Areas', description: 'Sub-areas and pump rooms within sites' },
        { name: 'Devices', description: 'MQTT IoT edge gateways, RTUs, and PLC communication status' },
        { name: 'Assets & Pumps', description: 'Operational assets, pumps, and current state' },
        { name: 'Pump Control', description: 'Safe commanded pump ON/OFF control with acknowledgement lifecycle' },
        { name: 'Sensors & Bindings', description: 'Physical and logical sensors and dynamic binding to pumps or rooms' },
        { name: 'Metrics', description: 'Metric definitions catalog and engineering limits' },
        { name: 'Telemetry', description: 'Historical time-series telemetry samples and downsampled trends' },
        { name: 'Alarms', description: 'Active and resolved alarms, operator acknowledgements' },
        { name: 'Alarm Rules', description: 'Configurable alarm threshold rules and anti-flicker policies' },
        { name: 'Events', description: 'System, device, and asset operational event logs' },
        { name: 'Audit Logs', description: 'Immutable audit trail of system configuration and user actions' },
        { name: 'Reports', description: 'CSV stream exports for telemetry, alarms, and events' },
        { name: 'Realtime', description: 'Server-Sent Events (SSE) stream for real-time live browser dashboard updates' },
        { name: 'Health', description: 'Service liveness and readiness health checks' },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
      defaultModelRendering: 'model',
    },
    staticCSP: false,
  });

  // Expose dedicated OpenAPI endpoint for easy Postman import
  fastify.get('/api/v1/openapi.json', {
    schema: {
      hide: true,
      tags: ['Health'],
      summary: 'Export OpenAPI JSON specification for Postman',
      description: 'Returns the full OpenAPI 3.0 specification in JSON format for direct import into Postman.',
    },
    handler: async (_req, reply) => {
      reply.type('application/json');
      return fastify.swagger();
    },
  });
};

export const swaggerPlugin = fp(swaggerPluginAsync);
