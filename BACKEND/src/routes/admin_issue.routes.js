import express from "express";
import { 
  handleFetchAllUserIssues,
  handleUpdateIssue,
  handleGetComplaintDetails,
  getIssueStats
} from "../controllers/admin_issue.controllers.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { adminOverridePriority } from "../controllers/user_issue.controllers.js";
const router = express.Router();

//Stats route MUST be BEFORE /:id to avoid route collision
router.get("/stats", adminAuth, getIssueStats);

// Get all complaints with filters
router.get("/", adminAuth, handleFetchAllUserIssues);

// Get single complaint details
router.get("/:id", adminAuth, handleGetComplaintDetails);

// Update complaint (status, priority, assignment, etc.)
router.put("/:id", adminAuth, handleUpdateIssue);

router.patch('/complaint/:complaintId/priority', adminAuth, adminOverridePriority);

export default router;