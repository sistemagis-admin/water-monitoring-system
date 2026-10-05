import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // PostgreSQL Database Variables (Separated)
  POSTGRES_USER: z.string().default('swpm_user'),
  POSTGRES_PASSWORD: z.string().default('swpm_password'),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_DB: z.string().default('swpm_db'),
  DATABASE_URL: z.string().optional(),

  // MQTT Variables (Separated)
  MQTT_HOST: z.string().default('localhost'),
  MQTT_PORT: z.coerce.number().default(1883),
  MQTT_URL: z.string().optional(),
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

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

const parsedData = parsed.data;

// Automatically resolve DATABASE_URL if omitted or template-string
const resolvedDatabaseUrl =
  parsedData.DATABASE_URL && !parsedData.DATABASE_URL.includes('${')
    ? parsedData.DATABASE_URL
    : `postgresql://${parsedData.POSTGRES_USER}:${encodeURIComponent(parsedData.POSTGRES_PASSWORD)}@${parsedData.POSTGRES_HOST}:${parsedData.POSTGRES_PORT}/${parsedData.POSTGRES_DB}`;

// Automatically resolve MQTT_URL if omitted or template-string
const resolvedMqttUrl =
  parsedData.MQTT_URL && !parsedData.MQTT_URL.includes('${')
    ? parsedData.MQTT_URL
    : `mqtt://${parsedData.MQTT_HOST}:${parsedData.MQTT_PORT}`;

export const env = {
  ...parsedData,
  DATABASE_URL: resolvedDatabaseUrl,
  MQTT_URL: resolvedMqttUrl,
};

export type Env = typeof env;
