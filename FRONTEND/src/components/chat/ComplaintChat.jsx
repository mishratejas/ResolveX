import React, { useState, useEffect, useRef } from 'react';
import { Send, X, User } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

// Make sure this matches your actual backend URL variable (Vite uses import.meta.env)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ComplaintChat = ({ complaintId, currentUser, onClose, complaintTitle, complaintStatus, isModal = true }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    // Get a clean token based on role
    const getToken = () => {
        return currentUser.role === 'admin' 
            ? localStorage.getItem('adminToken') || localStorage.getItem('accessToken')
            : localStorage.getItem('staffToken') || localStorage.getItem('staffAccessToken');
    };

    useEffect(() => {
        // 1. Initialize Socket.io Connection
        const socketInstance = io(BASE_URL);

        socketInstance.on('connect', () => {
            console.log('Connected to chat socket');
            socketInstance.emit('join_complaint', complaintId);
        });

        // 2. Listen for incoming messages
        socketInstance.on('new_message', (message) => {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        });

        setSocket(socketInstance);

        // 3. Fetch History
        fetchConversation();

        return () => {
            socketInstance.disconnect();
        };
    }, [complaintId]);

    const fetchConversation = async () => {
        try {
            setLoading(true);
            const token = getToken();
            
            // Adjust this URL to match your chat.routes.js exactly!
            const response = await axios.get(`${BASE_URL}/api/chat/complaint/${complaintId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setMessages(response.data.messages || []);
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error('Error fetching conversation:', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            setSending(true);
            const token = getToken();
            
            // Adjust this URL to match your chat.routes.js exactly!
            await axios.post(`${BASE_URL}/api/chat/complaint/${complaintId}/send`, {
                message: newMessage,
                senderId: currentUser.id || currentUser._id,
                senderModel: currentUser.role === 'admin' ? 'Admin' : 'Staff',
                senderName: currentUser.name //  Sending name to prevent DB lookups!
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNewMessage('');
            // Note: We don't manually add the message to state here because 
            // the backend emits 'new_message' via socket, which will catch it!
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const getRoleColor = (role) => {
        if (!role) return 'bg-gray-100 text-gray-800';
        switch(role.toLowerCase()) {
            case 'staff': return 'bg-purple-100 text-purple-800';
            case 'admin': return 'bg-red-100 text-red-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-white rounded-lg shadow-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        //  THE MAGIC TOGGLE: Changes shape based on where it lives!
        <div className={`flex flex-col bg-white overflow-hidden ${
            isModal 
                ? "h-[600px] w-full max-w-md rounded-2xl shadow-2xl border border-gray-100" 
                : "h-full w-full"
        }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <div>
                    <h2 className="text-lg font-bold">{complaintTitle || `Ticket #${complaintId.slice(-6).toUpperCase()}`}</h2>
                    <span className="px-2 py-0.5 mt-1 inline-block rounded-full bg-white/20 text-xs font-medium">
                        {complaintStatus || 'Active Chat'}
                    </span>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <User size={48} className="mb-2 opacity-50" />
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        //  PROPER FIX: Safely extract ID whether it's an object or a string
                        const messageSenderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
                        const currentUserId = currentUser.id || currentUser._id;
                        
                        // Safely check if it's our own message
                        const isOwnMessage = String(messageSenderId) === String(currentUserId);
                        
                        // Extract the real name
                        const displayName = typeof msg.senderId === 'object' ? msg.senderId.name : 'Unknown User';

                        return (
                            <div key={msg._id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                                    
                                    {!isOwnMessage && (
                                        <div className="flex items-center gap-2 mb-1 pl-1">
                                            <span className="text-xs font-bold text-gray-700">
                                                {displayName}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${getRoleColor(msg.senderModel)}`}>
                                                {msg.senderModel}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                                        isOwnMessage
                                            ? 'bg-blue-600 text-white rounded-tr-sm'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                                    }`}>
                                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                    </div>

                                    <div className={`text-[10px] text-gray-400 mt-1 px-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                            rows="1"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ComplaintChat;