import { pool } from '../config/database.js';

export async function getMetrics(user) {
  if (user.perfil === 'Professor') {
    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE situacao IN ('Pendente', 'Aprovada') AND (data + horario_inicio) > NOW())::int AS "minhasReservasFuturas",
        COUNT(*) FILTER (WHERE situacao = 'Pendente')::int AS "minhasReservasPendentes",
        COUNT(*) FILTER (WHERE situacao = 'Aprovada')::int AS "minhasReservasAprovadas"
       FROM reservas WHERE usuario_id = $1`, [user.id],
    );
    return { perfil: user.perfil, ...result.rows[0] };
  }
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM espacos WHERE archived_at IS NULL) AS "totalEspacos",
       COUNT(*) FILTER (WHERE situacao = 'Pendente')::int AS "reservasPendentes",
       COUNT(*) FILTER (WHERE situacao = 'Aprovada')::int AS "reservasAprovadas"
     FROM reservas`,
  );
  return { perfil: user.perfil, ...result.rows[0] };
}
