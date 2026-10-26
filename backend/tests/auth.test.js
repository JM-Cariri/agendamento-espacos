import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/config/database.js';

const professorCredentials = {
  email: 'professor@escola.local',
  password: 'Professor@123',
};

const coordinatorCredentials = {
  email: 'coordenador@escola.local',
  password: 'Coordenador@123',
};

function withOriginHeader(agent, origin = 'http://localhost:5173') {
  return agent.set('Origin', origin);
}

test('login válido do Professor', async () => {
  const response = await withOriginHeader(request(app).post('/api/auth/login')).send(professorCredentials);

  assert.equal(response.status, 200);
  assert.equal(response.body.user.perfil, 'Professor');
  assert.ok(response.headers['set-cookie'][0].includes('token='));
});

test('login válido do Coordenador', async () => {
  const response = await withOriginHeader(request(app).post('/api/auth/login')).send(coordinatorCredentials);

  assert.equal(response.status, 200);
  assert.equal(response.body.user.perfil, 'Coordenador');
  assert.ok(response.headers['set-cookie'][0].includes('token='));
});

test('senha incorreta retorna 401', async () => {
  const response = await withOriginHeader(request(app).post('/api/auth/login')).send({
    email: 'professor@escola.local',
    password: 'SenhaErrada',
  });

  assert.equal(response.status, 401);
});

test('requisição protegida sem autenticação retorna 401', async () => {
  const response = await request(app).get('/api/auth/me');

  assert.equal(response.status, 401);
});

test('Professor acessando rota exclusiva de Coordenador retorna 403', async () => {
  const login = await withOriginHeader(request(app).post('/api/auth/login')).send(professorCredentials);
  const cookie = login.headers['set-cookie'][0].split(';')[0];

  const response = await request(app)
    .get('/api/admin-only')
    .set('Cookie', cookie)
    .set('Origin', 'http://localhost:5173');

  assert.equal(response.status, 403);
});

test('logout revoga a sessão no servidor e invalida o cookie', async () => {
  const login = await withOriginHeader(request(app).post('/api/auth/login')).send(professorCredentials);
  const cookie = login.headers['set-cookie'][0].split(';')[0];

  const logout = await request(app)
    .post('/api/auth/logout')
    .set('Cookie', cookie)
    .set('Origin', 'http://localhost:5173');

  assert.equal(logout.status, 200);

  const me = await request(app)
    .get('/api/auth/me')
    .set('Cookie', cookie)
    .set('Origin', 'http://localhost:5173');

  assert.equal(me.status, 401);

  const sessionCheck = await pool.query(
    'SELECT revoked_at FROM sessoes WHERE usuario_id = (SELECT id FROM usuarios WHERE email = $1)',
    ['professor@escola.local'],
  );

  assert.ok(sessionCheck.rows.some((row) => row.revoked_at !== null));
});

test('reuso do cookie após logout retorna 401', async () => {
  const login = await withOriginHeader(request(app).post('/api/auth/login')).send(coordinatorCredentials);
  const cookie = login.headers['set-cookie'][0].split(';')[0];

  await request(app)
    .post('/api/auth/logout')
    .set('Cookie', cookie)
    .set('Origin', 'http://localhost:5173');

  const reused = await request(app)
    .get('/api/auth/me')
    .set('Cookie', cookie)
    .set('Origin', 'http://localhost:5173');

  assert.equal(reused.status, 401);
});

test('sessão expira após 30 minutos de inatividade', async () => {
  const login = await withOriginHeader(request(app).post('/api/auth/login')).send(professorCredentials);
  const cookie = login.headers['set-cookie'][0].split(';')[0];

  const sessionResult = await pool.query(
    'SELECT id FROM sessoes WHERE usuario_id = (SELECT id FROM usuarios WHERE email = $1) ORDER BY created_at DESC LIMIT 1',
    ['professor@escola.local'],
  );

  const sessionId = sessionResult.rows[0].id;

  await pool.query(
    `UPDATE sessoes
     SET created_at = NOW() - INTERVAL '1 hour',
         last_activity_at = NOW() - INTERVAL '31 minutes',
         expires_at = NOW() - INTERVAL '1 minute'
     WHERE id = $1`,
    [sessionId],
  );

  const response = await request(app)
    .get('/api/auth/me')
    .set('Cookie', cookie)
    .set('Origin', 'http://localhost:5173');

  assert.equal(response.status, 401);
});

test('origem ausente ou não confiável em escrita retorna 403', async () => {
  const login = await withOriginHeader(request(app).post('/api/auth/login')).send(professorCredentials);
  const cookie = login.headers['set-cookie'][0].split(';')[0];

  const noOrigin = await request(app)
    .post('/api/auth/logout')
    .set('Cookie', cookie);

  const badOrigin = await request(app)
    .post('/api/auth/logout')
    .set('Cookie', cookie)
    .set('Origin', 'https://malicious.example');

  assert.equal(noOrigin.status, 403);
  assert.equal(badOrigin.status, 403);
});

test.after(() => pool.end());
