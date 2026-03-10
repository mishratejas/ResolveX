import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Calendar, MapPin, ThumbsUp, Eye,
  ChevronDown, ChevronUp, Plus, RefreshCw, AlertCircle, Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import debounce from "lodash/debounce";
import { toast } from "react-hot-toast";

const AllComplaints = ({ currentUser }) => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [voting, setVoting] = useState({});
  const [user, setUser] = useState(null);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const categories = [
    { id: "all", label: "All Categories" },
    { id: "road", label: "Road & Infrastructure" },
    { id: "sanitation", label: "Sanitation & Waste" },
    { id: "water", label: "Water Supply" },
    { id: "electricity", label: "Electricity" },
    { id: "security", label: "Security" },
    { id: "transport", label: "Transport" },
    { id: "other", label: "Other" },
  ];

  const statusOptions = [
    { id: "all", label: "All Status" },
    { id: "pending", label: "Pending" },
    { id: "in-progress", label: "In Progress" },
    { id: "resolved", label: "Resolved" },
  ];

  const dateRanges = [
    { id: "all", label: "All Time" },
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
  ];

  const loadComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const currentWorkspace = JSON.parse(localStorage.getItem("currentWorkspace") || "null");
      if (!currentWorkspace) {
        toast.error("Please select a workspace first");
        setComplaints([]);
        setFilteredComplaints([]);
        setLoading(false);
        return;
      }
      const response = await axios.get(`${BASE_URL}/api/user_issues`, {
        params: { workspaceId: currentWorkspace.id },
      });
      if (response.data.success) {
        const data = response.data.data || [];
        setComplaints(data);
        setFilteredComplaints(data);
      } else {
        setComplaints([]);
        setFilteredComplaints([]);
      }
    } catch (error) {
      console.error("Error loading complaints:", error);
      if (error.response?.status === 400) toast.error("Invalid workspace. Please select a valid workspace.");
      else if (error.response?.status === 401) toast.error("Session expired. Please login again.");
      else toast.error("Failed to load complaints");
      setComplaints([]);
      setFilteredComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [BASE_URL]);

  useEffect(() => { loadComplaints(); }, [loadComplaints]);

  // Re-run load whenever workspace is selected or user logs in
  useEffect(() => {
    const handler = () => {
      // Small delay to ensure localStorage is written first
      setTimeout(() => loadComplaints(), 100);
    };
    window.addEventListener("workspaceSelected", handler);
    window.addEventListener("userLogin", handler);
    return () => {
      window.removeEventListener("workspaceSelected", handler);
      window.removeEventListener("userLogin", handler);
    };
  }, [loadComplaints]);

  const debouncedFilter = useCallback(
    debounce(() => {
      let filtered = [...complaints];
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((c) =>
          c.title?.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.category?.toLowerCase().includes(query)
        );
      }
      if (selectedStatus !== "all") filtered = filtered.filter((c) => c.status === selectedStatus);
      if (selectedCategory !== "all") filtered = filtered.filter((c) => c.category === selectedCategory);
      if (selectedDateRange !== "all") {
        const now = new Date();
        let startDate = new Date();
        if (selectedDateRange === "today") startDate.setHours(0, 0, 0, 0);
        else if (selectedDateRange === "week") startDate.setDate(now.getDate() - 7);
        else if (selectedDateRange === "month") startDate.setMonth(now.getMonth() - 1);
        filtered = filtered.filter((c) => c.createdAt && new Date(c.createdAt) >= startDate);
      }
      setFilteredComplaints(filtered);
    }, 300),
    [complaints, searchQuery, selectedStatus, selectedCategory, selectedDateRange]
  );

  useEffect(() => {
    debouncedFilter();
    return () => debouncedFilter.cancel();
  }, [debouncedFilter]);

  const handleVote = async (complaintId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!token || !userData) { toast.error("Please login to vote"); return; }
      const userId = userData?.id || userData?._id;
      const complaint = complaints.find((c) => c._id === complaintId);
      if (!complaint) return;
      const complaintUserId = complaint.user?._id || complaint.user;
      if (complaintUserId === userId) { toast.error("You cannot vote on your own complaint"); return; }
      if (complaint.voters?.includes(userId)) { toast.error("You have already voted for this issue!"); return; }
      setVoting((prev) => ({ ...prev, [complaintId]: true }));
      const response = await axios.put(
        `${BASE_URL}/api/user_issues/${complaintId}/vote`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setComplaints((prev) =>
          prev.map((c) =>
            c._id === complaintId
              ? { ...c, voteCount: response.data.data.voteCount, voters: [...(c.voters || []), userId] }
              : c
          )
        );
        toast.success("Vote added successfully!");
      }
    } catch (error) {
      if (error.response?.status === 401) { localStorage.clear(); toast.error("Session expired."); navigate("/"); }
      else if (error.response?.status === 400) toast.error(error.response.data.message || "You have already voted!");
      else toast.error("Failed to vote. Please try again.");
    } finally {
      setVoting((prev) => ({ ...prev, [complaintId]: false }));
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getVoteButtonText = (complaint) => {
    if (!user) return "Login to Vote";
    const userId = user?.id || user?._id;
    if (complaint.user?._id === userId || complaint.user === userId) return "Your Complaint";
    if (complaint.voters?.includes(userId)) return "Voted";
    return "Vote";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Community Issues</h1>
            <p className="text-gray-600 mt-1">View and engage with complaints in your workspace</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/home/raise-complaint")}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Report New Issue
            </button>
            <button onClick={loadComplaints} className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search complaints by title, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                {[
                  { label: "Status", value: selectedStatus, onChange: setSelectedStatus, options: statusOptions },
                  { label: "Category", value: selectedCategory, onChange: setSelectedCategory, options: categories },
                  { label: "Date Range", value: selectedDateRange, onChange: setSelectedDateRange, options: dateRanges },
                ].map(({ label, value, onChange, options }) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                    <select
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Showing {filteredComplaints.length} of {complaints.length} complaints
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", count: complaints.length },
          { label: "Pending", count: complaints.filter((c) => c.status === "pending").length },
          { label: "In Progress", count: complaints.filter((c) => c.status === "in-progress").length },
          { label: "Resolved", count: complaints.filter((c) => c.status === "resolved").length },
        ].map(({ label, count }) => (
          <div key={label} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
          </div>
        ))}
      </div>

      {/* Complaints Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredComplaints.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredComplaints.map((complaint, index) => {
            const userId = user?.id || user?._id;
            const isOwnComplaint = complaint.user?._id === userId || complaint.user === userId;
            const hasVoted = complaint.voters?.includes(userId);

            return (
              <motion.div
                key={complaint._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                onClick={() => navigate(`/home/complaints/${complaint._id}`)}
              >
                <div className="p-6">
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                      {complaint.status?.charAt(0).toUpperCase() + complaint.status?.slice(1) || "Unknown"}
                    </span>
                    <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {complaint.category || "Uncategorized"}
                    </span>
                    {complaint.adminId && (
                      <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {complaint.adminId.name || complaint.adminId.workspaceCode || "Workspace"}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{complaint.title}</h3>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{complaint.description}</p>

                  {/* Location & Date */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {complaint.location?.address || complaint.location || "Location not specified"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(complaint.createdAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleVote(complaint._id); }}
                      disabled={voting[complaint._id] || !user || isOwnComplaint || hasVoted}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50 ${
                        isOwnComplaint
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : hasVoted
                          ? "bg-green-100 text-green-600 cursor-default"
                          : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      }`}
                    >
                      {voting[complaint._id] ? (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ThumbsUp className={`w-4 h-4 ${hasVoted ? "fill-current" : ""}`} />
                      )}
                      <span className="font-medium">{complaint.voteCount || 0}</span>
                      <span>{getVoteButtonText(complaint)}</span>
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/home/complaints/${complaint._id}`); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No complaints found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your filters or search query</p>
          <button
            onClick={() => { setSearchQuery(""); setSelectedStatus("all"); setSelectedCategory("all"); setSelectedDateRange("all"); }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default AllComplaints;
