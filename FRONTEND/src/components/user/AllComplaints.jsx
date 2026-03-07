import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  ThumbsUp,
  MessageCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Plus,
  RefreshCw,
  AlertCircle,
  Building2,
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

  // Get current user
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
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

  // 🔧 FIXED: Load complaints for current workspace only
  const loadComplaints = useCallback(async () => {
    try {
      setLoading(true);

      // Get current workspace
      const currentWorkspace = JSON.parse(
        localStorage.getItem("currentWorkspace") || "null",
      );

      if (!currentWorkspace) {
        toast.error("Please select a workspace first");
        setComplaints([]);
        setFilteredComplaints([]);
        setLoading(false);
        return;
      }

      console.log("📡 Fetching complaints for workspace:", currentWorkspace.id);

      // Always include workspaceId in request
      const response = await axios.get(`${BASE_URL}/api/user_issues`, {
        params: {
          workspaceId: currentWorkspace.id,
        },
      });

      console.log("✅ Complaints response:", response.data);

      if (response.data.success) {
        const complaintsData = response.data.data || [];
        setComplaints(complaintsData);
        setFilteredComplaints(complaintsData);
      } else {
        setComplaints([]);
        setFilteredComplaints([]);
      }
    } catch (error) {
      console.error("❌ Error loading complaints:", error);

      // Handle specific error cases
      if (error.response?.status === 400) {
        toast.error("Invalid workspace. Please select a valid workspace.");
      } else if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Failed to load complaints");
      }

      setComplaints([]);
      setFilteredComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [BASE_URL]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // Debounced filter function
  const debouncedFilter = useCallback(
    debounce(() => {
      let filtered = [...complaints];

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (complaint) =>
            complaint.title?.toLowerCase().includes(query) ||
            complaint.description?.toLowerCase().includes(query) ||
            complaint.category?.toLowerCase().includes(query),
        );
      }

      if (selectedStatus !== "all") {
        filtered = filtered.filter(
          (complaint) => complaint.status === selectedStatus,
        );
      }

      if (selectedCategory !== "all") {
        filtered = filtered.filter(
          (complaint) => complaint.category === selectedCategory,
        );
      }

      if (selectedDateRange !== "all") {
        const now = new Date();
        let startDate = new Date();

        switch (selectedDateRange) {
          case "today":
            startDate.setHours(0, 0, 0, 0);
            break;
          case "week":
            startDate.setDate(now.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(now.getMonth() - 1);
            break;
        }

        filtered = filtered.filter(
          (complaint) =>
            complaint.createdAt && new Date(complaint.createdAt) >= startDate,
        );
      }

      setFilteredComplaints(filtered);
    }, 300),
    [
      complaints,
      searchQuery,
      selectedStatus,
      selectedCategory,
      selectedDateRange,
    ],
  );

  useEffect(() => {
    debouncedFilter();
    return () => debouncedFilter.cancel();
  }, [debouncedFilter]);

  // 🔧 FIXED: Vote handling with proper checks
  const handleVote = async (complaintId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const userData = JSON.parse(localStorage.getItem("user"));

      if (!token || !userData) {
        toast.error("Please login to vote");
        return;
      }

      const userId = userData?.id || userData?._id;

      // Find the complaint
      const complaint = complaints.find((c) => c._id === complaintId);
      if (!complaint) return;

      // Check if user is the owner
      const complaintUserId = complaint.user?._id || complaint.user;
      if (complaintUserId === userId) {
        toast.error("You cannot vote on your own complaint");
        return;
      }

      // Check if user already voted
      if (complaint.voters?.includes(userId)) {
        toast.error("You have already voted for this issue!");
        return;
      }

      setVoting((prev) => ({ ...prev, [complaintId]: true }));

      const response = await axios.put(
        `${BASE_URL}/api/user_issues/${complaintId}/vote`,
        { userId: userId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        // Update local state
        setComplaints((prev) =>
          prev.map((c) =>
            c._id === complaintId
              ? {
                  ...c,
                  voteCount: response.data.data.voteCount,
                  voters: [...(c.voters || []), userId],
                }
              : c,
          ),
        );
        toast.success("Vote added successfully!");
      }
    } catch (error) {
      console.error("Error voting:", error);

      if (error.response?.status === 401) {
        localStorage.clear();
        toast.error("Session expired. Please login again.");
        navigate("/");
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || "You have already voted!");
      } else {
        toast.error("Failed to vote. Please try again.");
      }
    } finally {
      setVoting((prev) => ({ ...prev, [complaintId]: false }));
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Check if user can vote on a complaint
  const canVote = (complaint) => {
    if (!user) return false;
    const userId = user?.id || user?._id;
    const complaintUserId = complaint.user?._id || complaint.user;

    // Can't vote on own complaint
    if (complaintUserId === userId) return false;

    // Can't vote if already voted
    if (complaint.voters?.includes(userId)) return false;

    return true;
  };

  // Get vote button text
  const getVoteButtonText = (complaint) => {
    if (!user) return "Login to Vote";
    const userId = user?.id || user?._id;

    if (complaint.user?._id === userId || complaint.user === userId) {
      return "Your Complaint";
    }
    if (complaint.voters?.includes(userId)) {
      return "Voted";
    }
    return "Vote";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Community Issues
            </h1>
            <p className="text-gray-600 mt-1">
              View and engage with complaints in your workspace
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/home/raise-complaint")}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Report New Issue
            </button>
            <button
              onClick={loadComplaints}
              className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh complaints"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search complaints by title, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            />
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <select
                    value={selectedDateRange}
                    onChange={(e) => setSelectedDateRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  >
                    {dateRanges.map((range) => (
                      <option key={range.id} value={range.id}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Toggle */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredComplaints.length} of {complaints.length}{" "}
            complaints
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {complaints.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {complaints.filter((c) => c.status === "pending").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {complaints.filter((c) => c.status === "in-progress").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Resolved</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {complaints.filter((c) => c.status === "resolved").length}
          </p>
        </div>
      </div>

      {/* Complaints Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredComplaints.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredComplaints.map((complaint, index) => {
            const userId = user?.id || user?._id;
            const isOwnComplaint =
              complaint.user?._id === userId || complaint.user === userId;
            const hasVoted = complaint.voters?.includes(userId);

            return (
              <motion.div
                key={complaint._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                onClick={() => navigate(`/complaints/${complaint._id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}
                        >
                          {complaint.status?.charAt(0).toUpperCase() +
                            complaint.status?.slice(1) || "Unknown"}
                        </span>
                        <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {complaint.category || "Uncategorized"}
                        </span>
                        {/* Show workspace badge */}
                        {complaint.adminId && (
                          <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {complaint.adminId.name ||
                              complaint.adminId.workspaceCode ||
                              "Workspace"}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {complaint.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {complaint.description}
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {complaint.location?.address || // Use address first
                          (complaint.location?.city
                            ? `${complaint.location.city}, ${complaint.location.state}`
                            : "") ||
                          complaint.location ||
                          "Location not specified"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(complaint.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(complaint._id);
                        }}
                        disabled={
                          voting[complaint._id] ||
                          !user ||
                          isOwnComplaint ||
                          hasVoted
                        }
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          isOwnComplaint
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : hasVoted
                              ? "bg-green-100 text-green-600 cursor-default"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        }`}
                        title={
                          isOwnComplaint
                            ? "You cannot vote on your own complaint"
                            : hasVoted
                              ? "You have already voted"
                              : "Vote for this complaint"
                        }
                      >
                        {voting[complaint._id] ? (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ThumbsUp
                            className={`w-4 h-4 ${hasVoted ? "fill-current" : ""}`}
                          />
                        )}
                        <span className="font-medium">
                          {complaint.voteCount || 0}
                        </span>
                        <span>{getVoteButtonText(complaint)}</span>
                      </button>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg">
                        <MessageCircle className="w-4 h-4" />
                        <span>{complaint.comments?.length || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/complaints/${complaint._id}`);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No complaints found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or search query
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedStatus("all");
              setSelectedCategory("all");
              setSelectedDateRange("all");
            }}
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
