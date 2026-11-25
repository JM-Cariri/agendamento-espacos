import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { metrics } from '../controllers/dashboardController.js';

const router = express.Router();
router.get('/metrics', requireAuth, metrics);
export default router;
