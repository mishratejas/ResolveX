import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Award,
  TrendingUp,
  Target,
  BarChart3,
  ThumbsUp,
  MessageCircle,
  Eye,
  ExternalLink,
  Download,
  Building2,
  Users,
  LogOut,
  Plus,
  Copy,
  Check,
  X,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Profile = ({ currentUser }) => {
  const [userData, setUserData] = useState(null);
  const [userComplaints, setUserComplaints] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showJoinWorkspace, setShowJoinWorkspace] = useState(false);
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
  const [monthlyActivity, setMonthlyActivity] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [userRank, setUserRank] = useState(null);

  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    if (!loading) {
      if (workspaces.length > 0) {
        const currentWorkspace = localStorage.getItem("currentWorkspace");
        if (!currentWorkspace) {
          // If user has workspaces but no workspace selected, show workspace selector
          navigate("/user/select-workspace");
        }
      }
      // If no workspaces, stay on profile to show join form
    }
  }, [loading, workspaces, navigate]);

  useEffect(() => {
    if (currentUser) {
      loadUserData();
      loadUserWorkspaces();
      loadUserActivity();
      loadUserAchievements();
      loadUserRank();
    }
  }, [currentUser]);

const loadUserData = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("accessToken");
    const currentWorkspace = JSON.parse(localStorage.getItem('currentWorkspace'));

    // Load user's profile
    const profileRes = await axios.get(`${BASE_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (profileRes.data.success) {
      setUserData(profileRes.data.data);
    }

    // Load user's complaints - filtered by current workspace
    const workspaceParam = currentWorkspace?.id ? `?workspaceId=${currentWorkspace.id}` : '';
    const complaintsRes = await axios.get(`${BASE_URL}/api/user_issues/my${workspaceParam}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (complaintsRes.data.success) {
      setUserComplaints(complaintsRes.data.data || []);
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    toast.error("Failed to load user data");
  } finally {
    setLoading(false);
  }
};

  const loadUserWorkspaces = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/api/users/my-workspaces`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setWorkspaces(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading workspaces:", error);
      toast.error("Failed to load workspaces");
    }
  };

  const loadUserActivity = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      // You'll need to create this endpoint
      const response = await axios.get(
        `${BASE_URL}/api/users/activity/monthly`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setMonthlyActivity(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading activity:", error);
      // Don't show toast for this as it's not critical
      setMonthlyActivity([]);
    }
  };

  const loadUserAchievements = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      // You'll need to create this endpoint
      const response = await axios.get(`${BASE_URL}/api/users/achievements`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setAchievements(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading achievements:", error);
      setAchievements([]);
    }
  };

  const loadUserRank = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      // You'll need to create this endpoint
      const response = await axios.get(`${BASE_URL}/api/users/rank`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setUserRank(response.data.data);
      }
    } catch (error) {
      console.error("Error loading rank:", error);
      setUserRank(null);
    }
  };

  const handleJoinWorkspace = async (e) => {
    e.preventDefault();
    if (!workspaceCode.trim()) {
      toast.error("Please enter a workspace code");
      return;
    }

    setWorkspaceLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${BASE_URL}/api/users/join-workspace`,
        { workspaceCode: workspaceCode.trim().toUpperCase() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setWorkspaceCode("");
        setShowJoinWorkspace(false);
        await loadUserWorkspaces();

        // Update user data in localStorage
        const userDataStr = localStorage.getItem("user");
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          userData.joinedWorkspaces = response.data.data.joinedWorkspaces;
          localStorage.setItem("user", JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error("Error joining workspace:", error);
      toast.error(error.response?.data?.message || "Failed to join workspace");
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleLeaveWorkspace = async (workspaceId, workspaceName) => {
    if (workspaces.length <= 1) {
      toast.error(
        "You must be in at least one workspace. Join another workspace before leaving this one.",
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to leave ${workspaceName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${BASE_URL}/api/users/leave-workspace/${workspaceId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success(response.data.message);
        await loadUserWorkspaces();

        // Update user data in localStorage
        const userDataStr = localStorage.getItem("user");
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          userData.joinedWorkspaces = response.data.data.joinedWorkspaces;
          localStorage.setItem("user", JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error("Error leaving workspace:", error);
      toast.error(error.response?.data?.message || "Failed to leave workspace");
    }
  };

  const handleSwitchWorkspace = (workspace) => {
    // Store current workspace in localStorage as object
    const workspaceData = {
      id: workspace._id,
      name: workspace.organizationName,
      code: workspace.workspaceCode,
      email: workspace.email,
    };

    localStorage.setItem("currentWorkspace", JSON.stringify(workspaceData));

    // Navigate to home/dashboard
    navigate("/home");
  };
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success("Workspace code copied!");
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "rejected":
        return "bg-red-100 text-red-800";
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

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate user stats dynamically
  const userStats = React.useMemo(() => {
    if (!userComplaints?.length)
      return {
        total: 0,
        resolved: 0,
        pending: 0,
        inProgress: 0,
        rejected: 0,
        totalVotes: 0,
        totalComments: 0,
        resolutionRate: 0,
      };

    const total = userComplaints.length;
    const resolved = userComplaints.filter(
      (c) => c.status?.toLowerCase() === "resolved",
    ).length;
    const pending = userComplaints.filter(
      (c) => c.status?.toLowerCase() === "pending",
    ).length;
    const inProgress = userComplaints.filter((c) =>
      ["in-progress", "in_progress"].includes(c.status?.toLowerCase()),
    ).length;
    const rejected = userComplaints.filter(
      (c) => c.status?.toLowerCase() === "rejected",
    ).length;
    const totalVotes = userComplaints.reduce(
      (sum, c) => sum + (c.voteCount || 0),
      0,
    );
    const totalComments = userComplaints.reduce(
      (sum, c) => sum + (c.comments?.length || 0),
      0,
    );
    const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;

    return {
      total,
      resolved,
      pending,
      inProgress,
      rejected,
      totalVotes,
      totalComments,
      resolutionRate,
    };
  }, [userComplaints]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {userData?.profileImage ? (
              <img
                src={userData.profileImage}
                alt={userData.name}
                className="w-24 h-24 rounded-full border-4 border-white/30 object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-white/20 to-white/10 rounded-full border-4 border-white/30 flex items-center justify-center text-white text-3xl font-bold">
                {userData?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  {userData?.name || "User"}
                </h1>
                <div className="flex flex-wrap gap-4 text-white/90">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{userData?.email}</span>
                  </div>
                  {userData?.phone && (
                    <div className="flex items-center gap-2">
                      <span>•</span>
                      <span>{userData.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(userData?.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="bg-white/20 px-2 py-1 rounded-full text-sm capitalize">
                      {userData?.role || "User"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/user/profile/edit")}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>

            {/* User Address */}
            {userData?.address && (
              <div className="mt-4 flex items-center gap-2 text-white/80">
                <MapPin className="w-4 h-4" />
                <span>
                  {[
                    userData.address.street,
                    userData.address.city,
                    userData.address.state,
                    userData.address.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Workspaces Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Your Workspaces
              </h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {workspaces.length}{" "}
                {workspaces.length === 1 ? "Workspace" : "Workspaces"}
              </span>
            </div>
            <button
              onClick={() => setShowJoinWorkspace(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Join Workspace
            </button>
          </div>
        </div>

        {/* Join Workspace Form */}
        {showJoinWorkspace && (
          <div className="p-6 bg-blue-50 border-b border-blue-200">
            <form
              onSubmit={handleJoinWorkspace}
              className="flex flex-col md:flex-row gap-4"
            >
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter Workspace Code
                </label>
                <input
                  type="text"
                  value={workspaceCode}
                  onChange={(e) =>
                    setWorkspaceCode(e.target.value.toUpperCase())
                  }
                  placeholder="e.g., ABC123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  disabled={workspaceLoading}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ask your workspace admin for the code
                </p>
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={workspaceLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {workspaceLoading ? "Joining..." : "Join"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinWorkspace(false);
                    setWorkspaceCode("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Workspaces List */}
        <div className="divide-y divide-gray-200">
          {workspaces.length > 0 ? (
            workspaces.map((workspace) => (
              <div
                key={workspace._id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      {workspace.profileImage ? (
                        <img
                          src={workspace.profileImage}
                          alt={workspace.organizationName}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {workspace.organizationName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span>{workspace.email}</span>
                        </div>
                        {workspace.phone && (
                          <div className="flex items-center gap-1">
                            <span>•</span>
                            <span>{workspace.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-mono">
                          Code: {workspace.workspaceCode}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(workspace.workspaceCode)
                          }
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Copy code"
                        >
                          {copiedCode === workspace.workspaceCode ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                      {workspace.createdAt && (
                        <p className="text-xs text-gray-400 mt-2">
                          Member since {formatDate(workspace.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSwitchWorkspace(workspace)}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-sm"
                    >
                      Switch
                    </button>
                    <button
                      onClick={() =>
                        handleLeaveWorkspace(
                          workspace._id,
                          workspace.organizationName,
                        )
                      }
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Leave workspace"
                      disabled={workspaces.length <= 1}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No workspaces joined yet
              </h3>
              <p className="text-gray-600 mb-4">
                Join a workspace to start reporting and tracking issues in your
                community
              </p>
              <button
                onClick={() => setShowJoinWorkspace(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Join Your First Workspace
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Issues Submitted</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {userStats.total}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {userStats.resolved} resolved • {userStats.pending} pending •{" "}
            {userStats.inProgress} in progress
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolution Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {userStats.resolutionRate.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${userStats.resolutionRate}%` }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Community Impact</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {userStats.totalVotes}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {userStats.totalComments} comments received
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Workspaces</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {workspaces.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Active in {workspaces.length}{" "}
            {workspaces.length === 1 ? "community" : "communities"}
          </div>
        </motion.div>
      </div>

      {/* User's Issues */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Your Submitted Issues
            </h3>
            <div className="flex items-center gap-4">
              <select
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                onChange={(e) => {
                  // Handle filtering
                  const value = e.target.value;
                  // You can implement filtering logic here
                }}
              >
                <option value="all">All Issues</option>
                <option value="resolved">Resolved</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("accessToken");
                    const response = await axios.get(
                      `${BASE_URL}/api/user_issues/export`,
                      {
                        headers: { Authorization: `Bearer ${token}` },
                        responseType: "blob",
                      },
                    );

                    // Create download link
                    const url = window.URL.createObjectURL(
                      new Blob([response.data]),
                    );
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", "my-issues.csv");
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  } catch (error) {
                    console.error("Error exporting issues:", error);
                    toast.error("Failed to export issues");
                  }
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      Workspace 
    </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Votes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
  {userComplaints.slice(0, 10).map((complaint) => (
    <tr key={complaint._id} className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-gray-900">{complaint.title}</p>
          <p className="text-sm text-gray-500 truncate max-w-xs">
            {complaint.description}
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        {/* NEW: Workspace column */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <div>
            <span className="text-sm font-medium text-gray-900">
              {complaint.adminId?.organizationName || complaint.adminId?.name || 'Unknown Workspace'}
            </span>
            {complaint.adminId?.workspaceCode && (
              <div className="text-xs text-gray-500">
                Code: {complaint.adminId.workspaceCode}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
          {complaint.status ? complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1).replace("_", "-") : "Unknown"}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-900 capitalize">
          {complaint.category || "Uncategorized"}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          {formatDate(complaint.createdAt)}
        </div>
        {complaint.updatedAt && complaint.updatedAt !== complaint.createdAt && (
          <div className="text-xs text-gray-500">
            Updated {formatDate(complaint.updatedAt)}
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4 text-blue-500" />
            <span className="font-medium">{complaint.voteCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{complaint.comments?.length || 0}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/user/issues/${complaint._id}`)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const url = `${window.location.origin}/issue/${complaint._id}`;
              navigator.clipboard.writeText(url);
              toast.success("Link copied to clipboard!");
            }}
            className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Copy link"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>

        {userComplaints.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No issues submitted yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start contributing to your community by reporting issues
            </p>
            <button
              onClick={() => navigate("/raise-complaint")}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Report Your First Issue
            </button>
          </div>
        )}

        {userComplaints.length > 10 && (
          <div className="p-4 border-t border-gray-200 text-center">
            <button
              onClick={() => navigate("/user/issues")}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              View all {userComplaints.length} issues →
            </button>
          </div>
        )}
      </motion.div>

      {/* Activity Insights - Now Dynamic */}
      {monthlyActivity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Activity Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Activity */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Monthly Contributions
              </h4>
              <div className="space-y-3">
                {monthlyActivity.slice(0, 6).map((item, index) => {
                  const maxIssues = Math.max(
                    ...monthlyActivity.map((m) => m.count),
                  );
                  const percentage =
                    maxIssues > 0 ? (item.count / maxIssues) * 100 : 0;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600 w-16">
                        {item.month}
                      </span>
                      <div className="flex-1 flex items-center gap-2 ml-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Achievements</h4>
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${achievement.achieved ? "bg-white border border-green-200" : "bg-gray-100 opacity-60"}`}
                      title={achievement.description}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{achievement.icon}</span>
                        <div>
                          <span
                            className={`text-sm ${achievement.achieved ? "text-gray-900" : "text-gray-500"}`}
                          >
                            {achievement.title}
                          </span>
                          {achievement.progress && (
                            <div className="text-xs text-gray-500 mt-1">
                              {achievement.progress.current}/
                              {achievement.progress.total}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Profile;
