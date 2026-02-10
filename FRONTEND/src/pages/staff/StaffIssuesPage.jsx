import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  MoreVertical,
  Eye,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  X,
  ChevronDown,
  Calendar,
  MapPin,
  User,
  FileText,
  BarChart3,
  Printer,
  Share2,
  Star,
  TrendingUp,
  ChevronRight
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || "https://webster-2025.onrender.com";

const StaffIssuesPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    pending: 0,
    highPriority: 0,
    totalComments: 0,
    avgResolutionTime: '2.5 days'
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('staffData') || localStorage.getItem('staff') || 'null');
    if (!userData) {
      navigate('/');
      return;
    }
    setUser(userData);
    fetchComplaints();
  }, [navigate]);

 const fetchComplaints = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('staffToken') || localStorage.getItem('staffAccessToken');
    
    // Use the correct endpoint
    const response = await axios.get(`${BASE_URL}/api/staff/issues`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Complaints response:', response.data);

    if (response.data.success) {
      const data = response.data.data || [];
      setComplaints(data);
      applyFilters(data, filter, searchQuery, selectedPriority);
      calculateStats(data);
    }
  } catch (error) {
    console.error('Error fetching complaints:', error);
    // Add error handling
    if (error.response?.status === 401) {
      localStorage.clear();
      navigate('/');
    }
  } finally {
    setLoading(false);
  }
};

  const applyFilters = (data, statusFilter, search, priorityFilter) => {
    let filtered = [...data];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(complaint => {
        if (statusFilter === 'pending') return complaint.status === 'pending';
        if (statusFilter === 'in-progress') return complaint.status === 'in-progress' || complaint.status === 'in_progress';
        if (statusFilter === 'resolved') return complaint.status === 'resolved' || complaint.status === 'completed';
        return true;
      });
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(complaint => 
        complaint.priority?.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    // Search filter
    if (search.trim() !== '') {
      const query = search.toLowerCase();
      filtered = filtered.filter(complaint =>
        complaint.title?.toLowerCase().includes(query) ||
        complaint.description?.toLowerCase().includes(query) ||
        complaint.user?.name?.toLowerCase().includes(query) ||
        complaint.location?.toLowerCase().includes(query) ||
        complaint._id?.toLowerCase().includes(query)
      );
    }

    setFilteredComplaints(filtered);
  };

  const calculateStats = (data) => {
    const now = new Date();
    let totalComments = 0;
    let resolvedCount = 0;
    let totalResolutionTime = 0;

    data.forEach(complaint => {
      totalComments += complaint.comments?.length || 0;
      if (complaint.status === 'resolved' || complaint.status === 'completed') {
        resolvedCount++;
        if (complaint.resolvedAt && complaint.createdAt) {
          const created = new Date(complaint.createdAt);
          const resolved = new Date(complaint.resolvedAt);
          const hours = Math.abs(resolved - created) / 36e5;
          totalResolutionTime += hours;
        }
      }
    });

    const avgHours = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 48;
    const avgDays = (avgHours / 24).toFixed(1);

    setStats({
      assigned: data.length,
      inProgress: data.filter(c => c.status === 'in-progress' || c.status === 'in_progress').length,
      resolved: data.filter(c => c.status === 'resolved' || c.status === 'completed').length,
      pending: data.filter(c => c.status === 'pending' || c.status === 'open').length,
      highPriority: data.filter(c => c.priority === 'high' || c.priority === 'urgent').length,
      totalComments: totalComments,
      avgResolutionTime: `${avgDays} days`
    });
  };

  useEffect(() => {
    applyFilters(complaints, filter, searchQuery, selectedPriority);
  }, [filter, searchQuery, selectedPriority, complaints]);

const updateComplaintStatus = async (complaintId, newStatus) => {
  try {
    const token = localStorage.getItem('staffToken') || localStorage.getItem('staffAccessToken');
    
    const response = await axios.put(
      `${BASE_URL}/api/staff/issues/${complaintId}`,
      { 
        status: newStatus,
        comments: `Status changed to ${newStatus} by staff` // Optional comment
      },
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    if (response.data.success) {
      fetchAssignedComplaints(); // Refresh the list
      
      // Add to recent activity
      const newActivity = {
        _id: Date.now().toString(),
        action: `Updated status to ${newStatus}`,
        timestamp: new Date().toISOString(),
        type: 'status_update'
      };
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 3)]);
      
      alert('Status updated successfully!');
    }
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Failed to update status: ' + (error.response?.data?.message || error.message));
  }
};

  const addComment = async (complaintId, comment) => {
    try {
      const token = localStorage.getItem('staffToken') || localStorage.getItem('staffAccessToken');
      const response = await axios.put(
        `${BASE_URL}/api/staff/issues/${complaintId}`,
        { comments: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        fetchComplaints();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'in-progress':
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resolved':
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in-progress':
      case 'in_progress': return <RefreshCw className="w-4 h-4" />;
      case 'resolved':
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent': return (
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          High
        </span>
      );
      case 'medium': return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
          Medium
        </span>
      );
      case 'low': return (
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          Low
        </span>
      );
      default: return (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
          Normal
        </span>
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    // Simple CSV export
    const headers = ['ID', 'Title', 'Status', 'Priority', 'Created', 'User', 'Location'];
    const csvData = filteredComplaints.map(complaint => [
      complaint._id,
      complaint.title,
      complaint.status,
      complaint.priority,
      formatDate(complaint.createdAt),
      complaint.user?.name || 'Unknown',
      complaint.location || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `issues_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const resetFilters = () => {
    setFilter('all');
    setSearchQuery('');
    setSelectedPriority('all');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading issues...</p>
          <p className="text-sm text-gray-500">Fetching your assigned complaints</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/staff/dashboard')}
              className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Assigned Issues</h1>
            <p className="text-gray-600 mt-1">Manage all complaints assigned to you</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Assigned</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.assigned}</h3>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.pending}</h3>
            </div>
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">In Progress</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.inProgress}</h3>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Resolved</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.resolved}</h3>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">High Priority</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.highPriority}</h3>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, description, user, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2 border border-gray-200"
            >
              <Filter className="w-5 h-5" />
              Filters
              {showFilters && <X className="w-4 h-4" />}
            </button>
            
            <button
              onClick={resetFilters}
              className="px-4 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 border border-gray-300"
            >
              Reset
            </button>
            
            <button
              onClick={fetchComplaints}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'pending', 'in-progress', 'resolved'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'all' ? 'All' : status.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Priority</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'high', 'medium', 'low'].map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setSelectedPriority(priority)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedPriority === priority
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {priority === 'all' ? 'All' : priority}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Sort By</label>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                    Newest First
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                    Priority
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                    Due Date
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {filteredComplaints.length} Issues Found
          </h3>
          <p className="text-sm text-gray-500">
            Showing {filteredComplaints.length} of {complaints.length} total issues
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Avg. Resolution: <span className="font-semibold text-green-600">{stats.avgResolutionTime}</span>
        </div>
      </div>

      {/* Complaints List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Issue Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No issues found</h3>
                      <p className="text-gray-500 max-w-md">
                        {searchQuery 
                          ? "No issues match your search criteria. Try different keywords or reset filters."
                          : "No issues assigned to you. Check back later for new assignments."}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={resetFilters}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((complaint) => (
                  <tr key={complaint._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-start gap-3">
                          <div className={`w-3 h-3 rounded-full mt-2 ${getPriorityColor(complaint.priority)}`}></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                {complaint.title}
                              </h4>
                              {complaint.comments?.length > 0 && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {complaint.comments.length}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {complaint.description}
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                              <div className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                <span>{complaint.user?.name || 'Unknown User'}</span>
                              </div>
                              {complaint.location && (
                                <div className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  <span>{complaint.location}</span>
                                </div>
                              )}
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                <span>{formatDate(complaint.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 w-fit ${getStatusColor(complaint.status)}`}>
                        {getStatusIcon(complaint.status)}
                        <span className="text-xs font-medium capitalize">
                          {complaint.status?.replace('_', ' ') || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getPriorityBadge(complaint.priority)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        <div>{formatDate(complaint.createdAt)}</div>
                        {complaint.dueDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Due: {formatDate(complaint.dueDate)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {complaint.status !== 'resolved' && complaint.status !== 'completed' && (
                          <>
                            {complaint.status === 'pending' && (
                              <button
                                onClick={() => updateComplaintStatus(complaint._id, 'in-progress')}
                                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors font-medium flex items-center gap-1"
                              >
                                <RefreshCw className="w-4 h-4" />
                                Start
                              </button>
                            )}
                            {complaint.status === 'in-progress' && (
                              <button
                                onClick={() => updateComplaintStatus(complaint._id, 'resolved')}
                                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors font-medium flex items-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Resolve
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => navigate(`/staff/issues/${complaint._id}`)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/staff/chat/${complaint._id}`)}
                          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors font-medium flex items-center gap-1"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Chat
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredComplaints.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-500">
                Showing {Math.min(filteredComplaints.length, 10)} of {filteredComplaints.length} results
              </div>
              <div className="flex items-center gap-2 mt-3 sm:mt-0">
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                  Previous
                </button>
                <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  1
                </button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                  2
                </button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                  3
                </button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Response Time</p>
              <h3 className="text-2xl font-bold text-blue-900 mt-1">4.2 hours</h3>
              <p className="text-xs text-blue-600 mt-2">Average first response</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Resolution Rate</p>
              <h3 className="text-2xl font-bold text-green-900 mt-1">92%</h3>
              <p className="text-xs text-green-600 mt-2">Issues resolved this month</p>
            </div>
            <Star className="w-10 h-10 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">User Satisfaction</p>
              <h3 className="text-2xl font-bold text-purple-900 mt-1">4.8/5.0</h3>
              <p className="text-xs text-purple-600 mt-2">Based on 128 reviews</p>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffIssuesPage;