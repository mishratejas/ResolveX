import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  LogOut,
  Plus,
  Copy,
  Check,
  ArrowRight,
  X,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const WorkspaceSelector = ({ onWorkspaceSelect }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoinWorkspace, setShowJoinWorkspace] = useState(false);
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadUserWorkspaces();
  }, []);

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
    } finally {
      setLoading(false);
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
        // Clear current workspace if leaving the active one
        const currentWorkspace = JSON.parse(localStorage.getItem("currentWorkspace") || "{}");
        if (currentWorkspace.id === workspaceId) {
          localStorage.removeItem("currentWorkspace");
        }
        await loadUserWorkspaces();
      }
    } catch (error) {
      console.error("Error leaving workspace:", error);
      toast.error(error.response?.data?.message || "Failed to leave workspace");
    }
  };

  // 🔧 FIXED: Save workspace with workspaceCode property
const handleSelectWorkspace = (workspace) => {
  // Save to localStorage with proper structure
  const workspaceData = {
    id: workspace._id,
    name: workspace.organizationName,
    workspaceCode: workspace.workspaceCode, // ← FIXED: Use workspaceCode, not code
    email: workspace.email,
    phone: workspace.phone || '',
    joinedAt: new Date().toISOString()
  };

  console.log('🏢 Selecting workspace:', workspaceData);
  localStorage.setItem("currentWorkspace", JSON.stringify(workspaceData));

  // Notify parent and trigger reload in complaint components
  if (onWorkspaceSelect) {
    onWorkspaceSelect(workspaceData);
  }
  window.dispatchEvent(new Event("workspaceSelected"));

  // Go to home/dashboard
  navigate("/home");
};

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success("Workspace code copied!");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-block p-3 bg-white rounded-2xl shadow-lg mb-4">
            <Building2 className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to ResolveX
          </h1>
          <p className="text-gray-600">
            {user?.name}, please select a workspace to continue
          </p>
        </motion.div>

        {/* Workspaces Grid */}
        <div className="max-w-4xl mx-auto">
          {workspaces.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {workspaces.map((workspace, index) => (
                  <motion.div
                    key={workspace._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          {workspace.profileImage ? (
                            <img
                              src={workspace.profileImage}
                              alt={workspace.organizationName}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <Building2 className="w-8 h-8 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                            {workspace.organizationName}
                          </h3>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">
                                {workspace.email}
                              </span>
                            </div>
                            {workspace.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{workspace.phone}</span>
                              </div>
                            )}
                            {workspace.createdAt && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Member since {formatDate(workspace.createdAt)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-mono">
                              Code: {workspace.workspaceCode}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(workspace.workspaceCode)
                              }
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Copy code"
                            >
                              {copiedCode === workspace.workspaceCode ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleSelectWorkspace(workspace)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
                        >
                          Select Workspace
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleLeaveWorkspace(
                              workspace._id,
                              workspace.organizationName,
                            )
                          }
                          className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Leave workspace"
                          disabled={workspaces.length <= 1}
                        >
                          <LogOut className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Join Another Workspace Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <button
                  onClick={() => setShowJoinWorkspace(true)}
                  className="px-6 py-3 bg-white text-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-shadow font-medium inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Join Another Workspace
                </button>
              </motion.div>
            </>
          ) : (
            // No Workspaces - Show Join Form
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                No Workspaces Yet
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                You haven't joined any workspace yet. Enter a workspace code to
                get started.
              </p>

              <form onSubmit={handleJoinWorkspace} className="max-w-md mx-auto">
                <div className="mb-4">
                  <input
                    type="text"
                    value={workspaceCode}
                    onChange={(e) =>
                      setWorkspaceCode(e.target.value.toUpperCase())
                    }
                    placeholder="Enter workspace code (e.g., ABC123)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-center text-lg font-mono"
                    disabled={workspaceLoading}
                    autoFocus
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Ask your workspace admin for the code
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={workspaceLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {workspaceLoading ? "Joining..." : "Join Workspace"}
                </button>
              </form>
            </motion.div>
          )}
        </div>

        {/* Join Workspace Modal */}
        {showJoinWorkspace && workspaces.length > 0 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Join Workspace
                </h3>
                <button
                  onClick={() => {
                    setShowJoinWorkspace(false);
                    setWorkspaceCode("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleJoinWorkspace}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workspace Code
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
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={workspaceLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
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
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceSelector;