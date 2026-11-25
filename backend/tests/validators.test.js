import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSlot, validateStatus } from '../src/validators/reservationsValidator.js';
import { validateReservationFilters, validateSpaceFilters } from '../src/validators/filtersValidator.js';
import { validateSpace } from '../src/validators/spacesValidator.js';

test('validates fixed 50-minute slots within operating hours', () => {
  assert.doesNotThrow(() => validateSlot('2030-01-01', '07:00', '07:50'));
  assert.doesNotThrow(() => validateSlot('2030-01-01', '21:10', '22:00'));
  for (const [start, end] of [['06:50', '07:40'], ['09:00', '09:50'], ['21:20', '22:10'], ['07:00', '08:00']]) {
    assert.throws(() => validateSlot('2030-01-01', start, end), { status: 400 });
  }
});

test('validates status transitions input, filters, and required space fields', () => {
  assert.equal(validateStatus({ situacao: 'Recusada', justificativa_recusa: 'Motivo' }).justificativa_recusa, 'Motivo');
  assert.throws(() => validateStatus({ situacao: 'Recusada' }), { status: 400 });
  assert.throws(() => validateStatus({ situacao: 'Aprovada', extra: true }), { status: 400 });
  assert.equal(validateSpaceFilters({ nome: ' sala ', capacidadeMinima: '20' }).nome, 'sala');
  assert.throws(() => validateSpaceFilters({ capacidadeMinima: '0' }), { status: 400 });
  assert.throws(() => validateReservationFilters({ dateFrom: '2027-02-02', dateTo: '2027-02-01' }), { status: 400 });
  assert.throws(() => validateReservationFilters({ periodo: 'mes' }), { status: 400 });
  assert.throws(() => validateSpace({ nome: '', capacidade: 0 }), { status: 400 });
});
