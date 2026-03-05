import express from "express";
import {adminAuth} from "../middleware/adminAuth.js";
import {
  getDepartments,
  createDepartment,
  getDepartmentStats,  // Add this import
  getDepartmentsByWorkspaceCode
} from "../controllers/department.controllers.js";

const router = express.Router();

// PUBLIC ROUTE: Fetch departments by Workspace Code
// Full URL will be: GET /api/admin/departments/workspace/:code
router.get('/workspace/:code', getDepartmentsByWorkspaceCode);

// GET all active departments (Admin)
router.get("/", adminAuth, getDepartments);

// GET department statistics
router.get("/stats", adminAuth, getDepartmentStats);  // Add this route

// POST create department (Admin only – optional)
router.post("/", adminAuth, createDepartment);


export default router;