import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import {
    getAnalytics,
    exportAnalytics,
    getOverviewStats,
    getTopPerformers,
    getGeographicData,
    getComparisonData
} from '../controllers/admin.analytics.controllers.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// ==================== ANALYTICS ROUTES ====================

// GET /api/admin/analytics/stats/overview - Overview statistics
router.get('/stats/overview', getOverviewStats);

// GET /api/admin/analytics/staff/top-performers - Top performing staff
router.get('/staff/top-performers', getTopPerformers);

// GET /api/admin/analytics/geographic - Geographic distribution
router.get('/geographic', getGeographicData);

// GET /api/admin/analytics/comparison - Period comparison
router.get('/comparison', getComparisonData);

// GET /api/admin/analytics - Get comprehensive analytics
router.get('/', getAnalytics);

// GET /api/admin/analytics/export - Export analytics data
router.get('/export', exportAnalytics);

export default router;