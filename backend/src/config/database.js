import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required database environment variables: ${missingEnvVars.join(', ')}`);
}

const isTestRun = process.env.NODE_ENV === 'test'
  || process.execArgv.includes('--test')
  || process.argv.some((argument) => argument.includes('/node_modules/.bin/node') || argument.includes('/tests/'));

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: isTestRun
    ? (process.env.TEST_DB_NAME || 'agendamento_espacos_test')
    : process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function ensureDatabaseReady() {
  const result = await pool.query('SELECT NOW() AS now');
  return result.rows[0].now;
}

export default pool;
