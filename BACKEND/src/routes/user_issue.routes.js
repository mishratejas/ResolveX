import express from 'express';
import { 
    handleAllIssueFetch, 
    handleSingleUserIssueFetch,
    handleIssueGeneration, 
    handleSingleIssueFetch, 
    handleComplaintLocations,
    handleGetMyIssues,
    handleGetStats,
    checkDuplicateComplaint,
    handleUpvoteComplaint,
    handleDeleteIssue,
    addComplaintComment,
    handleExportMyIssues
} from "../controllers/user_issue.controllers.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/user_issues - Get ALL complaints (public) with status filter
router.get('/', handleAllIssueFetch);

// GET /api/user_issues/my - Get current user's complaints (requires auth)
router.get('/my', auth, handleGetMyIssues);

// GET /api/user_issues/stats - Get statistics (public)
router.get('/stats', handleGetStats);

router.post('/check-duplicate', auth, checkDuplicateComplaint);

// POST /api/user_issues - Create new complaint (requires auth)
router.post('/', auth, handleIssueGeneration);

// GET /api/user_issues/my-issues - Get all the complaints of a specific user
router.get("/my-issues", auth, handleSingleUserIssueFetch);

router.get('/locations', handleComplaintLocations);

router.get('/export', auth, handleExportMyIssues);

// GET /api/user_issues/:id - Get single complaint details (public)
router.get('/:id', handleSingleIssueFetch);

// Upvote an existing complaint
router.put('/:id/upvote', auth, handleUpvoteComplaint);

router.put('/:id/vote', auth, handleUpvoteComplaint);

router.post('/:id/comments', auth, addComplaintComment);

// DELETE /api/user_issues/:id - Delete a complaint (owner only)
router.delete('/:id', auth, handleDeleteIssue);

export default router;