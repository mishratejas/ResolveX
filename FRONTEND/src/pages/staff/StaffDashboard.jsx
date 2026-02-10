import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertTriangle,
  Home,
  LogOut,
  RefreshCw,
  User,
  Shield,
  Bell,
  Settings,
  Calendar,
  MapPin,
  AlertCircle,
  Filter,
  Search,
  MessageSquare,
  Eye,
  ArrowRight,
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Download,
  MoreVertical,
  Phone,
  Mail,
  Building,
  ChevronRight,
  Star,
  Award
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || "https://webster-2025.onrender.com";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [staffData, setStaffData] = useState(null);
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    pending: 0,
    highPriority: 0,
    avgResolutionTime: '2.5 days'
  });
  const [activeTab, setActiveTab] = useState('all');
  const [recentActivity, setRecentActivity] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log('🏁 StaffDashboard mounted');
    checkAuth();
  }, [navigate]);

  const checkAuth = () => {
    const token = localStorage.getItem('staffToken') || localStorage.getItem('staffAccessToken');
    const storedData = localStorage.getItem('staffData') || localStorage.getItem('staff');
    
    console.log('🔑 Token exists:', !!token);
    console.log('👤 Stored data exists:', !!storedData);
    
    if (!token) {
      console.log('❌ No token found, redirecting to login');
      navigate('/');
      return;
    }

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log('📋 Staff data loaded:', parsedData);
        setStaffData(parsedData);
      } catch (e) {
        console.error('❌ Error parsing staff data:', e);
      }
    }

    fetchAssignedComplaints();
    fetchRecentActivity();
  };

const fetchAssignedComplaints = async () => {
  try {
    setLoading(true);
    setError('');
    
    const token = localStorage.getItem('staffToken') || localStorage.getItem('staffAccessToken');
    console.log('📤 Fetching complaints with token:', token ? 'Token exists' : 'No token');
    
    // Use the correct endpoint
    const response = await axios.get(`${BASE_URL}/api/staff/issues`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ API Response:', response.data);
    
    let complaints = [];
    if (response.data.success) {
      complaints = response.data.data || [];
      console.log('📊 Complaints received:', complaints.length);
      
      setAssignedComplaints(complaints);
      calculateStats(complaints);
    } else {
      setError(response.data.message || 'Failed to load complaints');
    }
    
  } catch (error) {
    console.error('❌ Error fetching assigned complaints:', error);
    handleApiError(error);
  } finally {
    setLoading(false);
  }
};

const fetchRecentActivity = () => {
  // Create simulated activity data since the endpoint doesn't exist
  const simulatedActivity = [
    {
      _id: '1',
      action: `You logged into the system`,
      timestamp: new Date().toISOString(),
      type: 'login'
    },
    {
      _id: '2',
      action: `New issue assigned: "Water Supply Issue - Main Street"`,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      type: 'assignment'
    },
    {
      _id: '3',
      action: `Updated status of "Power Outage - Downtown" to in-progress`,
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      type: 'status_update'
    },
    {
      _id: '4',
      action: `Resolved "Garbage Collection Delay - West Area"`,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      type: 'resolution'
    }
  ];
  
  setRecentActivity(simulatedActivity);
};

  const calculateStats = (complaints) => {
    const now = new Date();
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    complaints.forEach(complaint => {
      if (complaint.resolvedAt && complaint.createdAt) {
        const created = new Date(complaint.createdAt);
        const resolved = new Date(complaint.resolvedAt);
        const hours = Math.abs(resolved - created) / 36e5;
        totalResolutionTime += hours;
        resolvedCount++;
      }
    });

    const avgHours = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 48;
    const avgDays = (avgHours / 24).toFixed(1);

    const stats = {
      assigned: complaints.length,
      inProgress: complaints.filter(c => c.status === 'in-progress' || c.status === 'in_progress').length,
      resolved: complaints.filter(c => c.status === 'resolved' || c.status === 'completed' || c.status === 'closed').length,
      pending: complaints.filter(c => c.status === 'pending' || c.status === 'open' || !c.status).length,
      highPriority: complaints.filter(c => c.priority === 'high' || c.priority === 'urgent').length,
      avgResolutionTime: `${avgDays} days`
    };
    setStats(stats);
  };

  const handleApiError = (error) => {
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('🔐 Token expired or invalid, redirecting to login');
        localStorage.clear();
        navigate('/');
        return;
      }
      setError(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
    } else if (error.request) {
      console.error('❌ No response received:', error.request);
      setError('Unable to connect to server. Please check your connection.');
    } else {
      console.error('❌ Request setup error:', error.message);
      setError(`Error: ${error.message}`);
    }
  };

  const handleLogout = () => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffData');
    localStorage.removeItem('staffAccessToken');
    localStorage.removeItem('staff');
    localStorage.removeItem('refreshToken');
    navigate('/');
  };

  const updateComplaintStatus = async (complaintId, newStatus) => {
    try {
      const token = localStorage.getItem('staffToken') || localStorage.getItem('staffAccessToken');
      
      const response = await axios.put(
        `${BASE_URL}/api/staff/issues/${complaintId}`,
        { status: newStatus },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.data.success) {
        fetchAssignedComplaints();
        
        // Add to recent activity
        const complaint = assignedComplaints.find(c => c._id === complaintId);
        if (complaint) {
          const newActivity = {
            _id: Date.now().toString(),
            action: `Updated status of "${complaint.title}" to ${newStatus}`,
            timestamp: new Date().toISOString(),
            type: 'status_update'
          };
          setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)]);
        }
        
        alert('Status updated successfully!');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status: ' + (error.message || 'Unknown error'));
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending':
      case 'open':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'in-progress':
      case 'in_progress':
      case 'processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resolved':
      case 'completed':
      case 'closed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending':
      case 'open':
        return <Clock className="w-4 h-4" />;
      case 'in-progress':
      case 'in_progress':
      case 'processing':
        return <RefreshCw className="w-4 h-4" />;
      case 'resolved':
      case 'completed':
      case 'closed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityBadge = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">High</span>;
      case 'medium':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Medium</span>;
      case 'low':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Low</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Normal</span>;
    }
  };

  const filteredComplaints = assignedComplaints.filter(complaint => {
    // Filter by active tab
    let matchesTab = true;
    if (activeTab === 'pending') matchesTab = complaint.status === 'pending';
    else if (activeTab === 'in-progress') matchesTab = complaint.status === 'in-progress' || complaint.status === 'in_progress';
    else if (activeTab === 'resolved') matchesTab = complaint.status === 'resolved' || complaint.status === 'completed';
    
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      complaint.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Show loading state
  if (loading && !staffData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col justify-center items-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="mt-6 text-lg font-medium text-gray-700">Loading your dashboard...</p>
        <p className="mt-2 text-sm text-gray-500">Please wait a moment</p>
      </div>
    );
  }

  if (!staffData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col justify-center items-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Session Expired</h3>
          <p className="text-gray-600 mb-8">Your session has expired or you're not logged in. Please login again to continue.</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <User className="w-5 h-5" />
              Go to Login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
                <p className="text-sm text-gray-600">Issue Resolution Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{staffData.name}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Building className="w-3 h-3 mr-1" />
                    <span>{staffData.department?.name || staffData.department || 'General Department'}</span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                  {staffData.name?.charAt(0) || 'S'}
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium flex items-center gap-2 border border-red-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome back, {staffData.name}! 👋</h2>
              <p className="text-blue-100">You have <span className="font-bold">{stats.assigned}</span> assigned issues to handle today</p>
              <div className="flex items-center mt-4 space-x-6">
                <div className="flex items-center bg-white/10 px-3 py-1 rounded-full">
                  <Building className="w-4 h-4 mr-2" />
                  <span className="text-sm">{staffData.department?.name || staffData.department || 'General Department'}</span>
                </div>
                <div className="flex items-center bg-white/10 px-3 py-1 rounded-full">
                  <Shield className="w-4 h-4 mr-2" />
                  <span className="text-sm">Staff ID: {staffData.staffId || staffData.id}</span>
                </div>
                <div className="hidden md:flex items-center bg-white/10 px-3 py-1 rounded-full">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span className="text-sm">Avg. Resolution: {stats.avgResolutionTime}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-4 md:mt-0">
              <button
                onClick={fetchAssignedComplaints}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
              <button
                onClick={() => navigate('/staff/issues')}
                className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <ClipboardList className="w-5 h-5" />
                View All
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-red-800 mb-1">Unable to load complaints</h4>
                <p className="text-red-600 mb-3">{error}</p>
                <div className="flex space-x-3">
                  <button
                    onClick={fetchAssignedComplaints}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors font-medium"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={checkAuth}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    Check Authentication
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Assigned</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.assigned}</h3>
                <p className="text-green-600 text-xs mt-2 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2 from yesterday
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.pending}</h3>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">In Progress</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.inProgress}</h3>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Resolved</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.resolved}</h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">High Priority</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.highPriority}</h3>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search issues by title, description, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['all', 'pending', 'in-progress', 'resolved'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Complaints Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Assigned Issues</h2>
                    <p className="text-gray-600 mt-1">Manage and update the status of your assigned issues</p>
                  </div>
                  
                  <div className="mt-3 sm:mt-0">
                    <span className="text-sm text-gray-500">
                      Showing {filteredComplaints.length} of {assignedComplaints.length} issues
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="py-16 text-center">
                    <div className="inline-block">
                      <div className="w-12 h-12 border-4 border-blue-200 rounded-full"></div>
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin -mt-12"></div>
                    </div>
                    <p className="mt-6 text-gray-600">Loading your assigned issues...</p>
                    <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
                  </div>
                ) : filteredComplaints.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ClipboardList className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No issues found</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      {searchQuery 
                        ? "No issues match your search. Try different keywords."
                        : activeTab === 'all' 
                          ? "You don't have any assigned issues yet. Check back later or contact your supervisor."
                          : `No ${activeTab} issues found in your assignments.`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredComplaints.slice(0, 6).map((complaint) => (
                      <div 
                        key={complaint._id} 
                        className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
                                  {complaint.title}
                                </h3>
                                <div className="flex items-center gap-3 mt-2">
                                  <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${getStatusColor(complaint.status)}`}>
                                    {getStatusIcon(complaint.status)}
                                    <span className="text-xs font-medium capitalize">
                                      {complaint.status?.replace('_', ' ') || 'Unknown'}
                                    </span>
                                  </div>
                                  {complaint.priority && getPriorityBadge(complaint.priority)}
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-gray-600 mb-4 line-clamp-2">{complaint.description}</p>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                <span>By: {complaint.user?.name || 'Unknown User'}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>{formatDate(complaint.createdAt)}</span>
                              </div>
                              {complaint.location && (
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  <span className="truncate max-w-xs">{complaint.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 min-w-[180px]">
                            {complaint.status !== 'resolved' && complaint.status !== 'completed' && (
                              <>
                                {complaint.status === 'pending' && (
                                  <button
                                    onClick={() => updateComplaintStatus(complaint._id, 'in-progress')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                    Start Working
                                  </button>
                                )}
                                
                                {complaint.status === 'in-progress' && (
                                  <button
                                    onClick={() => updateComplaintStatus(complaint._id, 'resolved')}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Mark Resolved
                                  </button>
                                )}
                              </>
                            )}
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/staff/issues/${complaint._id}`)}
                                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                              <button
                                onClick={() => navigate(`/staff/chat/${complaint._id}`)}
                                className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Chat
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {filteredComplaints.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <button
                      onClick={() => navigate('/staff/issues')}
                      className="w-full px-5 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      View All Issues
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/staff/profile')}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3"
                >
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Update Profile</p>
                    <p className="text-xs text-gray-500">Edit your personal information</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/staff/reports')}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3"
                >
                  <BarChart3 className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Performance Report</p>
                    <p className="text-xs text-gray-500">View your performance metrics</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/staff/training')}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3"
                >
                  <Award className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Training Materials</p>
                    <p className="text-xs text-gray-500">Access training resources</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-600" />
                  Recent Activity
                </h3>
                <button className="text-blue-600 text-sm hover:text-blue-800">
                  See All
                </button>
              </div>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity._id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'status_update' ? 'bg-green-100 text-green-600' :
                        activity.type === 'comment' ? 'bg-blue-100 text-blue-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {activity.type === 'status_update' ? <CheckCircle className="w-4 h-4" /> :
                         activity.type === 'comment' ? <MessageSquare className="w-4 h-4" /> :
                         <Bell className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{activity.action}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">You resolved a water supply issue</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">New issue assigned: Road Maintenance</p>
                        <p className="text-xs text-gray-500">Yesterday, 4:30 PM</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Department Info */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Department Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium">{staffData.department?.name || staffData.department || 'General'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{staffData.department?.category || 'Infrastructure'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Staff Count:</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Avg. Response Time:</span>
                  <span className="font-medium text-green-600">4.2 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-gray-800">ResolveX</span>
                <span className="text-gray-400 mx-2">•</span>
                <span className="text-sm text-gray-600">Staff Portal v1.0</span>
              </div>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-4">
              <span>{staffData.department?.name || staffData.department}</span>
              <span>•</span>
              <span>Staff ID: {staffData.staffId || staffData.id}</span>
              <span>•</span>
              <span>{new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;