import { asyncHandler } from '../utils/http.js';
import { getMetrics } from '../services/dashboardService.js';

export const metrics = asyncHandler(async (req, res) => res.json(await getMetrics(req.user)));
