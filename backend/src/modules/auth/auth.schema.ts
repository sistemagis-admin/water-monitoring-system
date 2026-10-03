import { z } from 'zod';
import { standardSuccessResponseSchema, standardErrorResponseSchema } from '../../shared/schemas/common.js';

export const loginBodySchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerBodySchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['ENGINEER', 'OPERATOR', 'VIEWER']).default('OPERATOR'),
});

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string(),
  role: z.string(),
  permissions: z.array(z.string()),
  site_id: z.string().uuid().nullable().optional(),
});

export const loginResponseSchema = standardSuccessResponseSchema(
  z.object({
    access_token: z.string(),
    token_type: z.literal('Bearer'),
    expires_in: z.string(),
    user: userProfileSchema,
  })
);

export const meResponseSchema = standardSuccessResponseSchema(userProfileSchema);

export const logoutResponseSchema = standardSuccessResponseSchema(
  z.object({
    message: z.string(),
  })
);
