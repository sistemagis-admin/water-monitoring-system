import { buildApp } from './app.js';
import { env } from './config/env.js';
import { mqttManager } from './infrastructure/mqtt/mqtt-client.js';
import { startDeviceHealthJob } from './jobs/device-health.js';
import { startCommandTimeoutJob } from './jobs/command-timeout.js';
import { sseManager } from './infrastructure/realtime/sse-manager.js';
import { pool } from './infrastructure/db/index.js';

async function startServer() {
  try {
    const app = await buildApp();

    // Initialize MQTT Ingestion Client
    mqttManager.init();

    // Start Background Jobs
    const stopDeviceHealthJob = startDeviceHealthJob(10000);
    const stopCommandTimeoutJob = startCommandTimeoutJob(3000);

    // Listen
    await app.listen({ port: env.PORT, host: env.HOST });

    console.log(`
========================================================================
🚀 Smart Water Pump Monitoring System (SWPMS) - Fastify Backend API
🏢 PT Ascon Multi Pratama - SCADA & Industrial IoT
========================================================================
📡 API Server running on    : http://${env.HOST}:${env.PORT}
📖 Swagger UI Documentation : http://localhost:${env.PORT}/docs
📄 OpenAPI Specification    : http://localhost:${env.PORT}/docs/json
📮 Direct Postman Import    : http://localhost:${env.PORT}/api/v1/openapi.json
⚡ Realtime SSE Stream      : http://localhost:${env.PORT}/api/v1/realtime/stream
🔌 MQTT Broker Endpoint     : ${env.MQTT_URL}
🗄️ PostgreSQL Database      : Connected (${env.DATABASE_URL.split('@')[1] || 'localhost'})
========================================================================
`);

    // Graceful Shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        console.log(`Received ${signal}, shutting down gracefully...`);
        stopDeviceHealthJob();
        stopCommandTimeoutJob();
        sseManager.close();
        mqttManager.close();
        await app.close();
        await pool.end();
        console.log('Server shut down cleanly.');
        process.exit(0);
      });
    }
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

startServer();
