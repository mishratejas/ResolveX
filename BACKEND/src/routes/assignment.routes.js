import express from 'express';
import {
    assignIssueToStaff,
    bulkAssignIssues,
    reassignIssue,
    unassignIssue,
    autoAssignByWorkload,
    getStaffWorkload
} from '../controllers/assignment.controllers.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { auditLogger } from '../middleware/auditLogger.js';

const router = express.Router();

// Assign single issue to staff
router.post(
    '/assign/:issueId',
    adminAuth,
    auditLogger('ISSUE_ASSIGNED', 'ISSUE_MANAGEMENT', 'MEDIUM'),
    assignIssueToStaff
);

// Bulk assign multiple issues
router.post(
    '/bulk-assign',
    adminAuth,
    auditLogger('ISSUE_BULK_UPDATE', 'ISSUE_MANAGEMENT', 'HIGH'),
    bulkAssignIssues
);

// Reassign issue to different staff
router.put(
    '/reassign/:issueId',
    adminAuth,
    auditLogger('ISSUE_REASSIGNED', 'ISSUE_MANAGEMENT', 'MEDIUM'),
    reassignIssue
);

// Unassign issue
router.put(
    '/unassign/:issueId',
    adminAuth,
    auditLogger('ISSUE_UNASSIGNED', 'ISSUE_MANAGEMENT', 'MEDIUM'),
    unassignIssue
);

// Auto-assign based on workload
router.post(
    '/auto-assign/:issueId',
    adminAuth,
    auditLogger('ISSUE_ASSIGNED', 'ISSUE_MANAGEMENT', 'MEDIUM'),
    autoAssignByWorkload
);

// Get staff workload
router.get('/staff-workload', adminAuth, getStaffWorkload);

export default router;