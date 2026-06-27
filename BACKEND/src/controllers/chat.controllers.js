import ChatMessage from "../models/chat.model.js";
import UserComplaint from "../models/UserComplaint.models.js";
import User from "../models/User.models.js";
import Staff from "../models/Staff.models.js";
import Admin from "../models/Admin.models.js";

// ==================== SEND MESSAGE ====================

export const sendMessage = async (req, res) => {
  try {
    const { complaintId, message, receiverId, receiverModel } = req.body;
    
    // Determine sender based on authenticated user
    let senderId, senderModel, senderName;
    
    if (req.user) {
        senderId = req.user._id;
        senderModel = 'User';
        senderName = req.user.name;
    } else if (req.staff) {
        senderId = req.staff._id;
        senderModel = 'Staff';
        senderName = req.staff.name;
    } else if (req.admin) {
        senderId = req.admin._id;
        senderModel = 'Admin';
        senderName = req.admin.name;
    } else {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!complaintId || !message) {
        return res.status(400).json({ success: false, message: "Complaint ID and message are required" });
    }

    // Verify complaint exists
    const complaint = await UserComplaint.findById(complaintId)
        .populate('user', 'name email')
        .populate('assignedTo', 'name email');
    
    if (!complaint) {
        return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    // Generate conversation ID
    const conversationId = `complaint_${complaintId}`;

    // Create message
    const chatMessage = await ChatMessage.create({
        conversationId,
        senderId,
        senderModel,
        receiverId: receiverId || null,
        receiverModel: receiverModel || null,
        complaintId,
        message,
        messageType: 'text',
        isRead: false
    });

    // Populate sender and receiver info
    await chatMessage.populate([
        { path: 'senderId', select: 'name email profileImage' },
        { path: 'receiverId', select: 'name email profileImage' }
    ]);

    // Emit socket event to complaint room
    if (global.io) {
        global.io.to(conversationId).emit('new_message', {
            messageId: chatMessage._id,
            conversationId,
            senderId,
            senderModel,
            senderName,
            receiverId,
            receiverModel,
            message,
            timestamp: chatMessage.createdAt,
            complaint: {
                id: complaint._id,
                title: complaint.title,
                status: complaint.status
            }
        });

        // Send notification to specific users if applicable
        if (receiverId) {
            global.io.to(receiverId.toString()).emit('new_notification', {
                type: 'chat_message',
                complaintId,
                from: senderName,
                message: message.substring(0, 50) + (message.length > 50 ? '...' : '')
            });
        }
    }

    res.status(201).json(
        { success: true, message: "Message sent successfully", data: {
            message: chatMessage,
            complaintInfo: {
                id: complaint._id,
                title: complaint.title,
                status: complaint.status,
                category: complaint.category
            }
        } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ==================== GET CONVERSATION ====================

export const getConversation = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!complaintId) {
        return res.status(400).json({ success: false, message: "Complaint ID is required" });
    }

    // Verify complaint exists and user has access
    const complaint = await UserComplaint.findById(complaintId);
    if (!complaint) {
        return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    // Check access permissions
    let hasAccess = false;
    if (req.admin) {
        hasAccess = true; // Admins can see all conversations
    } else if (req.staff && complaint.assignedTo && complaint.assignedTo.toString() === req.staff._id.toString()) {
        hasAccess = true; // Assigned staff can see conversation
    } else if (req.user && complaint.user.toString() === req.user._id.toString()) {
        hasAccess = true; // Complaint owner can see conversation
    }

    if (!hasAccess) {
        return res.status(403).json({ success: false, message: "You don't have access to this conversation" });
    }

    const conversationId = `complaint_${complaintId}`;
    const skip = (page - 1) * limit;

    // Get messages with pagination
    const [messages, totalMessages] = await Promise.all([
        ChatMessage.find({ conversationId })
            .populate('senderId', 'name email profileImage')
            .populate('receiverId', 'name email profileImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        ChatMessage.countDocuments({ conversationId })
    ]);

    // Reverse to show oldest first
    messages.reverse();

    // Mark messages as read for current user
    let currentUserId;
    if (req.user) currentUserId = req.user._id;
    else if (req.staff) currentUserId = req.staff._id;
    else if (req.admin) currentUserId = req.admin._id;

    if (currentUserId) {
        await ChatMessage.updateMany(
            {
                conversationId,
                receiverId: currentUserId,
                isRead: false
            },
            { isRead: true }
        );
    }

    // Get participants info
    const participants = await getConversationParticipants(complaint);

    res.status(200).json(
        { success: true, message: "Conversation fetched successfully", data: {
            messages,
            participants,
            complaint: {
                id: complaint._id,
                title: complaint.title,
                description: complaint.description,
                status: complaint.status,
                category: complaint.category,
                priority: complaint.priority,
                createdAt: complaint.createdAt
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalMessages,
                totalPages: Math.ceil(totalMessages / limit),
                hasMore: skip + messages.length < totalMessages
            }
        } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ==================== GET ALL USER CONVERSATIONS (INBOX) ====================

export const getAllConversations = async (req, res) => {
  try {
    let userId, userModel;

    if (req.user) {
        userId = req.user._id;
        userModel = 'User';
    } else if (req.staff) {
        userId = req.staff._id;
        userModel = 'Staff';
    } else if (req.admin) {
        userId = req.admin._id;
        userModel = 'Admin';
    } else {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let complaints;

    if (userModel === 'Admin') {
        // Admins see all complaints
        complaints = await UserComplaint.find()
            .populate('user', 'name email profileImage')
            .populate('assignedTo', 'name email profileImage')
            .sort({ updatedAt: -1 })
            .lean();
    } else if (userModel === 'Staff') {
        // Staff see only assigned complaints
        complaints = await UserComplaint.find({ assignedTo: userId })
            .populate('user', 'name email profileImage')
            .populate('assignedTo', 'name email profileImage')
            .sort({ updatedAt: -1 })
            .lean();
    } else {
        // Users see their own complaints
        complaints = await UserComplaint.find({ user: userId })
            .populate('user', 'name email profileImage')
            .populate('assignedTo', 'name email profileImage')
            .sort({ updatedAt: -1 })
            .lean();
    }

    // Get last message and unread count for each complaint
    const conversationsWithDetails = await Promise.all(
        complaints.map(async (complaint) => {
            const conversationId = `complaint_${complaint._id}`;
            
            const [lastMessage, unreadCount] = await Promise.all([
                ChatMessage.findOne({ conversationId })
                    .sort({ createdAt: -1 })
                    .populate('senderId', 'name')
                    .lean(),
                ChatMessage.countDocuments({
                    conversationId,
                    receiverId: userId,
                    isRead: false
                })
            ]);

            //  If there are no messages, return null so we can filter it out of the inbox
            if (!lastMessage) return null;

            return {
                complaintId: complaint._id,
                ticketId: complaint.ticketId || complaint._id.toString().slice(-6).toUpperCase(), // Added for frontend
                title: complaint.title,
                category: complaint.category,
                status: complaint.status,
                priority: complaint.priority,
                user: complaint.user,
                assignedTo: complaint.assignedTo,
                lastMessage: {
                    text: lastMessage.message,
                    sender: lastMessage.senderId?.name || 'User',
                    timestamp: lastMessage.createdAt
                },
                unreadCount,
                updatedAt: complaint.updatedAt
            };
        })
    );

    //  Filter out all the nulls (tickets with no chats)
    const activeConversations = conversationsWithDetails.filter(conv => conv !== null);

    // Sort by last message time
    activeConversations.sort((a, b) => {
        const timeA = a.lastMessage?.timestamp || a.updatedAt;
        const timeB = b.lastMessage?.timestamp || b.updatedAt;
        return new Date(timeB) - new Date(timeA);
    });

    // Get total unread count
    const totalUnread = activeConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

    res.status(200).json(
        { success: true, message: "Conversations fetched successfully", data: {
            conversations: activeConversations,
            totalUnread,
            totalConversations: activeConversations.length
        } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ==================== GET UNREAD COUNT ====================

export const getUnreadCount = async (req, res) => {
  try {
    let userId;

    if (req.user) userId = req.user._id;
    else if (req.staff) userId = req.staff._id;
    else if (req.admin) userId = req.admin._id;
    else return res.status(401).json({ success: false, message: "Unauthorized" });

    const unreadCount = await ChatMessage.countDocuments({
        receiverId: userId,
        isRead: false
    });

    res.status(200).json(
        { success: true, message: "Unread count fetched successfully", data: { unreadCount } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ==================== MARK AS READ ====================

export const markAsRead = async (req, res) => {
  try {
    const { complaintId } = req.params;
    
    let userId;
    if (req.user) userId = req.user._id;
    else if (req.staff) userId = req.staff._id;
    else if (req.admin) userId = req.admin._id;
    else return res.status(401).json({ success: false, message: "Unauthorized" });

    const conversationId = `complaint_${complaintId}`;

    const result = await ChatMessage.updateMany(
        {
            conversationId,
            receiverId: userId,
            isRead: false
        },
        { isRead: true }
    );

    res.status(200).json(
        { success: true, message: "Messages marked as read", data: {
            messagesMarked: result.modifiedCount
        } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ==================== EDIT MESSAGE ====================

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, message: "Message content is required" });
    }

    let userId;
    if (req.user) userId = req.user._id;
    else if (req.staff) userId = req.staff._id;
    else if (req.admin) userId = req.admin._id;
    else return res.status(401).json({ success: false, message: "Unauthorized" });

    const chatMessage = await ChatMessage.findOne({
        _id: messageId,
        senderId: userId
    });

    if (!chatMessage) {
        return res.status(404).json({ success: false, message: "Message not found or you don't have permission to edit" });
    }

    chatMessage.message = message;
    chatMessage.isEdited = true;
    await chatMessage.save();

    // Emit socket event
    if (global.io) {
        global.io.to(chatMessage.conversationId).emit('message_edited', {
            messageId: chatMessage._id,
            message,
            editedAt: new Date()
        });
    }

    res.status(200).json(
        { success: true, message: "Message edited successfully", data: { message: chatMessage } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ==================== DELETE MESSAGE ====================

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    let userId, userModel;
    if (req.user) {
        userId = req.user._id;
        userModel = 'User';
    } else if (req.staff) {
        userId = req.staff._id;
        userModel = 'Staff';
    } else if (req.admin) {
        userId = req.admin._id;
        userModel = 'Admin';
    } else {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const chatMessage = await ChatMessage.findOne({
        _id: messageId,
        senderId: userId
    });

    if (!chatMessage) {
        return res.status(404).json({ success: false, message: "Message not found or you don't have permission to delete" });
    }

    // Soft delete - add to deletedBy array
    if (!chatMessage.deletedBy) {
        chatMessage.deletedBy = [];
    }
    chatMessage.deletedBy.push(userId);
    chatMessage.deletedByModel = userModel;
    await chatMessage.save();

    // Emit socket event
    if (global.io) {
        global.io.to(chatMessage.conversationId).emit('message_deleted', {
            messageId: chatMessage._id
        });
    }

    res.status(200).json(
        { success: true, message: "Message deleted successfully", data: null }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ==================== UPLOAD FILE IN CHAT ====================

export const uploadChatFile = async (req, res) => {
  try {
    const { complaintId } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Here you would upload to Cloudinary
    // For now, returning a placeholder
    const fileUrl = `https://example.com/files/${req.file.filename}`;

    let senderId, senderModel;
    if (req.user) {
        senderId = req.user._id;
        senderModel = 'User';
    } else if (req.staff) {
        senderId = req.staff._id;
        senderModel = 'Staff';
    } else if (req.admin) {
        senderId = req.admin._id;
        senderModel = 'Admin';
    }

    const conversationId = `complaint_${complaintId}`;

    const chatMessage = await ChatMessage.create({
        conversationId,
        senderId,
        senderModel,
        complaintId,
        message: `Sent a file: ${req.file.originalname}`,
        messageType: 'file',
        fileUrl,
        isRead: false
    });

    if (global.io) {
        global.io.to(conversationId).emit('new_message', chatMessage);
    }

    res.status(201).json(
        { success: true, message: "File uploaded successfully", data: { message: chatMessage, fileUrl } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ==================== TYPING INDICATOR ====================

export const sendTypingIndicator = async (req, res) => {
  try {
    const { complaintId, isTyping } = req.body;

    let userId, userName;
    if (req.user) {
        userId = req.user._id;
        userName = req.user.name;
    } else if (req.staff) {
        userId = req.staff._id;
        userName = req.staff.name;
    } else if (req.admin) {
        userId = req.admin._id;
        userName = req.admin.name;
    }

    const conversationId = `complaint_${complaintId}`;

    if (global.io) {
        global.io.to(conversationId).emit('user_typing', {
            userId,
            userName,
            isTyping
        });
    }

    res.status(200).json(
        { success: true, message: "Typing indicator sent", data: null }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ==================== SEARCH MESSAGES ====================

export const searchMessages = async (req, res) => {
  try {
    const { query, complaintId } = req.query;

    if (!query) {
        return res.status(400).json({ success: false, message: "Search query is required" });
    }

    let userId;
    if (req.user) userId = req.user._id;
    else if (req.staff) userId = req.staff._id;
    else if (req.admin) userId = req.admin._id;

    const searchQuery = {
        message: { $regex: query, $options: 'i' }
    };

    if (complaintId) {
        searchQuery.conversationId = `complaint_${complaintId}`;
    }

    // For non-admin users, filter by accessible conversations
    if (!req.admin) {
        if (req.staff) {
            const assignedComplaints = await UserComplaint.find({ assignedTo: userId }).select('_id');
            const complaintIds = assignedComplaints.map(c => c._id);
            searchQuery.complaintId = { $in: complaintIds };
        } else if (req.user) {
            const userComplaints = await UserComplaint.find({ user: userId }).select('_id');
            const complaintIds = userComplaints.map(c => c._id);
            searchQuery.complaintId = { $in: complaintIds };
        }
    }

    const messages = await ChatMessage.find(searchQuery)
        .populate('senderId', 'name email')
        .populate('complaintId', 'title category status')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    res.status(200).json(
        { success: true, message: "Search completed", data: { messages, count: messages.length } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ==================== HELPER FUNCTIONS ====================

async function getConversationParticipants(complaint) {
    const participants = [];

    // Add complaint owner
    if (complaint.user) {
        const user = await User.findById(complaint.user).select('name email profileImage').lean();
        if (user) {
            participants.push({
                id: user._id,
                name: user.name,
                email: user.email,
                role: 'user',
                profileImage: user.profileImage
            });
        }
    }

    // Add assigned staff
    if (complaint.assignedTo) {
        const staff = await Staff.findById(complaint.assignedTo).select('name email profileImage').lean();
        if (staff) {
            participants.push({
                id: staff._id,
                name: staff.name,
                email: staff.email,
                role: 'staff',
                profileImage: staff.profileImage
            });
        }
    }

    // Admins are implicit participants (can join any conversation)
    const admins = await Admin.find({ role: 'admin' })
        .select('name email profileImage')
        .limit(5)
        .lean();
    
    admins.forEach(admin => {
        participants.push({
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: 'admin',
            profileImage: admin.profileImage
        });
    });

    return participants;
}

export default {
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
};