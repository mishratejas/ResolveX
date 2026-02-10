import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  ThumbsUp,
  MessageCircle,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyComplaints = ({ currentUser }) => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    inProgress: 0,
    totalVotes: 0
  });

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    loadMyComplaints();
  }, [currentUser]);

  const loadMyComplaints = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await axios.get(`${BASE_URL}/api/user_issues/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const complaintsData = response.data.data || [];
        setComplaints(complaintsData);
        
        // Calculate stats
        const total = complaintsData.length;
        const resolved = complaintsData.filter(c => c.status === 'resolved').length;
        const pending = complaintsData.filter(c => c.status === 'pending').length;
        const inProgress = complaintsData.filter(c => c.status === 'in-progress').length;
        const totalVotes = complaintsData.reduce((sum, c) => sum + (c.voteCount || 0), 0);
        
        setStats({ total, resolved, pending, inProgress, totalVotes });
      }
    } catch (error) {
      console.error('Error loading my complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (complaintId) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${BASE_URL}/api/user_issues/${complaintId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Remove from local state
      setComplaints(prev => prev.filter(c => c._id !== complaintId));
    } catch (error) {
      console.error('Error deleting complaint:', error);
      alert('Failed to delete complaint. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
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
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Complaints</h1>
            <p className="text-gray-600 mt-1">Track and manage your reported issues</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadMyComplaints}
              className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Reported</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <Target className="w-12 h-12 opacity-80" />
          </div>
          <div className="mt-4 text-sm opacity-90">
            {stats.total === 0 ? 'No complaints yet' : 
             `${stats.resolved} resolved • ${stats.pending} pending`}
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Resolution Rate</p>
              <p className="text-3xl font-bold mt-2">
                {stats.total > 0 
                  ? `${((stats.resolved / stats.total) * 100).toFixed(0)}%`
                  : '0%'}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 opacity-80" />
          </div>
          <div className="mt-4 text-sm opacity-90">
            {stats.resolved} of {stats.total} resolved
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-400 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Community Impact</p>
              <p className="text-3xl font-bold mt-2">{stats.totalVotes}</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
          <div className="mt-4 text-sm opacity-90">
            Total votes received on your complaints
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Complaint History</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search your complaints..."
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                <option>Sort by: Recent</option>
                <option>Sort by: Votes</option>
                <option>Sort by: Status</option>
              </select>
            </div>
          </div>
        </div>

        {complaints.length > 0 ? (
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {complaints.map((complaint) => (
                  <tr key={complaint._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{complaint.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {complaint.location || 'Location not specified'}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{complaint.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                        {complaint.status?.charAt(0).toUpperCase() + complaint.status?.slice(1) || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(complaint.createdAt)}</div>
                      <div className="text-xs text-gray-500">
                        {complaint.updatedAt !== complaint.createdAt && `Updated ${formatDate(complaint.updatedAt)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{complaint.voteCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4 text-gray-400" />
                          <span>{complaint.comments?.length || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/complaints/${complaint._id}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Update Status"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(complaint._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No complaints yet</h3>
            <p className="text-gray-600 mb-4">Start by reporting your first community issue</p>
            <button
              onClick={() => navigate('/raise-complaint')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Report New Issue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyComplaints;