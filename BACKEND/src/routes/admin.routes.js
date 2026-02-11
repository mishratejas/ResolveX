import express from "express";
import { 
    adminLogin,
    adminLogout,
    getDashboardData,
    getRealTimeStats,
    getNotifications,
    markNotificationAsRead,
    getChartData
} from "../controllers/admin.controllers.js";
import { 
    getAllUsers,
    getUserStats,
    getUserDetails,
    updateUser,
    deleteUser,
    bulkUpdateUsers
} from "../controllers/admin.user.controllers.js";
import { 
    getAllStaff,
    getStaffStats,          // ✅ FIXED: Added missing import
    getStaffDetails,
    createStaff,
    updateStaff,
    deleteStaff,
    bulkActivateStaff,
    bulkDeactivateStaff,
    getTopPerformers
} from "../controllers/admin.staff.controllers.js";
import {
    handleFetchAllUserIssues,
    handleFetchStaffList,
    handleUpdateIssue,
    handleGetComplaintDetails,
    handleBulkAssign,
    getIssueStats
} from "../controllers/admin_issue.controllers.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { auditLogger } from "../middleware/auditLogger.js";

const router = express.Router();

// ==================== AUTHENTICATION ====================
router.post("/login", adminLogin);
router.post("/logout", adminAuth, auditLogger('LOGOUT', 'AUTHENTICATION'), adminLogout);

// ==================== DASHBOARD ====================
router.get("/dashboard", adminAuth, auditLogger('DASHBOARD_VIEWED', 'ANALYTICS', 'LOW'), getDashboardData);
router.get("/stats/realtime", adminAuth, getRealTimeStats);
router.get("/analytics/chart", adminAuth, getChartData);

// ==================== NOTIFICATIONS ====================
router.get("/notifications", adminAuth, getNotifications);
router.put("/notifications/:id/read", adminAuth, markNotificationAsRead);

// ==================== USER MANAGEMENT ====================
router.get("/users", adminAuth, getAllUsers);
router.get("/users/stats", adminAuth, getUserStats);
router.get("/users/:id", adminAuth, getUserDetails);
router.put("/users/:id", adminAuth, auditLogger('USER_UPDATED', 'USER_MANAGEMENT', 'MEDIUM'), updateUser);
router.delete("/users/:id", adminAuth, auditLogger('USER_DELETED', 'USER_MANAGEMENT', 'HIGH'), deleteUser);
router.post("/users/bulk", adminAuth, auditLogger('USER_BULK_UPDATE', 'USER_MANAGEMENT', 'HIGH'), bulkUpdateUsers);

// ==================== STAFF MANAGEMENT ====================
router.get("/staff", adminAuth, getAllStaff);
router.get("/staff/stats", adminAuth, getStaffStats); // ✅ FIXED: Now properly imported
router.get("/staff/top-performers", adminAuth, getTopPerformers);
router.get("/staff/:id", adminAuth, getStaffDetails);
router.post("/staff", adminAuth, auditLogger('STAFF_CREATED', 'STAFF_MANAGEMENT', 'MEDIUM'), createStaff);
router.put("/staff/:id", adminAuth, auditLogger('STAFF_UPDATED', 'STAFF_MANAGEMENT', 'MEDIUM'), updateStaff);
router.delete("/staff/:id", adminAuth, auditLogger('STAFF_DELETED', 'STAFF_MANAGEMENT', 'HIGH'), deleteStaff);
router.post("/staff/bulk-activate", adminAuth, auditLogger('STAFF_BULK_UPDATE', 'STAFF_MANAGEMENT', 'MEDIUM'), bulkActivateStaff);
router.post("/staff/bulk-deactivate", adminAuth, auditLogger('STAFF_BULK_UPDATE', 'STAFF_MANAGEMENT', 'MEDIUM'), bulkDeactivateStaff);

// ==================== ISSUE MANAGEMENT ====================
router.get("/issues", adminAuth, handleFetchAllUserIssues);
router.get("/issues/stats", adminAuth, getIssueStats);
router.get("/issues/staff-list", adminAuth, handleFetchStaffList);
router.get("/issues/:id", adminAuth, handleGetComplaintDetails);
router.put("/issues/:id", adminAuth, auditLogger('ISSUE_UPDATED', 'ISSUE_MANAGEMENT', 'MEDIUM'), handleUpdateIssue);
router.post("/issues/bulk-assign", adminAuth, auditLogger('ISSUE_BULK_UPDATE', 'ISSUE_MANAGEMENT', 'HIGH'), handleBulkAssign);

export default router;