import express from "express";
import { 
    adminLogin,
    adminLogout,
    adminRefreshToken,
    getDashboardData,
    getChartData,
    getAdminProfile,      
    updateAdminProfile    
} from "../controllers/admin.controllers.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { auditLogger } from "../middleware/auditLogger.js";

const router = express.Router();

// ==================== AUTHENTICATION ====================
// NOTE: Admin signup/workspace creation now lives at POST /api/otp/signup/admin (otp.routes.js)
router.post("/login", adminLogin);
router.post("/refresh-token", adminRefreshToken);
router.post("/logout", adminAuth, auditLogger('LOGOUT', 'AUTHENTICATION'), adminLogout);

// ==================== OWN PROFILE ====================
router.get("/profile", adminAuth, getAdminProfile);
router.put("/profile", adminAuth, updateAdminProfile); // Admin can update their own name/phone/org/profile photo

// ==================== DASHBOARD ====================
router.get("/dashboard", adminAuth, auditLogger('DASHBOARD_VIEWED', 'ANALYTICS', 'LOW'), getDashboardData);
router.get("/analytics/chart", adminAuth, getChartData);

export default router;