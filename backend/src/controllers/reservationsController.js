import { asyncHandler } from '../utils/http.js';
import { parseId, validateReservation, validateSlot, validateStatus } from '../validators/reservationsValidator.js';
import { validateReservationFilters } from '../validators/filtersValidator.js';
import * as reservations from '../services/reservationService.js';

export const listReservations = asyncHandler(async (req, res) => res.json(await reservations.listReservations(validateReservationFilters(req.query))));
export const getReservation = asyncHandler(async (req, res) => res.json(await reservations.getReservation(parseId(req.params.id))));
export const createReservation = asyncHandler(async (req, res) => {
  const input = validateReservation(req.body);
  validateSlot(input.data, input.horario_inicio, input.horario_fim);
  res.status(201).json(await reservations.createReservation(req.user.id, input));
});
export const updateReservation = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const partial = validateReservation(req.body, true);
  const current = await reservations.getReservation(id);
  const candidate = {
    data: partial.data ?? (current.data instanceof Date ? current.data.toISOString().slice(0, 10) : String(current.data).slice(0, 10)),
    horario_inicio: partial.horario_inicio ?? String(current.horario_inicio).slice(0, 5),
    horario_fim: partial.horario_fim ?? String(current.horario_fim).slice(0, 5),
  };
  validateSlot(candidate.data, candidate.horario_inicio, candidate.horario_fim);
  res.json(await reservations.updateReservation(id, req.user, partial));
});
export const changeReservationStatus = asyncHandler(async (req, res) => {
  res.json(await reservations.changeReservationStatus(parseId(req.params.id), req.user, validateStatus(req.body)));
});
