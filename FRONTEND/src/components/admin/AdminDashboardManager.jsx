import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Copy, Users, FileText, CheckCircle, Clock, 
  TrendingUp, UserCog, Building, PieChart,
  RefreshCw, ChevronDown, ChevronRight, LineChart // 🚀 I ADDED LineChart HERE!
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart as RechartsLine, Line,
  CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts';

import * as adminService from '../../services/adminService.js';

const AdminDashboardManager = () => {
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalComplaints: 0, pending: 0, inProgress: 0, resolved: 0, satisfaction: 0,
      totalUsers: 0, activeStaff: 0, totalDepartments: 0, todayComplaints: 0,
      weeklyGrowth: 0, monthlyGrowth: 0, avgResolutionTime: 0
    },
    topPerformers: [],
    departmentStats: [],
    performanceTrends: []
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [lastUpdated, setLastUpdated] = useState(null);

  const [adminInfo, setAdminInfo] = useState({
    organizationName: 'ResolveX Admin',
    workspaceCode: '------',
    name: 'Administrator'
  });
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem('adminData') || localStorage.getItem('admin');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setAdminInfo({
          organizationName: parsedData.organizationName || 'ResolveX Admin',
          workspaceCode: parsedData.workspaceCode || '------',
          name: parsedData.name || 'Administrator'
        });
      } catch (e) {
        console.error('Error parsing admin data:', e);
      }
    }
  }, []);

  const copyWorkspaceCode = () => {
    if (adminInfo.workspaceCode && adminInfo.workspaceCode !== '------') {
      navigator.clipboard.writeText(adminInfo.workspaceCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const fetchAllDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const dashboardRes = await adminService.getDashboardData();
      
      if (dashboardRes.success) {
        const backendData = dashboardRes.data;
        setDashboardData(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            totalComplaints: backendData.stats?.totalComplaints || 0,
            pending: backendData.stats?.pending || 0,
            inProgress: backendData.stats?.inProgress || 0,
            resolved: backendData.stats?.resolved || 0,
            satisfaction: backendData.stats?.satisfaction || 0,
            totalUsers: backendData.stats?.users || 0,
            activeStaff: backendData.stats?.staff || 0,
            totalDepartments: backendData.stats?.departments || 0,
            todayComplaints: backendData.stats?.today || 0,
            weeklyGrowth: backendData.stats?.weeklyGrowth || 0,
            monthlyGrowth: backendData.stats?.monthlyGrowth || 0,
            avgResolutionTime: backendData.stats?.avgResolutionTime || 0
          },
          topPerformers: (backendData.performance?.topPerformers || []).map(staff => ({
            id: staff._id,
            name: staff.name,
            department: staff.department?.name || 'General',
            resolutionRate: staff.resolutionRate || 0,
            resolved: staff.resolvedCount || 0,
            avatarColor: getRandomGradient()
          }))
        }));
      }

      try {
        const [chartRes, issueStatsRes] = await Promise.all([
          adminService.getChartData(timeRange), // 🚀 Now uses dynamic timeRange
          adminService.getIssueStats()
        ]);
        
        if (chartRes.success && chartRes.data) {
          setDashboardData(prev => ({
            ...prev,
            performanceTrends: (chartRes.data.dailyComplaints || []).map(day => ({
              date: day.day || formatDate(day.date),
              total: Math.max(day.complaints || 0, day.resolved || 0), 
              resolved: day.resolved || 0,
            })),
            departmentStats: (chartRes.data.departments || []).map(dept => ({
              name: dept.name || 'Unknown',
              totalComplaints: dept.value || dept.total || 0,
              resolved: dept.resolved || 0,
              color: getDepartmentColor(dept.name)
            }))
          }));
        }
        
        if (issueStatsRes.success) {
          setDashboardData(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              totalComplaints: issueStatsRes.data.total || prev.stats.totalComplaints,
              pending: issueStatsRes.data.pending || prev.stats.pending,
              inProgress: issueStatsRes.data.inProgress || prev.stats.inProgress,
              resolved: issueStatsRes.data.resolved || prev.stats.resolved,
              todayComplaints: issueStatsRes.data.today || prev.stats.todayComplaints
            }
          }));
        }
      } catch (chartError) {
        console.warn('Chart data error:', chartError);
      }

      setLastUpdated(new Date());

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAllDashboardData();
  }, [fetchAllDashboardData]);

  const getRandomGradient = () => {
    const gradients = ['from-amber-600 to-orange-600', 'from-orange-600 to-red-600', 'from-yellow-600 to-amber-600', 'from-red-600 to-rose-600'];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  const getDepartmentColor = (department) => {
    const colorMap = { 'Water Supply': '#f59e0b', 'Electricity': '#ea580c', 'Road Maintenance': '#dc2626', 'Sanitation': '#f97316' };
    return colorMap[department] || '#ea580c';
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    return `${Math.floor(seconds / 60)}m ago`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (timeRange === '1d') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (timeRange === '7d') return date.toLocaleDateString([], { weekday: 'short' });
    if (timeRange === '30d') return date.getDate().toString();
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllDashboardData();
  };

  const StatCard = ({ title, value, icon: Icon, color, description, onClick }) => (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={onClick}
      className="group relative bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-orange-100 hover:border-orange-200"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-amber-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg ${color.bg} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300`}>
            <Icon className={`w-6 h-6 ${color.text}`} />
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          {description && <p className="text-xs text-gray-500 mt-2">{description}</p>}
        </div>
      </div>
    </motion.div>
  );

  if (loading && !dashboardData.stats.totalComplaints) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading live dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 relative overflow-hidden rounded-xl shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-red-500 to-orange-400"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1920')] bg-cover bg-center opacity-15 mix-blend-overlay"></div>
        <div className="relative p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
            <p className="text-white/90 text-lg mb-4">Managing operations for <span className="font-semibold text-white">{adminInfo.organizationName}</span></p>
            
            <div className="inline-flex items-center bg-white/10 backdrop-blur-md border border-white/30 rounded-lg p-1 pr-3 shadow-sm">
              <div className="bg-white text-orange-600 px-3 py-1.5 rounded-md font-bold font-mono tracking-wider shadow-inner flex items-center gap-2">
                <Building className="w-4 h-4 text-orange-500" />
                {adminInfo.workspaceCode}
              </div>
              <div className="ml-3 flex flex-col justify-center">
                <span className="text-xs text-white/80 font-medium uppercase tracking-wider mb-0.5">Workspace Code</span>
                <button onClick={copyWorkspaceCode} className="text-xs flex items-center gap-1 text-white hover:text-amber-200 transition-colors font-medium">
                  {copiedCode ? <><CheckCircle className="w-3 h-3 text-emerald-300" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy to share</>}
                </button>
              </div>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
              <div className="text-center">
                <div className="text-sm text-white/80">Current Time</div>
                <div className="text-2xl font-bold text-white font-mono">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
            </div>
            <div className="text-xs text-white/60">
              Last updated: {formatTimeAgo(lastUpdated)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Complaints" value={dashboardData.stats.totalComplaints.toLocaleString()} icon={FileText} color={{ bg: 'bg-gradient-to-br from-orange-100 to-amber-100', text: 'text-orange-600' }} description={`${dashboardData.stats.todayComplaints} today`} onClick={() => navigate('/admin/issues')} />
        <StatCard title="Active Users" value={dashboardData.stats.totalUsers.toLocaleString()} icon={Users} color={{ bg: 'bg-gradient-to-br from-red-100 to-rose-100', text: 'text-red-600' }} description={`${dashboardData.stats.activeStaff} staff active`} onClick={() => navigate('/admin/users')} />
        <StatCard title="Pending Resolution" value={dashboardData.stats.pending} icon={Clock} color={{ bg: 'bg-gradient-to-br from-amber-100 to-yellow-100', text: 'text-amber-600' }} onClick={() => navigate('/admin/issues')} />
        <StatCard title="Resolution Rate" value={`${dashboardData.stats.satisfaction}%`} icon={TrendingUp} color={{ bg: 'bg-gradient-to-br from-orange-100 to-red-100', text: 'text-orange-600' }} description={`${dashboardData.stats.resolved} resolved`} onClick={() => navigate('/admin/analytics')} />
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* 🚀 Graph with integrated Filters */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-orange-100 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Complaint Trends</h3>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span className="text-xs text-gray-600">Total</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs text-gray-600">Resolved</span></div>
              </div>
            </div>

            {/* 🚀 Integrated Graph Controls */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  disabled={refreshing}
                  className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer hover:bg-gray-50 disabled:opacity-50"
                >
                  <option value="1d">Last 24h</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 text-gray-600 disabled:opacity-50"
                title="Refresh Graph"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="h-72 w-full flex-1">
            {dashboardData.performanceTrends.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <LineChart className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">No trend data available.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLine data={dashboardData.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#fdba74' }} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#fdba74' }} tickLine={false} dx={-10} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #fed7aa', borderRadius: '0.75rem' }} />
                  <Line type="monotone" dataKey="total" name="Total Active" stroke="#f97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: '#ea580c', fill: '#fff' }} />
                  <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: '#059669', fill: '#fff' }} />
                </RechartsLine>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white rounded-xl p-6 border border-orange-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Departments</h3>
              <p className="text-sm text-gray-600">Top by volume</p>
            </div>
          </div>
          
          <div className="space-y-4 flex-1">
            {dashboardData.departmentStats.length > 0 ? (
              dashboardData.departmentStats.slice(0, 4).map((dept, index) => {
                const resolutionRate = dept.totalComplaints > 0 ? Math.round((dept.resolved / dept.totalComplaints) * 100) : 0;
                return (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color }}></div>
                        <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                      </div>
                      <span className={`text-sm font-bold ${resolutionRate > 80 ? 'text-emerald-600' : resolutionRate > 60 ? 'text-amber-600' : 'text-rose-600'}`}>{resolutionRate}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ease-out ${resolutionRate > 80 ? 'bg-gradient-to-r from-emerald-500 to-green-500' : resolutionRate > 60 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-rose-500 to-pink-500'}`} style={{ width: `${resolutionRate}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{dept.resolved} resolved</span>
                      <span>{dept.totalComplaints} total</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                <PieChart className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">No department data available.</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t border-orange-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-gray-900">{dashboardData.departmentStats?.length || 0}</div>
                <div className="text-xs text-gray-600 font-medium">Departments</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-gray-900">{dashboardData.stats.avgResolutionTime || 0}d</div>
                <div className="text-xs text-gray-600 font-medium">Avg Resolution</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-orange-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Top Performers</h3>
              <p className="text-sm text-gray-600">Best performing staff</p>
            </div>
            <button onClick={() => navigate('/admin/staff')} className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 group">
              Manage <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="space-y-4">
            {dashboardData.topPerformers.length > 0 ? (
              dashboardData.topPerformers.slice(0, 3).map((staff, index) => (
                <motion.div key={staff.id || index} whileHover={{ x: 4 }} className="group flex items-center gap-4 p-4 hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-200">
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
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500" style={{ width: `${staff.resolutionRate}%` }}></div>
                      </div>
                      <span className="text-xs font-medium text-gray-500">{staff.resolved} resolved</span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 py-6">
                <UserCog className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">No performance data yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardManager;