import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import { auditLogger } from "../middleware/auditLogger.js";
import {
    getAllStaff,
    getStaffStats,
    getStaffDetails,
    createStaff,
    updateStaff,
    deleteStaff,
    bulkActivateStaff,
    bulkDeactivateStaff,
    getTopPerformers
} from "../controllers/admin.staff.controllers.js";
import { getPendingStaff, approveStaff, rejectStaff } from "../controllers/staff.controllers.js";

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// Fixed-segment routes MUST come before "/:id" to avoid route collision
// GET /api/admin/staff/pending - Staff awaiting approval
router.get("/pending", getPendingStaff);

// GET /api/admin/staff/stats - Get staff statistics
router.get("/stats", getStaffStats);

// GET /api/admin/staff/top-performers - Get top performing staff
router.get("/top-performers", getTopPerformers);

// POST /api/admin/staff/bulk-activate - Bulk activate staff
router.post("/bulk-activate", auditLogger('STAFF_BULK_UPDATE', 'STAFF_MANAGEMENT', 'MEDIUM'), bulkActivateStaff);

// POST /api/admin/staff/bulk-deactivate - Bulk deactivate staff
router.post("/bulk-deactivate", auditLogger('STAFF_BULK_UPDATE', 'STAFF_MANAGEMENT', 'MEDIUM'), bulkDeactivateStaff);

// GET /api/admin/staff - Get all staff with pagination
router.get("/", getAllStaff);

// POST /api/admin/staff - Create new staff
router.post("/", auditLogger('STAFF_CREATED', 'STAFF_MANAGEMENT', 'MEDIUM'), createStaff);

// GET /api/admin/staff/:id - Get single staff member's details
router.get("/:id", getStaffDetails);

// PUT /api/admin/staff/:id - Update staff
router.put("/:id", auditLogger('STAFF_UPDATED', 'STAFF_MANAGEMENT', 'MEDIUM'), updateStaff);

// DELETE /api/admin/staff/:id - Delete staff
router.delete("/:id", auditLogger('STAFF_DELETED', 'STAFF_MANAGEMENT', 'HIGH'), deleteStaff);

// PATCH /api/admin/staff/:id/approve - Approve a pending staff signup
router.patch("/:id/approve", approveStaff);

// DELETE /api/admin/staff/:id/reject - Reject a pending staff signup
router.delete("/:id/reject", rejectStaff);

export default router;