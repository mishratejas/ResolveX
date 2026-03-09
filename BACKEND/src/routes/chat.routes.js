import express from 'express';
import {
    sendMessage,
    getConversation,
    getAllConversations,
    getUnreadCount,
    markAsRead,
    editMessage,
    deleteMessage,
    uploadChatFile,
    sendTypingIndicator,
    searchMessages
} from '../controllers/chat.controllers.js';
import { getComplaintMessages, sendComplaintMessage } from '../controllers/complaint_chat.controllers.js';
import { auth } from '../middleware/auth.js';
import { staffAuth } from '../middleware/staffAuth.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { chatAuth } from '../middleware/chatAuth.js'; // This middleware checks if user, staff, or admin
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Send message (any authenticated user)
router.post('/send', chatAuth, sendMessage);

// Get conversation for a specific complaint
router.get('/conversation/:complaintId', chatAuth, getConversation);

// Get all conversations for current user
router.get('/conversations', chatAuth, getAllConversations);

// Get unread message count
router.get('/unread-count', chatAuth, getUnreadCount);

// Mark messages as read
router.patch('/conversation/:complaintId/read', chatAuth, markAsRead);

// Edit message
router.patch('/message/:messageId/edit', chatAuth, editMessage);

// Delete message
router.delete('/message/:messageId', chatAuth, deleteMessage);

// Upload file in chat
router.post('/upload', chatAuth, upload.single('file'), uploadChatFile);

// Typing indicator
router.post('/typing', chatAuth, sendTypingIndicator);

// Search messages
router.get('/search', chatAuth, searchMessages);

// --- NEW: Our Optimized Live Ticket Chat Routes ---
router.get('/complaint/:complaintId', chatAuth, getComplaintMessages);
router.post('/complaint/:complaintId/send', chatAuth, sendComplaintMessage);

export default router;