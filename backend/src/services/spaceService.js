import { pool } from '../config/database.js';
import { HttpError } from '../utils/http.js';

export async function listSpaces(filters) {
  const values = [];
  const clauses = ['archived_at IS NULL'];
  if (filters.nome !== undefined) { values.push(`%${filters.nome}%`); clauses.push(`nome ILIKE $${values.length}`); }
  if (filters.capacidadeMinima !== undefined) { values.push(filters.capacidadeMinima); clauses.push(`capacidade >= $${values.length}`); }
  const result = await pool.query(`SELECT * FROM espacos WHERE ${clauses.join(' AND ')} ORDER BY nome, id`, values);
  return result.rows;
}

export async function getSpace(id) {
  const result = await pool.query(
    `SELECT e.*, COUNT(r.id)::int AS total_reservas,
      COUNT(r.id) FILTER (WHERE r.situacao = 'Pendente')::int AS reservas_pendentes,
      COUNT(r.id) FILTER (WHERE r.situacao = 'Aprovada')::int AS reservas_aprovadas
     FROM espacos e LEFT JOIN reservas r ON r.espaco_id = e.id
     WHERE e.id = $1 GROUP BY e.id`, [id],
  );
  if (!result.rowCount) throw new HttpError(404, 'Espaço não encontrado.');
  return result.rows[0];
}

export async function createSpace(space) {
  const result = await pool.query(
    'INSERT INTO espacos (nome, capacidade, descricao, localizacao_predio) VALUES ($1, $2, $3, $4) RETURNING *',
    [space.nome, space.capacidade, space.descricao ?? null, space.localizacao_predio],
  );
  return result.rows[0];
}

export async function updateSpace(id, data) {
  const fields = ['nome', 'capacidade', 'descricao', 'localizacao_predio'].filter((key) => data[key] !== undefined);
  if (!fields.length) throw new HttpError(400, 'Informe ao menos um campo válido para atualizar.');
  const values = fields.map((key) => data[key]);
  const assignments = fields.map((key, index) => `${key} = $${index + 1}`);
  values.push(id);
  const result = await pool.query(
    `UPDATE espacos SET ${assignments.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length} AND archived_at IS NULL RETURNING *`, values,
  );
  if (!result.rowCount) {
    const exists = await pool.query('SELECT 1 FROM espacos WHERE id = $1', [id]);
    if (!exists.rowCount) throw new HttpError(404, 'Espaço não encontrado.');
    throw new HttpError(409, 'Espaços arquivados não podem ser alterados.');
  }
  return result.rows[0];
}

export async function archiveSpace(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const locked = await client.query('SELECT id FROM espacos WHERE id = $1 FOR UPDATE', [id]);
    if (!locked.rowCount) throw new HttpError(404, 'Espaço não encontrado.');
    const active = await client.query(
      `SELECT 1 FROM reservas WHERE espaco_id = $1 AND situacao IN ('Pendente', 'Aprovada')
       AND data + horario_inicio > NOW() LIMIT 1`, [id],
    );
    if (active.rowCount) throw new HttpError(409, 'Não é possível arquivar: existem reservas futuras pendentes ou aprovadas. Cancele ou reprograme essas reservas primeiro.');
    const result = await client.query(
      'UPDATE espacos SET archived_at = COALESCE(archived_at, NOW()), updated_at = NOW() WHERE id = $1 RETURNING id, archived_at', [id],
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
