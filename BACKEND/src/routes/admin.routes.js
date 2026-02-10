import express from "express";
import { 
    adminLogin,
    adminLogout,
    getDashboardData,
    getRealTimeStats,
    getNotifications,
    markNotificationAsRead,
    getChartData,
    getAllUsers,
    getAllStaff,
    getUserDetails,
    getStaffDetails
} from "../controllers/admin.controllers.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// ==================== AUTHENTICATION ====================
router.post("/login", adminLogin);
router.post("/logout", adminAuth, adminLogout);

// ==================== DASHBOARD ====================
router.get("/dashboard", adminAuth, getDashboardData);
router.get("/stats/realtime", adminAuth, getRealTimeStats);
router.get("/analytics/chart", adminAuth, getChartData); // ✅ FIXED: plural "charts"

// ==================== NOTIFICATIONS ====================
router.get("/notifications", adminAuth, getNotifications);
router.put("/notifications/:id/read", adminAuth, markNotificationAsRead);

// ==================== USER MANAGEMENT ====================
router.get("/users", adminAuth, getAllUsers);
router.get("/users/:id", adminAuth, getUserDetails);

// ==================== STAFF MANAGEMENT ====================
router.get("/staff", adminAuth, getAllStaff);
router.get("/staff/:id", adminAuth, getStaffDetails);

export default router;