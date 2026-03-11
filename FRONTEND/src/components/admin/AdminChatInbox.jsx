import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Search, 
  MessageSquare, 
  Clock, 
  User, 
  Inbox,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ComplaintChat from "../chat/ComplaintChat"; // Adjust path if needed

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminChatInbox = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    const storedAdmin = localStorage.getItem("adminData") || localStorage.getItem("admin");
    if (storedAdmin) setAdminData(JSON.parse(storedAdmin));
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/chat/inbox`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setConversations(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching inbox:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ticketId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    // 🚀 Adjusted to fit inside your dashboard layout beautifully
    <div className="flex flex-col md:flex-row h-[75vh] min-h-[600px] w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      
      {/* LEFT SIDEBAR: LIST OF CHATS */}
      <div className="w-full md:w-1/3 lg:w-96 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Active Chats
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ticket ID or title..."
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-blue-500" />
              <p className="text-sm">Loading messages...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 px-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-medium text-gray-600">No active chats</p>
              <p className="text-xs mt-1">When staff send messages, they will appear here.</p>
            </div>
          ) : (
            filteredConversations.map((chat) => (
              <button
                key={chat.complaintId}
                onClick={() => setSelectedChat(chat)}
                className={`w-full p-4 flex items-start gap-3 border-b border-gray-100 transition-all text-left ${
                  selectedChat?.complaintId === chat.complaintId 
                    ? "bg-blue-50/80 border-l-4 border-l-blue-600" 
                    : "hover:bg-gray-100 border-l-4 border-l-transparent"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-700 font-bold text-xs border border-blue-200">
                  {chat.ticketId.slice(-3)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-white border border-blue-100 shadow-sm px-1.5 py-0.5 rounded">
                      #{chat.ticketId}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(chat.latestMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm truncate">{chat.title}</h4>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {chat.latestMessage}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] font-medium text-gray-500 bg-white w-fit px-2 py-0.5 rounded-full border border-gray-200">
                    <User className="w-3 h-3" />
                    Staff: {chat.assignedToName}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT SIDE: THE CHAT WINDOW */}
      <div className="flex-1 bg-white flex flex-col relative h-full">
        <AnimatePresence mode="wait">
          {selectedChat ? (
            <motion.div 
              key={selectedChat.complaintId}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="h-full w-full"
            >
               {/* 🚀 Rendering the exact same component, just telling it not to act like a modal */}
               <ComplaintChat 
                  complaintId={selectedChat.complaintId}
                  complaintTitle={selectedChat.title}
                  complaintStatus={selectedChat.status}
                  currentUser={{
                    id: adminData?.id || adminData?._id,
                    name: adminData?.name || "Admin",
                    role: 'admin'
                  }}
                  onClose={() => setSelectedChat(null)}
                  isModal={false} 
               />
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 bg-gray-50/50">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 border border-blue-100">
                <MessageSquare className="w-12 h-12 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-700">Master Inbox</h3>
              <p className="max-w-sm text-center text-sm mt-2 text-gray-500">
                Select an active conversation from the left sidebar to view the history and communicate directly with your field staff.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminChatInbox;