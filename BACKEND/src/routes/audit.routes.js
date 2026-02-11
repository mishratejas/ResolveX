import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import {
    getAuditLogs,
    getAuditLogById,
    getActivitySummary,
    getUserActivityTimeline,
    getIssueAuditTrail,
    getRecentActivities,
    getAuditStatistics,
    exportAuditLogs,
    getSecurityEvents,
    getFailedActivities
} from '../controllers/audit.controllers.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// ==================== AUDIT LOG ROUTES ====================

// GET /api/audit - Get all audit logs with filtering
router.get('/', getAuditLogs);

// GET /api/audit/recent - Get recent activities (dashboard)
router.get('/recent', getRecentActivities);

// GET /api/audit/summary - Get activity summary
router.get('/summary', getActivitySummary);

// GET /api/audit/statistics - Get audit statistics
router.get('/statistics', getAuditStatistics);

// GET /api/audit/security - Get security events
router.get('/security', getSecurityEvents);

// GET /api/audit/failed - Get failed activities
router.get('/failed', getFailedActivities);

// GET /api/audit/export - Export audit logs
router.get('/export', exportAuditLogs);

// GET /api/audit/user/:userId - Get user activity timeline
router.get('/user/:userId', getUserActivityTimeline);

// GET /api/audit/issue/:issueId - Get issue audit trail
router.get('/issue/:issueId', getIssueAuditTrail);

// GET /api/audit/:id - Get specific audit log by ID
router.get('/:id', getAuditLogById);

export default router;