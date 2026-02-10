import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import {
  Search, UserCheck, MessageSquare, CheckCircle, XCircle,
  Clock, AlertCircle, MoreVertical, Download, Eye, User,
  ChevronDown, ChevronUp, RefreshCw, Users, FileText,
  Trash2, Edit, Plus, Shield, MapPin, Calendar,
  BarChart2, SortAsc, SortDesc, Share2, Flag,
  Activity, AlertTriangle, MessageCircle,
  ExternalLink, Link, Tag, Building,
  Mail, Phone, Globe, Award, Target, TrendingDown, Star, Pin,
  Lock, Unlock, EyeOff, Copy, Send,
  Heart, ThumbsUp, ThumbsDown,
  Zap, Battery, BatteryCharging, Cloud,
  Database, Server, Network, Wifi,
  ShieldCheck, ShieldAlert, Key,
  Fingerprint, QrCode, CreditCard,
  Wallet, Receipt, Coins, Store,
  School, Hospital, Church,
   CloudRain, Sun, Wind,
  Droplets, Thermometer, Waves,
  Navigation, Compass,
  Link2, Share, Upload, Printer,
  Archive, BookOpen, Book, Bookmark,
  HelpCircle, Info, Maximize2, Minimize2,
  ZoomIn, ZoomOut, Crop, RotateCw,
  RotateCcw, Type, Bold, Italic,
  Underline, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight,
  AlignJustify, List, ListOrdered,
  ListChecks, ListTodo, ListMinus,
  ListPlus, ListX, ListMusic, ListVideo, ListRestart, Grid, Columns,
  Rows, Layout, Sidebar, SidebarClose,
  SidebarOpen, PanelLeft, PanelRight,
  PanelTop, PanelBottom, ToggleLeft,
  ToggleRight, CheckSquare, Square,
  Radio, Check, Minus, Divide, Percent,
  Equal, ChevronsUp, ChevronsDown, ChevronsLeft,
  ChevronsRight, Move, MoveVertical,
  MoveHorizontal, MoveDiagonal, MoveDiagonal2,
  ArrowUp, ArrowDown, ArrowRight,
  ArrowUpRight, ArrowDownRight,
  ArrowUpLeft, ArrowDownLeft, Maximize,
  Minimize, TrendingUp,
  FilterIcon as Filter,
  FilterX,
  ArrowLeft as ArrowLeftIcon,
  Hash, AtSign
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  CartesianGrid,
  XAxis,
  YAxis,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap
} from 'recharts';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
let socket;

const AdminIssuesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'all',
    department: 'all',
    priority: 'all',
    dateRange: 'all',
    assignedTo: 'all',
    category: 'all',
    urgency: 'all'
  });
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    highPriority: 0,
    assigned: 0,
    overdue: 0,
    today: 0,
    week: 0,
    month: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 20,
    totalPages: 1,
    totalItems: 0
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const [chartData, setChartData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    // WebSocket connection
    socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log('🔗 Connected to complaints WebSocket');
      socket.emit('join_admin', { room: 'complaints' });
    });

    socket.on('new_complaint', (complaint) => {
      setComplaints(prev => [complaint, ...prev]);
      setRealTimeUpdates(prev => [
        { 
          type: 'new', 
          data: complaint, 
          timestamp: new Date(),
          id: Date.now() + Math.random()
        },
        ...prev.slice(0, 9)
      ]);
      updateStats({ type: 'increment', field: 'total' });
    });

    socket.on('complaint_updated', (updatedComplaint) => {
      setComplaints(prev => 
        prev.map(c => c._id === updatedComplaint._id ? updatedComplaint : c)
      );
      setRealTimeUpdates(prev => [
        { 
          type: 'update', 
          data: updatedComplaint, 
          timestamp: new Date(),
          id: Date.now() + Math.random()
        },
        ...prev.slice(0, 9)
      ]);
    });

    socket.on('complaint_resolved', (data) => {
      updateStats({ type: 'increment', field: 'resolved' });
      updateStats({ type: 'decrement', field: 'inProgress' });
    });

    socket.on('complaint_deleted', (complaintId) => {
      setComplaints(prev => prev.filter(c => c._id !== complaintId));
      updateStats({ type: 'decrement', field: 'total' });
    });

    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    setRefreshInterval(interval);

    return () => {
      if (socket) socket.disconnect();
      if (interval) clearInterval(interval);
    };
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const [complaintsRes, staffRes, statsRes, departmentsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/issues`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page: pagination.currentPage,
            limit: pagination.itemsPerPage,
            sort: `${sortConfig.direction === 'desc' ? '-' : ''}${sortConfig.key}`,
            ...selectedFilters
          }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/staff`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/issues/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/departments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (complaintsRes.data.success) {
        const data = complaintsRes.data;
        setComplaints(data.data || []);
        setFilteredComplaints(data.data || []);
        setPagination(prev => ({
          ...prev,
          totalPages: data.totalPages || 1,
          totalItems: data.total || 0
        }));
      }

      if (staffRes.data.success) {
        setStaffList(staffRes.data.data || []);
      }

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (departmentsRes.data.success) {
        setDepartments(departmentsRes.data.data || []);
        // Extract unique categories
        const uniqueCategories = [...new Set(departmentsRes.data.data.map(dept => dept.category))];
        setCategories(uniqueCategories);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (update) => {
    setStats(prev => ({
      ...prev,
      [update.field]: update.type === 'increment' ? prev[update.field] + 1 : Math.max(0, prev[update.field] - 1)
    }));
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim() === '') {
      setFilteredComplaints(complaints);
      return;
    }
    
    const filtered = complaints.filter(complaint => 
      complaint.title?.toLowerCase().includes(value.toLowerCase()) ||
      complaint.description?.toLowerCase().includes(value.toLowerCase()) ||
      complaint.user?.name?.toLowerCase().includes(value.toLowerCase()) ||
      complaint.user?.email?.toLowerCase().includes(value.toLowerCase()) ||
      complaint.department?.toLowerCase().includes(value.toLowerCase()) ||
      complaint.category?.toLowerCase().includes(value.toLowerCase()) ||
      complaint.ticketId?.toLowerCase().includes(value.toLowerCase())
    );
    
    setFilteredComplaints(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const applyFilters = useCallback(() => {
    let filtered = [...complaints];
    
    if (selectedFilters.status !== 'all') {
      filtered = filtered.filter(c => c.status === selectedFilters.status);
    }
    
    if (selectedFilters.department !== 'all') {
      filtered = filtered.filter(c => c.department === selectedFilters.department);
    }
    
    if (selectedFilters.priority !== 'all') {
      filtered = filtered.filter(c => c.priority === selectedFilters.priority);
    }
    
    if (selectedFilters.assignedTo !== 'all') {
      if (selectedFilters.assignedTo === 'unassigned') {
        filtered = filtered.filter(c => !c.assignedTo);
      } else {
        filtered = filtered.filter(c => c.assignedTo?._id === selectedFilters.assignedTo);
      }
    }
    
    if (selectedFilters.category !== 'all') {
      filtered = filtered.filter(c => c.category === selectedFilters.category);
    }
    
    // Apply search
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(complaint => 
        complaint.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredComplaints(filtered);
  }, [complaints, selectedFilters, searchTerm, sortConfig]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleBulkAssign = async () => {
    if (!selectedStaff || selectedRows.length === 0) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/issues/bulk-assign`,
        {
          complaintIds: selectedRows,
          assignedTo: selectedStaff
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update locally
      setComplaints(prev => 
        prev.map(c => 
          selectedRows.includes(c._id) 
            ? { ...c, assignedTo: staffList.find(s => s._id === selectedStaff) }
            : c
        )
      );
      
      setSelectedRows([]);
      setSelectedStaff('');
      setShowAssignModal(false);
      
    } catch (error) {
      console.error('Error in bulk assign:', error);
    }
  };

  const exportToFile = () => {
    const data = filteredComplaints.map(complaint => ({
      'Ticket ID': complaint.ticketId || 'N/A',
      'Title': complaint.title,
      'Description': complaint.description,
      'Status': complaint.status,
      'Priority': complaint.priority,
      'Category': complaint.category,
      'Department': complaint.department,
      'User': complaint.user?.name || 'N/A',
      'Assigned To': complaint.assignedTo?.name || 'Unassigned',
      'Created At': new Date(complaint.createdAt).toLocaleString(),
      'Last Updated': new Date(complaint.updatedAt).toLocaleString()
    }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaints_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    setShowExportModal(false);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleComplaintClick = (complaint) => {
    navigate(`/admin/issues/${complaint._id}`);
  };

  const handleChatClick = (complaint, e) => {
    e.stopPropagation();
    navigate(`/admin/chat?complaint=${complaint._id}&staff=${complaint.assignedTo?._id}`);
  };

  const handleEditClick = (complaint, e) => {
    e.stopPropagation();
    navigate(`/admin/issues/${complaint._id}/edit`);
  };

  const handleAssignClick = (complaint, e) => {
    e.stopPropagation();
    setSelectedRows([complaint._id]);
    setShowAssignModal(true);
  };

  const handleDeleteClick = async (complaintId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/issues/${complaintId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setComplaints(prev => prev.filter(c => c._id !== complaintId));
    } catch (error) {
      console.error('Error deleting complaint:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading && complaints.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Real-time updates indicator */}
      {realTimeUpdates.length > 0 && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 animate-slideIn">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
              <span className="text-sm font-semibold text-gray-900">Live Updates</span>
              <button
                onClick={() => setRealTimeUpdates([])}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {realTimeUpdates.map((update) => (
                <div key={update.id} className="text-sm p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100">
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      update.type === 'new' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <span className={`font-medium ${
                        update.type === 'new' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {update.type === 'new' ? 'New' : 'Updated'}
                      </span>
                      <span className="text-gray-600 ml-2 truncate block">
                        {update.data.title?.substring(0, 40)}...
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(update.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Complaints Management</h1>
              <p className="text-gray-600">
                Real-time monitoring and management of all user complaints
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
                className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
              >
                {viewMode === 'table' ? 'Card View' : 'Table View'}
              </button>
              <button
                onClick={() => setShowStatsModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 shadow-sm"
              >
                <BarChart2 className="w-4 h-4" />
                Analytics
              </button>
              <button
                onClick={() => navigate('/admin/issues/create')}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Complaint
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Total', value: stats.total, icon: FileText, color: 'bg-blue-500', change: '+12%' },
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-yellow-500', change: '+5%' },
              { label: 'In Progress', value: stats.inProgress, icon: Activity, color: 'bg-purple-500', change: '+8%' },
              { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'bg-green-500', change: '+15%' },
              { label: 'High Priority', value: stats.highPriority, icon: AlertTriangle, color: 'bg-red-500', change: '+3%' },
            ].map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.color.replace('bg-', 'bg-')} bg-opacity-10`}>
                    <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {stat.change.startsWith('+') ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-xs ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search complaints by title, description, user, or ID..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                onClick={fetchData}
                className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedFilters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={selectedFilters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={selectedFilters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                  <select
                    value={selectedFilters.assignedTo}
                    onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Staff</option>
                    <option value="unassigned">Unassigned</option>
                    {staffList.map(staff => (
                      <option key={staff._id} value={staff._id}>{staff.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {showAdvancedFilters && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={selectedFilters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <select
                      value={selectedFilters.dateRange}
                      onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="quarter">This Quarter</option>
                    </select>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {showAdvancedFilters ? 'Hide Advanced' : 'Show Advanced'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedFilters({
                        status: 'all',
                        department: 'all',
                        priority: 'all',
                        dateRange: 'all',
                        assignedTo: 'all',
                        category: 'all',
                        urgency: 'all'
                      });
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedRows.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-6 border border-blue-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-700 font-bold">{selectedRows.length}</span>
                </div>
                <div>
                  <p className="font-medium text-blue-800">{selectedRows.length} complaints selected</p>
                  <p className="text-sm text-blue-600">Choose an action below</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => {
                    const action = e.target.value;
                    setBulkAction(action);
                    
                    switch (action) {
                      case 'assign':
                        setShowAssignModal(true);
                        break;
                      case 'change_status':
                        const status = prompt('Enter new status (pending/in-progress/resolved/closed):');
                        if (status) {
                          handleBulkStatusChange(status);
                        }
                        break;
                      case 'change_priority':
                        const priority = prompt('Enter new priority (low/medium/high/critical):');
                        if (priority) {
                          handleBulkPriorityChange(priority);
                        }
                        break;
                      case 'delete':
                        if (window.confirm(`Delete ${selectedRows.length} complaints?`)) {
                          handleBulkDelete();
                        }
                        break;
                      default:
                        break;
                    }
                    
                    setBulkAction('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">Bulk Actions</option>
                  <option value="assign">Assign to Staff</option>
                  <option value="change_status">Change Status</option>
                  <option value="change_priority">Change Priority</option>
                  <option value="export">Export Selected</option>
                  <option value="delete">Delete Selected</option>
                </select>
                
                <button
                  onClick={() => setSelectedRows([])}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Complaints Display */}
        {viewMode === 'table' ? (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === filteredComplaints.length && filteredComplaints.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows(filteredComplaints.map(c => c._id));
                          } else {
                            setSelectedRows([]);
                          }
                        }}
                        className="rounded border-gray-300 focus:ring-blue-500 h-4 w-4"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('title')}
                        className="flex items-center gap-1 hover:text-gray-900"
                      >
                        Complaint
                        {sortConfig.key === 'title' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('user.name')}
                        className="flex items-center gap-1 hover:text-gray-900"
                      >
                        User
                        {sortConfig.key === 'user.name' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('priority')}
                        className="flex items-center gap-1 hover:text-gray-900"
                      >
                        Priority
                        {sortConfig.key === 'priority' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-1 hover:text-gray-900"
                      >
                        Created
                        {sortConfig.key === 'createdAt' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredComplaints.map((complaint) => (
                    <tr 
                      key={complaint._id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleComplaintClick(complaint)}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(complaint._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows([...selectedRows, complaint._id]);
                            } else {
                              setSelectedRows(selectedRows.filter(id => id !== complaint._id));
                            }
                          }}
                          className="rounded border-gray-300 focus:ring-blue-500 h-4 w-4"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {complaint.priority === 'high' && (
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mt-1.5"></div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                                {complaint.title}
                              </h4>
                              {complaint.hasUnreadMessages && (
                                <MessageCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-1 mt-1">{complaint.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                {complaint.department}
                              </span>
                              {complaint.category && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                  {complaint.category}
                                </span>
                              )}
                              {complaint.location && (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {complaint.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{complaint.user?.name}</p>
                            <p className="text-sm text-gray-500 truncate max-w-[150px]">{complaint.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={complaint.status}
                          onChange={async (e) => {
                            e.stopPropagation();
                            try {
                              const token = localStorage.getItem('adminToken');
                              await axios.put(
                                `${import.meta.env.VITE_API_URL}/api/admin/issues/${complaint._id}`,
                                { status: e.target.value },
                                { headers: { Authorization: `Bearer ${token}` } }
                              );
                              
                              setComplaints(prev => 
                                prev.map(c => 
                                  c._id === complaint._id 
                                    ? { ...c, status: e.target.value }
                                    : c
                                )
                              );
                            } catch (error) {
                              console.error('Error updating status:', error);
                            }
                          }}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-opacity-50 cursor-pointer ${getStatusColor(complaint.status)}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={complaint.priority}
                          onChange={async (e) => {
                            e.stopPropagation();
                            try {
                              const token = localStorage.getItem('adminToken');
                              await axios.put(
                                `${import.meta.env.VITE_API_URL}/api/admin/issues/${complaint._id}`,
                                { priority: e.target.value },
                                { headers: { Authorization: `Bearer ${token}` } }
                              );
                              
                              setComplaints(prev => 
                                prev.map(c => 
                                  c._id === complaint._id 
                                    ? { ...c, priority: e.target.value }
                                    : c
                                )
                              );
                            } catch (error) {
                              console.error('Error updating priority:', error);
                            }
                          }}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-opacity-50 cursor-pointer ${getPriorityColor(complaint.priority)}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900 font-medium">
                            {formatDate(complaint.createdAt)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(complaint.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                          {complaint.dueDate && new Date(complaint.dueDate) < new Date() && (
                            <p className="text-xs text-red-600 mt-1 font-medium">
                              Overdue
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleChatClick(complaint, e)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chat"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleEditClick(complaint, e)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleAssignClick(complaint, e)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Assign"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <div className="relative group">
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                              <div className="py-1">
                                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors">
                                  <Copy className="w-3 h-3 inline mr-2" />
                                  Duplicate
                                </button>
                                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors">
                                  <Flag className="w-3 h-3 inline mr-2" />
                                  Flag
                                </button>
                                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors">
                                  <Archive className="w-3 h-3 inline mr-2" />
                                  Archive
                                </button>
                                <div className="border-t border-gray-200 my-1"></div>
                                <button
                                  onClick={(e) => handleDeleteClick(complaint._id, e)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3 inline mr-2" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredComplaints.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search or filters' : 'No complaints have been submitted yet'}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Card View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComplaints.map((complaint) => (
              <div 
                key={complaint._id} 
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => handleComplaintClick(complaint)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-3 h-3 rounded-full ${
                        complaint.priority === 'high' ? 'bg-red-500' :
                        complaint.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></span>
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {complaint.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{complaint.description}</p>
                  </div>
                  {complaint.hasUnreadMessages && (
                    <div className="relative flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-blue-500" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">User</span>
                    <span className="text-sm font-medium">{complaint.user?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Department</span>
                    <span className="text-sm font-medium">{complaint.department}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Created</span>
                    <span className="text-sm">
                      {formatDate(complaint.createdAt)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <select
                    value={complaint.status}
                    onChange={async (e) => {
                      e.stopPropagation();
                      try {
                        const token = localStorage.getItem('adminToken');
                        await axios.put(
                          `${import.meta.env.VITE_API_URL}/api/admin/issues/${complaint._id}`,
                          { status: e.target.value },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        
                        setComplaints(prev => 
                          prev.map(c => 
                            c._id === complaint._id 
                              ? { ...c, status: e.target.value }
                              : c
                          )
                        );
                      } catch (error) {
                        console.error('Error updating status:', error);
                      }
                    }}
                    className="text-xs px-2 py-1 rounded border focus:outline-none cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/issues/${complaint._id}`);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => handleChatClick(complaint, e)}
                      className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                      title="Chat"
                    >
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredComplaints.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                {pagination.totalItems} complaints
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                        className={`w-8 h-8 rounded-lg ${
                          pagination.currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-scaleIn">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Format</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>CSV</option>
                    <option>Excel</option>
                    <option>PDF</option>
                    <option>JSON</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date Range</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                    <option>Custom Range</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Include Fields</label>
                  <div className="space-y-2">
                    {[
                      'Complaint Details',
                      'User Information',
                      'Staff Assignments',
                      'Status History',
                      'Internal Notes',
                      'Attachments'
                    ].map((field) => (
                      <label key={field} className="flex items-center hover:bg-gray-50 p-2 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">{field}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={exportToFile}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-sm"
                  >
                    Export Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-scaleIn">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Assign {selectedRows.length} Complaint{selectedRows.length !== 1 ? 's' : ''}
                </h3>
                <button 
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedStaff('');
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Staff</label>
                  <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map(staff => (
                      <option key={staff._id} value={staff._id}>
                        {staff.name} ({staff.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Priority Level</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg">
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input 
                    type="date" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Instructions (Optional)</label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Add specific instructions for the staff..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedStaff('');
                    }}
                    className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAssign}
                    disabled={!selectedStaff}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                  >
                    Assign Complaints
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Complaints Analytics</h3>
                <button 
                  onClick={() => setShowStatsModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4">Resolution Rate</h4>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                    </div>
                    <p className="text-gray-600">Overall resolution rate</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4">Average Response Time</h4>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">4.2h</div>
                    <p className="text-gray-600">Average time to first response</p>
                  </div>
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Jan', complaints: 120, resolved: 95 },
                    { name: 'Feb', complaints: 150, resolved: 120 },
                    { name: 'Mar', complaints: 180, resolved: 150 },
                    { name: 'Apr', complaints: 200, resolved: 170 },
                    { name: 'May', complaints: 220, resolved: 190 },
                    { name: 'Jun', complaints: 240, resolved: 210 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="complaints" fill="#3b82f6" name="Total Complaints" />
                    <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIssuesPage;