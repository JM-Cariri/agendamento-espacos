import { HttpError } from '../utils/http.js';
import { isKnownStatus } from './reservationsValidator.js';

const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

export function validateSpaceFilters(query) {
  const unknown = Object.keys(query).filter((key) => !['nome', 'capacidadeMinima'].includes(key));
  if (unknown.length) throw new HttpError(400, `Filtro não reconhecido: ${unknown.join(', ')}.`);
  const nome = query.nome;
  const capacity = query.capacidadeMinima;
  if (nome !== undefined && (typeof nome !== 'string' || !nome.trim())) throw new HttpError(400, 'O filtro nome não pode ser vazio.');
  if (capacity !== undefined && (!/^\d+$/.test(String(capacity)) || Number(capacity) <= 0 || Number(capacity) > 2147483647)) throw new HttpError(400, 'capacidadeMinima deve ser um inteiro positivo.');
  return { nome: nome?.trim(), capacidadeMinima: capacity === undefined ? undefined : Number(capacity) };
}

export function validateReservationFilters(query) {
  const allowed = ['status', 'spaceId', 'userId', 'date', 'dateFrom', 'dateTo', 'periodo'];
  const unknown = Object.keys(query).filter((key) => !allowed.includes(key));
  if (unknown.length) throw new HttpError(400, `Filtro não reconhecido: ${unknown.join(', ')}.`);
  if (query.status !== undefined && !isKnownStatus(query.status)) throw new HttpError(400, 'Filtro status inválido.');
  for (const key of ['spaceId', 'userId']) {
    if (query[key] !== undefined && (!/^\d+$/.test(String(query[key])) || Number(query[key]) < 1 || Number(query[key]) > 2147483647)) throw new HttpError(400, `${key} deve ser um inteiro positivo.`);
  }
  for (const key of ['date', 'dateFrom', 'dateTo']) if (query[key] !== undefined && !validDate(query[key])) throw new HttpError(400, `${key} deve ser uma data válida no formato AAAA-MM-DD.`);
  if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) throw new HttpError(400, 'dateFrom não pode ser posterior a dateTo.');
  if (query.periodo !== undefined && !['futuras', 'aprovadasFuturas'].includes(query.periodo)) throw new HttpError(400, 'periodo deve ser futuras ou aprovadasFuturas.');
  return query;
}
