// services/chatService.js
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
let socket = null;

export const chatService = {
    // Initialize Socket Connection
    initializeSocket: (userId, userType = 'admin') => {
        if (!socket) {
            socket = io(API_URL, {
                auth: {
                    userId,
                    userType
                }
            });

            socket.on('connect', () => {
                console.log('🔗 Connected to chat socket');
            });

            socket.on('disconnect', () => {
                console.log('🔌 Disconnected from chat socket');
            });

            socket.on('error', (error) => {
                console.error('Socket error:', error);
            });
        }
        return socket;
    },

    // Join complaint room
    joinComplaintRoom: (complaintId) => {
        if (socket) {
            socket.emit('join_complaint', { complaintId });
        }
    },

    // Leave complaint room
    leaveComplaintRoom: (complaintId) => {
        if (socket) {
            socket.emit('leave_complaint', { complaintId });
        }
    },

    // Send message
    sendMessage: async (data) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.post(
                `${API_URL}/api/chat/send`,
                data,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Emit socket event
            if (socket && response.data.success) {
                socket.emit('new_message', response.data.data);
            }
            
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },

    // Get conversation
    getConversation: async (complaintId, otherUserId = null) => {
        try {
            const token = localStorage.getItem('adminToken');
            const params = otherUserId ? { complaintId, otherUserId } : { complaintId };
            
            const response = await axios.get(
                `${API_URL}/api/chat/conversation`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching conversation:', error);
            throw error;
        }
    },

    // Get all conversations
    getAllConversations: async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(
                `${API_URL}/api/chat/conversations`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw error;
        }
    },

    // Mark messages as read
    markAsRead: async (conversationId, messageIds) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.patch(
                `${API_URL}/api/chat/conversation/${conversationId}/read`,
                { messageIds },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    },

    // Get unread count
    getUnreadCount: async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(
                `${API_URL}/api/chat/unread-count`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            throw error;
        }
    },

    // Edit message
    editMessage: async (messageId, newContent) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.patch(
                `${API_URL}/api/chat/message/${messageId}/edit`,
                { message: newContent },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Emit edit event
            if (socket && response.data.success) {
                socket.emit('message_edited', {
                    messageId,
                    newContent,
                    updatedAt: new Date()
                });
            }
            
            return response.data;
        } catch (error) {
            console.error('Error editing message:', error);
            throw error;
        }
    },

    // Delete message
    deleteMessage: async (messageId) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.delete(
                `${API_URL}/api/chat/message/${messageId}/delete`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Emit delete event
            if (socket && response.data.success) {
                socket.emit('message_deleted', { messageId });
            }
            
            return response.data;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    },

    // Search messages
    searchMessages: async (query, filters = {}) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(
                `${API_URL}/api/chat/search`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { q: query, ...filters }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error searching messages:', error);
            throw error;
        }
    },

    // Socket event listeners
    onNewMessage: (callback) => {
        if (socket) {
            socket.on('new_message', callback);
        }
    },

    onMessageEdited: (callback) => {
        if (socket) {
            socket.on('message_edited', callback);
        }
    },

    onMessageDeleted: (callback) => {
        if (socket) {
            socket.on('message_deleted', callback);
        }
    },

    onUserTyping: (callback) => {
        if (socket) {
            socket.on('user_typing', callback);
        }
    },

    onUserOnline: (callback) => {
        if (socket) {
            socket.on('user_online', callback);
        }
    },

    onUserOffline: (callback) => {
        if (socket) {
            socket.on('user_offline', callback);
        }
    },

    // Typing indicator
    sendTypingIndicator: (complaintId, isTyping) => {
        if (socket) {
            socket.emit('typing', { complaintId, isTyping });
        }
    },

    // Disconnect
    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    },

    // Get active connections
    getActiveConnections: async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(
                `${API_URL}/api/chat/connections`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching connections:', error);
            throw error;
        }
    },

    // Upload file
    uploadFile: async (file, complaintId) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('complaintId', complaintId);

            const token = localStorage.getItem('adminToken');
            const response = await axios.post(
                `${API_URL}/api/chat/upload`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    },

    // Get chat history
    getChatHistory: async (complaintId, limit = 50, before = null) => {
        try {
            const token = localStorage.getItem('adminToken');
            const params = { complaintId, limit };
            if (before) params.before = before;

            const response = await axios.get(
                `${API_URL}/api/chat/history`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching chat history:', error);
            throw error;
        }
    }
};

export default chatService;