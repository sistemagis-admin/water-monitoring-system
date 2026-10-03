import { z } from 'zod';
import { standardSuccessResponseSchema, paginationQuerySchema, idParamSchema } from '../../shared/schemas/common.js';

export const siteSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  address: z.string().nullable().optional(),
  timezone: z.string(),
  status: z.string(),
  created_at: z.string().or(z.date()),
  updated_at: z.string().or(z.date()),
});

export const createSiteBodySchema = z.object({
  project_id: z.string().uuid(),
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(255),
  address: z.string().optional(),
  timezone: z.string().default('Asia/Jakarta'),
  status: z.string().default('ACTIVE'),
});

export const updateSiteBodySchema = createSiteBodySchema.partial();

export const siteListResponseSchema = standardSuccessResponseSchema(z.array(siteSchema));
export const siteDetailResponseSchema = standardSuccessResponseSchema(siteSchema);
