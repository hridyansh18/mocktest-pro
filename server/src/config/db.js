import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const ssl = env.pgSslMode === 'disable'
  ? false
  : env.pgSslMode === 'require'
    ? { rejectUnauthorized: false }
    : { rejectUnauthorized: true };

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl,
  max: env.dbPoolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle PostgreSQL client', err);
});

export const query = (text, params) => pool.query(text, params);
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
