import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.pgSsl ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[db] Unexpected error on idle PostgreSQL client', err);
  process.exit(1);
});

/**
 * Run a parameterized query against the pool.
 * All models should go through this (or getClient for transactions)
 * so every query is parameterized and never string-concatenated —
 * this is the project's primary SQL-injection defense.
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Acquire a dedicated client for multi-statement transactions.
 * Caller is responsible for BEGIN / COMMIT / ROLLBACK / release().
 */
export const getClient = () => pool.connect();

export const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export default pool;
