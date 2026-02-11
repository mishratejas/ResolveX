import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Shield, Briefcase } from 'lucide-react';
import io from 'socket.io-client';
import adminService from '../../services/adminService';

const ComplaintChat = ({ complaintId, adminId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // Initialize Socket
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        setSocket(newSocket);

        // Join Complaint Room
        newSocket.emit('join_complaint', complaintId);

        // Listen for new messages
        newSocket.on('new_message', (message) => {
            setMessages((prev) => [...prev, message]);
            scrollToBottom();
        });

        // Load initial messages
        loadMessages();

        return () => newSocket.disconnect();
    }, [complaintId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        try {
            const response = await adminService.getComplaintMessages(complaintId);
            if (response.success) {
                setMessages(response.messages);
            }
        } catch (error) {
            console.error("Failed to load messages", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await adminService.sendComplaintMessage(complaintId, newMessage, adminId);
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const getSenderIcon = (role) => {
        switch (role) {
            case 'Admin': return <Shield className="w-4 h-4" />;
            case 'Staff': return <Briefcase className="w-4 h-4" />;
            default: return <User className="w-4 h-4" />;
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    Complaint Discussion
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => {
                    const isMe = msg.senderModel === 'Admin' && msg.senderId === adminId;
                    return (
                        <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    msg.senderModel === 'Admin' ? 'bg-indigo-100 text-indigo-600' :
                                    msg.senderModel === 'Staff' ? 'bg-orange-100 text-orange-600' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {getSenderIcon(msg.senderModel)}
                                </div>
                                <div className={`p-3 rounded-lg ${
                                    isMe ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
                                }`}>
                                    <div className="text-xs opacity-70 mb-1 flex justify-between gap-4">
                                        <span>{msg.senderModel}</span>
                                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-sm">{msg.message}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
};

import { MessageSquare } from 'lucide-react';

export default ComplaintChat;