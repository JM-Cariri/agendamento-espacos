import { HttpError } from '../utils/http.js';

const reservationFields = ['espaco_id', 'data', 'horario_inicio', 'horario_fim', 'finalidade'];
const statuses = ['Pendente', 'Aprovada', 'Recusada', 'Cancelada'];

export function parseId(value, label = 'reserva') {
  if (!/^\d+$/.test(String(value)) || Number(value) < 1 || Number(value) > 2147483647) throw new HttpError(400, `Informe um identificador de ${label} válido.`);
  return Number(value);
}

export function validateReservation(body, partial = false) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Envie um objeto JSON válido.');
  for (const key of Object.keys(body)) if (!reservationFields.includes(key)) errors.push(`Campo não permitido: ${key}.`);
  if (partial && Object.keys(body).length === 0) errors.push('Informe ao menos um campo para atualizar.');
  if (!partial || 'espaco_id' in body) {
    if (!/^\d+$/.test(String(body.espaco_id)) || Number(body.espaco_id) < 1 || Number(body.espaco_id) > 2147483647) errors.push('Informe um espaco_id inteiro positivo.');
  }
  if (!partial || 'data' in body) {
    if (typeof body.data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.data) || Number.isNaN(Date.parse(`${body.data}T00:00:00Z`)) || new Date(`${body.data}T00:00:00Z`).toISOString().slice(0, 10) !== body.data) errors.push('Informe uma data válida no formato AAAA-MM-DD.');
  }
  for (const key of ['horario_inicio', 'horario_fim']) {
    if ((!partial || key in body) && (typeof body[key] !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body[key]))) errors.push(`Informe ${key} no formato HH:MM.`);
  }
  if (!partial || 'finalidade' in body) {
    if (typeof body.finalidade !== 'string' || !body.finalidade.trim()) errors.push('Informe a finalidade da reserva.');
    else if (body.finalidade.trim().length > 2000) errors.push('A finalidade deve ter até 2000 caracteres.');
  }
  if (errors.length) throw new HttpError(400, 'Dados da reserva inválidos.', errors);
  return {
    espaco_id: body.espaco_id === undefined ? undefined : Number(body.espaco_id),
    data: body.data,
    horario_inicio: body.horario_inicio,
    horario_fim: body.horario_fim,
    finalidade: body.finalidade?.trim(),
  };
}

export function validateSlot(date, start, end) {
  const startMinutes = Number(start.slice(0, 2)) * 60 + Number(start.slice(3, 5));
  const endMinutes = Number(end.slice(0, 2)) * 60 + Number(end.slice(3, 5));
  if (startMinutes < 420 || endMinutes > 1320 || endMinutes - startMinutes !== 50 || (startMinutes - 420) % 50 !== 0) {
    throw new HttpError(400, 'Dados do slot inválidos. Escolha um slot consecutivo de 50 minutos, alinhado entre 07:00 e 22:00.');
  }
}

export function validateStatus(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !['situacao', 'justificativa_recusa'].includes(key))) {
    throw new HttpError(400, 'Envie apenas situacao e justificativa_recusa.');
  }
  if (!statuses.includes(body.situacao)) throw new HttpError(400, 'Situação inválida. Use Pendente, Aprovada, Recusada ou Cancelada.');
  if (body.situacao === 'Recusada' && (typeof body.justificativa_recusa !== 'string' || !body.justificativa_recusa.trim())) {
    throw new HttpError(400, 'Informe uma justificativa não vazia para recusar a reserva.');
  }
  if (body.situacao !== 'Recusada' && body.justificativa_recusa != null) throw new HttpError(400, 'Justificativa de recusa só pode ser enviada ao recusar.');
  return { situacao: body.situacao, justificativa_recusa: body.justificativa_recusa?.trim() || null };
}

export function isKnownStatus(value) {
  return statuses.includes(value);
}
