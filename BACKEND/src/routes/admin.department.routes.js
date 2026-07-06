import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  getDepartments,
  createDepartment,
  getDepartmentsByWorkspaceCode,
  deleteDepartment,
  updateDepartment
} from "../controllers/department.controllers.js";

const router = express.Router();

// PUBLIC ROUTE: Fetch departments by Workspace Code
// Full URL will be: GET /api/admin/departments/workspace/:code
router.get('/workspace/:code', getDepartmentsByWorkspaceCode);

// GET all active departments (Admin)
router.get("/", adminAuth, getDepartments);

// POST create department (Admin only)
router.post("/", adminAuth, createDepartment);

// PUT update a department
router.put("/:id", adminAuth, updateDepartment);

// DELETE a department and reassign its data
router.delete("/:id", adminAuth, deleteDepartment);

export default router;