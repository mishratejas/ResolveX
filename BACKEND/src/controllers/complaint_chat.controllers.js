// import ChatMessage from "../models/chat.model.js";
// import UserComplaint from "../models/UserComplaint.models.js";
// import { io } from "../app.js";

// // Fetch messages for a specific complaint
// export const getComplaintMessages = async (req, res) => {
//     try {
//         const { complaintId } = req.params;
        
//         const messages = await ChatMessage.find({ complaintId })
//             .sort({ createdAt: 1 }) // Oldest first
//             .lean();

//         res.status(200).json({
//             success: true,
//             messages
//         });
//     } catch (error) {
//         console.error('Error fetching complaint messages:', error);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };

// // Send a message to a complaint room
// export const sendComplaintMessage = async (req, res) => {
//     try {
//         const { complaintId } = req.params;
//         const { message, senderModel, senderId } = req.body; // sender information should ideally come from auth middleware

//         // Validate complaint existence
//         const complaint = await UserComplaint.findById(complaintId);
//         if (!complaint) {
//             return res.status(404).json({ success: false, message: 'Complaint not found' });
//         }

//         const newMessage = await ChatMessage.create({
//             complaintId,
//             senderId,
//             senderModel,
//             message,
//             conversationId: `complaint_${complaintId}` // Logical grouping
//         });

//         // Emit real-time event to the complaint room
//         io.to(`complaint_${complaintId}`).emit('new_message', newMessage);

//         res.status(201).json({
//             success: true,
//             data: newMessage
//         });
//     } catch (error) {
//         console.error('Error sending complaint message:', error);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };

// ####################################################################################

// import ChatMessage from "../models/chat.model.js";
// import UserComplaint from "../models/UserComplaint.models.js";

// // Fetch messages for a specific complaint
// export const getComplaintMessages = async (req, res) => {
//     try {
//         const { complaintId } = req.params;
        
//         // 1. Verify the complaint actually exists
//         const complaint = await UserComplaint.findById(complaintId);
//         if (!complaint) {
//             return res.status(404).json({ success: false, message: 'Complaint not found' });
//         }

//         // 2. Fetch the chat history for this specific ticket
//         const messages = await ChatMessage.find({ complaintId })
//             .sort({ createdAt: 1 }) // Oldest first so chat flows top-to-bottom
//             .lean();

//         res.status(200).json({
//             success: true,
//             messages
//         });
//     } catch (error) {
//         console.error('Error fetching complaint messages:', error);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };

// // Send a message to a complaint room
// export const sendComplaintMessage = async (req, res) => {
//     try {
//         const { complaintId } = req.params;
//         let { message, senderModel, senderId, senderName } = req.body; 

//         // 🚀 THE BULLETPROOF NET: If the frontend forgot the ID, grab it securely from the Auth Token!
//         if (!senderId) {
//             senderId = req.admin?._id || req.admin?.id || req.staff?._id || req.staff?.id || req.user?._id || req.user?.id;
//         }

//         // 🚀 If it's STILL missing, stop and tell us!
//         if (!senderId) {
//             console.error("❌ ERROR: Could not find senderId in request body or auth token!");
//             return res.status(400).json({ success: false, message: "Authentication error: Missing User ID" });
//         }

//         const complaint = await UserComplaint.findById(complaintId);
//         if (!complaint) {
//             return res.status(404).json({ success: false, message: 'Complaint not found' });
//         }

//         const newMessage = await ChatMessage.create({
//             complaintId,
//             senderId,
//             senderModel,
//             senderName,
//             message,
//             conversationId: `complaint_${complaintId}` 
//         });

//         if (global.io) {
//             global.io.to(`complaint_${complaintId}`).emit('new_message', newMessage);
//         }

//         res.status(201).json({ success: true, data: newMessage });
//     } catch (error) {
//         console.error('Error sending complaint message:', error);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };


import ChatMessage from "../models/chat.model.js";
import UserComplaint from "../models/UserComplaint.models.js";

// Fetch messages for a specific complaint
export const getComplaintMessages = async (req, res) => {
    try {
        const { complaintId } = req.params;
        
        const complaint = await UserComplaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        // 🚀 PROPER FIX: Tell MongoDB to fetch the sender's actual name and email
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
        let { message, senderModel, senderId } = req.body; 

        if (!senderId) {
            senderId = req.admin?._id || req.admin?.id || req.staff?._id || req.staff?.id || req.user?._id || req.user?.id;
        }

        if (!senderId) {
            return res.status(400).json({ success: false, message: "Authentication error: Missing User ID" });
        }

        const complaint = await UserComplaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        let newMessage = await ChatMessage.create({
            complaintId,
            senderId,
            senderModel,
            message,
            conversationId: `complaint_${complaintId}` 
        });

        // 🚀 PROPER FIX: Populate the sender's details BEFORE broadcasting to Socket.io
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

// 🚀 NEW: Get all active conversations for the Master Inbox
export const getActiveConversations = async (req, res) => {
    try {
        const conversations = await ChatMessage.aggregate([
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