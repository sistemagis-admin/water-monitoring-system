import pg from 'pg';
import { env } from '../../config/env.js';
import { logger } from '../../shared/utils/logger.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({
    service: 'database',
    event: 'pool_error',
    message: 'Unexpected error on idle database client',
    details: err.message,
  });
});

export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn({
        service: 'database',
        event: 'slow_query',
        message: `Query took ${duration}ms`,
        query: text.substring(0, 100),
      });
    }
    return res;
  } catch (error: any) {
    logger.error({
      service: 'database',
      event: 'query_error',
      message: error.message,
      query: text,
      params,
    });
    throw error;
  }
}

export async function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}

export async function transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const res = await pool.query('SELECT NOW()');
    return !!res.rows[0];
  } catch (err: any) {
    logger.error({
      service: 'database',
      event: 'connection_test_failed',
      message: err.message,
    });
    return false;
  }
}
