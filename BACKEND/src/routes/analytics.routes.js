import express from 'express';
import {
    getComprehensiveAnalytics,
    exportAnalyticsData
} from '../controllers/analytics.controllers.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { staffAuth } from '../middleware/staffAuth.js';
import { auditLogger } from '../middleware/auditLogger.js';

const router = express.Router();

// Admin analytics (comprehensive)
router.get(
    '/comprehensive',
    adminAuth,
    auditLogger('ANALYTICS_VIEWED', 'ANALYTICS', 'LOW'),
    getComprehensiveAnalytics
);

// Export analytics data
router.get(
    '/export',
    adminAuth,
    auditLogger('DATA_EXPORTED', 'DATA_OPERATION', 'MEDIUM'),
    exportAnalyticsData
);

// Staff analytics (limited to their assignments)
router.get(
    '/staff/my-performance',
    staffAuth,
    async (req, res) => {
        // Get analytics for this staff member only
        req.query.staffId = req.staff._id;
        return getComprehensiveAnalytics(req, res);
    }
);

export default router;