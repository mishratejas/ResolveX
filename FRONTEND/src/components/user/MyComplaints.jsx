import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, MapPin, ThumbsUp, Eye, Trash2,
  AlertCircle, CheckCircle, Target, TrendingUp, RefreshCw, X, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyComplaints = ({ currentUser }) => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '' });
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, inProgress: 0, totalVotes: 0 });

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => { loadMyComplaints(); }, [currentUser]);

  const loadMyComplaints = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const currentWorkspace = JSON.parse(localStorage.getItem('currentWorkspace'));
      const workspaceParam = currentWorkspace?.id ? `?workspaceId=${currentWorkspace.id}` : '';
      const response = await axios.get(`${BASE_URL}/api/user_issues/my${workspaceParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const d = response.data.data || [];
        setComplaints(d);
        setStats({
          total: d.length,
          resolved: d.filter(c => c.status === 'resolved').length,
          pending: d.filter(c => c.status === 'pending').length,
          inProgress: d.filter(c => c.status === 'in-progress').length,
          totalVotes: d.reduce((s, c) => s + (c.voteCount || 0), 0)
        });
      }
    } catch (error) {
      console.error('Error loading my complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (complaint) => {
    setDeleteModal({ open: true, id: complaint._id, title: complaint.title });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${BASE_URL}/api/user_issues/${deleteModal.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(prev => prev.filter(c => c._id !== deleteModal.id));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
      setDeleteModal({ open: false, id: null, title: '' });
    } catch (error) {
      console.error('Error deleting complaint:', error);
      alert('Failed to delete complaint. Please try again.');
    } finally {
      setDeleting(false);
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

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatLocation = (location) => {
    if (!location) return 'Location not specified';
    if (typeof location === 'object') return location.address || 'Location not specified';
    return location;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const displayedComplaints = useMemo(() => {
    let filtered = [...complaints];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        formatLocation(c.location).toLowerCase().includes(q) ||
        c.status?.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'votes': filtered.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0)); break;
      case 'status': {
        const order = { resolved: 0, 'in-progress': 1, pending: 2 };
        filtered.sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));
        break;
      }
      case 'oldest': filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      default: filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return filtered;
  }, [complaints, searchQuery, sortBy]);

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
          <button onClick={loadMyComplaints} className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
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
            {stats.total === 0 ? 'No complaints yet' : `${stats.resolved} resolved • ${stats.pending} pending`}
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Resolution Rate</p>
              <p className="text-3xl font-bold mt-2">
                {stats.total > 0 ? `${((stats.resolved / stats.total) * 100).toFixed(0)}%` : '0%'}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 opacity-80" />
          </div>
          <div className="mt-4 text-sm opacity-90">{stats.resolved} of {stats.total} resolved</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-pink-400 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Community Impact</p>
              <p className="text-3xl font-bold mt-2">{stats.totalVotes}</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
          <div className="mt-4 text-sm opacity-90">Total votes received on your complaints</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Complaint History</h3>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full sm:w-56"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
              >
                <option value="recent">Sort: Recent</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="votes">Sort: Most Votes</option>
                <option value="status">Sort: Status</option>
              </select>
            </div>
          </div>
        </div>

        {displayedComplaints.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedComplaints.map((complaint) => (
                  <tr key={complaint._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{complaint.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{formatLocation(complaint.location)}
                        </span>
                        {complaint.category && (
                          <span className="text-xs text-gray-400">• {complaint.category}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority?.toUpperCase() || 'MEDIUM'}
                      </span>
                      {complaint.autoPriorityAssigned && <span className="ml-1 text-xs text-purple-600">🤖</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                        {complaint.status?.charAt(0).toUpperCase() + complaint.status?.slice(1) || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{formatDate(complaint.createdAt)}</div>
                      {complaint.updatedAt !== complaint.createdAt && (
                        <div className="text-xs text-gray-400 mt-0.5">Updated {formatDate(complaint.updatedAt)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-sm text-gray-800">{complaint.voteCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/home/complaints/${complaint._id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="View full details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button
                          onClick={() => openDeleteModal(complaint)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete this complaint"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
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
            {searchQuery ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600 mb-4">Try a different search term</p>
                <button onClick={() => setSearchQuery('')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No complaints yet</h3>
                <p className="text-gray-600 mb-4">Start by reporting your first community issue</p>
                <button
                  onClick={() => navigate('/home/raise-complaint')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:opacity-90 font-medium"
                >
                  Report New Issue
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Complaint</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
                <button
                  onClick={() => setDeleteModal({ open: false, id: null, title: '' })}
                  className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteModal.title}"</span>?
                  This will permanently remove the complaint and all associated data.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDeleteModal({ open: false, id: null, title: '' })}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {deleting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Deleting...</>
                  ) : (
                    <><Trash2 className="w-4 h-4" />Yes, Delete</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
