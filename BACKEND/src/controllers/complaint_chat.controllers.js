import ChatMessage from "../models/chat.model.js";
import UserComplaint from "../models/UserComplaint.models.js";
import { io } from "../app.js";

// Fetch messages for a specific complaint
export const getComplaintMessages = async (req, res) => {
    try {
        const { complaintId } = req.params;
        
        const messages = await ChatMessage.find({ complaintId })
            .sort({ createdAt: 1 }) // Oldest first
            .lean();

        res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Error fetching complaint messages:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Send a message to a complaint room
export const sendComplaintMessage = async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { message, senderModel, senderId } = req.body; // sender information should ideally come from auth middleware

        // Validate complaint existence
        const complaint = await UserComplaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        const newMessage = await ChatMessage.create({
            complaintId,
            senderId,
            senderModel,
            message,
            conversationId: `complaint_${complaintId}` // Logical grouping
        });

        // Emit real-time event to the complaint room
        io.to(`complaint_${complaintId}`).emit('new_message', newMessage);

        res.status(201).json({
            success: true,
            data: newMessage
        });
    } catch (error) {
        console.error('Error sending complaint message:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
