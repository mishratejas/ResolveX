// // FRONTEND: src/components/chat/ComplaintChat.jsx
// import React, { useState, useEffect, useRef } from 'react';
// import { Send, Paperclip, MoreVertical, Edit2, Trash2, Check, X, User } from 'lucide-react';
// import axios from 'axios';
// import { io } from 'socket.io-client';

// const ComplaintChat = ({ complaintId, currentUser, onClose }) => {
//     const [messages, setMessages] = useState([]);
//     const [newMessage, setNewMessage] = useState('');
//     const [loading, setLoading] = useState(true);
//     const [sending, setSending] = useState(false);
//     const [socket, setSocket] = useState(null);
//     const [typing, setTyping] = useState(null);
//     const [participants, setParticipants] = useState([]);
//     const [complaint, setComplaint] = useState(null);
//     const [editingMessage, setEditingMessage] = useState(null);
//     const messagesEndRef = useRef(null);
//     const typingTimeoutRef = useRef(null);

//     useEffect(() => {
//         // Initialize socket connection
//         const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
//             auth: {
//                 userId: currentUser.id,
//                 userType: currentUser.role
//             }
//         });

//         socketInstance.on('connect', () => {
//             console.log('Connected to chat');
//             socketInstance.emit('join_complaint', complaintId);
//         });

//         socketInstance.on('new_message', (message) => {
//             setMessages(prev => [...prev, message]);
//             scrollToBottom();
//         });

//         socketInstance.on('message_edited', ({ messageId, message: newContent }) => {
//             setMessages(prev =>
//                 prev.map(msg =>
//                     msg._id === messageId ? { ...msg, message: newContent, isEdited: true } : msg
//                 )
//             );
//         });

//         socketInstance.on('message_deleted', ({ messageId }) => {
//             setMessages(prev => prev.filter(msg => msg._id !== messageId));
//         });

//         socketInstance.on('user_typing', ({ userName, isTyping }) => {
//             if (userName !== currentUser.name) {
//                 setTyping(isTyping ? userName : null);
//             }
//         });

//         setSocket(socketInstance);

//         // Fetch conversation
//         fetchConversation();

//         return () => {
//             socketInstance.emit('leave_complaint', complaintId);
//             socketInstance.disconnect();
//         };
//     }, [complaintId]);

//     const fetchConversation = async () => {
//         try {
//             setLoading(true);
//             const response = await axios.get(`/api/chat/enhanced/conversation/${complaintId}`);
//             setMessages(response.data.data.messages);
//             setParticipants(response.data.data.participants);
//             setComplaint(response.data.data.complaint);
//         } catch (error) {
//             console.error('Error fetching conversation:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const scrollToBottom = () => {
//         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     };

//     const handleSendMessage = async (e) => {
//         e.preventDefault();
        
//         if (!newMessage.trim()) return;

//         try {
//             setSending(true);
//             await axios.post('/api/chat/enhanced/send', {
//                 complaintId,
//                 message: newMessage,
//                 receiverId: null, // Broadcast to all participants
//                 receiverModel: null
//             });

//             setNewMessage('');
//             handleStopTyping();
//         } catch (error) {
//             console.error('Error sending message:', error);
//             alert('Failed to send message');
//         } finally {
//             setSending(false);
//         }
//     };

//     const handleTyping = () => {
//         if (socket) {
//             socket.emit('typing', { complaintId, isTyping: true });

//             // Clear existing timeout
//             if (typingTimeoutRef.current) {
//                 clearTimeout(typingTimeoutRef.current);
//             }

//             // Set new timeout to stop typing after 2 seconds
//             typingTimeoutRef.current = setTimeout(() => {
//                 handleStopTyping();
//             }, 2000);
//         }
//     };

//     const handleStopTyping = () => {
//         if (socket) {
//             socket.emit('typing', { complaintId, isTyping: false });
//         }
//     };

//     const handleEditMessage = async (messageId, newContent) => {
//         try {
//             await axios.patch(`/api/chat/enhanced/message/${messageId}/edit`, {
//                 message: newContent
//             });
//             setEditingMessage(null);
//         } catch (error) {
//             console.error('Error editing message:', error);
//             alert('Failed to edit message');
//         }
//     };

//     const handleDeleteMessage = async (messageId) => {
//         if (!window.confirm('Are you sure you want to delete this message?')) return;

//         try {
//             await axios.delete(`/api/chat/enhanced/message/${messageId}`);
//         } catch (error) {
//             console.error('Error deleting message:', error);
//             alert('Failed to delete message');
//         }
//     };

//     const handleFileUpload = async (e) => {
//         const file = e.target.files[0];
//         if (!file) return;

//         const formData = new FormData();
//         formData.append('file', file);
//         formData.append('complaintId', complaintId);

//         try {
//             await axios.post('/api/chat/enhanced/upload', formData, {
//                 headers: { 'Content-Type': 'multipart/form-data' }
//             });
//         } catch (error) {
//             console.error('Error uploading file:', error);
//             alert('Failed to upload file');
//         }
//     };

//     const getRoleColor = (role) => {
//         const colors = {
//             user: 'bg-blue-100 text-blue-800',
//             staff: 'bg-purple-100 text-purple-800',
//             admin: 'bg-red-100 text-red-800'
//         };
//         return colors[role] || 'bg-gray-100 text-gray-800';
//     };

//     const getRoleBadge = (role) => {
//         const badges = {
//             user: 'User',
//             staff: 'Staff',
//             admin: 'Admin'
//         };
//         return badges[role] || role;
//     };

//     if (loading) {
//         return (
//             <div className="flex items-center justify-center h-full">
//                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//             </div>
//         );
//     }

//     return (
//         <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
//             {/* Header */}
//             <div className="flex items-center justify-between p-4 border-b bg-gray-50">
//                 <div>
//                     <h2 className="text-lg font-bold text-gray-900">{complaint?.title}</h2>
//                     <div className="flex items-center gap-2 mt-1">
//                         <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
//                             complaint?.status === 'resolved' ? 'bg-green-100 text-green-800' :
//                             complaint?.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
//                             'bg-yellow-100 text-yellow-800'
//                         }`}>
//                             {complaint?.status}
//                         </span>
//                         <span className="text-xs text-gray-500">
//                             {complaint?.category}
//                         </span>
//                     </div>
//                 </div>
                
//                 {/* Participants */}
//                 <div className="flex items-center gap-2">
//                     <span className="text-sm text-gray-600">Participants:</span>
//                     <div className="flex -space-x-2">
//                         {participants.slice(0, 3).map((participant) => (
//                             <div
//                                 key={participant.id}
//                                 className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
//                                 title={participant.name}
//                             >
//                                 <span className="text-xs font-medium">
//                                     {participant.name.charAt(0).toUpperCase()}
//                                 </span>
//                             </div>
//                         ))}
//                         {participants.length > 3 && (
//                             <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center">
//                                 <span className="text-xs font-medium text-white">
//                                     +{participants.length - 3}
//                                 </span>
//                             </div>
//                         )}
//                     </div>
//                     {onClose && (
//                         <button
//                             onClick={onClose}
//                             className="ml-4 p-2 hover:bg-gray-200 rounded-full"
//                         >
//                             <X size={20} />
//                         </button>
//                     )}
//                 </div>
//             </div>

//             {/* Messages Container */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-4">
//                 {messages.length === 0 ? (
//                     <div className="flex flex-col items-center justify-center h-full text-gray-500">
//                         <User size={48} className="mb-2" />
//                         <p>No messages yet. Start the conversation!</p>
//                     </div>
//                 ) : (
//                     messages.map((message) => (
//                         <MessageBubble
//                             key={message._id}
//                             message={message}
//                             isOwnMessage={message.senderId._id === currentUser.id}
//                             currentUser={currentUser}
//                             onEdit={handleEditMessage}
//                             onDelete={handleDeleteMessage}
//                             editingMessage={editingMessage}
//                             setEditingMessage={setEditingMessage}
//                             getRoleColor={getRoleColor}
//                             getRoleBadge={getRoleBadge}
//                         />
//                     ))
//                 )}
//                 <div ref={messagesEndRef} />
                
//                 {/* Typing Indicator */}
//                 {typing && (
//                     <div className="flex items-center gap-2 text-sm text-gray-500 italic">
//                         <div className="flex gap-1">
//                             <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
//                             <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
//                             <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
//                         </div>
//                         <span>{typing} is typing...</span>
//                     </div>
//                 )}
//             </div>

//             {/* Input Area */}
//             <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
//                 <div className="flex items-end gap-2">
//                     <input
//                         type="file"
//                         id="file-upload"
//                         className="hidden"
//                         onChange={handleFileUpload}
//                     />
//                     <label
//                         htmlFor="file-upload"
//                         className="p-2 hover:bg-gray-200 rounded-full cursor-pointer transition-colors"
//                     >
//                         <Paperclip size={20} className="text-gray-600" />
//                     </label>

//                     <div className="flex-1 relative">
//                         <textarea
//                             value={newMessage}
//                             onChange={(e) => {
//                                 setNewMessage(e.target.value);
//                                 handleTyping();
//                             }}
//                             onBlur={handleStopTyping}
//                             placeholder="Type your message..."
//                             className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
//                             rows="2"
//                             onKeyPress={(e) => {
//                                 if (e.key === 'Enter' && !e.shiftKey) {
//                                     e.preventDefault();
//                                     handleSendMessage(e);
//                                 }
//                             }}
//                         />
//                     </div>

//                     <button
//                         type="submit"
//                         disabled={!newMessage.trim() || sending}
//                         className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                     >
//                         <Send size={20} />
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// };

// // Message Bubble Component
// const MessageBubble = ({ 
//     message, 
//     isOwnMessage, 
//     currentUser, 
//     onEdit, 
//     onDelete, 
//     editingMessage, 
//     setEditingMessage,
//     getRoleColor,
//     getRoleBadge
// }) => {
//     const [editContent, setEditContent] = useState(message.message);
//     const [showMenu, setShowMenu] = useState(false);

//     const handleSaveEdit = () => {
//         onEdit(message._id, editContent);
//     };

//     const handleCancelEdit = () => {
//         setEditContent(message.message);
//         setEditingMessage(null);
//     };

//     if (editingMessage === message._id) {
//         return (
//             <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
//                 <div className="max-w-md w-full">
//                     <textarea
//                         value={editContent}
//                         onChange={(e) => setEditContent(e.target.value)}
//                         className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                         rows="3"
//                     />
//                     <div className="flex gap-2 mt-2">
//                         <button
//                             onClick={handleSaveEdit}
//                             className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
//                         >
//                             <Check size={16} />
//                             Save
//                         </button>
//                         <button
//                             onClick={handleCancelEdit}
//                             className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
//                         >
//                             <X size={16} />
//                             Cancel
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
//             <div className={`max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
//                 {!isOwnMessage && (
//                     <div className="flex items-center gap-2 mb-1">
//                         <span className="text-sm font-medium text-gray-900">
//                             {message.senderId.name}
//                         </span>
//                         <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(message.senderModel.toLowerCase())}`}>
//                             {getRoleBadge(message.senderModel.toLowerCase())}
//                         </span>
//                     </div>
//                 )}
                
//                 <div className="relative group">
//                     <div className={`px-4 py-2 rounded-lg ${
//                         isOwnMessage
//                             ? 'bg-blue-600 text-white rounded-br-none'
//                             : 'bg-gray-100 text-gray-900 rounded-bl-none'
//                     }`}>
//                         <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
//                         {message.isEdited && (
//                             <span className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'} italic`}>
//                                 (edited)
//                             </span>
//                         )}
//                     </div>

//                     {/* Message Menu */}
//                     {isOwnMessage && (
//                         <div className="absolute top-0 right-0 -mr-8 opacity-0 group-hover:opacity-100 transition-opacity">
//                             <button
//                                 onClick={() => setShowMenu(!showMenu)}
//                                 className="p-1 hover:bg-gray-200 rounded"
//                             >
//                                 <MoreVertical size={16} />
//                             </button>
                            
//                             {showMenu && (
//                                 <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border z-10">
//                                     <button
//                                         onClick={() => {
//                                             setEditingMessage(message._id);
//                                             setShowMenu(false);
//                                         }}
//                                         className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-left text-sm"
//                                     >
//                                         <Edit2 size={14} />
//                                         Edit
//                                     </button>
//                                     <button
//                                         onClick={() => {
//                                             onDelete(message._id);
//                                             setShowMenu(false);
//                                         }}
//                                         className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-left text-sm text-red-600"
//                                     >
//                                         <Trash2 size={14} />
//                                         Delete
//                                     </button>
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </div>

//                 <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
//                     {new Date(message.createdAt).toLocaleTimeString([], { 
//                         hour: '2-digit', 
//                         minute: '2-digit' 
//                     })}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ComplaintChat;


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
            console.log('🔌 Connected to chat socket');
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
                senderName: currentUser.name // 🚀 Sending name to prevent DB lookups!
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

    // return (
    //     <div className="flex flex-col h-[600px] w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
    //         {/* Header */}
    //         <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
    //             <div>
    //                 <h2 className="text-lg font-bold">{complaintTitle || `Ticket #${complaintId.slice(-6).toUpperCase()}`}</h2>
    //                 <span className="px-2 py-0.5 mt-1 inline-block rounded-full bg-white/20 text-xs font-medium">
    //                     {complaintStatus || 'Active Chat'}
    //                 </span>
    //             </div>
    //             {onClose && (
    //                 <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
    //                     <X size={20} />
    //                 </button>
    //             )}
    //         </div>

    //         {/* Messages Container */}
    //         <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
    //             {messages.length === 0 ? (
    //                 <div className="flex flex-col items-center justify-center h-full text-gray-400">
    //                     <User size={48} className="mb-2 opacity-50" />
    //                     <p className="text-sm">No messages yet. Start the conversation!</p>
    //                 </div>
    //             ) : (
    //                 messages.map((msg) => {
    //                     // 🚀 PROPER FIX: Safely extract ID whether it's an object or a string
    //                     const messageSenderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
    //                     const currentUserId = currentUser.id || currentUser._id;
                        
    //                     // Safely check if it's our own message
    //                     const isOwnMessage = String(messageSenderId) === String(currentUserId);
                        
    //                     // Extract the real name
    //                     const displayName = typeof msg.senderId === 'object' ? msg.senderId.name : 'Unknown User';

    //                     return (
    //                         <div key={msg._id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
    //                             <div className={`max-w-[80%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                                    
    //                                 {!isOwnMessage && (
    //                                     <div className="flex items-center gap-2 mb-1 pl-1">
    //                                         <span className="text-xs font-bold text-gray-700">
    //                                             {displayName}
    //                                         </span>
    //                                         <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${getRoleColor(msg.senderModel)}`}>
    //                                             {msg.senderModel}
    //                                         </span>
    //                                     </div>
    //                                 )}
                                    
    //                                 <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
    //                                     isOwnMessage
    //                                         ? 'bg-blue-600 text-white rounded-tr-sm'
    //                                         : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
    //                                 }`}>
    //                                     <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
    //                                 </div>

    //                                 <div className={`text-[10px] text-gray-400 mt-1 px-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
    //                                     {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    //                                 </div>
    //                             </div>
    //                         </div>
    //                     );
    //                 })
    //             )}
    //             <div ref={messagesEndRef} />
    //         </div>

    //         {/* Input Area */}
    //         <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
    //             <div className="flex items-end gap-2">
    //                 <div className="flex-1 relative">
    //                     <textarea
    //                         value={newMessage}
    //                         onChange={(e) => setNewMessage(e.target.value)}
    //                         placeholder="Type your message..."
    //                         className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
    //                         rows="1"
    //                         onKeyDown={(e) => {
    //                             if (e.key === 'Enter' && !e.shiftKey) {
    //                                 e.preventDefault();
    //                                 handleSendMessage(e);
    //                             }
    //                         }}
    //                     />
    //                 </div>
    //                 <button
    //                     type="submit"
    //                     disabled={!newMessage.trim() || sending}
    //                     className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
    //                 >
    //                     <Send size={18} />
    //                 </button>
    //             </div>
    //         </form>
    //     </div>
    // );
    return (
        // 🚀 THE MAGIC TOGGLE: Changes shape based on where it lives!
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
                        // 🚀 PROPER FIX: Safely extract ID whether it's an object or a string
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