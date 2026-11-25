import { pool } from '../config/database.js';
import { HttpError } from '../utils/http.js';

const dateString = (value) => value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);

async function transaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

async function lockSlots(client, slots) {
  const keys = [...new Map(slots.map(({ espaco_id, data }) => [`${espaco_id}:${dateString(data)}`, { espaco_id, data: dateString(data) }])).values()]
    .sort((left, right) => left.espaco_id - right.espaco_id || left.data.localeCompare(right.data));
  for (const key of keys) await client.query('SELECT pg_advisory_xact_lock($1::int, hashtext($2))', [key.espaco_id, key.data]);
}

async function assertFuture(client, date, start) {
  const result = await client.query('SELECT ($1::date + $2::time) > NOW() AS is_future', [dateString(date), start]);
  if (!result.rows[0].is_future) throw new HttpError(400, 'A reserva deve começar no futuro; escolha um horário que ainda não tenha iniciado.');
}

async function assertAvailable(client, { espaco_id, data, horario_inicio, horario_fim }, ignoreId) {
  const space = await client.query('SELECT id FROM espacos WHERE id = $1 AND archived_at IS NULL FOR SHARE', [espaco_id]);
  if (!space.rowCount) throw new HttpError(409, 'O espaço não existe ou está arquivado. Selecione um espaço ativo.');
  const params = [espaco_id, dateString(data), horario_inicio, horario_fim];
  const exclusion = ignoreId ? 'AND id <> $5' : '';
  if (ignoreId) params.push(ignoreId);
  const conflict = await client.query(
    `SELECT id FROM reservas WHERE espaco_id = $1 AND data = $2::date
       AND situacao IN ('Pendente', 'Aprovada')
       AND horario_inicio < $4::time AND horario_fim > $3::time ${exclusion} LIMIT 1`, params,
  );
  if (conflict.rowCount) throw new HttpError(409, 'Conflito de horário: o espaço já possui uma reserva pendente ou aprovada nesse slot. Escolha outro horário ou espaço.');
}

export async function listReservations(filters) {
  const values = [];
  const clauses = [];
  const add = (sql, value) => { values.push(value); clauses.push(sql.replace('?', `$${values.length}`)); };
  if (filters.status) add('r.situacao = ?', filters.status);
  if (filters.spaceId) add('r.espaco_id = ?', Number(filters.spaceId));
  if (filters.userId) add('r.usuario_id = ?', Number(filters.userId));
  if (filters.date) add('r.data = ?::date', filters.date);
  if (filters.dateFrom) add('r.data >= ?::date', filters.dateFrom);
  if (filters.dateTo) add('r.data <= ?::date', filters.dateTo);
  if (filters.periodo === 'futuras') clauses.push("r.situacao IN ('Pendente', 'Aprovada') AND (r.data + r.horario_inicio) > NOW()");
  if (filters.periodo === 'aprovadasFuturas') clauses.push("r.situacao = 'Aprovada' AND (r.data + r.horario_inicio) > NOW()");
  const result = await pool.query(
    `SELECT r.*, json_build_object('id', u.id, 'nome', u.nome, 'email', u.email, 'perfil', u.perfil) AS usuario,
      json_build_object('id', e.id, 'nome', e.nome, 'capacidade', e.capacidade,
      'localizacao_predio', e.localizacao_predio, 'archived_at', e.archived_at) AS espaco
     FROM reservas r JOIN usuarios u ON u.id = r.usuario_id JOIN espacos e ON e.id = r.espaco_id
     ${clauses.length ? `WHERE ${clauses.map((clause) => `(${clause})`).join(' AND ')}` : ''}
     ORDER BY r.data, r.horario_inicio, r.id`, values,
  );
  return result.rows;
}

export async function getReservation(id) {
  const result = await pool.query(
    `SELECT r.*, json_build_object('id', u.id, 'nome', u.nome, 'email', u.email, 'perfil', u.perfil) AS usuario,
      json_build_object('id', e.id, 'nome', e.nome, 'capacidade', e.capacidade,
      'localizacao_predio', e.localizacao_predio, 'archived_at', e.archived_at) AS espaco
     FROM reservas r JOIN usuarios u ON u.id = r.usuario_id JOIN espacos e ON e.id = r.espaco_id WHERE r.id = $1`, [id],
  );
  if (!result.rowCount) throw new HttpError(404, 'Reserva não encontrada.');
  return result.rows[0];
}

export async function createReservation(userId, input) {
  return transaction(async (client) => {
    await lockSlots(client, [input]);
    await assertFuture(client, input.data, input.horario_inicio);
    await assertAvailable(client, input);
    const result = await client.query(
      `INSERT INTO reservas (usuario_id, espaco_id, data, horario_inicio, horario_fim, finalidade, situacao)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pendente') RETURNING *`,
      [userId, input.espaco_id, input.data, input.horario_inicio, input.horario_fim, input.finalidade],
    );
    return result.rows[0];
  });
}

export async function updateReservation(id, user, input) {
  return transaction(async (client) => {
    const before = await client.query('SELECT espaco_id, data FROM reservas WHERE id = $1', [id]);
    if (!before.rowCount) throw new HttpError(404, 'Reserva não encontrada.');
    const old = before.rows[0];
    await lockSlots(client, [old, { espaco_id: input.espaco_id ?? old.espaco_id, data: input.data ?? old.data }]);
    const current = await client.query('SELECT * FROM reservas WHERE id = $1 FOR UPDATE', [id]);
    if (!current.rowCount) throw new HttpError(404, 'Reserva não encontrada.');
    const reservation = current.rows[0];
    if (Number(reservation.espaco_id) !== Number(old.espaco_id) || dateString(reservation.data) !== dateString(old.data)) {
      throw new HttpError(409, 'A reserva foi atualizada simultaneamente. Recarregue e tente novamente.');
    }
    if (Number(reservation.usuario_id) !== Number(user.id) && user.perfil !== 'Coordenador') throw new HttpError(403, 'Somente o titular ou um Coordenador pode editar esta reserva.');
    if (!['Pendente', 'Aprovada'].includes(reservation.situacao)) throw new HttpError(409, 'Apenas reservas pendentes ou aprovadas podem ser editadas.');
    const candidate = {
      espaco_id: input.espaco_id ?? reservation.espaco_id,
      data: input.data ?? dateString(reservation.data),
      horario_inicio: input.horario_inicio ?? String(reservation.horario_inicio).slice(0, 5),
      horario_fim: input.horario_fim ?? String(reservation.horario_fim).slice(0, 5),
      finalidade: input.finalidade ?? reservation.finalidade,
    };
    await assertFuture(client, candidate.data, candidate.horario_inicio);
    await assertAvailable(client, candidate, id);
    const result = await client.query(
      `UPDATE reservas SET espaco_id = $1, data = $2, horario_inicio = $3, horario_fim = $4,
       finalidade = $5, updated_at = NOW() WHERE id = $6 RETURNING *`,
      [candidate.espaco_id, candidate.data, candidate.horario_inicio, candidate.horario_fim, candidate.finalidade, id],
    );
    return result.rows[0];
  });
}

async function cancellationWindow(client, reservation) {
  const result = await client.query(
    `SELECT $1::date > CURRENT_DATE AS future_date,
      ($1::date = CURRENT_DATE AND $1::date + $2::time > NOW()) AS same_day_before_start`,
    [dateString(reservation.data), reservation.horario_inicio],
  );
  return result.rows[0];
}

export async function changeReservationStatus(id, user, input) {
  return transaction(async (client) => {
    const snapshot = await client.query('SELECT espaco_id, data FROM reservas WHERE id = $1', [id]);
    if (!snapshot.rowCount) throw new HttpError(404, 'Reserva não encontrada.');
    const item = snapshot.rows[0];
    await lockSlots(client, [item]);
    const found = await client.query('SELECT * FROM reservas WHERE id = $1 FOR UPDATE', [id]);
    if (!found.rowCount) throw new HttpError(404, 'Reserva não encontrada.');
    const reservation = found.rows[0];
    if (Number(reservation.espaco_id) !== Number(item.espaco_id) || dateString(reservation.data) !== dateString(item.data)) {
      throw new HttpError(409, 'A reserva foi atualizada simultaneamente. Recarregue e tente novamente.');
    }

    if (input.situacao === 'Aprovada' || input.situacao === 'Recusada') {
      if (user.perfil !== 'Coordenador') throw new HttpError(403, 'Somente um Coordenador pode aprovar ou recusar reservas.');
      if (reservation.situacao !== 'Pendente') throw new HttpError(409, 'Somente uma reserva pendente pode ser aprovada ou recusada.');
      if (input.situacao === 'Aprovada') await assertAvailable(client, reservation, id);
    } else if (input.situacao === 'Cancelada') {
      if (!['Pendente', 'Aprovada'].includes(reservation.situacao)) throw new HttpError(409, 'A reserva já foi recusada ou cancelada e não pode ser cancelada novamente.');
      const window = await cancellationWindow(client, reservation);
      if (!window.future_date && !window.same_day_before_start) throw new HttpError(409, 'O horário da reserva já começou ou a data já passou; não é possível cancelar.');
      const owner = Number(reservation.usuario_id) === Number(user.id);
      if (window.same_day_before_start && !window.future_date && user.perfil !== 'Coordenador') {
        if (owner) throw new HttpError(403, 'No dia da reserva, somente um Coordenador pode cancelar antes do início.');
        throw new HttpError(403, 'Somente o titular ou um Coordenador pode cancelar esta reserva.');
      }
      if (!owner && user.perfil !== 'Coordenador') throw new HttpError(403, 'Somente o titular ou um Coordenador pode cancelar esta reserva.');
    } else {
      throw new HttpError(409, 'Transição de situação não permitida.');
    }

    const result = await client.query(
      `UPDATE reservas SET situacao = $1, justificativa_recusa = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [input.situacao, input.situacao === 'Recusada' ? input.justificativa_recusa : null, id],
    );
    return result.rows[0];
  });
}
