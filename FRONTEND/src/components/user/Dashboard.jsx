import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  ThumbsUp,
  Users,
  MapPin,
  Calendar,
  ChevronRight,
  Activity,
  RefreshCw,
  BarChart3,
  Award
} from 'lucide-react';
import axios from 'axios';
import { PlusCircle } from 'lucide-react';
const Dashboard = ({ currentUser }) => {
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    inProgress: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [topComplaints, setTopComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickStats, setQuickStats] = useState({
    votesGiven: 0,
    commentsMade: 0,
    issuesReported: 0,
    avgResolutionTime: '0 days'
  });
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all complaints for stats
      const complaintsRes = await axios.get(`${BASE_URL}/api/user_issues`);
      if (complaintsRes.data.success) {
        const complaints = complaintsRes.data.data || [];
        
        // Calculate stats
        const total = complaints.length;
        const resolved = complaints.filter(c => c.status === 'resolved').length;
        const pending = complaints.filter(c => c.status === 'pending').length;
        const inProgress = complaints.filter(c => c.status === 'in-progress').length;
        
        setStats({ total, resolved, pending, inProgress });
        
        // Get top complaints by votes
        const top = [...complaints]
          .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
          .slice(0, 5);
        setTopComplaints(top);
      }
      
      // Load user's complaints for recent activity
      const token = localStorage.getItem('accessToken');
      if (token && currentUser) {
        const myComplaintsRes = await axios.get(`${BASE_URL}/api/user_issues/my`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (myComplaintsRes.data.success) {
          const myComplaints = myComplaintsRes.data.data || [];
          setRecentActivity(myComplaints.slice(0, 5));
          
          // Calculate quick stats
          const issuesReported = myComplaints.length;
          const votesGiven = myComplaints.reduce((sum, c) => sum + (c.voteCount || 0), 0);
          
          // Calculate resolution time (mock for now)
          const resolvedComplaints = myComplaints.filter(c => c.status === 'resolved');
          let totalDays = 0;
          resolvedComplaints.forEach(complaint => {
            if (complaint.createdAt && complaint.resolvedAt) {
              const created = new Date(complaint.createdAt);
              const resolved = new Date(complaint.resolvedAt);
              const diffTime = Math.abs(resolved - created);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              totalDays += diffDays;
            }
          });
          
          const avgResolutionTime = resolvedComplaints.length > 0 
            ? `${(totalDays / resolvedComplaints.length).toFixed(1)} days`
            : 'N/A';
            
          setQuickStats({
            votesGiven,
            commentsMade: myComplaints.reduce((sum, c) => sum + (c.comments?.length || 0), 0),
            issuesReported,
            avgResolutionTime
          });
        }
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (complaintId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Please login to vote');
        return;
      }
      
      await axios.put(`${BASE_URL}/api/user_issues/${complaintId}/vote`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Refresh data after voting
      loadDashboardData();
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to vote. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back, {currentUser?.name}! 👋</h2>
            <p className="opacity-90">Here's what's happening in your community today</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={loadDashboardData}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/raise-complaint')}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Report New Issue
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Complaints</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">Active</span>
            <span className="text-gray-500 ml-2">in community</span>
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
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.resolved}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full" 
                style={{ width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0}% resolution rate
            </p>
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
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Activity className="w-4 h-4 text-yellow-500 mr-2" />
            <span className="text-sm text-gray-600">Avg. resolution time: {quickStats.avgResolutionTime}</span>
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
              <p className="text-sm text-gray-600">My Contributions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{quickStats.issuesReported}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{quickStats.votesGiven}</div>
              <div className="text-gray-500">Votes</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{quickStats.commentsMade}</div>
              <div className="text-gray-500">Comments</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity and Top Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button 
              onClick={() => navigate('/my-complaints')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((complaint, index) => (
              <div key={complaint._id || index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                onClick={() => navigate(`/complaints/${complaint._id}`)}>
                <div className={`w-2 h-2 mt-2 rounded-full ${
                  complaint.status === 'resolved' ? 'bg-green-500' :
                  complaint.status === 'in-progress' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{complaint.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(complaint.status)}`}>
                      {complaint.status ? complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1) : 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(complaint.updatedAt)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{complaint.voteCount || 0}</span>
                  </div>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent activity</p>
                <button 
                  onClick={() => navigate('/raise-complaint')}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Report your first issue
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Complaints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Community Issues</h3>
            <button 
              onClick={() => navigate('/complaints')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {topComplaints.map((complaint, index) => (
              <div key={complaint._id || index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                onClick={() => navigate(`/complaints/${complaint._id}`)}>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{complaint.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">by {complaint.user?.name || 'Anonymous'}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{complaint.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-gray-900">{complaint.voteCount || 0}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(complaint._id);
                    }}
                    className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Vote
                  </button>
                </div>
              </div>
            ))}
            {topComplaints.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No community issues yet</p>
                <button 
                  onClick={() => navigate('/raise-complaint')}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Be the first to report
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/raise-complaint')}
              className="w-full px-4 py-3 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center justify-between"
            >
              <span>Report New Issue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate('/complaints')}
              className="w-full px-4 py-3 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center justify-between"
            >
              <span>Browse All Issues</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate('/reports')}
              className="w-full px-4 py-3 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center justify-between"
            >
              <span>View Reports</span>
              <BarChart3 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate('/leaderboard')}
              className="w-full px-4 py-3 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center justify-between"
            >
              <span>Check Leaderboard</span>
              <Award className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Community Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending Issues</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <div className="text-sm text-gray-600">Resolved Today</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{quickStats.issuesReported}</div>
              <div className="text-sm text-gray-600">Your Reports</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Community Engagement</span>
              <span>{quickStats.votesGiven} votes • {quickStats.commentsMade} comments</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" 
                style={{ width: `${Math.min((quickStats.votesGiven / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

