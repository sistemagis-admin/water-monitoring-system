import { z } from 'zod';

export const standardSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.record(z.any()).optional(),
  });

export const standardErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const idParamSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
});

export const siteIdParamSchema = z.object({
  siteId: z.string().uuid('Site ID must be a valid UUID'),
});

export const dateRangeQuerySchema = z.object({
  from: z.string().optional().describe('ISO timestamp start range'),
  to: z.string().optional().describe('ISO timestamp end range'),
});
