import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import {
    getAnalytics,
    exportAnalytics
} from '../controllers/admin.analytics.controllers.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// GET /api/admin/analytics - Get comprehensive analytics
router.get('/', getAnalytics);

// GET /api/admin/analytics/export - Export analytics data
router.get('/export', exportAnalytics);

export default router;