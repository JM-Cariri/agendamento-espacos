import express from 'express';
import { requireAuth, requireRole, requireTrustedOrigin } from '../middleware/authMiddleware.js';
import * as controller from '../controllers/spacesController.js';

const router = express.Router();
router.get('/', requireAuth, controller.listSpaces);
router.post('/', requireTrustedOrigin, requireAuth, requireRole('Coordenador'), controller.createSpace);
router.get('/:id', requireAuth, controller.getSpace);
router.put('/:id', requireTrustedOrigin, requireAuth, requireRole('Coordenador'), controller.updateSpace);
router.patch('/:id/archive', requireTrustedOrigin, requireAuth, requireRole('Coordenador'), controller.archiveSpace);
export default router;
