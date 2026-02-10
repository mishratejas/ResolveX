import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Download
} from 'lucide-react';
import axios from 'axios';

const Profile = ({ currentUser }) => {
  const [userData, setUserData] = useState(null);
  const [userComplaints, setUserComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    loadUserData();
  }, [currentUser]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      // Load user's complaints
      const complaintsRes = await axios.get(`${BASE_URL}/api/user_issues/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (complaintsRes.data.success) {
        setUserComplaints(complaintsRes.data.data || []);
      }
      
      // If you have a user profile endpoint, load additional data here
      // const userRes = await axios.get(`${BASE_URL}/api/users/profile`, {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      
      setUserData(currentUser);
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
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

  // Calculate user stats
  const userStats = React.useMemo(() => {
    if (!userComplaints.length) return null;
    
    const total = userComplaints.length;
    const resolved = userComplaints.filter(c => c.status === 'resolved').length;
    const pending = userComplaints.filter(c => c.status === 'pending').length;
    const inProgress = userComplaints.filter(c => c.status === 'in-progress').length;
    const totalVotes = userComplaints.reduce((sum, c) => sum + (c.voteCount || 0), 0);
    const totalComments = userComplaints.reduce((sum, c) => sum + (c.comments?.length || 0), 0);
    const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;
    
    return {
      total,
      resolved,
      pending,
      inProgress,
      totalVotes,
      totalComments,
      resolutionRate
    };
  }, [userComplaints]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
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
            <div className="w-24 h-24 bg-gradient-to-br from-white/20 to-white/10 rounded-full border-4 border-white/30 flex items-center justify-center text-white text-3xl font-bold">
              {userData?.name?.charAt(0) || 'U'}
            </div>
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{userData?.name || 'User'}</h1>
                <div className="flex flex-wrap gap-4 text-white/90">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{userData?.email || 'user@example.com'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(userData?.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                      {userData?.role || 'Community Member'}
                    </span>
                  </div>
                </div>
              </div>
              
              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors font-medium flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
            
            {/* User Bio */}
            <div className="mt-6">
              <p className="text-white/90">
                Active community member passionate about improving local infrastructure and services.
                Committed to reporting and resolving community issues.
              </p>
            </div>
          </div>
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
              <p className="text-2xl font-bold text-gray-900 mt-1">{userStats?.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {userStats?.resolved || 0} resolved • {userStats?.pending || 0} pending
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
                {userStats ? `${userStats.resolutionRate.toFixed(1)}%` : '0%'}
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
                style={{ width: `${userStats?.resolutionRate || 0}%` }}
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
              <p className="text-2xl font-bold text-gray-900 mt-1">{userStats?.totalVotes || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {userStats?.totalComments || 0} comments received
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
              <p className="text-sm text-gray-600">Rank</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">#27</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Top 10% contributor
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
            <h3 className="text-lg font-semibold text-gray-900">Your Submitted Issues</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Filter:</span>
                <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <option>All Issues</option>
                  <option>Resolved</option>
                  <option>Pending</option>
                  <option>In Progress</option>
                </select>
              </div>
              <button className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
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
                      <p className="text-sm text-gray-500 truncate max-w-xs">{complaint.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                      {complaint.status ? complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1) : 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{complaint.category || 'Uncategorized'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{formatDate(complaint.createdAt)}</div>
                    <div className="text-xs text-gray-500">
                      {complaint.updatedAt !== complaint.createdAt && `Updated ${formatDate(complaint.updatedAt)}`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
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
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" title="Share">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No issues submitted yet</h3>
            <p className="text-gray-600 mb-4">Start contributing to your community by reporting issues</p>
            <a
              href="/raise-complaint"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium inline-block"
            >
              Report Your First Issue
            </a>
          </div>
        )}
      </motion.div>

      {/* Activity Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Activity Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Monthly Contribution</h4>
            <div className="space-y-3">
              {[
                { month: 'Jan', issues: 4 },
                { month: 'Feb', issues: 6 },
                { month: 'Mar', issues: 8 },
                { month: 'Apr', issues: 5 },
                { month: 'May', issues: 7 },
                { month: 'Jun', issues: 9 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" 
                        style={{ width: `${(item.issues / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{item.issues}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Achievements</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'First Issue', achieved: true, icon: '🎯' },
                { title: '10 Votes', achieved: true, icon: '👍' },
                { title: 'Community Star', achieved: false, icon: '⭐' },
                { title: 'Quick Resolver', achieved: true, icon: '⚡' },
                { title: 'Top Contributor', achieved: false, icon: '🏆' },
                { title: 'Helpful Citizen', achieved: true, icon: '🤝' }
              ].map((achievement, index) => (
                <div key={index} className={`p-3 rounded-lg ${achievement.achieved ? 'bg-white border border-green-200' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{achievement.icon}</span>
                    <span className={`text-sm ${achievement.achieved ? 'text-gray-900' : 'text-gray-500'}`}>
                      {achievement.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;