import 'dotenv/config';
import express from 'express';
import { pool, ensureDatabaseReady } from './config/database.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    const now = await ensureDatabaseReady();
    res.json({ status: 'ok', database: true, timestamp: now });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database unavailable', details: error.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

export { app, pool };
