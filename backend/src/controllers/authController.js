import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { buildCookieOptions, signSessionToken } from '../middleware/authMiddleware.js';

export async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const userResult = await pool.query(
    'SELECT id, nome, email, senha_hash, perfil FROM usuarios WHERE email = $1',
    [email.trim()],
  );

  if (userResult.rowCount === 0) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const user = userResult.rows[0];
  const passwordMatches = await bcrypt.compare(password, user.senha_hash);

  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const sessionResult = await pool.query(
    `INSERT INTO sessoes (usuario_id, created_at, last_activity_at, expires_at, revoked_at)
     VALUES ($1, NOW(), NOW(), NOW() + INTERVAL '30 minutes', NULL)
     RETURNING id, expires_at`,
    [user.id],
  );

  const session = sessionResult.rows[0];
  const token = signSessionToken(session.id, user.id, user.perfil);

  res.cookie('token', token, buildCookieOptions());

  return res.status(200).json({
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
    },
  });
}

export async function getCurrentUser(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  return res.status(200).json({ user: req.user });
}

export async function logout(req, res) {
  if (!req.user || !req.sessionId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  await pool.query(
    'UPDATE sessoes SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL',
    [req.sessionId],
  );

  res.clearCookie('token', { path: '/' });
  return res.status(200).json({ message: 'Logged out successfully.' });
}
