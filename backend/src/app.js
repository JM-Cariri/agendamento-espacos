import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { pool, ensureDatabaseReady } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import { requireAuth, requireRole, requireTrustedOrigin } from './middleware/authMiddleware.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(express.json());
app.use(cookieParser());

app.get('/health', async (_req, res) => {
  try {
    const now = await ensureDatabaseReady();
    res.json({ status: 'ok', database: true, timestamp: now });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database unavailable', details: error.message });
  }
});

app.use('/api/auth', authRoutes);

app.get('/api/admin-only', requireTrustedOrigin, requireAuth, requireRole('Coordenador'), (_req, res) => {
  res.status(200).json({ message: 'Coordinator access granted.' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

export { app, pool };
