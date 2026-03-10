import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  getDepartments,
  createDepartment,
  getDepartmentStats,
  getDepartmentsByWorkspaceCode,
  deleteDepartment,
  updateDepartment // 🚀 ADDED THIS IMPORT
} from "../controllers/department.controllers.js";

const router = express.Router();

// PUBLIC ROUTE: Fetch departments by Workspace Code
// Full URL will be: GET /api/admin/departments/workspace/:code
router.get('/workspace/:code', getDepartmentsByWorkspaceCode);

// GET all active departments (Admin)
router.get("/", adminAuth, getDepartments);

// GET department statistics
router.get("/stats", adminAuth, getDepartmentStats);

// POST create department (Admin only)
router.post("/", adminAuth, createDepartment);

// 🚀 NEW: PUT update a department
router.put("/:id", adminAuth, updateDepartment);

// DELETE a department and reassign its data
router.delete("/:id", adminAuth, deleteDepartment);

export default router;