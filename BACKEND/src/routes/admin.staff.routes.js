import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
    getAllStaff,
    getStaffStats,
    createStaff,
    updateStaff,
    deleteStaff,
    bulkActivateStaff,
    bulkDeactivateStaff,
    getTopPerformers
} from "../controllers/admin.staff.controllers.js";

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// GET /api/admin/staff - Get all staff with pagination
router.get("/", getAllStaff);

// GET /api/admin/staff/stats - Get staff statistics
router.get("/stats", getStaffStats);

// GET /api/admin/staff/top-performers - Get top performing staff
router.get("/top-performers", getTopPerformers);

// POST /api/admin/staff - Create new staff
router.post("/", createStaff);

// PUT /api/admin/staff/:id - Update staff
router.put("/:id", updateStaff);

// DELETE /api/admin/staff/:id - Delete staff
router.delete("/:id", deleteStaff);

// POST /api/admin/staff/bulk-activate - Bulk activate staff
router.post("/bulk-activate", bulkActivateStaff);

// POST /api/admin/staff/bulk-deactivate - Bulk deactivate staff
router.post("/bulk-deactivate", bulkDeactivateStaff);

export default router;