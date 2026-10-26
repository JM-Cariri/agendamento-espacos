import express from 'express';
import { login, logout, getCurrentUser } from '../controllers/authController.js';
import { requireAuth, requireTrustedOrigin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', requireTrustedOrigin, login);
router.get('/me', requireAuth, getCurrentUser);
router.post('/logout', requireTrustedOrigin, requireAuth, logout);

export default router;
