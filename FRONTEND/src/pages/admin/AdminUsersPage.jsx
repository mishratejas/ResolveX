// pages/admin/AdminUsersPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Filter, RefreshCw, Eye, Edit, Trash2, Mail, Phone,
  CheckCircle, XCircle, Clock, AlertCircle, Download, MoreVertical,
  Star, Shield, User, Activity, Calendar, ChevronDown, ChevronUp,
  FileText, MessageSquare, Award, TrendingUp, UserCheck, UserX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserProfileEditor from '../../components/admin/UserProfileEditor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'all',
    verified: 'all',
    dateRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [pagination.page]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedFilters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          status: selectedFilters.status
        }
      });
      
      if (response.data.success) {
        setUsers(response.data.data.users || []);
        setFilteredUsers(response.data.data.users || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          totalPages: response.data.data.pagination.totalPages
        }));
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/api/admin/users/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phone?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (selectedFilters.status !== 'all') {
      const isActive = selectedFilters.status === 'active';
      filtered = filtered.filter(user => user.isActive === isActive);
    }

    // Apply verification filter
    if (selectedFilters.verified !== 'all') {
      const isVerified = selectedFilters.verified === 'verified';
      filtered = filtered.filter(user => user.isVerified === isVerified);
    }

    setFilteredUsers(filtered);
  };

  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setShowProfileEditor(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('User deleted successfully');
        setShowDeleteConfirm(null);
        fetchUsers();
        fetchUserStats();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleBulkAction = async (action) => {
    const selectedIds = filteredUsers.filter(u => u.selected).map(u => u._id);
    if (selectedIds.length === 0) {
      alert('Please select at least one user');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_URL}/api/admin/users/bulk`, {
        userIds: selectedIds,
        action,
        data: action === 'change_role' ? { role: prompt('Enter role: user/moderator/admin') } : {}
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(response.data.message);
        fetchUsers();
        fetchUserStats();
      }
    } catch (err) {
      console.error('Error in bulk action:', err);
      alert(err.response?.data?.message || 'Failed to perform bulk action');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-600 mt-1">View and manage all registered users</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => handleBulkAction('export')}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total || 0}</p>
                <p className="text-xs text-gray-500 mt-2">{stats.active || 0} active</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Verified Users</p>
                <p className="text-3xl font-bold text-green-600">{stats.verified || 0}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {((stats.verified / stats.total) * 100).toFixed(1) || 0}% of total
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">New Users (30d)</p>
                <p className="text-3xl font-bold text-purple-600">{stats.growth?.last30Days || 0}</p>
                <p className="text-xs text-gray-500 mt-2">+{stats.growth?.last30Days || 0} this month</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Avg Complaints</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.complaints?.avgComplaintsPerUser?.toFixed(1) || 0}
                </p>
                <p className="text-xs text-gray-500 mt-2">Per user</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedFilters({
                  status: 'all',
                  verified: 'all',
                  dateRange: 'all'
                });
              }}
              className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                <select
                  value={selectedFilters.status}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification</label>
                <select
                  value={selectedFilters.verified}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, verified: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Registration Date</label>
                <select
                  value={selectedFilters.dateRange}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={filterUsers}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Complaints</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Resolution Rate</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredUsers.map((user) => (
                <motion.tr 
                  key={user._id} 
                  className="hover:bg-gray-50 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        {user.isVerified && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <CheckCircle className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          {user.role === 'admin' && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">ID: {user._id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{user.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {user.stats?.totalComplaints || 0}
                        </span>
                        <span className="text-sm text-gray-500">total</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-600 font-medium">{user.stats?.resolvedComplaints || 0} resolved</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-yellow-600 font-medium">{user.stats?.pendingComplaints || 0} pending</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                          style={{ width: `${user.stats?.resolutionRate || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">
                        {user.stats?.resolutionRate || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-1 ${
                        user.isActive 
                          ? 'text-green-700 bg-green-100 border border-green-200' 
                          : 'text-red-700 bg-red-100 border border-red-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {user.isVerified && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewProfile(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View & Edit Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowProfileEditor(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowDeleteConfirm(showDeleteConfirm === user._id ? null : user._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <AnimatePresence>
                          {showDeleteConfirm === user._id && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 p-3"
                            >
                              <p className="text-sm text-gray-700 mb-3">
                                Delete {user.name}? This action cannot be undone.
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDeleteUser(user._id)}
                                  className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
              
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium mb-1">No users found</p>
                      <p className="text-sm text-gray-500 mb-4">Try adjusting your search or filters</p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedFilters({ status: 'all', verified: 'all', dateRange: 'all' });
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  {pagination.page}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Editor Modal */}
      <AnimatePresence>
        {showProfileEditor && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <UserProfileEditor
                userId={selectedUser._id}
                onSave={() => {
                  setShowProfileEditor(false);
                  setSelectedUser(null);
                  fetchUsers();
                  fetchUserStats();
                }}
                onCancel={() => {
                  setShowProfileEditor(false);
                  setSelectedUser(null);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsersPage;