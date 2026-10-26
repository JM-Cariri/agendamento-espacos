import test from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../src/config/database.js';

test('database has the required seeded user profiles and hashed passwords', async () => {
  const result = await pool.query(
    "SELECT nome, email, perfil, senha_hash FROM usuarios ORDER BY perfil"
  );

  assert.equal(result.rows.length, 2);
  assert.deepEqual(
    result.rows.map((row) => row.perfil).sort(),
    ['Coordenador', 'Professor'],
  );
  assert.ok(result.rows.every((row) => row.senha_hash.startsWith('$2')));
  assert.ok(result.rows.some((row) => row.email === 'professor@escola.local'));
  assert.ok(result.rows.some((row) => row.email === 'coordenador@escola.local'));
});

test.after(() => pool.end());
