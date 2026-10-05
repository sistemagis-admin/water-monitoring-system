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

export const dashboardHistoricalQuerySchema = z.object({
  site_id: z.string().optional(),
  area_id: z.string().optional().default('ALL'),
  timeframe: z.enum(['24h', '7d', '30d', '1y', 'custom']).default('24h'),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const dashboardHistoricalResponseSchema = standardSuccessResponseSchema(
  z.object({
    area_id: z.string(),
    timeframe: z.string(),
    from: z.string(),
    to: z.string(),
    points: z.array(
      z.object({
        timestamp: z.string(),
        label: z.string(),
        full_label: z.string(),
        flow: z.number(),
        pressure: z.number(),
        power: z.number(),
        temp: z.number(),
      })
    ),
    summary: z.record(
      z.string(),
      z.object({
        min: z.number(),
        max: z.number(),
        avg: z.number(),
        total: z.number().optional(),
        unit: z.string(),
      })
    ),
  })
);

