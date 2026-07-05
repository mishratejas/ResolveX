import ChatMessage from "../models/chat.model.js";
import UserComplaint from "../models/UserComplaint.models.js";

// Works out who is calling (admin/staff/user) and whether they're actually
// allowed to be in this complaint's chat thread. This is the check that was
// missing before: previously any valid admin/staff/user token could read or
// post into ANY complaint's chat just by knowing the complaintId.
const getRequesterAccess = (req, complaint) => {
    if (req.admin) {
        const isOwner = complaint.adminId?.toString() === req.admin._id.toString();
        return {
            authorized: isOwner,
            senderId: req.admin._id,
            senderModel: "Admin"
        };
    }

    if (req.staff) {
        const isAssigned = complaint.assignedTo?.toString() === req.staff._id.toString();
        return {
            authorized: isAssigned,
            senderId: req.staff._id,
            senderModel: "Staff"
        };
    }

    if (req.user) {
        const isOwner = complaint.user?.toString() === req.user._id.toString();
        return {
            authorized: isOwner,
            senderId: req.user._id,
            senderModel: "User"
        };
    }

    return { authorized: false, senderId: null, senderModel: null };
};

// Fetch messages for a specific complaint
export const getComplaintMessages = async (req, res) => {
    try {
        const { complaintId } = req.params;

        const complaint = await UserComplaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        const access = getRequesterAccess(req, complaint);
        if (!access.authorized) {
            return res.status(403).json({ success: false, message: 'You do not have access to this conversation' });
        }

        //Tell MongoDB to fetch the sender's actual name and email
        const messages = await ChatMessage.find({ complaintId })
            .populate('senderId', 'name email') 
            .sort({ createdAt: 1 }) 
            .lean();

        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching complaint messages:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Send a message to a complaint room
export const sendComplaintMessage = async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { message } = req.body;

        const complaint = await UserComplaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        const access = getRequesterAccess(req, complaint);
        if (!access.authorized) {
            return res.status(403).json({ success: false, message: 'You do not have access to this conversation' });
        }

        let newMessage = await ChatMessage.create({
            complaintId,
            senderId: access.senderId,
            senderModel: access.senderModel,
            message,
            conversationId: `complaint_${complaintId}` 
        });

        // PROPER FIX: Populate the sender's details BEFORE broadcasting to Socket.io
        newMessage = await newMessage.populate('senderId', 'name email');

        if (global.io) {
            global.io.to(`complaint_${complaintId}`).emit('new_message', newMessage);
        }

        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        console.error('Error sending complaint message:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
    
};

//Get all active conversations for the Admin's Master Inbox
// (scoped to the logged-in admin's own workspace only)
export const getActiveConversations = async (req, res) => {
    try {
        if (!req.admin) {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        // Only complaints that belong to this admin's workspace
        const workspaceComplaintIds = await UserComplaint.find({ adminId: req.admin._id }).distinct('_id');

        const conversations = await ChatMessage.aggregate([
            { $match: { complaintId: { $in: workspaceComplaintIds } } },
            { $sort: { createdAt: -1 } },
            { 
                $group: { 
                    _id: "$complaintId", 
                    latestMessage: { $first: "$message" },
                    latestMessageTime: { $first: "$createdAt" },
                    senderModel: { $first: "$senderModel" }
                } 
            },
            { $sort: { latestMessageTime: -1 } } // Sort inbox by newest activity
        ]);

        const populatedConversations = await UserComplaint.find({
            _id: { $in: conversations.map(c => c._id) }
        }).populate('assignedTo', 'name').lean();

        const inbox = conversations.map(conv => {
            const complaint = populatedConversations.find(c => c._id.toString() === conv._id.toString());
            if (!complaint) return null; 
            
            return {
                complaintId: conv._id,
                title: complaint.title || 'Untitled Issue',
                ticketId: complaint.ticketId || complaint._id.toString().slice(-6).toUpperCase(),
                status: complaint.status,
                latestMessage: conv.latestMessage,
                latestMessageTime: conv.latestMessageTime,
                assignedToName: complaint.assignedTo?.name || 'Unassigned'
            };
        }).filter(Boolean); 

        res.status(200).json({ success: true, data: inbox });
    } catch (error) {
        console.error('Error fetching inbox:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get conversations for the current staff/admin/user (used by StaffDashboard's
// inbox + unread-count widget). Each role only sees complaints it actually
// owns/is assigned to - never other workspaces' or other staff's threads.
export const getMyConversations = async (req, res) => {
    try {
        let userId, userModel, complaintFilter;

        if (req.staff) {
            userId = req.staff._id;
            userModel = 'Staff';
            complaintFilter = { assignedTo: userId };
        } else if (req.admin) {
            userId = req.admin._id;
            userModel = 'Admin';
            complaintFilter = { adminId: userId }; // scoped to this admin's own workspace
        } else if (req.user) {
            userId = req.user._id;
            userModel = 'User';
            complaintFilter = { user: userId };
        } else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const complaints = await UserComplaint.find(complaintFilter)
            .populate('user', 'name email profileImage')
            .populate('assignedTo', 'name email profileImage')
            .sort({ updatedAt: -1 })
            .lean();

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
                        senderModel: { $ne: userModel },
                        isRead: false
                    })
                ]);

                if (!lastMessage) return null;

                return {
                    complaintId: complaint._id,
                    ticketId: complaint.ticketId || complaint._id.toString().slice(-6).toUpperCase(),
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

        const activeConversations = conversationsWithDetails.filter(conv => conv !== null);

        activeConversations.sort((a, b) => {
            const timeA = a.lastMessage?.timestamp || a.updatedAt;
            const timeB = b.lastMessage?.timestamp || b.updatedAt;
            return new Date(timeB) - new Date(timeA);
        });

        const totalUnread = activeConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

        res.status(200).json({
            success: true,
            message: "Conversations fetched successfully",
            data: {
                conversations: activeConversations,
                totalUnread,
                totalConversations: activeConversations.length
            }
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};