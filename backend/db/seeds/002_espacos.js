import { pool } from '../../src/config/database.js';

const spaces = [
  { nome: 'Sala 101', capacidade: 30, descricao: 'Sala de aula com projetor', localizacao: 'Bloco A, 1º andar' },
  { nome: 'Laboratório de Informática', capacidade: 25, descricao: 'Computadores e projetor', localizacao: 'Bloco B, térreo' },
  { nome: 'Auditório', capacidade: 120, descricao: 'Auditório principal', localizacao: 'Bloco C, térreo' },
];

try {
  for (const space of spaces) {
    await pool.query(
      `INSERT INTO espacos (nome, capacidade, descricao, localizacao_predio)
       SELECT $1::varchar, $2::integer, $3::text, $4::varchar
       WHERE NOT EXISTS (
         SELECT 1 FROM espacos WHERE nome = $1::varchar AND localizacao_predio = $4::varchar
       )`,
      [space.nome, space.capacidade, space.descricao, space.localizacao],
    );
  }
  const result = await pool.query('SELECT COUNT(*)::int AS total FROM espacos WHERE archived_at IS NULL');
  console.log(`Seeded spaces; ${result.rows[0].total} active spaces are available.`);
} catch (error) {
  console.error('Failed to seed spaces:', error.message || (error.name === 'AggregateError' ? 'Database connection unavailable; verify the existing PostgreSQL service.' : error.name));
  process.exitCode = 1;
} finally {
  await pool.end();
}
