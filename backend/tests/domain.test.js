import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/config/database.js';

const origin = 'http://localhost:5173';
const credentials = {
  professor: { email: 'professor@escola.local', password: 'Professor@123' },
  coordinator: { email: 'coordenador@escola.local', password: 'Coordenador@123' },
};

async function login(role) {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/login').set('Origin', origin).send(credentials[role]);
  assert.equal(response.status, 200);
  return agent;
}

async function futureDate() {
  const result = await pool.query("SELECT (CURRENT_DATE + 3)::text AS date");
  return result.rows[0].date;
}

test('spaces, reservations, filters, lifecycle, concurrency, dashboard, and audit routes', async (t) => {
  const professor = await login('professor');
  const coordinator = await login('coordinator');
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const name = `Espaço teste ${suffix}`;
  const spaceBody = {
    nome: name,
    capacidade: 35,
    descricao: 'Criado por teste de integração',
    localizacao_predio: 'Bloco de testes',
    horario_funcionamento_inicio: '07:00',
    horario_funcionamento_fim: '22:00',
  };
  let spaceId;

  await t.test('CRUD de espaço, acesso por perfil e filtros', async () => {
    const forbidden = await professor.post('/api/spaces').set('Origin', origin).send(spaceBody);
    assert.equal(forbidden.status, 403);

    const missingLocation = await coordinator.post('/api/spaces').set('Origin', origin).send({
      nome: 'Espaço sem localização',
      capacidade: 10,
    });
    assert.equal(missingLocation.status, 400);
    assert.match(missingLocation.body.error, /inválidos/i);
    assert.ok(missingLocation.body.details.some((message) => message.includes('localização')));

    const created = await coordinator.post('/api/spaces').set('Origin', origin).send(spaceBody);
    assert.equal(created.status, 201);
    spaceId = created.body.id;
    assert.ok(Number.isInteger(spaceId) && spaceId > 0);
    assert.equal(created.body.localizacao_predio, 'Bloco de testes');

    const filtered = await professor.get('/api/spaces').query({ nome: name.slice(-8), capacidadeMinima: 30 });
    assert.equal(filtered.status, 200);
    assert.ok(filtered.body.some((space) => space.id === spaceId));
    assert.equal((await professor.get('/api/spaces').query({ nome: '   ' })).status, 400);
    assert.equal((await professor.get('/api/spaces').query({ capacidadeMinima: 'zero' })).status, 400);

    const detail = await professor.get(`/api/spaces/${spaceId}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.body.total_reservas, 0);
    const invalidId = await coordinator.put('/api/spaces/invalid-id').set('Origin', origin).send({ capacidade: 40 });
    assert.equal(invalidId.status, 400);
    assert.match(invalidId.body.error, /identificador de espaço válido/i);
    const updated = await coordinator.put(`/api/spaces/${spaceId}`).set('Origin', origin).send({ capacidade: 40 });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.capacidade, 40);
  });

  await t.test('validations and exactly one concurrent reservation wins', async () => {
    const data = await futureDate();
    const invalid = await professor.post('/api/reservas').set('Origin', origin).send({
      espaco_id: spaceId, data, horario_inicio: '09:00', horario_fim: '10:00', finalidade: 'Horário inválido',
    });
    assert.equal(invalid.status, 400);
    assert.match(invalid.body.error, /inválidos/);

    const attempts = await Promise.all(Array.from({ length: 5 }, (_, index) => professor.post('/api/reservas')
      .set('Origin', origin)
      .send({ espaco_id: spaceId, data, horario_inicio: '07:00', horario_fim: '07:50', finalidade: `Concorrência ${index}` })));
    assert.equal(attempts.filter((response) => response.status === 201).length, 1);
    assert.equal(attempts.filter((response) => response.status === 409).length, 4);
    const created = attempts.find((response) => response.status === 201);
    assert.equal(created.body.situacao, 'Pendente');
    assert.equal((await coordinator.patch(`/api/spaces/${spaceId}/archive`).set('Origin', origin)).status, 409);

    const filters = await professor.get('/api/reservas').query({ status: 'Pendente', spaceId, date: data });
    assert.equal(filters.status, 200);
    assert.equal(filters.body.length, 1);
    assert.equal((await professor.get('/api/reservas').query({ periodo: 'invalid' })).status, 400);
    assert.equal((await professor.get('/api/reservas').query({ dateFrom: '2027-01-02', dateTo: '2027-01-01' })).status, 400);

    const reservationId = created.body.id;
    const details = await professor.get(`/api/reservas/${reservationId}`);
    assert.equal(details.status, 200);
    assert.equal(details.body.usuario.email, credentials.professor.email);
    assert.equal(details.body.espaco.id, spaceId);

    const ownerUpdate = await professor.put(`/api/reservas/${reservationId}`).set('Origin', origin).send({ finalidade: 'Atualizada pelo titular' });
    assert.equal(ownerUpdate.status, 200);
    assert.equal(ownerUpdate.body.finalidade, 'Atualizada pelo titular');

    const professorApproval = await professor.patch(`/api/reservas/${reservationId}/status`).set('Origin', origin).send({ situacao: 'Aprovada' });
    assert.equal(professorApproval.status, 403);
    const missingReason = await coordinator.patch(`/api/reservas/${reservationId}/status`).set('Origin', origin).send({ situacao: 'Recusada' });
    assert.equal(missingReason.status, 400);
    const rejected = await coordinator.patch(`/api/reservas/${reservationId}/status`).set('Origin', origin).send({ situacao: 'Recusada', justificativa_recusa: 'Necessário para o evento escolar' });
    assert.equal(rejected.status, 200);
    assert.equal(rejected.body.justificativa_recusa, 'Necessário para o evento escolar');
    assert.equal((await professor.delete(`/api/reservas/${reservationId}`).set('Origin', origin)).status, 404);

    const archived = await coordinator.patch(`/api/spaces/${spaceId}/archive`).set('Origin', origin);
    assert.equal(archived.status, 200);
    assert.ok(archived.body.archived_at);
    assert.equal((await professor.get('/api/spaces').query({ nome: name })).body.some((item) => item.id === spaceId), false);
    assert.equal((await professor.post('/api/reservas').set('Origin', origin).send({
      espaco_id: spaceId, data, horario_inicio: '07:00', horario_fim: '07:50', finalidade: 'Espaço arquivado',
    })).status, 409);
  });

  await t.test('cancellation and role-shaped dashboard metrics', async () => {
    const activeSpace = await coordinator.post('/api/spaces').set('Origin', origin).send({ ...spaceBody, nome: `${name} métricas` });
    assert.equal(activeSpace.status, 201);
    const data = await futureDate();
    const created = await professor.post('/api/reservas').set('Origin', origin).send({
      espaco_id: activeSpace.body.id, data, horario_inicio: '08:40', horario_fim: '09:30', finalidade: 'Cancelamento histórico',
    });
    assert.equal(created.status, 201);
    const canceled = await professor.patch(`/api/reservas/${created.body.id}/status`).set('Origin', origin).send({ situacao: 'Cancelada' });
    assert.equal(canceled.status, 200);
    assert.equal(canceled.body.situacao, 'Cancelada');
    assert.equal((await professor.patch(`/api/reservas/${created.body.id}/status`).set('Origin', origin).send({ situacao: 'Cancelada' })).status, 409);

    const sameDaySlot = await pool.query(`SELECT to_char(slot, 'HH24:MI') AS start, to_char(slot + INTERVAL '50 minutes', 'HH24:MI') AS finish
      FROM generate_series(CURRENT_DATE + TIME '07:00', CURRENT_DATE + TIME '21:10', INTERVAL '50 minutes') AS slot
      WHERE slot > NOW() ORDER BY slot LIMIT 1`);
    if (sameDaySlot.rowCount) {
      const sameDay = await professor.post('/api/reservas').set('Origin', origin).send({
        espaco_id: activeSpace.body.id, data: (await pool.query('SELECT CURRENT_DATE::text AS date')).rows[0].date,
        horario_inicio: sameDaySlot.rows[0].start, horario_fim: sameDaySlot.rows[0].finish, finalidade: 'Regra de cancelamento no dia',
      });
      assert.equal(sameDay.status, 201);
      const ownerDenied = await professor.patch(`/api/reservas/${sameDay.body.id}/status`).set('Origin', origin).send({ situacao: 'Cancelada' });
      assert.equal(ownerDenied.status, 403);
      const coordinatorCancelled = await coordinator.patch(`/api/reservas/${sameDay.body.id}/status`).set('Origin', origin).send({ situacao: 'Cancelada' });
      assert.equal(coordinatorCancelled.status, 200);
    }
    assert.equal((await coordinator.get('/api/dashboard/metrics')).body.perfil, 'Coordenador');
    const metrics = await professor.get('/api/dashboard/metrics');
    assert.equal(metrics.status, 200);
    assert.equal(metrics.body.perfil, 'Professor');
    assert.ok(Object.hasOwn(metrics.body, 'minhasReservasFuturas'));
    assert.ok(Object.hasOwn(metrics.body, 'minhasReservasPendentes'));
    assert.ok(Object.hasOwn(metrics.body, 'minhasReservasAprovadas'));
    const approvedBooking = await professor.post('/api/reservas').set('Origin', origin).send({
      espaco_id: activeSpace.body.id, data, horario_inicio: '10:20', horario_fim: '11:10', finalidade: 'Fluxo de aprovação',
    });
    assert.equal(approvedBooking.status, 201);
    const approved = await coordinator.patch(`/api/reservas/${approvedBooking.body.id}/status`).set('Origin', origin).send({ situacao: 'Aprovada' });
    assert.equal(approved.status, 200);
    const approvedFuture = await professor.get('/api/reservas').query({ periodo: 'aprovadasFuturas', spaceId: activeSpace.body.id });
    assert.ok(approvedFuture.body.some((item) => item.id === approvedBooking.body.id));
    const cancelApproved = await professor.patch(`/api/reservas/${approvedBooking.body.id}/status`).set('Origin', origin).send({ situacao: 'Cancelada' });
    assert.equal(cancelApproved.status, 200);
    const archived = await coordinator.patch(`/api/spaces/${activeSpace.body.id}/archive`).set('Origin', origin);
    assert.equal(archived.status, 200);
  });
});

test.after(() => pool.end());
