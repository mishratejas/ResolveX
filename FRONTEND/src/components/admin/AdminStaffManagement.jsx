import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import {
  Search, Filter, UserPlus, UserCheck, UserX, UserCog,
  Mail, Phone, MapPin, Briefcase, Shield, Star,
  TrendingUp, TrendingDown, Clock, CheckCircle, XCircle,
  MoreVertical, Edit, Trash2, Eye, Send, Lock,
  Unlock, Download, Upload, RefreshCw, ChevronDown,
  ChevronUp, Plus, X, AlertTriangle, Award,
  Target, BarChart3, Activity, Users, User as UserIcon,
  Calendar, Award as AwardIcon, Zap, Battery,
  BatteryCharging, Cpu, HardDrive, Database,
  Server, Network, Wifi, Cloud, Globe,
  ShieldCheck, ShieldAlert, Key, Fingerprint,
  QrCode, CreditCard, Wallet, Receipt,
  Coins, Building, Building2, Home,
  Factory, Warehouse, Store, Hotel,
  School, Hospital, Bank, Church,
  Tree, CloudRain, Sun, Wind,
  Droplets, Thermometer, Waves,
  Navigation, Compass, MapPin as MapPinIcon,
  Phone as PhoneIcon, Mail as MailIcon,
  Globe as GlobeIcon, Link, Link2,
  Share2, Upload as UploadIcon,
  Download as DownloadIcon, Printer,
  Copy, Archive, BookOpen, Book,
  Bookmark, HelpCircle, Info,
  ExternalLink, ChevronRight,
  ChevronLeft, MoreHorizontal,
  Menu, Hash, AtSign, Percent,
  Divide, Plus as PlusIcon,
  Minus, Multiply, Equal,
  NotEqual, GreaterThan,
  LessThan, Infinity,
  Pi, Sigma, Omega,
  Alpha, Beta, Gamma,
  Delta, Epsilon, Zeta,
  Eta, Theta, Iota,
  Kappa, Lambda, Mu,
  Nu, Xi, Omicron,
  Rho, Tau, Upsilon,
  Phi, Chi, Psi,
  ArrowRight, ArrowLeft,
  ArrowUp, ArrowDown,
  ArrowUpRight, ArrowDownRight,
  ArrowUpLeft, ArrowDownLeft,
  Maximize2, Minimize2,
  Minimize, Maximize,
  ZoomIn, ZoomOut,
  Crop, RotateCw,
  RotateCcw, Type,
  Bold, Italic,
  Underline, Strikethrough,
  Highlight, AlignLeft,
  AlignCenter, AlignRight,
  AlignJustify, List,
  ListOrdered, ListChecks,
  ListTodo, ListMinus,
  ListPlus, ListX,
  ListMusic, ListVideo,
  ListImage, ListRestart,
  Filter as FilterIcon,
  FilterX, SortAsc,
  SortDesc, Grid,
  Columns, Rows,
  Layout, Sidebar,
  SidebarClose, SidebarOpen,
  PanelLeft, PanelRight,
  PanelTop, PanelBottom,
  PanelTopClose, PanelBottomClose,
  PanelLeftClose, PanelRightClose,
  PanelTopOpen, PanelBottomOpen,
  PanelLeftOpen, PanelRightOpen,
  ToggleLeft, ToggleRight,
  ToggleLeft as ToggleLeftIcon,
  ToggleRight as ToggleRightIcon,
  CheckSquare, Square,
  CheckCircle as CheckCircleIcon,
  Circle, Radio,
  Check, X as XIcon,
  Minus as MinusIcon,
  Plus as PlusIcon2,
  Divide as DivideIcon,
  Percent as PercentIcon,
  Equal as EqualIcon,
  NotEqual as NotEqualIcon,
  GreaterThan as GreaterThanIcon,
  LessThan as LessThanIcon,
  ChevronsUp, ChevronsDown,
  ChevronsLeft, ChevronsRight,
  ChevronsUpDown, ChevronsLeftRight,
  Move, MoveVertical,
  MoveHorizontal, MoveDiagonal,
  MoveDiagonal2, MoveUp,
  MoveDown, MoveLeft,
  MoveRight, MoveUpLeft,
  MoveUpRight, MoveDownLeft,
  MoveDownRight, ArrowBigUp,
  ArrowBigDown, ArrowBigLeft,
  ArrowBigRight, ArrowBigUpDash,
  ArrowBigDownDash, ArrowBigLeftDash,
  ArrowBigRightDash, ArrowUpFromLine,
  ArrowDownFromLine, ArrowLeftFromLine,
  ArrowRightFromLine, ArrowUpToLine,
  ArrowDownToLine, ArrowLeftToLine,
  ArrowRightToLine, ArrowUpCircle,
  ArrowDownCircle, ArrowLeftCircle,
  ArrowRightCircle, ArrowUpSquare,
  ArrowDownSquare, ArrowLeftSquare,
  ArrowRightSquare, ArrowUpAZ,
  ArrowDownAZ, ArrowUpZA,
  ArrowDownZA, ArrowUp01,
  ArrowDown01, ArrowUp10,
  ArrowDown10, ArrowUpNarrowWide,
  ArrowDownWideNarrow, ArrowUpWideNarrow,
  ArrowDownNarrowWide, ArrowRightLeft,
  ArrowLeftRight, ArrowUpLeftFromCircle,
  ArrowUpRightFromCircle, ArrowDownLeftFromCircle,
  ArrowDownRightFromCircle, ArrowLeftFromLine as ArrowLeftFromLineIcon,
  ArrowRightFromLine as ArrowRightFromLineIcon,
  ArrowLeftToLine as ArrowLeftToLineIcon,
  ArrowRightToLine as ArrowRightToLineIcon,
  ArrowLeftCircle as ArrowLeftCircleIcon,
  ArrowRightCircle as ArrowRightCircleIcon,
  ArrowLeftSquare as ArrowLeftSquareIcon,
  ArrowRightSquare as ArrowRightSquareIcon,
  ArrowLeftRight as ArrowLeftRightIcon,
  ArrowRightLeft as ArrowRightLeftIcon,
  ArrowUpLeft as ArrowUpLeftIcon,
  ArrowUpRight as ArrowUpRightIcon,
  ArrowDownLeft as ArrowDownLeftIcon,
  ArrowDownRight as ArrowDownRightIcon,
  ArrowUpLeftFromCircle as ArrowUpLeftFromCircleIcon,
  ArrowUpRightFromCircle as ArrowUpRightFromCircleIcon,
  ArrowDownLeftFromCircle as ArrowDownLeftFromCircleIcon,
  ArrowDownRightFromCircle as ArrowDownRightFromCircleIcon,
  ArrowUpFromLine as ArrowUpFromLineIcon,
  ArrowDownFromLine as ArrowDownFromLineIcon,
  ArrowUpToLine as ArrowUpToLineIcon,
  ArrowDownToLine as ArrowDownToLineIcon,
  ArrowUpCircle as ArrowUpCircleIcon,
  ArrowDownCircle as ArrowDownCircleIcon,
  ArrowUpSquare as ArrowUpSquareIcon,
  ArrowDownSquare as ArrowDownSquareIcon,
  ArrowUpAZ as ArrowUpAZIcon,
  ArrowDownAZ as ArrowDownAZIcon,
  ArrowUpZA as ArrowUpZAIcon,
  ArrowDownZA as ArrowDownZAIcon,
  ArrowUp01 as ArrowUp01Icon,
  ArrowDown01 as ArrowDown01Icon,
  ArrowUp10 as ArrowUp10Icon,
  ArrowDown10 as ArrowDown10Icon,
  ArrowUpNarrowWide as ArrowUpNarrowWideIcon,
  ArrowDownWideNarrow as ArrowDownWideNarrowIcon,
  ArrowUpWideNarrow as ArrowUpWideNarrowIcon,
  ArrowDownNarrowWide as ArrowDownNarrowWideIcon,
  ArrowRightLeft as ArrowRightLeftIcon,
  ArrowLeftRight as ArrowLeftRightIcon
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, CartesianGrid, XAxis, YAxis } from 'recharts';

const SOCKET_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
let socket;

const AdminStaffManagement = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    department: 'all',
    status: 'all',
    role: 'all',
    performance: 'all'
  });
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    departments: {},
    performanceStats: {}
  });
  const [performanceData, setPerformanceData] = useState([]);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // WebSocket connection
  useEffect(() => {
    socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log('🔗 Connected to staff WebSocket');
      socket.emit('join_admin', { room: 'staff' });
    });

    socket.on('staff_created', (staff) => {
      setStaffList(prev => [staff, ...prev]);
      setRealTimeUpdates(prev => [
        { type: 'new', data: staff, timestamp: new Date() },
        ...prev.slice(0, 4)
      ]);
    });

    socket.on('staff_updated', (staff) => {
      setStaffList(prev => 
        prev.map(s => s._id === staff._id ? staff : s)
      );
    });

    socket.on('staff_deleted', (staffId) => {
      setStaffList(prev => prev.filter(s => s._id !== staffId));
    });

    socket.on('staff_activity', (activity) => {
      setRealTimeUpdates(prev => [activity, ...prev.slice(0, 4)]);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const [staffRes, statsRes, performanceRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/staff`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/staff/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/staff/performance`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (staffRes.data.success) {
        setStaffList(staffRes.data.data || []);
        setFilteredStaff(staffRes.data.data || []);
      }

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (performanceRes.data.success) {
        setPerformanceData(performanceRes.data.data);
      }

    } catch (error) {
      console.error('Error fetching staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    fetchStaffData();
  }, [navigate]);

  const handleSearch = useCallback(
    (term) => {
      let result = staffList;
      
      if (term) {
        result = result.filter(staff =>
          staff.name?.toLowerCase().includes(term.toLowerCase()) ||
          staff.email?.toLowerCase().includes(term.toLowerCase()) ||
          staff.staffId?.toLowerCase().includes(term.toLowerCase()) ||
          staff.department?.toLowerCase().includes(term.toLowerCase())
        );
      }

      Object.entries(selectedFilters).forEach(([key, value]) => {
        if (value !== 'all') {
          result = result.filter(staff => staff[key] === value);
        }
      });

      setFilteredStaff(result);
    },
    [staffList, selectedFilters]
  );

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, handleSearch]);

  const handleAddStaff = async (staffData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/staff`,
        staffData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowAddStaffModal(false);
        fetchStaffData();
        
        // Emit via socket
        if (socket) {
          socket.emit('staff_created', response.data.data);
        }
      }
    } catch (error) {
      console.error('Error adding staff:', error);
    }
  };

  const handleUpdateStaff = async (staffId, updates) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/admin/staff/${staffId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowEditStaffModal(false);
        fetchStaffData();
        
        if (socket) {
          socket.emit('staff_updated', response.data.data);
        }
      }
    } catch (error) {
      console.error('Error updating staff:', error);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/admin/staff/${staffId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        fetchStaffData();
        
        if (socket) {
          socket.emit('staff_deleted', staffId);
        }
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedStaff.length === 0) return;

    try {
      const token = localStorage.getItem('adminToken');
      
      switch (action) {
        case 'activate':
          await axios.post(
            `${process.env.REACT_APP_API_URL}/api/admin/staff/bulk-activate`,
            { staffIds: selectedStaff },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        
        case 'deactivate':
          await axios.post(
            `${process.env.REACT_APP_API_URL}/api/admin/staff/bulk-deactivate`,
            { staffIds: selectedStaff },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        
        case 'assign_department':
          const department = prompt('Enter department:');
          if (department) {
            await axios.post(
              `${process.env.REACT_APP_API_URL}/api/admin/staff/bulk-assign-department`,
              { staffIds: selectedStaff, department },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
          break;
        
        case 'delete':
          if (window.confirm(`Delete ${selectedStaff.length} staff members?`)) {
            await axios.post(
              `${process.env.REACT_APP_API_URL}/api/admin/staff/bulk-delete`,
              { staffIds: selectedStaff },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
          break;
      }

      fetchStaffData();
      setSelectedStaff([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status) => {
    return status === 'active' 
      ? 'text-green-600 bg-green-100' 
      : 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff data...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600">
              Manage staff accounts, permissions, and performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
            >
              {viewMode === 'table' ? 'Grid View' : 'Table View'}
            </button>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Staff
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Staff</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Performance</p>
              <p className="text-2xl font-bold">
                {performanceData.length > 0 
                  ? Math.round(performanceData.reduce((a, b) => a + b.score, 0) / performanceData.length) 
                  : 0}%
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Departments</p>
              <p className="text-2xl font-bold">
                {Object.keys(stats.departments || {}).length}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Building className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search staff by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedFilters.department}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, department: e.target.value }))}
              className="px-4 py-3 border border-gray-300 rounded-xl"
            >
              <option value="all">All Departments</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Electricity">Electricity</option>
              <option value="Road Maintenance">Road Maintenance</option>
              <option value="Sanitation">Sanitation</option>
            </select>
            
            <select
              value={selectedFilters.status}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-3 border border-gray-300 rounded-xl"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <button
              onClick={fetchStaffData}
              className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Staff List */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Table Header with Bulk Actions */}
          {selectedStaff.length > 0 && (
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-blue-800">
                    {selectedStaff.length} staff selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkAction(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Bulk Actions</option>
                    <option value="activate">Activate</option>
                    <option value="deactivate">Deactivate</option>
                    <option value="assign_department">Assign Department</option>
                    <option value="delete">Delete</option>
                  </select>
                  <button
                    onClick={() => setSelectedStaff([])}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedStaff.length === filteredStaff.length && filteredStaff.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStaff(filteredStaff.map(s => s._id));
                        } else {
                          setSelectedStaff([]);
                        }
                      }}
                      className="rounded border-gray-300 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left">Staff Member</th>
                  <th className="px-6 py-4 text-left">Department</th>
                  <th className="px-6 py-4 text-left">Contact</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Performance</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStaff.map((staff) => (
                  <tr key={staff._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedStaff.includes(staff._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStaff([...selectedStaff, staff._id]);
                          } else {
                            setSelectedStaff(selectedStaff.filter(id => id !== staff._id));
                          }
                        }}
                        className="rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{staff.name}</p>
                          <p className="text-sm text-gray-500">{staff.staffId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg text-sm">
                        {staff.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-900">{staff.email}</p>
                        <p className="text-sm text-gray-500">{staff.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(staff.status)}`}>
                        {staff.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              staff.performance >= 90 ? 'bg-green-500' :
                              staff.performance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${staff.performance || 0}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getPerformanceColor(staff.performance || 0)} px-2 py-1 rounded`}>
                          {staff.performance || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCurrentStaff(staff);
                            setShowPerformanceModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Performance"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentStaff(staff);
                            setShowEditStaffModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/staff/${staff._id}/activity`)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="Activity"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staff._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staff) => (
            <div key={staff._id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{staff.name}</h3>
                    <p className="text-sm text-gray-500">{staff.staffId}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(staff.status)}`}>
                  {staff.status}
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{staff.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{staff.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{staff.phone}</span>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Performance</span>
                  <span className={`text-sm font-medium ${getPerformanceColor(staff.performance || 0)}`}>
                    {staff.performance || 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      staff.performance >= 90 ? 'bg-green-500' :
                      staff.performance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${staff.performance || 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setCurrentStaff(staff);
                    setShowEditStaffModal(true);
                  }}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                >
                  Edit
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/admin/staff/${staff._id}/activity`)}
                    className="p-1.5 hover:bg-gray-100 rounded"
                  >
                    <Activity className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setCurrentStaff(staff)}
                    className="p-1.5 hover:bg-blue-100 rounded"
                  >
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Add New Staff Member</h3>
                <button onClick={() => setShowAddStaffModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData);
                handleAddStaff(data);
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Staff ID</label>
                    <input
                      type="text"
                      name="staffId"
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="Enter staff ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Department</label>
                    <select
                      name="department"
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select department</option>
                      <option value="Water Supply">Water Supply</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Road Maintenance">Road Maintenance</option>
                      <option value="Sanitation">Sanitation</option>
                      <option value="Police">Police</option>
                      <option value="Fire Department">Fire Department</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Role</label>
                    <select
                      name="role"
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    >
                      <option value="staff">Staff</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Permissions</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      'view_complaints',
                      'manage_complaints',
                      'assign_complaints',
                      'view_users',
                      'manage_users',
                      'generate_reports',
                      'system_settings'
                    ].map(permission => (
                      <label key={permission} className="flex items-center">
                        <input
                          type="checkbox"
                          name="permissions"
                          value={permission}
                          className="mr-2"
                        />
                        <span className="text-sm">
                          {permission.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Staff Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Performance Modal */}
      {showPerformanceModal && currentStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{currentStaff.name}'s Performance</h3>
                  <p className="text-gray-600">{currentStaff.department}</p>
                </div>
                <button onClick={() => setShowPerformanceModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {currentStaff.performance || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {currentStaff.complaintsResolved || 0}
                  </div>
                  <div className="text-sm text-gray-600">Complaints Resolved</div>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {currentStaff.averageResolutionTime || '0'}h
                  </div>
                  <div className="text-sm text-gray-600">Avg. Resolution Time</div>
                </div>
              </div>
              
              {/* Performance Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaffManagement;
