import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

const SESSION_TTL_MINUTES = 30;
const SESSION_TTL_MS = SESSION_TTL_MINUTES * 60 * 1000;

export function buildCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true';

  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: SESSION_TTL_MS,
  };
}

export function requireTrustedOrigin(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const allowedOrigins = new Set([
    'http://localhost:5173',
    ...(process.env.TRUSTED_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    ...(process.env.FRONTEND_ORIGIN ? [process.env.FRONTEND_ORIGIN.trim()] : []),
  ]);
  const requestOrigin = req.headers.origin;
  if (!requestOrigin) {
    return res.status(403).json({ error: 'Origin is required for state-changing requests.' });
  }

  try {
    const requestUrl = new URL(requestOrigin);
    if (requestUrl.origin !== requestOrigin || !allowedOrigins.has(requestUrl.origin)) {
      return res.status(403).json({ error: 'Origin not trusted.' });
    }
  } catch (_error) {
    return res.status(403).json({ error: 'Origin not trusted.' });
  }

  return next();
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return secret;
}

export function signSessionToken(sessionId, userId, perfil) {
  return jwt.sign({ sessionId, userId, perfil }, getJwtSecret(), { expiresIn: `${SESSION_TTL_MINUTES}m` });
}

export async function requireAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const sessionResult = await pool.query(
      `
        SELECT s.id AS session_id, s.usuario_id, s.expires_at, s.revoked_at, s.last_activity_at,
               u.id AS user_id, u.nome, u.email, u.perfil
        FROM sessoes s
        JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.id = $1
      `,
      [decoded.sessionId],
    );

    if (sessionResult.rowCount === 0) {
      return res.status(401).json({ error: 'Session is invalid or no longer exists.' });
    }

    const session = sessionResult.rows[0];

    if (session.revoked_at) {
      return res.status(401).json({ error: 'Session has been revoked.' });
    }

    if (Number(session.usuario_id) !== Number(decoded.userId)) {
      return res.status(401).json({ error: 'Session does not match the authenticated user.' });
    }

    const expiresAt = new Date(session.expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      return res.status(401).json({ error: 'Session expired due to inactivity.' });
    }

    const renewedExpiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    await pool.query(
      `UPDATE sessoes SET last_activity_at = NOW(), expires_at = $1 WHERE id = $2`,
      [renewedExpiresAt, session.session_id],
    );

    const refreshedToken = signSessionToken(session.session_id, session.user_id, session.perfil);
    res.cookie('token', refreshedToken, buildCookieOptions());

    req.user = {
      id: session.user_id,
      nome: session.nome,
      email: session.email,
      perfil: session.perfil,
    };
    req.sessionId = session.session_id;

    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed or session expired.' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (req.user.perfil !== role) {
      return res.status(403).json({ error: `Only ${role} users can access this resource.` });
    }

    return next();
  };
}
