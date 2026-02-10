import express from "express";
import {adminAuth} from "../middleware/adminAuth.js";
import {
  getDepartments,
  createDepartment,
  getDepartmentStats  // Add this import
} from "../controllers/department.controllers.js";

const router = express.Router();

// GET all active departments (Admin)
router.get("/", adminAuth, getDepartments);

// GET department statistics
router.get("/stats", adminAuth, getDepartmentStats);  // Add this route

// POST create department (Admin only – optional)
router.post("/", adminAuth, createDepartment);

export default router;