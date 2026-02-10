import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
    getAllUsers,
    getUserStats,
    getUserDetails,
    updateUser,
    deleteUser,
    bulkUpdateUsers
} from "../controllers/admin.user.controllers.js";

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// GET /api/admin/users - Get all users
router.get("/", getAllUsers);

// GET /api/admin/users/stats - Get user statistics
router.get("/stats", getUserStats);

// GET /api/admin/users/:id - Get user details
router.get("/:id", getUserDetails);

// PUT /api/admin/users/:id - Update user
router.put("/:id", updateUser);

// DELETE /api/admin/users/:id - Delete user
router.delete("/:id", deleteUser);

// POST /api/admin/users/bulk - Bulk operations
router.post("/bulk", bulkUpdateUsers);

export default router;