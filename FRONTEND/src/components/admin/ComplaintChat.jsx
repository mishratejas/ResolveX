// components/admin/ComplaintChat.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Paperclip, Smile, Image, FileText, X, Check, Edit, Trash2, MoreVertical, Download, Eye } from 'lucide-react';
import { chatService } from '../../services/chatService';
import { format } from 'date-fns';

const ComplaintChat = ({ complaintId, staffId, adminId, complaintTitle }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Initialize chat
    useEffect(() => {
        if (!complaintId || !adminId) return;

        const initializeChat = async () => {
            try {
                setLoading(true);
                
                // Initialize socket
                const socketInstance = chatService.initializeSocket(adminId, 'admin');
                setSocket(socketInstance);
                
                // Join complaint room
                chatService.joinComplaintRoom(complaintId);
                
                // Load messages
                const response = await chatService.getChatHistory(complaintId);
                if (response.success) {
                    setMessages(response.data);
                }
                
                // Set up event listeners
                setupSocketListeners(socketInstance);
                
            } catch (error) {
                console.error('Error initializing chat:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeChat();

        return () => {
            if (socket) {
                chatService.leaveComplaintRoom(complaintId);
                chatService.disconnect();
            }
        };
    }, [complaintId, adminId]);

    // Setup socket listeners
    const setupSocketListeners = (socketInstance) => {
        chatService.onNewMessage((message) => {
            if (message.complaintId === complaintId) {
                setMessages(prev => [...prev, message]);
            }
        });

        chatService.onMessageEdited((data) => {
            setMessages(prev => prev.map(msg => 
                msg._id === data.messageId 
                    ? { ...msg, message: data.newContent, isEdited: true, updatedAt: data.updatedAt }
                    : msg
            ));
        });

        chatService.onMessageDeleted((data) => {
            setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
        });

        chatService.onUserTyping((data) => {
            if (data.complaintId === complaintId) {
                setTypingUsers(prev => {
                    const exists = prev.find(u => u.userId === data.userId);
                    if (data.isTyping && !exists) {
                        return [...prev, { userId: data.userId, name: data.userName }];
                    } else if (!data.isTyping && exists) {
                        return prev.filter(u => u.userId !== data.userId);
                    }
                    return prev;
                });
            }
        });

        chatService.onUserOnline((user) => {
            setOnlineUsers(prev => {
                const exists = prev.find(u => u.userId === user.userId);
                if (!exists) {
                    return [...prev, user];
                }
                return prev;
            });
        });

        chatService.onUserOffline((userId) => {
            setOnlineUsers(prev => prev.filter(u => u.userId !== userId));
        });
    };

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || sending || !staffId) return;

        try {
            setSending(true);
            const messageData = {
                conversationId: `${adminId}_${staffId}_${complaintId}`,
                senderId: adminId,
                senderModel: 'Admin',
                receiverId: staffId,
                receiverModel: 'Staff',
                message: newMessage.trim(),
                complaintId: complaintId,
                messageType: 'text'
            };

            await chatService.sendMessage(messageData);
            setNewMessage('');
            
            // Clear typing indicator
            chatService.sendTypingIndicator(complaintId, false);
            
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    // Handle typing
    const handleTyping = useCallback(() => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        chatService.sendTypingIndicator(complaintId, true);
        
        typingTimeoutRef.current = setTimeout(() => {
            chatService.sendTypingIndicator(complaintId, false);
        }, 2000);
    }, [complaintId]);

    // Upload file
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const response = await chatService.uploadFile(file, complaintId);
            
            if (response.success) {
                const messageData = {
                    conversationId: `${adminId}_${staffId}_${complaintId}`,
                    senderId: adminId,
                    senderModel: 'Admin',
                    receiverId: staffId,
                    receiverModel: 'Staff',
                    message: `File: ${file.name}`,
                    complaintId: complaintId,
                    messageType: file.type.startsWith('image/') ? 'image' : 'file',
                    fileUrl: response.data.url,
                    fileName: file.name,
                    fileSize: file.size
                };

                await chatService.sendMessage(messageData);
                setShowFileUpload(false);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    // Edit message
    const handleEditMessage = async (messageId) => {
        try {
            await chatService.editMessage(messageId, editContent);
            setEditingMessageId(null);
            setEditContent('');
        } catch (error) {
            console.error('Error editing message:', error);
            alert('Failed to edit message');
        }
    };

    // Delete message
    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;

        try {
            await chatService.deleteMessage(messageId);
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Failed to delete message');
        }
    };

    // Download file
    const handleDownloadFile = (fileUrl, fileName) => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Format message time
    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffHours = (now - date) / (1000 * 60 * 60);
        
        if (diffHours < 24) {
            return format(date, 'h:mm a');
        } else if (diffHours < 48) {
            return 'Yesterday';
        } else {
            return format(date, 'MMM d');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-lg border border-gray-200">
            {/* Chat Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                            S
                        </div>
                        {onlineUsers.some(u => u.userId === staffId) && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{complaintTitle}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Chat with Staff</span>
                            {typingUsers.length > 0 && (
                                <span className="text-blue-600 animate-pulse">
                                    {typingUsers.map(u => u.name).join(', ')} typing...
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFileUpload(!showFileUpload)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Attach file"
                    >
                        <Paperclip className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="text-sm text-gray-500">
                        {onlineUsers.length} online
                    </span>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message._id}
                            className={`flex ${message.senderId === adminId ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg ${
                                message.senderId === adminId 
                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' 
                                    : 'bg-white border border-gray-200'
                            } rounded-2xl p-4 shadow-sm`}>
                                {/* Message header */}
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs opacity-75">
                                        {message.senderId === adminId ? 'You' : 'Staff'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {message.isEdited && (
                                            <span className="text-xs opacity-75 italic">edited</span>
                                        )}
                                        <span className="text-xs opacity-75">
                                            {formatMessageTime(message.createdAt)}
                                        </span>
                                        {message.senderId === adminId && (
                                            <div className="relative group">
                                                <button className="p-1 hover:bg-white/10 rounded">
                                                    <MoreVertical className="w-3 h-3" />
                                                </button>
                                                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                                    <button
                                                        onClick={() => {
                                                            setEditingMessageId(message._id);
                                                            setEditContent(message.message);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMessage(message._id)}
                                                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Message content */}
                                {editingMessageId === message._id ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full p-2 border rounded-lg text-gray-900"
                                            rows="2"
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditMessage(message._id)}
                                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingMessageId(null);
                                                    setEditContent('');
                                                }}
                                                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg text-sm"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {message.messageType === 'image' ? (
                                            <div>
                                                <img
                                                    src={message.fileUrl}
                                                    alt="Attachment"
                                                    className="rounded-lg max-w-full h-auto cursor-pointer"
                                                    onClick={() => window.open(message.fileUrl, '_blank')}
                                                />
                                                <p className="mt-2">{message.message}</p>
                                            </div>
                                        ) : message.messageType === 'file' ? (
                                            <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                                                <FileText className="w-8 h-8" />
                                                <div className="flex-1">
                                                    <p className="font-medium">{message.fileName}</p>
                                                    <p className="text-xs opacity-75">
                                                        {(message.fileSize / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleDownloadFile(message.fileUrl, message.fileName)}
                                                    className="p-2 hover:bg-white/10 rounded"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* File Upload Panel */}
            {showFileUpload && (
                <div className="border-t border-gray-200 p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Upload File</h4>
                        <button
                            onClick={() => setShowFileUpload(false)}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <div className="grid grid-cols-4 gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center gap-2"
                        >
                            <Image className="w-6 h-6 text-gray-500" />
                            <span className="text-xs">Image</span>
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center gap-2"
                        >
                            <FileText className="w-6 h-6 text-gray-500" />
                            <span className="text-xs">Document</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFileUpload(!showFileUpload)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <Paperclip className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                handleTyping();
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Type your message here..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                        />
                        <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2">
                            <Smile className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                {uploading && (
                    <div className="mt-2 text-sm text-blue-600">
                        Uploading file...
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComplaintChat;