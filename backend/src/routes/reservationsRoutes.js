import express from 'express';
import { requireAuth, requireTrustedOrigin } from '../middleware/authMiddleware.js';
import * as controller from '../controllers/reservationsController.js';

const router = express.Router();
router.get('/', requireAuth, controller.listReservations);
router.post('/', requireTrustedOrigin, requireAuth, controller.createReservation);
router.get('/:id', requireAuth, controller.getReservation);
router.put('/:id', requireTrustedOrigin, requireAuth, controller.updateReservation);
router.patch('/:id/status', requireTrustedOrigin, requireAuth, controller.changeReservationStatus);
export default router;
