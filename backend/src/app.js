import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { pool, ensureDatabaseReady } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import spacesRoutes from './routes/spacesRoutes.js';
import reservationsRoutes from './routes/reservationsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { requireAuth, requireRole } from './middleware/authMiddleware.js';
import { sendError } from './utils/http.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(express.json());
app.use(cookieParser());

app.get('/health', async (_req, res) => {
  try {
    const now = await ensureDatabaseReady();
    res.json({ status: 'ok', database: true, timestamp: now });
  } catch (_error) {
    res.status(500).json({ status: 'error', message: 'Database unavailable' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/spaces', spacesRoutes);
app.use('/api/reservas', reservationsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/admin-only', requireAuth, requireRole('Coordenador'), (_req, res) => {
  res.status(200).json({ message: 'Coordinator access granted.' });
});
app.all('/api/*', (_req, res) => res.status(404).json({ error: 'Endpoint não encontrado.', details: [] }));
app.use((error, _req, res, next) => {
  if (error?.type === 'entity.parse.failed') error.status = 400;
  sendError(error, _req, res, next);
});

const isTestRun = process.env.NODE_ENV === 'test' || process.execArgv.includes('--test');
if (!isTestRun) {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}.`));
}

export { app, pool };
