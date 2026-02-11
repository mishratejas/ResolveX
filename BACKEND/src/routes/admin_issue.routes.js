import express from "express";
import { 
  handleFetchAllUserIssues,
  handleFetchStaffList,
  handleUpdateIssue,
  handleGetComplaintDetails,
  handleBulkAssign,
  getIssueStats
} from "../controllers/admin_issue.controllers.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// ✅ CRITICAL FIX: Stats route MUST be BEFORE /:id to avoid route collision
router.get("/stats", adminAuth, getIssueStats);

// Get all complaints with filters
router.get("/", adminAuth, handleFetchAllUserIssues);

// Get staff list for assignment dropdowns
router.get("/staff", adminAuth, handleFetchStaffList);

// Get single complaint details
router.get("/:id", adminAuth, handleGetComplaintDetails);

// Update complaint (status, priority, assignment, etc.)
router.put("/:id", adminAuth, handleUpdateIssue);

// Bulk operations
router.post("/bulk-assign", adminAuth, handleBulkAssign);

export default router;