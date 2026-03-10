import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Calendar, User, ThumbsUp,
  ExternalLink, Image as ImageIcon, AlertTriangle, Clock, CheckCircle
} from "lucide-react";
import axios from "axios";

const ComplaintDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => { loadComplaintDetails(); }, [id]);

  const loadComplaintDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/user_issues/${id}`);
      if (response.data.success) {
        const data = response.data.data;
        setComplaint(data);
        // Check if current user already voted
        const userId = currentUser?.id || currentUser?._id;
        if (userId && data.voters?.includes(userId)) {
          setAlreadyVoted(true);
        }
      }
    } catch (error) {
      console.error("Error loading complaint:", error);
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!currentUser) { alert("Please login to vote"); return; }
    const userId = currentUser?.id || currentUser?._id;
    const isOwner = complaint?.user?._id === userId || complaint?.user === userId;
    if (isOwner) { alert("You cannot vote on your own complaint"); return; }
    if (alreadyVoted) { alert("You have already voted for this issue!"); return; }

    try {
      setVoting(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.put(
        `${BASE_URL}/api/user_issues/${id}/vote`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setComplaint(response.data.data);
        setAlreadyVoted(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to vote");
    } finally {
      setVoting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-blue-100 text-blue-800";
      case "in-progress": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      case "low": return "bg-green-500 text-white";
      default: return "bg-gray-400 text-white";
    }
  };

  const formatLocation = (location) => {
    if (!location) return "Location not specified";
    if (typeof location === "object") return location.address || "Location not specified";
    return location;
  };

  const getMapsLink = (location) => {
    if (!location) return "";
    if (typeof location === "object" && location.latitude && location.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      typeof location === "object" ? location.address : location
    )}`;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : "N/A";

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Not Found</h2>
          <button onClick={() => navigate("/home")} className="text-blue-600 hover:text-blue-800 font-medium">← Go Back</button>
        </div>
      </div>
    );
  }

  const userId = currentUser?.id || currentUser?._id;
  const isOwner = complaint?.user?._id === userId || complaint?.user === userId;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Hero */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(complaint.status)}`}>
                {complaint.status?.toUpperCase()}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityBadge(complaint.priority)}`}>
                {complaint.priority?.toUpperCase() || "MEDIUM"}
                {complaint.autoPriorityAssigned && " 🤖"}
              </span>
              {complaint.category && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                  {complaint.category}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">{complaint.title}</h1>
            <div className="flex flex-wrap items-center gap-5 text-sm text-white/85">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {formatDate(complaint.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" /> {complaint.user?.name || "Anonymous"}
              </span>
              {complaint.status === "resolved" && complaint.resolvedAt && (
                <span className="flex items-center gap-1.5 bg-green-500/30 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-4 h-4" /> Resolved {formatDate(complaint.resolvedAt)}
                </span>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* AI Priority Banner */}
            {complaint.autoPriorityAssigned && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">🤖 AI Priority Assignment</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Priority was auto-assigned by AI based on urgency, impact, and severity.
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
            </div>

            {/* Images */}
            {complaint.images?.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Attached Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {complaint.images.map((img, i) => (
                    <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="group relative block">
                      <img src={img} alt={`Evidence ${i + 1}`} className="w-full h-40 object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <ImageIcon className="w-7 h-7 text-white" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Location</h3>
              <div className="flex items-start gap-2 text-gray-700">
                <MapPin className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{formatLocation(complaint.location)}</p>
                  {typeof complaint.location === "object" && complaint.location?.latitude && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {complaint.location.latitude.toFixed(6)}, {complaint.location.longitude.toFixed(6)}
                    </p>
                  )}
                  {getMapsLink(complaint.location) && (
                    <a
                      href={getMapsLink(complaint.location)}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mt-1"
                    >
                      View on Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 border-t border-gray-100">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</p>
                <p className="mt-1 text-gray-900 capitalize">{complaint.category || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <p className="text-gray-900 capitalize">{complaint.priority || "Medium"}</p>
                  {complaint.manualPriorityOverridden && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">Override</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Workspace</p>
                <p className="mt-1 text-gray-900">{complaint.adminId?.name || "—"}</p>
              </div>
            </div>

            {/* Vote section */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleVote}
                  disabled={voting || alreadyVoted || isOwner}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
                    alreadyVoted
                      ? "bg-green-100 text-green-700 cursor-default"
                      : isOwner
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                  }`}
                >
                  {voting ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ThumbsUp className={`w-4 h-4 ${alreadyVoted ? "fill-current" : ""}`} />
                  )}
                  <span>{complaint.voteCount || 0} {alreadyVoted ? "Voted" : isOwner ? "Your Issue" : "Upvote"}</span>
                </button>
                {alreadyVoted && (
                  <p className="text-sm text-green-600 font-medium">✓ Thanks for your support!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailPage;
