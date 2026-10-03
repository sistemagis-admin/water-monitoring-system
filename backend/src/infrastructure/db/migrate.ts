import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from './index.js';
import { logger } from '../../shared/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('--- Starting Database Migration ---');
  try {
    // Create migrations tracking table
    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      const existing = await query('SELECT name FROM schema_migrations WHERE name = $1', [file]);
      if (existing.rows.length === 0) {
        console.log(`Applying migration: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`Migration applied successfully: ${file}`);
        } catch (err: any) {
          await client.query('ROLLBACK');
          logger.error({
            service: 'migration',
            event: 'migration_failed',
            message: `Failed to apply migration ${file}: ${err.message}`,
          });
          throw err;
        } finally {
          client.release();
        }
      } else {
        console.log(`Migration already applied: ${file}`);
      }
    }

    console.log('--- Database Migrations Completed Successfully ---');
  } catch (error: any) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
