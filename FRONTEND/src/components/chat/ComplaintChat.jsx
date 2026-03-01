// FRONTEND: src/components/chat/ComplaintChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, MoreVertical, Edit2, Trash2, Check, X, User } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const ComplaintChat = ({ complaintId, currentUser, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [socket, setSocket] = useState(null);
    const [typing, setTyping] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [complaint, setComplaint] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        // Initialize socket connection
        const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
            auth: {
                userId: currentUser.id,
                userType: currentUser.role
            }
        });

        socketInstance.on('connect', () => {
            console.log('Connected to chat');
            socketInstance.emit('join_complaint', complaintId);
        });

        socketInstance.on('new_message', (message) => {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        });

        socketInstance.on('message_edited', ({ messageId, message: newContent }) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === messageId ? { ...msg, message: newContent, isEdited: true } : msg
                )
            );
        });

        socketInstance.on('message_deleted', ({ messageId }) => {
            setMessages(prev => prev.filter(msg => msg._id !== messageId));
        });

        socketInstance.on('user_typing', ({ userName, isTyping }) => {
            if (userName !== currentUser.name) {
                setTyping(isTyping ? userName : null);
            }
        });

        setSocket(socketInstance);

        // Fetch conversation
        fetchConversation();

        return () => {
            socketInstance.emit('leave_complaint', complaintId);
            socketInstance.disconnect();
        };
    }, [complaintId]);

    const fetchConversation = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/chat/enhanced/conversation/${complaintId}`);
            setMessages(response.data.data.messages);
            setParticipants(response.data.data.participants);
            setComplaint(response.data.data.complaint);
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
            await axios.post('/api/chat/enhanced/send', {
                complaintId,
                message: newMessage,
                receiverId: null, // Broadcast to all participants
                receiverModel: null
            });

            setNewMessage('');
            handleStopTyping();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleTyping = () => {
        if (socket) {
            socket.emit('typing', { complaintId, isTyping: true });

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Set new timeout to stop typing after 2 seconds
            typingTimeoutRef.current = setTimeout(() => {
                handleStopTyping();
            }, 2000);
        }
    };

    const handleStopTyping = () => {
        if (socket) {
            socket.emit('typing', { complaintId, isTyping: false });
        }
    };

    const handleEditMessage = async (messageId, newContent) => {
        try {
            await axios.patch(`/api/chat/enhanced/message/${messageId}/edit`, {
                message: newContent
            });
            setEditingMessage(null);
        } catch (error) {
            console.error('Error editing message:', error);
            alert('Failed to edit message');
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;

        try {
            await axios.delete(`/api/chat/enhanced/message/${messageId}`);
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Failed to delete message');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('complaintId', complaintId);

        try {
            await axios.post('/api/chat/enhanced/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file');
        }
    };

    const getRoleColor = (role) => {
        const colors = {
            user: 'bg-blue-100 text-blue-800',
            staff: 'bg-purple-100 text-purple-800',
            admin: 'bg-red-100 text-red-800'
        };
        return colors[role] || 'bg-gray-100 text-gray-800';
    };

    const getRoleBadge = (role) => {
        const badges = {
            user: 'User',
            staff: 'Staff',
            admin: 'Admin'
        };
        return badges[role] || role;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">{complaint?.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            complaint?.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            complaint?.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                            {complaint?.status}
                        </span>
                        <span className="text-xs text-gray-500">
                            {complaint?.category}
                        </span>
                    </div>
                </div>
                
                {/* Participants */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Participants:</span>
                    <div className="flex -space-x-2">
                        {participants.slice(0, 3).map((participant) => (
                            <div
                                key={participant.id}
                                className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
                                title={participant.name}
                            >
                                <span className="text-xs font-medium">
                                    {participant.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        ))}
                        {participants.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center">
                                <span className="text-xs font-medium text-white">
                                    +{participants.length - 3}
                                </span>
                            </div>
                        )}
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="ml-4 p-2 hover:bg-gray-200 rounded-full"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <User size={48} className="mb-2" />
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <MessageBubble
                            key={message._id}
                            message={message}
                            isOwnMessage={message.senderId._id === currentUser.id}
                            currentUser={currentUser}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                            editingMessage={editingMessage}
                            setEditingMessage={setEditingMessage}
                            getRoleColor={getRoleColor}
                            getRoleBadge={getRoleBadge}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
                
                {/* Typing Indicator */}
                {typing && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span>{typing} is typing...</span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
                <div className="flex items-end gap-2">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <label
                        htmlFor="file-upload"
                        className="p-2 hover:bg-gray-200 rounded-full cursor-pointer transition-colors"
                    >
                        <Paperclip size={20} className="text-gray-600" />
                    </label>

                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                handleTyping();
                            }}
                            onBlur={handleStopTyping}
                            placeholder="Type your message..."
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows="2"
                            onKeyPress={(e) => {
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
                        className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
};

// Message Bubble Component
const MessageBubble = ({ 
    message, 
    isOwnMessage, 
    currentUser, 
    onEdit, 
    onDelete, 
    editingMessage, 
    setEditingMessage,
    getRoleColor,
    getRoleBadge
}) => {
    const [editContent, setEditContent] = useState(message.message);
    const [showMenu, setShowMenu] = useState(false);

    const handleSaveEdit = () => {
        onEdit(message._id, editContent);
    };

    const handleCancelEdit = () => {
        setEditContent(message.message);
        setEditingMessage(null);
    };

    if (editingMessage === message._id) {
        return (
            <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-md w-full">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="3"
                    />
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={handleSaveEdit}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            <Check size={16} />
                            Save
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                            <X size={16} />
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                {!isOwnMessage && (
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                            {message.senderId.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(message.senderModel.toLowerCase())}`}>
                            {getRoleBadge(message.senderModel.toLowerCase())}
                        </span>
                    </div>
                )}
                
                <div className="relative group">
                    <div className={`px-4 py-2 rounded-lg ${
                        isOwnMessage
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                        {message.isEdited && (
                            <span className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'} italic`}>
                                (edited)
                            </span>
                        )}
                    </div>

                    {/* Message Menu */}
                    {isOwnMessage && (
                        <div className="absolute top-0 right-0 -mr-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1 hover:bg-gray-200 rounded"
                            >
                                <MoreVertical size={16} />
                            </button>
                            
                            {showMenu && (
                                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border z-10">
                                    <button
                                        onClick={() => {
                                            setEditingMessage(message._id);
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-left text-sm"
                                    >
                                        <Edit2 size={14} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            onDelete(message._id);
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-left text-sm text-red-600"
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                    {new Date(message.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })}
                </div>
            </div>
        </div>
    );
};

export default ComplaintChat;