import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
};

const getAppliedMigrations = async () => {
  const { rows } = await pool.query('SELECT filename FROM schema_migrations');
  return new Set(rows.map((r) => r.filename));
};

const run = async () => {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      logger.info(`Skipping already-applied migration: ${file}`);
      // eslint-disable-next-line no-continue
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    logger.info(`Applying migration: ${file}`);
    // eslint-disable-next-line no-await-in-loop
    const client = await pool.connect();
    try {
      // eslint-disable-next-line no-await-in-loop
      await client.query('BEGIN');
      // eslint-disable-next-line no-await-in-loop
      await client.query(sql);
      // eslint-disable-next-line no-await-in-loop
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      // eslint-disable-next-line no-await-in-loop
      await client.query('COMMIT');
    } catch (err) {
      // eslint-disable-next-line no-await-in-loop
      await client.query('ROLLBACK');
      logger.error(`Migration failed: ${file}`, err);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  logger.info('All migrations applied successfully.');
  await pool.end();
  process.exit(0);
};

run();
