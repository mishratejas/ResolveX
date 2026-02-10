import express from 'express';
import { 
    handleAllIssueFetch, 
    handleSingleUserIssueFetch,
    handleIssueGeneration, 
    handleSingleIssueFetch, 
    handleVoteCount,
    handleComplaintLocations,
    handleGetMyIssues,  // ADD THIS
    handleGetStats      // ADD THIS
} from "../controllers/user_issue.controllers.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/user_issues - Get ALL complaints (public) with status filter
router.get('/', handleAllIssueFetch);

// GET /api/user_issues/my - Get current user's complaints (requires auth)
router.get('/my', auth, handleGetMyIssues);

// GET /api/user_issues/stats - Get statistics (public)
router.get('/stats', handleGetStats);

// POST /api/user_issues - Create new complaint (requires auth)
router.post('/', auth, handleIssueGeneration);

// GET /api/user_issues/my-issues - Get all the complaints of a specific user
router.get("/my-issues", auth, handleSingleUserIssueFetch);

router.get('/locations', handleComplaintLocations);

// GET /api/user_issues/:id - Get single complaint details (public)
router.get('/:id', handleSingleIssueFetch);

// PUT /api/user_issues/:id/vote - Add voting system for public engagement
router.put('/:id/vote', handleVoteCount);

export default router;