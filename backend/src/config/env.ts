import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().default('postgresql://swpm_user:swpm_password@localhost:5432/swpm_db'),

  MQTT_URL: z.string().default('mqtt://localhost:1883'),
  MQTT_USERNAME: z.string().optional().default(''),
  MQTT_PASSWORD: z.string().optional().default(''),
  MQTT_CLIENT_ID: z.string().default('swpm-backend'),
  MQTT_TOPIC_PREFIX: z.string().default('swpm/v1'),

  JWT_SECRET: z.string().default('swpm_super_secret_jwt_key_change_in_production_2026_ascon'),
  ACCESS_TOKEN_TTL: z.string().default('7d'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),

  SSE_HEARTBEAT_INTERVAL: z.coerce.number().default(15000),
  DEVICE_OFFLINE_TIMEOUT: z.coerce.number().default(30000),
  COMMAND_TIMEOUT_SECONDS: z.coerce.number().default(15),
  TELEMETRY_RETENTION_DAYS: z.coerce.number().default(30),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
