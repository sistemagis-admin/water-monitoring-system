import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { query } from '../../infrastructure/db/index.js';
import { AppError } from '../../shared/errors/app-error.js';
import { idParamSchema } from '../../shared/schemas/common.js';

const createMetricBodySchema = z.object({
  code: z.string().min(2).max(100),
  label: z.string().min(2).max(255),
  unit: z.string().optional(),
  data_type: z.enum(['number', 'boolean', 'string']).default('number'),
  category: z.enum(['STATUS', 'HYDRAULIC', 'ELECTRICAL', 'MOTOR', 'DEVICE', 'ENERGY', 'PROCESS', 'OTHER']).default('OTHER'),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
  decimal_places: z.number().int().default(2),
  chartable: z.boolean().default(true),
  display_order: z.number().int().default(0),
  config: z.record(z.any()).optional(),
});

const updateMetricBodySchema = createMetricBodySchema.partial();

export const metricsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/v1/metrics
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('site.view')],
      schema: {
        tags: ['Metrics'],
        summary: 'List Metric Definitions',
        description: 'Returns the catalog of all engineering telemetry metrics, units, and boundaries.',
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          category: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { category } = request.query;
      let q = `SELECT * FROM metric_definitions`;
      const params: any[] = [];
      if (category) {
        q += ` WHERE category = $1`;
        params.push(category);
      }
      q += ` ORDER BY display_order ASC, code ASC`;

      const res = await query(q, params);
      return reply.send({ success: true, data: res.rows });
    }
  );

  // POST /api/v1/metrics
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.authorize('system.manage')],
      schema: {
        tags: ['Metrics'],
        summary: 'Create Metric Definition',
        security: [{ bearerAuth: [] }],
        body: createMetricBodySchema,
      },
    },
    async (request, reply) => {
      const b = request.body;
      const res = await query(
        `INSERT INTO metric_definitions (code, label, unit, data_type, category, min_value, max_value, decimal_places, chartable, display_order, config)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          b.code,
          b.label,
          b.unit || null,
          b.data_type,
          b.category,
          b.min_value ?? null,
          b.max_value ?? null,
          b.decimal_places ?? 2,
          b.chartable ?? true,
          b.display_order ?? 0,
          JSON.stringify(b.config || {}),
        ]
      );
      return reply.status(201).send({ success: true, data: res.rows[0] });
    }
  );

  // PATCH /api/v1/metrics/:id
  fastify.patch(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.authorize('system.manage')],
      schema: {
        tags: ['Metrics'],
        summary: 'Update Metric Definition',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateMetricBodySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const b = request.body;

      const res = await query(
        `UPDATE metric_definitions
         SET label = COALESCE($1, label),
             unit = COALESCE($2, unit),
             category = COALESCE($3, category),
             min_value = COALESCE($4, min_value),
             max_value = COALESCE($5, max_value),
             decimal_places = COALESCE($6, decimal_places),
             chartable = COALESCE($7, chartable),
             display_order = COALESCE($8, display_order),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $9
         RETURNING *`,
        [b.label, b.unit, b.category, b.min_value, b.max_value, b.decimal_places, b.chartable, b.display_order, id]
      );
      if (res.rows.length === 0) throw AppError.notFound('Metric not found');

      return reply.send({ success: true, data: res.rows[0] });
    }
  );
};
