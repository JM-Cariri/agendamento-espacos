import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrations = [
  { id: '001_usuarios', file: '../db/migrations/001_usuarios.sql' },
  { id: '002_espacos_reservas', file: '../db/migrations/002_espacos_reservas.sql' },
];

try {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);

  for (const migration of migrations) {
    const found = await pool.query('SELECT 1 FROM schema_migrations WHERE id = $1', [migration.id]);
    if (found.rowCount) continue;

    const connection = await pool.connect();
    try {
      await connection.query('BEGIN');
      if (migration.id === '001_usuarios') {
        const existing = await connection.query("SELECT to_regclass('public.usuarios') AS table_name");
        if (!existing.rows[0].table_name) {
          const sql = await fs.readFile(path.resolve(__dirname, migration.file), 'utf8');
          await connection.query(sql);
        }
      } else {
        const sql = await fs.readFile(path.resolve(__dirname, migration.file), 'utf8');
        await connection.query(sql);
      }
      await connection.query('INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT DO NOTHING', [migration.id]);
      await connection.query('COMMIT');
      console.log(`Applied migration ${migration.id}.`);
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  }
} catch (error) {
  console.error('Migration failed:', error.message || (error.name === 'AggregateError' ? 'Database connection unavailable; verify the existing PostgreSQL service.' : error.name));
  process.exitCode = 1;
} finally {
  await pool.end();
}
