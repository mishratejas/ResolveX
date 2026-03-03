import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  ThumbsUp,
  MessageCircle,
  ExternalLink,
  Image as ImageIcon,
  Share2,
  Flag,
  X,
  AlertTriangle,
  Clock
} from "lucide-react";
import axios from "axios";
import ComplaintChat from "../../components/chat/ComplaintChat";

const ComplaintDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    loadComplaintDetails();
  }, [id]);

  const loadComplaintDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/user_issues/${id}`);

      if (response.data.success) {
        setComplaint(response.data.data);
      }
    } catch (error) {
      console.error("Error loading complaint:", error);
      alert("Failed to load complaint details");
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    try {
      setVoting(true);
      const token = localStorage.getItem("accessToken");
      const user = JSON.parse(localStorage.getItem("user"));

      if (!token || !user) {
        alert("Please login to vote");
        return;
      }

      if (complaint?.voters?.includes(user._id)) {
        alert("You have already voted for this issue!");
        return;
      }

      const response = await axios.put(
        `${BASE_URL}/api/user_issues/${id}/vote`,
        { userId: user._id },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setComplaint(response.data.data);
      }
    } catch (error) {
      console.error("Error voting:", error);
      alert(error.response?.data?.message || "Failed to vote");
    } finally {
      setVoting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 🔧 FIXED: Get priority color with badge
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // 🔧 FIXED: Format location for display
  const formatLocation = (location) => {
    if (!location) return 'Location not specified';
    
    // Handle object format
    if (typeof location === 'object') {
      return location.address || 'Location not specified';
    }
    
    // Handle string format (legacy)
    if (typeof location === 'string') {
      return location;
    }
    
    return 'Location not specified';
  };

  // 🔧 FIXED: Get location for Google Maps
  const getLocationForMaps = (location) => {
    if (!location) return '';
    
    if (typeof location === 'object') {
      if (location.latitude && location.longitude) {
        return `${location.latitude},${location.longitude}`;
      }
      return location.address || '';
    }
    
    return location;
  };

  const handleOpenChat = () => {
    if (!currentUser) {
      alert("Please login to access chat");
      return;
    }
    setShowChat(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Complaint Not Found
          </h2>
          <button
            onClick={() => navigate("/home")}
            className="text-blue-600 hover:text-blue-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}
                  >
                    {complaint.status?.toUpperCase()}
                  </span>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(complaint.priority)}`}>
                    {complaint.priority?.toUpperCase() || 'MEDIUM'}
                    {complaint.autoPriorityAssigned && ' 🤖'}
                  </span>
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  {complaint.title}
                </h1>
                <div className="flex items-center gap-4 text-sm opacity-90">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {complaint.user?.name || "Anonymous"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Priority Information Banner */}
            {complaint.autoPriorityAssigned && (
              <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">🤖 AI Priority Assignment</h4>
                    <p className="text-sm text-gray-700">
                      This complaint's priority level was automatically analyzed and assigned by our AI system 
                      based on urgency, impact, and severity factors.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Description
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {complaint.description}
              </p>
            </div>

            {/* Location - FIXED */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Location
              </h3>
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-gray-700">{formatLocation(complaint.location)}</p>
                  
                  {/* Show GPS coordinates if available */}
                  {typeof complaint.location === 'object' && 
                   complaint.location.latitude && 
                   complaint.location.longitude && (
                    <p className="text-xs text-gray-500 mt-1">
                      GPS: {complaint.location.latitude.toFixed(6)}, {complaint.location.longitude.toFixed(6)}
                    </p>
                  )}

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getLocationForMaps(complaint.location))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mt-1"
                  >
                    View on Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Images */}
            {complaint.images && complaint.images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Images
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {complaint.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Complaint ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />

                      <a
                        href={image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <ImageIcon className="w-8 h-8 text-white" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category & Priority Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">
                  Category
                </h3>
                <p className="text-gray-900 capitalize">{complaint.category}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">
                  Priority Level
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 capitalize font-medium">
                    {complaint.priority || "Medium"}
                  </p>
                  {complaint.autoPriorityAssigned && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      AI-Assigned
                    </span>
                  )}
                  {complaint.manualPriorityOverridden && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                      Admin Override
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Engagement Stats */}
            <div className="flex items-center gap-6 py-4 border-t border-b border-gray-200">
              <button
                onClick={handleVote}
                disabled={voting}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                <ThumbsUp className="w-5 h-5" />
                <span className="font-semibold">
                  {complaint.voteCount || 0}
                </span>
                <span className="text-sm">Votes</span>
              </button>
              <div className="flex items-center gap-2 text-gray-600">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold">
                  {complaint.comments?.length || 0}
                </span>
                <span className="text-sm">Comments</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-4">
              <motion.button
                onClick={handleOpenChat}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                Open Chat
              </motion.button>

              <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-red-600">
                <Flag className="w-4 h-4" />
                Report Issue
              </button>
            </div>
          </div>
        </div>

        {/* Chat Modal */}
        {showChat && currentUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowChat(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl h-[600px] bg-white rounded-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-cyan-500">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-6 h-6 text-white" />
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Complaint Discussion
                    </h3>
                    <p className="text-sm text-white/80 truncate max-w-md">
                      {complaint.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="h-[calc(100%-73px)]">
                <ComplaintChat
                  complaintId={complaint._id}
                  currentUser={{
                    id: currentUser._id || currentUser.id,
                    name: currentUser.name,
                    role: currentUser.role || "user",
                  }}
                  onClose={() => setShowChat(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Floating Chat Button */}
        {!showChat && currentUser && (
          <motion.button
            onClick={handleOpenChat}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-40"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default ComplaintDetailPage;