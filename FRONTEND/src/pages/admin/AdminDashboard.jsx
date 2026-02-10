import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Users, FileText, CheckCircle, Clock, AlertTriangle,
  TrendingUp, Download, Eye, UserCog, Settings, Bell,
  Shield, Home, BarChart3, MessageSquare,
  Activity, ArrowUpRight, ArrowDownRight,
  RefreshCw, Calendar, ChevronRight, ChevronDown,
  AlertCircle, Menu, User, ChevronLeft,
  Database, Cpu, HardDrive, Network, Zap,
  BatteryCharging, Target, PieChart,
  TrendingDown, UserCheck, Building, ShieldCheck,
  LineChart, Globe, Mail, Phone,
  Star, Award, Percent, Filter, Search,
  MoreVertical, ExternalLink, ChevronsUp,
  ChevronsDown, Plus, Minimize2, Layers,
  Compass, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Flame, Sun, Zap as Lightning,
  Target as Bullseye,
  TrendingUp as ChartUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart as RechartsLine,
  Line,
  BarChart as RechartsBar,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  AreaChart as RechartsAreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

import * as adminService from '../../services/adminService.js';

const AdminDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  
  // State Management
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalComplaints: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      satisfaction: 0,
      totalUsers: 0,
      activeStaff: 0,
      totalDepartments: 0,
      todayComplaints: 0,
      weeklyGrowth: 0
    },
    recentActivity: [],
    topPerformers: [],
    urgentIssues: [],
    departmentStats: [],
    performanceTrends: []
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeStat, setActiveStat] = useState('all');

  // Fetch Data
  const fetchAllDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const dashboardRes = await adminService.getDashboardData();
      
      if (dashboardRes.success) {
        const backendData = dashboardRes.data;
        
        setDashboardData({
          stats: {
            totalComplaints: backendData.stats?.totalComplaints || 0,
            pending: backendData.stats?.pending || 0,
            inProgress: backendData.stats?.inProgress || 0,
            resolved: backendData.stats?.resolved || 0,
            satisfaction: backendData.stats?.satisfaction || 0,
            totalUsers: backendData.stats?.users || 0,
            activeStaff: backendData.stats?.staff || 0,
            totalDepartments: backendData.stats?.departments || 0,
            todayComplaints: backendData.stats?.today || 0,
            weeklyGrowth: backendData.stats?.weeklyGrowth || 0
          },
          recentActivity: backendData.recentActivity?.map(item => ({
            id: item.id || item._id,
            type: item.type || 'complaint_created',
            title: item.title || 'Unknown Activity',
            user: item.user?.name || 'System',
            timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
            priority: item.priority || 'medium'
          })) || [],
          topPerformers: backendData.performance?.topPerformers?.map(staff => ({
            id: staff._id,
            name: staff.name,
            department: staff.department,
            resolutionRate: staff.resolutionRate || 0,
            resolved: staff.resolvedCount || 0,
            avatarColor: getRandomGradient()
          })) || [],
          urgentIssues: [],
          departmentStats: [],
          performanceTrends: backendData.trends?.daily?.map(day => ({
            date: day.day || day.date,
            total: day.complaints || 0,
            resolved: day.resolved || 0,
            pending: (day.complaints || 0) - (day.resolved || 0)
          })) || []
        });
      }

      // Fetch additional data
      try {
        const chartRes = await adminService.getChartData(timeRange);
        if (chartRes.success && chartRes.data) {
          setDashboardData(prev => ({
            ...prev,
            performanceTrends: chartRes.data.dailyComplaints?.map(day => ({
              date: day.day || formatDate(day.date),
              total: day.complaints || 0,
              resolved: day.resolved || 0,
              pending: Math.max(0, (day.complaints || 0) - (day.resolved || 0))
            })) || [],
            departmentStats: chartRes.data.departments?.map(dept => ({
              name: dept.name,
              totalComplaints: dept.value || 0,
              resolved: Math.floor((dept.value || 0) * 0.7),
              color: getDepartmentColor(dept.name)
            })) || []
          }));
        }
      } catch (chartError) {
        console.warn('Chart data error:', chartError);
      }

      setLastUpdated(new Date());
      setIsOnline(true);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load dashboard data');
      setIsOnline(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  // Effects
  useEffect(() => {
    fetchAllDashboardData();
  }, [fetchAllDashboardData]);

  useEffect(() => {
    let interval;
    if (autoRefresh && !loading) {
      interval = setInterval(() => {
        fetchAllDashboardData();
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, loading, fetchAllDashboardData]);

  // Helper Functions
  const getRandomGradient = () => {
    const gradients = [
      'from-amber-600 to-orange-600',
      'from-orange-600 to-red-600',
      'from-yellow-600 to-amber-600',
      'from-red-600 to-rose-600',
      'from-orange-500 to-amber-500'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  const getDepartmentColor = (department) => {
    const colorMap = {
      'Water Supply': '#f59e0b',
      'Electricity': '#ea580c',
      'Road Maintenance': '#dc2626',
      'Sanitation': '#f97316',
      'Police': '#b91c1c',
      'Healthcare': '#ef4444',
      'Education': '#fbbf24',
      'Transport': '#d97706'
    };
    return colorMap[department] || '#ea580c';
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (timeRange === '1d') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (timeRange === '7d') return date.toLocaleDateString([], { weekday: 'short' });
    if (timeRange === '30d') return date.getDate().toString();
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Handlers
  const handleLogout = async () => {
    try {
      await adminService.adminLogout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      navigate('/admin/login');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllDashboardData();
  };

  // StatCard Component
  const StatCard = ({ title, value, icon: Icon, change, color, description, onClick }) => {
    const isPositive = change > 0;
    
    return (
      <motion.div 
        whileHover={{ y: -5, scale: 1.02 }}
        onClick={onClick}
        className="group relative bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-orange-100 hover:border-orange-200"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-amber-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg ${color.bg} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300`}>
              <Icon className={`w-6 h-6 ${color.text}`} />
            </div>
            {change !== undefined && (
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                  isPositive 
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 border border-rose-200'
                }`}
              >
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(change)}%
              </motion.div>
            )}
          </div>
          
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-2">{description}</p>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 group-hover:border-orange-200 transition-colors">
            <div className="flex items-center gap-1">
              <ChevronRight className="w-4 h-4 text-orange-500 opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all" />
              <p className="text-xs text-gray-500 group-hover:text-orange-600 transition-colors">View details</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Loading State
  if (loading && !dashboardData.stats.totalComplaints) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading live dashboard...</p>
          <p className="text-gray-500 text-sm">Please wait</p>
        </div>
      </div>
    );
  }

  // Main Render
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-orange-50/40 to-transparent"></div>
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute -bottom-20 left-1/3 w-64 h-64 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#fef3c7_1px,transparent_1px),linear-gradient(to_bottom,#fef3c7_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.02]"></div>
      </div>

      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-orange-100 shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-orange-50 rounded-lg transition-all duration-200 border border-orange-200"
              >
                <Menu className="w-5 h-5 text-orange-600" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center shadow-md border border-orange-500/30">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    RESOLVEX ADMIN
                  </h1>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="font-medium">Super Administrator</span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span className={`font-semibold ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isOnline ? '● LIVE' : '○ OFFLINE'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Time Range */}
              <div className="relative group">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  disabled={refreshing}
                  className="appearance-none bg-white border border-orange-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer hover:bg-orange-50 transition-colors disabled:opacity-50"
                >
                  <option value="1d">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              
              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-orange-50 rounded-lg transition-all duration-200 border border-orange-200 disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`w-5 h-5 text-orange-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setUnreadNotifications(0)}
                  className="p-2 hover:bg-orange-50 rounded-lg transition-all duration-200 relative group border border-orange-200"
                >
                  <div className="relative">
                    <Bell className="w-5 h-5 text-orange-600 group-hover:text-orange-700 transition-colors" />
                    {unreadNotifications > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-md border border-white">
                        {unreadNotifications}
                      </div>
                    )}
                  </div>
                </button>
              </div>
              
              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 hover:bg-orange-50 rounded-lg transition-all duration-200 group border border-orange-200">
                  <div className="relative">
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md border border-orange-500/30">
                      A
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:rotate-180" />
                </button>
                
                <div className="absolute right-0 mt-2 w-64 bg-white backdrop-blur-xl rounded-xl shadow-lg border border-orange-200 z-50 transform origin-top-right scale-95 opacity-0 invisible group-hover:scale-100 group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-4 border-b border-orange-100">
                    <p className="font-bold text-gray-900">Super Admin</p>
                    <p className="text-sm text-gray-600 truncate">admin@resolvex.com</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'text-emerald-600' : ''}`} />
                      Auto-refresh {autoRefresh ? '✓ ON' : 'OFF'}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 rounded-lg hover:from-orange-100 hover:to-red-100 transition-all flex items-center gap-2 font-medium border border-orange-200 mt-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white/95 backdrop-blur-xl border-r border-orange-100 transition-all duration-300 z-40 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="p-4 overflow-y-auto h-full">
          <nav className="space-y-2">
            {[
              { icon: Home, label: 'Dashboard', path: '/admin/dashboard', active: true, badge: null },
              { icon: FileText, label: 'Complaints', path: '/admin/issues', active: false, badge: dashboardData.stats.pending },
              { icon: Users, label: 'Users', path: '/admin/users', active: false, badge: dashboardData.stats.totalUsers },
              { icon: UserCog, label: 'Staff', path: '/admin/staff', active: false, badge: dashboardData.stats.activeStaff },
              { icon: BarChart3, label: 'Analytics', path: '/admin/analytics', active: false, badge: null },
              { icon: MessageSquare, label: 'Chat', path: '/admin/chat', active: false, badge: 0 },
              { icon: Settings, label: 'Settings', path: '/admin/settings', active: false, badge: null },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group ${
                  item.active
                    ? 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 text-orange-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-orange-50/50 border border-transparent hover:border-orange-200'
                }`}
              >
                <div className={`p-2 rounded ${
                  item.active 
                    ? 'bg-gradient-to-br from-orange-600 to-red-600 text-white shadow-md' 
                    : 'bg-orange-50 group-hover:bg-gradient-to-br group-hover:from-orange-100 group-hover:to-red-100'
                }`}>
                  <item.icon className="w-4 h-4" />
                </div>
                {!sidebarCollapsed && (
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                )}
                {item.badge !== null && !sidebarCollapsed && (
                  <span className="px-2 py-1 bg-gradient-to-r from-red-50 to-rose-50 text-red-700 text-xs rounded-full font-bold border border-red-200">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
          
          {/* Status Section */}
          <div className="mt-8 pt-6 border-t border-orange-100">
            <h3 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ${
              sidebarCollapsed ? 'text-center' : ''
            }`}>
              {sidebarCollapsed ? '...' : 'LAST UPDATED'}
            </h3>
            <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Data Freshness</div>
                <div className={`text-lg font-bold ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {lastUpdated ? formatTimeAgo(lastUpdated) : 'Never'}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {autoRefresh ? 'Auto-refresh ON' : 'Manual refresh'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 pt-6 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="p-6">
          {/* Welcome Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 relative overflow-hidden rounded-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-amber-400"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1920')] bg-cover bg-center opacity-10"></div>
            <div className="relative p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">ADMIN DASHBOARD</h2>
                  <p className="text-white/90 text-lg">
                    Real-time monitoring of {dashboardData.stats.totalComplaints.toLocaleString()} complaints
                  </p>
                  {error && (
                    <div className="mt-3 flex items-center gap-2 text-amber-200">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                    <div className="text-center">
                      <div className="text-sm text-white/80">Current Time</div>
                      <div className="text-2xl font-bold text-white font-mono">
                        {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-white/60">
                    {lastUpdated && `Updated: ${lastUpdated.toLocaleTimeString()}`}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <StatCard
              title="Total Complaints"
              value={dashboardData.stats.totalComplaints.toLocaleString()}
              icon={FileText}
              change={dashboardData.stats.weeklyGrowth}
              color={{ 
                bg: 'bg-gradient-to-br from-orange-100 to-amber-100', 
                text: 'text-orange-600'
              }}
              description={`${dashboardData.stats.todayComplaints} today`}
              onClick={() => navigate('/admin/issues')}
            />

            <StatCard
              title="Active Users"
              value={dashboardData.stats.totalUsers.toLocaleString()}
              icon={Users}
              change={8.2}
              color={{ 
                bg: 'bg-gradient-to-br from-red-100 to-rose-100', 
                text: 'text-red-600'
              }}
              description={`${dashboardData.stats.activeStaff} staff active`}
              onClick={() => navigate('/admin/users')}
            />

            <StatCard
              title="Pending Resolution"
              value={dashboardData.stats.pending}
              icon={Clock}
              color={{ 
                bg: 'bg-gradient-to-br from-amber-100 to-yellow-100', 
                text: 'text-amber-600'
              }}
              description={`${dashboardData.urgentIssues.length} urgent`}
              onClick={() => navigate('/admin/issues?status=pending')}
            />

            <StatCard
              title="Resolution Rate"
              value={`${dashboardData.stats.satisfaction}%`}
              icon={TrendingUp}
              change={3.2}
              color={{ 
                bg: 'bg-gradient-to-br from-orange-100 to-red-100', 
                text: 'text-orange-600'
              }}
              description={`${dashboardData.stats.resolved} resolved`}
              onClick={() => navigate('/admin/analytics')}
            />
          </motion.div>

          {/* Charts and Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Complaint Trends */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-orange-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Complaint Trends</h3>
                  <p className="text-sm text-gray-600">Last 7 days performance</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-xs text-gray-600">Total</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs text-gray-600">Resolved</span>
                  </div>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLine data={dashboardData.performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: '#fdba74' }}
                      tickLine={{ stroke: '#fdba74' }}
                    />
                    <YAxis 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: '#fdba74' }}
                      tickLine={{ stroke: '#fdba74' }}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #fed7aa',
                        borderRadius: '0.5rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        padding: '12px',
                        color: '#374151'
                      }}
                      labelStyle={{ color: '#6b7280' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#f97316" 
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, stroke: '#ea580c' }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: '#c2410c' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="resolved" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, stroke: '#059669' }}
                    />
                  </RechartsLine>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Performance */}
            <div className="bg-white rounded-xl p-6 border border-orange-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Department Performance</h3>
                  <p className="text-sm text-gray-600">Top departments by resolution rate</p>
                </div>
                <button 
                  onClick={() => navigate('/admin/analytics')}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 group"
                >
                  View All
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              <div className="space-y-4">
                {dashboardData.departmentStats && dashboardData.departmentStats.length > 0 ? (
                  dashboardData.departmentStats.slice(0, 4).map((dept, index) => {
                    const resolutionRate = dept.totalComplaints > 0 
                      ? Math.round((dept.resolved / dept.totalComplaints) * 100)
                      : 0;
                    
                    return (
                      <div key={index} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color }}></div>
                            <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                          </div>
                          <span className={`text-sm font-bold ${
                            resolutionRate > 80 ? 'text-emerald-600' :
                            resolutionRate > 60 ? 'text-amber-600' : 'text-rose-600'
                          }`}>
                            {resolutionRate}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out ${
                              resolutionRate > 80 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                              resolutionRate > 60 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                              'bg-gradient-to-r from-rose-500 to-pink-500'
                            }`}
                            style={{ width: `${resolutionRate}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{dept.resolved} resolved</span>
                          <span>{dept.totalComplaints} total</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">Loading department data...</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-orange-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                    <div className="text-2xl font-bold text-gray-900">
                      {dashboardData.stats.totalDepartments || 0}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">Departments</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-gray-900">
                      {dashboardData.stats.satisfaction || 0}%
                    </div>
                    <div className="text-xs text-gray-600 font-medium">Avg Resolution</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity and Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-orange-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                  <p className="text-sm text-gray-600">Latest system activities</p>
                </div>
                <button 
                  onClick={() => navigate('/admin/activity')}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 group"
                >
                  View All
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              <div className="space-y-4">
                {dashboardData.recentActivity.map((activity) => (
                  <motion.div 
                    key={activity.id}
                    whileHover={{ x: 4 }}
                    className="group flex items-center gap-4 p-4 hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-200"
                  >
                    <div className={`p-3 rounded-lg ${
                      activity.type.includes('complaint') ? 'bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600 border border-orange-200' :
                      activity.type.includes('user') ? 'bg-gradient-to-br from-red-100 to-rose-100 text-red-600 border border-red-200' :
                      activity.type.includes('staff') ? 'bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-600 border border-amber-200' :
                      'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                      {activity.type.includes('complaint') ? <FileText className="w-5 h-5" /> :
                       activity.type.includes('user') ? <User className="w-5 h-5" /> :
                       activity.type.includes('staff') ? <UserCog className="w-5 h-5" /> :
                       <Activity className="w-5 h-5" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{activity.title}</p>
                        {activity.priority === 'high' && (
                          <span className="px-2 py-1 bg-gradient-to-r from-red-50 to-rose-50 text-red-700 text-xs rounded-full font-semibold border border-red-200">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <span>{activity.user}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-xl p-6 border border-orange-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Top Performers</h3>
                  <p className="text-sm text-gray-600">Best performing staff</p>
                </div>
                <button 
                  onClick={() => navigate('/admin/staff')}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 group"
                >
                  Manage
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              <div className="space-y-4">
                {dashboardData.topPerformers.map((staff, index) => (
                  <motion.div 
                    key={index}
                    whileHover={{ x: 4 }}
                    className="group flex items-center gap-4 p-4 hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-200"
                  >
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-lg ${staff.avatarColor} flex items-center justify-center text-white font-bold shadow-md border border-white/30`}>
                        {staff.name.charAt(0)}
                      </div>
                      {index < 3 && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-md border border-white">
                          #{index + 1}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 truncate">{staff.name}</p>
                        <span className="text-sm font-bold text-emerald-600">{staff.resolutionRate}%</span>
                      </div>
                      <p className="text-sm text-gray-600">{staff.department}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                            style={{ width: `${staff.resolutionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-500">{staff.resolved} resolved</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { 
                  title: 'Manage Users', 
                  icon: Users, 
                  description: 'View and manage all users',
                  color: 'from-orange-500 to-red-500',
                  path: '/admin/users'
                },
                { 
                  title: 'Staff Control', 
                  icon: UserCog, 
                  description: 'Manage staff members',
                  color: 'from-red-500 to-rose-500',
                  path: '/admin/staff'
                },
                { 
                  title: 'Analytics', 
                  icon: BarChart3, 
                  description: 'View detailed reports',
                  color: 'from-amber-500 to-orange-500',
                  path: '/admin/analytics'
                },
                { 
                  title: 'System Settings', 
                  icon: Settings, 
                  description: 'Configure system settings',
                  color: 'from-orange-600 to-red-600',
                  path: '/admin/settings'
                }
              ].map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ y: -5, scale: 1.02 }}
                  onClick={() => navigate(action.path)}
                  className="group relative bg-white rounded-xl p-6 border border-orange-100 hover:border-orange-200 hover:shadow-md transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                       style={{ 
                         background: action.color.includes('orange') ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, transparent 70%)' :
                                 action.color.includes('red') ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, transparent 70%)' :
                                 action.color.includes('amber') ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 70%)' :
                                 'linear-gradient(135deg, rgba(217, 119, 6, 0.05) 0%, transparent 70%)'
                       }}></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 border border-white/30`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-gray-900 mb-2">{action.title}</h4>
                    <p className="text-sm text-gray-600">{action.description}</p>
                    
                    <div className="mt-4 pt-4 border-t border-orange-100">
                      <div className="flex items-center gap-1">
                        <ChevronRight className="w-4 h-4 text-orange-500 opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all" />
                        <span className="text-xs text-gray-500 group-hover:text-orange-600 transition-colors">Click to access</span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl text-gray-700 p-3 border-t border-orange-100">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></div>
                <span className="font-medium">{isOnline ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <span className="flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  Users: {dashboardData.stats.totalUsers}
                </span>
                <span className="flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  Complaints: {dashboardData.stats.totalComplaints}
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" />
                  Resolved: {dashboardData.stats.resolved}
                </span>
                <span className="flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  Growth: {dashboardData.stats.weeklyGrowth}%
                </span>
              </div>
            </div>
            
            <div className="text-gray-500 text-xs font-mono">
              {refreshing ? 'Refreshing...' : lastUpdated ? `Updated: ${formatTimeAgo(lastUpdated)}` : 'Loading...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;