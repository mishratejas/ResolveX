import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  MapPin,
  Activity,
  ChevronRight,
  Eye,
  Share2,
  Building2,
  Globe,
  Award,
  Target,
  Zap,
  Flame,
  Crown
} from 'lucide-react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const Reports = ({ currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedWorkspace, setSelectedWorkspace] = useState('all');
  const [workspaces, setWorkspaces] = useState([]);
  const [reportsData, setReportsData] = useState({
    myComplaints: [],
    workspaceStats: {},
    stats: {},
    categoryData: [],
    monthlyData: [],
    resolutionData: []
  });

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Load user's workspaces
  useEffect(() => {
    loadUserWorkspaces();
  }, []);

  // Load reports when workspace or time range changes
  useEffect(() => {
    if (selectedWorkspace) {
      loadMyReportsData();
    }
  }, [timeRange, selectedWorkspace]);

  const loadUserWorkspaces = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BASE_URL}/api/users/my-workspaces`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const workspacesList = response.data.data || [];
        setWorkspaces(workspacesList);
        
        // Set current workspace from localStorage if available
        const currentWorkspace = JSON.parse(localStorage.getItem('currentWorkspace') || 'null');
        if (currentWorkspace) {
          setSelectedWorkspace(currentWorkspace.id);
        }
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    }
  };

  const loadMyReportsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No access token found');
        return;
      }
      
      // Get current workspace
      const currentWorkspace = JSON.parse(localStorage.getItem('currentWorkspace') || 'null');
      
      // Load user's complaints with workspace filter
      const params = {};
      if (selectedWorkspace !== 'all') {
        params.workspaceId = selectedWorkspace;
      }
      
      const complaintsRes = await axios.get(`${BASE_URL}/api/user_issues/my`, {
        params,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (complaintsRes.data.success) {
        const myComplaints = complaintsRes.data.data || [];
        
        // Calculate workspace-specific stats
        const workspaceStats = {};
        myComplaints.forEach(complaint => {
          const workspaceId = complaint.adminId?._id || 'unknown';
          if (!workspaceStats[workspaceId]) {
            workspaceStats[workspaceId] = {
              name: complaint.adminId?.name || complaint.adminId?.organizationName || 'Unknown Workspace',
              total: 0,
              resolved: 0,
              pending: 0,
              inProgress: 0,
              points: 0
            };
          }
          workspaceStats[workspaceId].total++;
          workspaceStats[workspaceId].points += 10; // Base points
          
          if (complaint.status === 'resolved') {
            workspaceStats[workspaceId].resolved++;
            workspaceStats[workspaceId].points += 20; // Bonus for resolved
          } else if (complaint.status === 'in-progress') {
            workspaceStats[workspaceId].inProgress++;
          } else {
            workspaceStats[workspaceId].pending++;
          }
        });
        
        // Calculate overall stats for selected workspace(s)
        const total = myComplaints.length;
        const resolved = myComplaints.filter(c => c.status === 'resolved').length;
        const pending = myComplaints.filter(c => c.status === 'pending').length;
        const inProgress = myComplaints.filter(c => c.status === 'in-progress').length;
        
        // Calculate average resolution time
        const avgResolutionTime = calculateAvgResolutionTime(myComplaints);
        
        // Calculate category distribution
        const categoryCount = {};
        myComplaints.forEach(complaint => {
          const category = complaint.category || 'other';
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        
        const categoryData = Object.keys(categoryCount).map(category => ({
          name: category.charAt(0).toUpperCase() + category.slice(1),
          value: categoryCount[category],
          percentage: total > 0 ? ((categoryCount[category] / total) * 100).toFixed(1) : 0
        }));
        
        // Calculate monthly data
        const monthlyData = calculateMonthlyData(myComplaints);
        
        // Calculate resolution data
        const resolutionData = calculateResolutionData(myComplaints);
        
        // Calculate streaks and achievements
        const streaks = calculateStreaks(myComplaints);
        const achievements = calculateAchievements(myComplaints);
        
        setReportsData({
          myComplaints,
          workspaceStats: Object.values(workspaceStats),
          stats: { 
            total, 
            resolved, 
            pending, 
            inProgress,
            avgResolutionTime,
            streaks,
            achievements,
            totalPoints: Object.values(workspaceStats).reduce((sum, ws) => sum + ws.points, 0)
          },
          categoryData,
          monthlyData,
          resolutionData
        });
      }
      
    } catch (error) {
      console.error('Error loading reports data:', error);
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate streaks
  const calculateStreaks = (complaints) => {
    if (complaints.length === 0) return { current: 0, longest: 0, lastActive: null };
    
    const sorted = [...complaints].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let longestStreak = 0;
    let lastDate = null;
    
    // Group by date
    const dates = new Set();
    sorted.forEach(c => {
      const date = new Date(c.createdAt);
      date.setHours(0, 0, 0, 0);
      dates.add(date.toISOString());
    });
    
    const dateArray = Array.from(dates).map(d => new Date(d)).sort((a, b) => b - a);
    
    // Calculate current streak
    for (let i = 0; i < dateArray.length; i++) {
      const date = dateArray[i];
      if (i === 0) {
        const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) currentStreak = 1;
        lastDate = date;
      } else {
        const prevDate = dateArray[i - 1];
        const diffDays = Math.floor((prevDate - date) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    
    // Calculate longest streak
    let tempStreak = 1;
    for (let i = 1; i < dateArray.length; i++) {
      const diffDays = Math.floor((dateArray[i - 1] - dateArray[i]) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    
    return {
      current: currentStreak,
      longest: longestStreak || currentStreak,
      lastActive: lastDate
    };
  };

  // Calculate achievements
  const calculateAchievements = (complaints) => {
    const achievements = [];
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    
    // First Report
    if (total >= 1) {
      achievements.push({
        id: 'first',
        name: 'First Report',
        icon: '🎯',
        earned: true
      });
    }
    
    // 5 Reports
    if (total >= 5) {
      achievements.push({
        id: 'five',
        name: 'Active Citizen',
        icon: '🌟',
        earned: true
      });
    }
    
    // 10 Reports
    if (total >= 10) {
      achievements.push({
        id: 'ten',
        name: 'Community Hero',
        icon: '🏆',
        earned: true
      });
    }
    
    // First Resolution
    if (resolved >= 1) {
      achievements.push({
        id: 'first-resolved',
        name: 'Issue Solver',
        icon: '✅',
        earned: true
      });
    }
    
    // 5 Resolutions
    if (resolved >= 5) {
      achievements.push({
        id: 'five-resolved',
        name: 'Problem Fixer',
        icon: '🔧',
        earned: true
      });
    }
    
    // Streak achievements
    const streaks = calculateStreaks(complaints);
    if (streaks.current >= 3) {
      achievements.push({
        id: 'streak-3',
        name: '3-Day Streak',
        icon: '🔥',
        earned: true
      });
    }
    if (streaks.current >= 7) {
      achievements.push({
        id: 'streak-7',
        name: '7-Day Streak',
        icon: '⚡',
        earned: true
      });
    }
    
    return achievements;
  };

  const calculateMonthlyData = (complaints) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const monthlyCount = {};
    
    // Get last 6 months
    const lastSixMonths = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      lastSixMonths.push(months[monthIndex]);
    }
    
    complaints.forEach(complaint => {
      if (complaint.createdAt) {
        const date = new Date(complaint.createdAt);
        const month = date.getMonth();
        const monthName = months[month];
        
        if (!monthlyCount[monthName]) {
          monthlyCount[monthName] = { reported: 0, resolved: 0 };
        }
        
        monthlyCount[monthName].reported++;
        
        if (complaint.status === 'resolved') {
          monthlyCount[monthName].resolved++;
        }
      }
    });
    
    return lastSixMonths.map(month => ({
      month,
      reported: monthlyCount[month]?.reported || 0,
      resolved: monthlyCount[month]?.resolved || 0
    }));
  };

  const calculateResolutionData = (complaints) => {
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved');
    
    const timeGroups = {
      '1-3 days': 0,
      '4-7 days': 0,
      '1-2 weeks': 0,
      '2-4 weeks': 0,
      '1+ month': 0
    };
    
    resolvedComplaints.forEach(complaint => {
      if (complaint.createdAt && complaint.resolvedAt) {
        const created = new Date(complaint.createdAt);
        const resolved = new Date(complaint.resolvedAt);
        const diffTime = Math.abs(resolved - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 3) timeGroups['1-3 days']++;
        else if (diffDays <= 7) timeGroups['4-7 days']++;
        else if (diffDays <= 14) timeGroups['1-2 weeks']++;
        else if (diffDays <= 28) timeGroups['2-4 weeks']++;
        else timeGroups['1+ month']++;
      }
    });
    
    return Object.keys(timeGroups).map(key => ({
      name: key,
      value: timeGroups[key],
      color: getResolutionColor(key)
    }));
  };

  const calculateAvgResolutionTime = (complaints) => {
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved');
    let totalDays = 0;
    let count = 0;
    
    resolvedComplaints.forEach(complaint => {
      if (complaint.createdAt && complaint.resolvedAt) {
        const created = new Date(complaint.createdAt);
        const resolved = new Date(complaint.resolvedAt);
        const diffTime = Math.abs(resolved - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
        count++;
      }
    });
    
    return count > 0 ? (totalDays / count).toFixed(1) : 0;
  };

  const getResolutionColor = (timeRange) => {
    switch (timeRange) {
      case '1-3 days': return '#10b981';
      case '4-7 days': return '#3b82f6';
      case '1-2 weeks': return '#f59e0b';
      case '2-4 weeks': return '#f97316';
      case '1+ month': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Export feature
  const handleExport = () => {
    try {
      if (reportsData.myComplaints.length === 0) {
        alert('No data to export');
        return;
      }
      
      const exportData = reportsData.myComplaints.map(complaint => {
        const created = new Date(complaint.createdAt);
        const resolved = complaint.resolvedAt ? new Date(complaint.resolvedAt) : null;
        const resolutionTime = resolved ? Math.ceil((resolved - created) / (1000 * 60 * 60 * 24)) + ' days' : 'Pending';
        
        return {
          'Issue ID': complaint._id,
          'Title': complaint.title,
          'Category': complaint.category,
          'Status': complaint.status,
          'Workspace': complaint.adminId?.name || complaint.adminId?.organizationName || 'N/A',
          'Location': complaint.location || 'N/A',
          'Description': complaint.description,
          'Created Date': created.toLocaleDateString(),
          'Resolved Date': resolved ? resolved.toLocaleDateString() : 'N/A',
          'Resolution Time': resolutionTime,
          'Votes': complaint.voteCount || 0,
          'Comments': complaint.comments?.length || 0,
          'Priority': complaint.priority || 'Medium'
        };
      });
      
      // Export as CSV
      exportAsCSV(exportData);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export reports');
    }
  };

  const exportAsCSV = (data) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    
    const csvData = data.map(row => {
      return headers.map(header => {
        let cell = row[header] || '';
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          cell = `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      });
    });
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my-reports-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const metrics = {
    responseRate: reportsData.stats.total > 0 ? 
      ((reportsData.stats.resolved / reportsData.stats.total) * 100).toFixed(0) + '%' : '0%',
    satisfactionScore: (() => {
      const totalVotes = reportsData.myComplaints.reduce((sum, c) => sum + (c.voteCount || 0), 0);
      const totalComments = reportsData.myComplaints.reduce((sum, c) => sum + (c.comments?.length || 0), 0);
      const score = Math.min(5, ((totalVotes + totalComments) / Math.max(1, reportsData.myComplaints.length)) / 10);
      return score.toFixed(1) + '/5';
    })(),
    reopenedIssues: '0%', // Can calculate from status history if available
    avgFirstResponse: (() => {
      const complaintsWithComments = reportsData.myComplaints.filter(c => c.comments?.length > 0);
      let totalHours = 0;
      complaintsWithComments.forEach(c => {
        if (c.comments[0]?.createdAt && c.createdAt) {
          const created = new Date(c.createdAt);
          const firstComment = new Date(c.comments[0].createdAt);
          totalHours += Math.ceil((firstComment - created) / (1000 * 60 * 60));
        }
      });
      return complaintsWithComments.length > 0 ? 
        (totalHours / complaintsWithComments.length).toFixed(1) + 'h' : 'N/A';
    })(),
    communityEngagement: reportsData.myComplaints.reduce((sum, c) => 
      sum + (c.voteCount || 0) + (c.comments?.length || 0), 0)
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
      {/* Header with Workspace Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Detailed insights of your reported issues across workspaces</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Workspace Selector */}
            <div className="relative">
              <select
                value={selectedWorkspace}
                onChange={(e) => setSelectedWorkspace(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 appearance-none bg-white"
              >
                <option value="all">All Workspaces</option>
                {workspaces.map(ws => (
                  <option key={ws._id} value={ws._id}>
                    {ws.organizationName} ({ws.workspaceCode})
                  </option>
                ))}
              </select>
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
            
            <button 
              onClick={loadMyReportsData}
              className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <button 
              onClick={handleExport}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Streak & Achievements Section */}
      {reportsData.stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Current Streak</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {reportsData.stats.streaks?.current || 0} days
                </p>
              </div>
              <Flame className="w-10 h-10 text-orange-500" />
            </div>
            <p className="text-xs text-orange-600 mt-2">
              Longest: {reportsData.stats.streaks?.longest || 0} days
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Total Points</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {reportsData.stats.totalPoints || 0}
                </p>
              </div>
              <Award className="w-10 h-10 text-purple-500" />
            </div>
            <p className="text-xs text-purple-600 mt-2">
              From {reportsData.stats.total} reports
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Achievements</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {reportsData.stats.achievements?.length || 0}
                </p>
              </div>
              <Target className="w-10 h-10 text-blue-500" />
            </div>
            <div className="flex gap-1 mt-2">
              {reportsData.stats.achievements?.slice(0, 3).map((a, i) => (
                <span key={i} className="text-lg" title={a.name}>{a.icon}</span>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Impact Score</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {Math.min(100, Math.round((reportsData.stats.resolved / Math.max(1, reportsData.stats.total)) * 100))}
                </p>
              </div>
              <Crown className="w-10 h-10 text-green-500" />
            </div>
            <p className="text-xs text-green-600 mt-2">
              Based on resolution rate
            </p>
          </div>
        </div>
      )}

      {/* Workspace Distribution (if showing all) */}
      {selectedWorkspace === 'all' && reportsData.workspaceStats.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Activity by Workspace</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportsData.workspaceStats.map((ws, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-900">{ws.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Reports</p>
                    <p className="font-bold text-gray-900">{ws.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Resolved</p>
                    <p className="font-bold text-green-600">{ws.resolved}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Points</p>
                    <p className="font-bold text-purple-600">{ws.points}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Rate</p>
                    <p className="font-bold text-blue-600">
                      {ws.total > 0 ? Math.round((ws.resolved / ws.total) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">My Issues</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{reportsData.stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {reportsData.stats.resolved} resolved • {reportsData.stats.pending} pending
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolution Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {reportsData.stats.total > 0 ? 
                  ((reportsData.stats.resolved / reportsData.stats.total) * 100).toFixed(0) + '%' : 
                  '0%'
                }
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
                style={{ width: `${reportsData.stats.total > 0 ? (reportsData.stats.resolved / reportsData.stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Resolution Time</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {reportsData.stats.avgResolutionTime || 0} days
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {reportsData.stats.resolved > 0 ? 'Based on resolved issues' : 'No resolved issues yet'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">My Engagement</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {metrics.communityEngagement}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Votes + Comments received
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Issues</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {reportsData.stats.pending + reportsData.stats.inProgress}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Currently being addressed
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">My Monthly Trends</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">My Issues Reported</span>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportsData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="reported" name="My Issues Reported" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="My Issues Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">My Issues by Category</h3>
            <div className="text-sm text-gray-600">
              Total: {reportsData.stats.total} issues
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={reportsData.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportsData.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {reportsData.categoryData.map((category, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-gray-700">{category.name}</span>
                </div>
                <span className="font-medium text-gray-900">{category.value} ({category.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resolution Time Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">My Resolution Time Analysis</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={reportsData.resolutionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportsData.resolutionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {reportsData.resolutionData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{item.value} issues</span>
                  <span className="text-xs text-gray-500">
                    ({reportsData.stats.resolved > 0 ? ((item.value / reportsData.stats.resolved) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">My Performance Metrics</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Current Analysis</span>
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Response Rate</span>
                <span className="font-semibold text-gray-900">{metrics.responseRate}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" 
                  style={{ width: metrics.responseRate }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Satisfaction Score</span>
                <span className="font-semibold text-gray-900">{metrics.satisfactionScore}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${parseFloat(metrics.satisfactionScore) * 20}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Reopened Issues</span>
                <span className="font-semibold text-gray-900">{metrics.reopenedIssues}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" 
                  style={{ width: metrics.reopenedIssues }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Average First Response</span>
                <span className="font-semibold text-gray-900">{metrics.avgFirstResponse}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">My Detailed Analysis</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">My Categories by Resolution Time</h4>
              {reportsData.categoryData.length > 0 ? reportsData.categoryData.slice(0, 4).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.percentage}% resolved</span>
                    {parseFloat(item.percentage) > 50 ? (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center p-4 text-gray-500">
                  No resolved issues yet
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">My Activity Timeline</h4>
              {reportsData.monthlyData.slice(-4).map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{item.month}</span>
                    <span className="text-sm text-gray-600">{item.reported} reported • {item.resolved} resolved</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${(item.resolved / Math.max(1, item.reported)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Quick Actions</h4>
              <button 
                onClick={handleExport}
                className="w-full p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-between"
              >
                <span className="font-medium text-green-700">Export My Data</span>
                <Download className="w-5 h-5 text-green-600" />
              </button>
              <button 
                onClick={loadMyReportsData}
                className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-between"
              >
                <span className="font-medium text-blue-700">Refresh Data</span>
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </button>
              <button 
                onClick={() => window.print()}
                className="w-full p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-between"
              >
                <span className="font-medium text-purple-700">Print Report</span>
                <Share2 className="w-5 h-5 text-purple-600" />
              </button>
              <a 
                href="/home/raise-complaint"
                className="w-full p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-between"
              >
                <span className="font-medium text-orange-700">Report New Issue</span>
                <Eye className="w-5 h-5 text-orange-600" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;