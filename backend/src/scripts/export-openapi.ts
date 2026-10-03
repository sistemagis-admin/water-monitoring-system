import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildApp } from '../app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportOpenAPI() {
  console.log('Generating OpenAPI specification & Postman collection...');
  const app = await buildApp();
  await app.ready();

  const openApiSpec = app.swagger();

  // Root docs directory
  const rootDocsDir = path.resolve(__dirname, '../../../docs');
  const backendDir = path.resolve(__dirname, '../../');

  if (!fs.existsSync(rootDocsDir)) {
    fs.mkdirSync(rootDocsDir, { recursive: true });
  }

  // 1. Write openapi.json
  const openApiPath = path.join(rootDocsDir, 'openapi.json');
  fs.writeFileSync(openApiPath, JSON.stringify(openApiSpec, null, 2), 'utf-8');
  console.log(`✅ Exported OpenAPI JSON to: ${openApiPath}`);

  fs.writeFileSync(path.join(backendDir, 'openapi.json'), JSON.stringify(openApiSpec, null, 2), 'utf-8');

  // 2. Generate Postman Collection v2.1.0
  const postmanCollection = {
    info: {
      name: 'Smart Water Pump Monitoring System (SWPMS) - API Collection',
      description: 'Complete Postman Collection for PT Ascon Multi Pratama SWPMS Backend API',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{access_token}}',
          type: 'string',
        },
      ],
    },
    variable: [
      {
        key: 'baseUrl',
        value: 'http://localhost:3000',
        type: 'string',
      },
      {
        key: 'access_token',
        value: '',
        type: 'string',
      },
    ],
    item: [
      {
        name: 'Auth',
        item: [
          {
            name: 'Login (Super Admin)',
            event: [
              {
                listen: 'test',
                script: {
                  exec: [
                    'var jsonData = pm.response.json();',
                    'if (jsonData.success && jsonData.data.access_token) {',
                    '    pm.collectionVariables.set("access_token", jsonData.data.access_token);',
                    '    console.log("Token saved to collection variable");',
                    '}',
                  ],
                  type: 'text/javascript',
                },
              },
            ],
            request: {
              auth: { type: 'noauth' },
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ email: 'admin@ascon.co.id', password: 'Admin@123' }, null, 2),
              },
              url: { raw: '{{baseUrl}}/api/v1/auth/login', host: ['{{baseUrl}}'], path: ['api', 'v1', 'auth', 'login'] },
            },
          },
          {
            name: 'Login (Operator)',
            request: {
              auth: { type: 'noauth' },
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ email: 'operator@ascon.co.id', password: 'Operator@123' }, null, 2),
              },
              url: { raw: '{{baseUrl}}/api/v1/auth/login', host: ['{{baseUrl}}'], path: ['api', 'v1', 'auth', 'login'] },
            },
          },
          {
            name: 'Get Current Profile (Me)',
            request: {
              method: 'GET',
              url: { raw: '{{baseUrl}}/api/v1/auth/me', host: ['{{baseUrl}}'], path: ['api', 'v1', 'auth', 'me'] },
            },
          },
          {
            name: 'Logout',
            request: {
              method: 'POST',
              url: { raw: '{{baseUrl}}/api/v1/auth/logout', host: ['{{baseUrl}}'], path: ['api', 'v1', 'auth', 'logout'] },
            },
          },
        ],
      },
      {
        name: 'Dashboard',
        item: [
          {
            name: 'Global KPI Summary',
            request: {
              method: 'GET',
              url: { raw: '{{baseUrl}}/api/v1/dashboard/summary', host: ['{{baseUrl}}'], path: ['api', 'v1', 'dashboard', 'summary'] },
            },
          },
        ],
      },
      {
        name: 'Sites',
        item: [
          {
            name: 'List Sites',
            request: {
              method: 'GET',
              url: { raw: '{{baseUrl}}/api/v1/sites', host: ['{{baseUrl}}'], path: ['api', 'v1', 'sites'] },
            },
          },
        ],
      },
      {
        name: 'Areas / Rooms',
        item: [
          {
            name: 'List Areas',
            request: {
              method: 'GET',
              url: { raw: '{{baseUrl}}/api/v1/areas', host: ['{{baseUrl}}'], path: ['api', 'v1', 'areas'] },
            },
          },
        ],
      },
      {
        name: 'Devices',
        item: [
          {
            name: 'List Devices',
            request: {
              method: 'GET',
              url: { raw: '{{baseUrl}}/api/v1/devices', host: ['{{baseUrl}}'], path: ['api', 'v1', 'devices'] },
            },
          },
        ],
      },
      {
        name: 'Assets & Pumps',
        item: [
          {
            name: 'List Assets / Pumps',
            request: {
              method: 'GET',
              url: { raw: '{{baseUrl}}/api/v1/assets', host: ['{{baseUrl}}'], path: ['api', 'v1', 'assets'] },
            },
          },
        ],
      },
      {
        name: 'Dynamic Topology',
        item: [
          {
            name: 'Get Full Plant Topology',
            request: {
              method: 'GET',
              url: { raw: '{{baseUrl}}/api/v1/sensors/topology', host: ['{{baseUrl}}'], path: ['api', 'v1', 'sensors', 'topology'] },
            },
          },
        ],
      },
      {
        name: 'Sensors & Bindings',
        item: [
          {
            name: 'List Sensors',
            request: {
              method: 'GET',
              url: { raw: '{{baseUrl}}/api/v1/sensors', host: ['{{baseUrl}}'], path: ['api', 'v1', 'sensors'] },
            },
          },
        ],
      },
      {
        name: 'Metrics',
        item: [
          {
            name: 'List Metric Definitions',
            request: {
              method: 'GET',
              url: { raw: '{{baseUrl}}/api/v1/metrics', host: ['{{baseUrl}}'], path: ['api', 'v1', 'metrics'] },
            },
          },
        ],
      },
      {
        name: 'Alarms',
        item: [
          {
            name: 'List Alarms',
            request: {
              method: 'GET',
              url: { raw: '{{baseUrl}}/api/v1/alarms', host: ['{{baseUrl}}'], path: ['api', 'v1', 'alarms'] },
            },
          },
        ],
      },
      {
        name: 'Events & Audit',
        item: [
          {
            name: 'List Events',
            request: {
              method: 'GET',
              url: { raw: '{{baseUrl}}/api/v1/events', host: ['{{baseUrl}}'], path: ['api', 'v1', 'events'] },
            },
          },
          {
            name: 'List Audit Logs',
            request: {
              method: 'GET',
              url: { raw: '{{baseUrl}}/api/v1/audit-logs', host: ['{{baseUrl}}'], path: ['api', 'v1', 'audit-logs'] },
            },
          },
        ],
      },
      {
        name: 'Reports',
        item: [
          {
            name: 'Export Telemetry CSV',
            request: {
              method: 'GET',
              url: { raw: '{{baseUrl}}/api/v1/reports/telemetry.csv', host: ['{{baseUrl}}'], path: ['api', 'v1', 'reports', 'telemetry.csv'] },
            },
          },
          {
            name: 'Export Alarms CSV',
            request: {
              method: 'GET',
              url: { raw: '{{baseUrl}}/api/v1/reports/alarms.csv', host: ['{{baseUrl}}'], path: ['api', 'v1', 'reports', 'alarms.csv'] },
            },
          },
        ],
      },
      {
        name: 'Health',
        item: [
          {
            name: 'Service Health',
            request: {
              auth: { type: 'noauth' },
              method: 'GET',
              url: { raw: '{{baseUrl}}/health', host: ['{{baseUrl}}'], path: ['health'] },
            },
          },
          {
            name: 'Readiness Probe',
            request: {
              auth: { type: 'noauth' },
              method: 'GET',
              url: { raw: '{{baseUrl}}/health/ready', host: ['{{baseUrl}}'], path: ['health', 'ready'] },
            },
          },
          {
            name: 'Raw OpenAPI Specification (for Postman)',
            request: {
              auth: { type: 'noauth' },
              method: 'GET',
              url: { raw: '{{baseUrl}}/api/v1/openapi.json', host: ['{{baseUrl}}'], path: ['api', 'v1', 'openapi.json'] },
            },
          },
        ],
      },
    ],
  };

  const postmanPath = path.join(rootDocsDir, 'SWPMS_API.postman_collection.json');
  fs.writeFileSync(postmanPath, JSON.stringify(postmanCollection, null, 2), 'utf-8');
  console.log(`✅ Exported Postman Collection to: ${postmanPath}`);

  await app.close();
}

exportOpenAPI()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error exporting OpenAPI:', err);
    process.exit(1);
  });
