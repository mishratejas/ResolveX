import express from 'express';

import { 
    getComplaintMessages, 
    sendComplaintMessage, 
    getActiveConversations,
    getMyConversations
} from '../controllers/complaint_chat.controllers.js';

import { chatAuth } from '../middleware/chatAuth.js'; 

const router = express.Router();

// --- Live Ticket Chat Routes ---
router.get('/complaint/:complaintId', chatAuth, getComplaintMessages);
router.post('/complaint/:complaintId/send', chatAuth, sendComplaintMessage);

// Admin's Master Inbox (scoped to their own workspace)
router.get('/inbox', chatAuth, getActiveConversations);

// Staff/Admin/User's own conversation list + unread counts
router.get('/conversations', chatAuth, getMyConversations);

export default router;