import { z } from 'zod';
import { standardSuccessResponseSchema } from '../../shared/schemas/common.js';

export const dashboardSummarySchema = standardSuccessResponseSchema(
  z.object({
    sites: z.number(),
    devices: z.object({
      total: z.number(),
      online: z.number(),
      offline: z.number(),
      stale: z.number().optional(),
    }),
    pumps: z.object({
      total: z.number(),
      running: z.number(),
      stopped: z.number(),
      fault: z.number(),
      maintenance: z.number().optional(),
      offline: z.number().optional(),
      commanding: z.number().optional(),
    }),
    alarms: z.object({
      active: z.number(),
      critical: z.number(),
      high: z.number(),
      medium: z.number(),
      low: z.number().optional(),
    }),
  })
);

export const siteSummarySchema = standardSuccessResponseSchema(
  z.object({
    site: z.object({
      id: z.string().uuid(),
      code: z.string(),
      name: z.string(),
      status: z.string(),
      timezone: z.string(),
    }),
    devices: z.object({
      total: z.number(),
      online: z.number(),
      offline: z.number(),
    }),
    pumps: z.object({
      total: z.number(),
      running: z.number(),
      stopped: z.number(),
      fault: z.number(),
    }),
    alarms: z.object({
      active: z.number(),
      critical: z.number(),
      high: z.number(),
      medium: z.number(),
    }),
  })
);
