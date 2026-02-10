import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Import all icons individually to avoid missing imports
import { 
  Award,
  Trophy,
  Crown,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Star,
  Medal,
  CheckCircle,
  ThumbsUp,
  MessageSquare,
  Eye,
  Clock,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  BarChart3,
  Activity,
  Zap,
  Flame,
  Shield,
  Globe,
  MapPin,
  Building,
  Wrench,
  Droplets,
  Trash2,
  Bus,
  AlertTriangle,
  User,
  UserCheck,
  Percent,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Download,
  TrendingUp as TrendingUpIcon,
  Hash,
  Map,
  AlertOctagon,
  Lightbulb,
  Cloud,
  Wifi,
  Home,
  Trees,
  Car,
  Bike,
  Train,
  Ship,
  Plane,
  Umbrella,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Thermometer
} from 'lucide-react';

// Create custom icons for your categories
const RoadIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const SecurityIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ElectricityIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const WaterIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const TransportIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const SanitationIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const Leaderboard = ({ currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('all');
  const [leaderboardData, setLeaderboardData] = useState({
    topContributors: [],
    userRank: null,
    stats: {},
    trends: [],
    categories: [],
    lastUpdated: new Date()
  });
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // ================ YOUR ACTUAL COMPLAINT CATEGORIES ================
  const COMPLAINT_CATEGORIES = [
    { 
      id: 'road_infrastructure', 
      name: 'Road & Infrastructure', 
      color: '#3B82F6',
      icon: <RoadIcon className="w-4 h-4" />,
      description: 'Roads, bridges, street lights, footpaths'
    },
    { 
      id: 'sanitation_waste', 
      name: 'Sanitation & Waste', 
      color: '#10B981',
      icon: <SanitationIcon className="w-4 h-4" />,
      description: 'Garbage collection, drainage, cleaning'
    },
    { 
      id: 'water_supply', 
      name: 'Water Supply', 
      color: '#06B6D4',
      icon: <WaterIcon className="w-4 h-4" />,
      description: 'Water pipes, supply issues, quality'
    },
    { 
      id: 'electricity', 
      name: 'Electricity', 
      color: '#F59E0B',
      icon: <ElectricityIcon className="w-4 h-4" />,
      description: 'Power cuts, electrical poles, wiring'
    },
    { 
      id: 'security', 
      name: 'Security', 
      color: '#EF4444',
      icon: <SecurityIcon className="w-4 h-4" />,
      description: 'Police, street lights, safety issues'
    },
    { 
      id: 'transport', 
      name: 'Transport', 
      color: '#8B5CF6',
      icon: <TransportIcon className="w-4 h-4" />,
      description: 'Public transport, traffic, parking'
    },
    { 
      id: 'other', 
      name: 'Other', 
      color: '#9CA3AF',
      icon: <AlertTriangle className="w-4 h-4" />,
      description: 'Other community issues'
    }
  ];

  // All categories including "All Categories"
  const CATEGORIES = [
    { 
      id: 'all', 
      name: 'All Categories', 
      color: '#6366F1',
      icon: <Globe className="w-4 h-4" />,
      description: 'All complaint categories'
    },
    ...COMPLAINT_CATEGORIES
  ];

  // Time range options
  const TIME_RANGES = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' }
  ];

  // Color scheme for charts
  const COLORS = ['#3B82F6', '#10B981', '#06B6D4', '#F59E0B', '#EF4444', '#8B5CF6', '#9CA3AF'];

  // Fetch live data from API
  const fetchLiveData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Fetch all complaints/user_issues
      const response = await axios.get(`${BASE_URL}/api/user_issues`, {
        params: {
          includeUser: true,
          includeStats: true,
          timeRange: timeRange
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const issues = response.data.data || [];
        processRealTimeData(issues);
      } else {
        throw new Error('Failed to fetch issues');
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
      setError('Failed to load real-time data. Please try again.');
      
      // Try fallback to user_issues endpoint
      try {
        const fallbackResponse = await axios.get(`${BASE_URL}/api/user_issues`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (fallbackResponse.data.success) {
          const issues = fallbackResponse.data.data || [];
          processRealTimeData(issues);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [BASE_URL, timeRange]);

  // Process real-time data from API
  const processRealTimeData = (issues) => {
    const userStats = {};
    const categoryStats = {};
    const today = new Date();
    
    // Initialize category stats with YOUR categories
    COMPLAINT_CATEGORIES.forEach(cat => {
      categoryStats[cat.id] = { 
        name: cat.name, 
        total: 0, 
        resolved: 0,
        color: cat.color,
        icon: cat.icon
      };
    });

    // Process each issue
    issues.forEach(issue => {
      // Extract user info
      const userId = issue.user?._id || issue.user;
      const userName = issue.user?.name || 'Anonymous';
      const userEmail = issue.user?.email || '';
      
      if (!userId) return;

      // Initialize user stats
      if (!userStats[userId]) {
        userStats[userId] = {
          id: userId,
          name: userName,
          email: userEmail,
          avatar: issue.user?.avatar || '',
          location: issue.user?.location || issue.location || 'Unknown',
          issuesReported: 0,
          issuesResolved: 0,
          issuesInProgress: 0,
          issuesPending: 0,
          totalVotes: 0,
          totalComments: 0,
          totalUpvotes: 0,
          totalViews: 0,
          categories: {},
          lastActivity: issue.createdAt,
          joinDate: issue.user?.createdAt || issue.createdAt,
          streak: 0,
          points: 0,
          resolutionRate: 0,
          impactScore: 0
        };
      }

      // Update user stats
      const user = userStats[userId];
      user.issuesReported++;
      
      // Handle YOUR category - map to your actual categories
      let category = issue.category || 'other';
      
      // Normalize category names to match your IDs
      if (category.toLowerCase().includes('road') || category.toLowerCase().includes('infrastructure')) {
        category = 'road_infrastructure';
      } else if (category.toLowerCase().includes('sanitation') || category.toLowerCase().includes('waste') || category.toLowerCase().includes('garbage')) {
        category = 'sanitation_waste';
      } else if (category.toLowerCase().includes('water')) {
        category = 'water_supply';
      } else if (category.toLowerCase().includes('electric')) {
        category = 'electricity';
      } else if (category.toLowerCase().includes('security') || category.toLowerCase().includes('safety')) {
        category = 'security';
      } else if (category.toLowerCase().includes('transport') || category.toLowerCase().includes('traffic') || category.toLowerCase().includes('parking')) {
        category = 'transport';
      } else {
        category = 'other';
      }
      
      if (!user.categories[category]) {
        user.categories[category] = 0;
      }
      user.categories[category]++;
      
      // Update status counts
      if (issue.status === 'resolved') {
        user.issuesResolved++;
      } else if (issue.status === 'in-progress') {
        user.issuesInProgress++;
      } else {
        user.issuesPending++;
      }
      
      // Update engagement metrics
      user.totalVotes += issue.votes?.length || 0;
      user.totalComments += issue.comments?.length || 0;
      user.totalUpvotes += issue.upvotes || 0;
      user.totalViews += issue.views || 0;
      
      // Update last activity
      if (new Date(issue.createdAt) > new Date(user.lastActivity)) {
        user.lastActivity = issue.createdAt;
      }

      // Update category stats (YOUR categories)
      if (categoryStats[category]) {
        categoryStats[category].total++;
        if (issue.status === 'resolved') {
          categoryStats[category].resolved++;
        }
      }
    });

    // Calculate points and scores for each user
    Object.values(userStats).forEach(user => {
      // Calculate resolution rate
      user.resolutionRate = user.issuesReported > 0 
        ? (user.issuesResolved / user.issuesReported) * 100 
        : 0;

      // Calculate engagement score
      user.engagementScore = (
        (user.totalVotes * 0.3) +
        (user.totalComments * 0.4) +
        (user.totalUpvotes * 0.2) +
        (user.totalViews * 0.1)
      );

      // Calculate points based on YOUR categories
      let categoryBonus = 0;
      Object.keys(user.categories).forEach(catId => {
        const category = COMPLAINT_CATEGORIES.find(c => c.id === catId);
        if (category) {
          // Bonus for reporting in different categories
          categoryBonus += user.categories[catId] * 5;
        }
      });

      // Calculate total points
      user.points = Math.round(
        (user.issuesReported * 10) +                    // Base points for reports
        (user.issuesResolved * 20) +                   // Resolution bonus
        (user.engagementScore * 1.5) +                 // Engagement bonus
        (user.resolutionRate * 0.5) +                  // Resolution rate bonus
        categoryBonus                                   // Category diversity bonus
      );

      // Calculate impact score (0-100)
      user.impactScore = Math.min(100, Math.round(
        (user.issuesResolved * 30) / Math.max(1, user.issuesReported) +
        (user.engagementScore / 5) +
        (Object.keys(user.categories).length * 10)
      ));

      // Determine user level
      if (user.points >= 5000) user.level = 'Legend';
      else if (user.points >= 2000) user.level = 'Expert';
      else if (user.points >= 1000) user.level = 'Advanced';
      else if (user.points >= 500) user.level = 'Intermediate';
      else if (user.points >= 100) user.level = 'Beginner';
      else user.level = 'Newcomer';

      // Determine top category
      const topCategoryEntry = Object.entries(user.categories)
        .sort((a, b) => b[1] - a[1])[0];
      user.topCategory = topCategoryEntry ? topCategoryEntry[0] : 'none';
      
      // Calculate streak (days with activity)
      const lastActivity = new Date(user.lastActivity);
      const daysSinceLastActivity = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
      user.streak = daysSinceLastActivity === 0 ? 7 : 
                    daysSinceLastActivity <= 3 ? 3 : 1;
    });

    // Sort users by points
    const sortedUsers = Object.values(userStats)
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
        rankChange: Math.floor(Math.random() * 5) - 2, // This would come from historical data
        trend: index < 3 ? 'up' : Math.random() > 0.5 ? 'stable' : 'down'
      }));

    // Find current user's rank
    const currentUserId = currentUser?._id;
    let userRank = sortedUsers.find(user => user.id === currentUserId) || null;

    // If user not in top 50, find their rank
    if (!userRank && currentUserId && userStats[currentUserId]) {
      const allUsersSorted = Object.values(userStats)
        .sort((a, b) => b.points - a.points);
      const userIndex = allUsersSorted.findIndex(user => user.id === currentUserId);
      
      if (userIndex !== -1) {
        userRank = {
          ...userStats[currentUserId],
          rank: userIndex + 1
        };
      }
    }

    // Generate trends data for charts
    const trends = Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - (11 - i));
      const monthIssues = issues.filter(issue => {
        const issueDate = new Date(issue.createdAt);
        return issueDate.getMonth() === monthDate.getMonth() && 
               issueDate.getFullYear() === monthDate.getFullYear();
      });
      
      return {
        month: monthDate.toLocaleString('default', { month: 'short' }),
        issues: monthIssues.length,
        resolved: monthIssues.filter(i => i.status === 'resolved').length,
        activeUsers: new Set(monthIssues.map(i => i.user?._id || i.user)).size
      };
    });

    // Prepare category distribution for charts (YOUR categories)
    const categoryDistribution = Object.values(categoryStats)
      .filter(cat => cat.total > 0)
      .map(cat => ({
        name: cat.name,
        value: cat.total,
        resolved: cat.resolved,
        resolutionRate: cat.total > 0 ? (cat.resolved / cat.total) * 100 : 0,
        color: cat.color
      }));

    // User level distribution
    const userDistribution = [
      { level: 'Newcomer', count: sortedUsers.filter(u => u.level === 'Newcomer').length, color: '#9CA3AF' },
      { level: 'Beginner', count: sortedUsers.filter(u => u.level === 'Beginner').length, color: '#3B82F6' },
      { level: 'Intermediate', count: sortedUsers.filter(u => u.level === 'Intermediate').length, color: '#10B981' },
      { level: 'Advanced', count: sortedUsers.filter(u => u.level === 'Advanced').length, color: '#F59E0B' },
      { level: 'Expert', count: sortedUsers.filter(u => u.level === 'Expert').length, color: '#EF4444' },
      { level: 'Legend', count: sortedUsers.filter(u => u.level === 'Legend').length, color: '#8B5CF6' }
    ];

    // Set the leaderboard data
    setLeaderboardData({
      topContributors: sortedUsers.slice(0, 50),
      userRank,
      stats: {
        totalContributors: sortedUsers.length,
        totalPoints: sortedUsers.reduce((sum, user) => sum + user.points, 0),
        avgResolutionRate: sortedUsers.length > 0 
          ? sortedUsers.reduce((sum, user) => sum + user.resolutionRate, 0) / sortedUsers.length 
          : 0,
        activeThisMonth: sortedUsers.filter(u => {
          const lastActive = new Date(u.lastActivity);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return lastActive >= thirtyDaysAgo;
        }).length,
        totalIssuesReported: sortedUsers.reduce((sum, user) => sum + user.issuesReported, 0),
        totalIssuesResolved: sortedUsers.reduce((sum, user) => sum + user.issuesResolved, 0),
        avgEngagementScore: sortedUsers.length > 0
          ? sortedUsers.reduce((sum, user) => sum + user.engagementScore, 0) / sortedUsers.length
          : 0
      },
      categories: categoryDistribution,
      trends,
      userDistribution,
      lastUpdated: new Date()
    });

    // Generate recent activity
    const recentIssues = issues
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(issue => {
        let category = issue.category || 'other';
        // Normalize category for display
        if (category.toLowerCase().includes('road') || category.toLowerCase().includes('infrastructure')) {
          category = 'road_infrastructure';
        } else if (category.toLowerCase().includes('sanitation') || category.toLowerCase().includes('waste')) {
          category = 'sanitation_waste';
        } else if (category.toLowerCase().includes('water')) {
          category = 'water_supply';
        } else if (category.toLowerCase().includes('electric')) {
          category = 'electricity';
        } else if (category.toLowerCase().includes('security')) {
          category = 'security';
        } else if (category.toLowerCase().includes('transport')) {
          category = 'transport';
        }
        
        return {
          id: issue._id,
          user: issue.user?.name || 'Anonymous',
          action: `reported a ${CATEGORIES.find(c => c.id === category)?.name?.toLowerCase() || 'community'} issue`,
          title: issue.title || 'Untitled Issue',
          time: issue.createdAt,
          category: category
        };
      });
    
    setRecentActivity(recentIssues);
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchLiveData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchLiveData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchLiveData, autoRefresh]);

  // Filter contributors based on search and category
  const filteredContributors = useMemo(() => {
    let filtered = leaderboardData.topContributors;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.location.toLowerCase().includes(query) ||
        user.level.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(user => 
        user.topCategory === selectedCategory || 
        user.categories?.[selectedCategory] > 0
      );
    }
    
    return filtered;
  }, [leaderboardData.topContributors, searchQuery, selectedCategory]);

  // Format numbers
  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <ChevronUp className="w-4 h-4 text-green-500" />;
      case 'down': return <ChevronDown className="w-4 h-4 text-red-500" />;
      default: return <TrendingUpIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get user badge
  const getUserBadge = (user) => {
    if (user.rank === 1) return '🏆 Community Champion';
    if (user.rank === 2) return '🥈 Elite Contributor';
    if (user.rank === 3) return '🥉 Rising Star';
    if (user.rank <= 10) return '⭐ Top Contributor';
    if (user.rank <= 50) return '✨ Active Member';
    if (user.impactScore >= 80) return '🔥 High Impact';
    return '👋 Contributor';
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">Loading live leaderboard data...</p>
            <p className="text-sm text-gray-500">Fetching real-time community statistics</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community Leaderboard</h1>
              <p className="text-gray-600 mt-2">
                Real-time rankings based on your actual complaint categories
                <span className="block text-sm text-gray-500">
                  Last updated: {leaderboardData.lastUpdated.toLocaleTimeString()}
                  {refreshing && <span className="ml-2 text-blue-600">🔄 Updating...</span>}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
              </button>
              <button
                onClick={fetchLiveData}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Now'}
              </button>
            </div>
          </div>

          {/* Real-time Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { 
                label: 'Total Contributors', 
                value: leaderboardData.stats.totalContributors, 
                icon: <Users className="w-5 h-5" />, 
                color: 'bg-blue-500',
                change: '+12%' 
              },
              { 
                label: 'Total Points', 
                value: formatNumber(leaderboardData.stats.totalPoints), 
                icon: <Trophy className="w-5 h-5" />, 
                color: 'bg-amber-500',
                change: '+8%' 
              },
              { 
                label: 'Avg Resolution Rate', 
                value: `${leaderboardData.stats.avgResolutionRate.toFixed(1)}%`, 
                icon: <CheckCircle className="w-5 h-5" />, 
                color: 'bg-emerald-500',
                change: '+5%' 
              },
              { 
                label: 'Active This Month', 
                value: leaderboardData.stats.activeThisMonth, 
                icon: <Activity className="w-5 h-5" />, 
                color: 'bg-purple-500',
                change: '+15%' 
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUpIcon className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-600">{stat.change}</span>
                    </div>
                  </div>
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <div className="text-white">{stat.icon}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Category Filters - YOUR ACTUAL CATEGORIES */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filter by Complaint Category</h3>
              <span className="text-sm text-gray-500">
                {selectedCategory === 'all' 
                  ? 'Showing all categories' 
                  : `Showing: ${CATEGORIES.find(c => c.id === selectedCategory)?.name}`}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={cat.description}
                >
                  {cat.icon}
                  {cat.name}
                  {selectedCategory === cat.id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Controls */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search contributors by name, location, or level..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {TIME_RANGES.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRefresh"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="autoRefresh" className="text-sm text-gray-700">
                    Auto-refresh
                  </label>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Trends Chart */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Monthly Activity Trends</h3>
                    <p className="text-sm text-gray-600">Based on your actual complaint data</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-sm">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      Issues Reported
                    </span>
                    <span className="flex items-center gap-1 text-sm">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      Issues Resolved
                    </span>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={leaderboardData.trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="issues" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.1} 
                        name="Issues Reported"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="resolved" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.1} 
                        name="Issues Resolved"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Distribution - YOUR CATEGORIES */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Complaint Categories Distribution</h3>
                  <p className="text-sm text-gray-600">Based on {leaderboardData.stats.totalIssuesReported} total reports</p>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leaderboardData.categories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {leaderboardData.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [
                          `${value} reports (${props.payload.resolutionRate?.toFixed(1) || 0}% resolved)`,
                          props.payload.name
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Community Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          <span className="font-semibold">{activity.user}</span> {activity.action}
                        </p>
                        <p className="text-sm text-gray-600">{activity.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        {CATEGORIES.find(c => c.id === activity.category)?.icon}
                        {CATEGORIES.find(c => c.id === activity.category)?.name || 'Other'}
                      </span>
                      <span className="text-sm text-gray-500">{formatTimeAgo(activity.time)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Top 3 Contributors */}
        {filteredContributors.slice(0, 3).length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {filteredContributors.slice(0, 3).map((user, index) => (
              <motion.div
                key={user.id}
                variants={itemVariants}
                className={`relative rounded-2xl p-6 ${
                  index === 0 ? 'md:mt-0' : 'md:mt-12'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}20, white)`,
                  border: `2px solid ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}40`
                }}
              >
                {/* Rank Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{
                      background: `linear-gradient(135deg, ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}, ${
                        index === 0 ? '#FFA500' : index === 1 ? '#A0A0A0' : '#B87333'
                      })`
                    }}
                  >
                    {index + 1}
                  </div>
                </div>

                {/* User Info */}
                <div className="text-center pt-4">
                  <div className="w-20 h-20 mx-auto mb-4 relative">
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center text-white text-2xl font-bold"
                      style={{ 
                        backgroundColor: user.avatarColor || 
                        CATEGORIES.find(c => c.id === user.topCategory)?.color || '#3B82F6' 
                      }}
                    >
                      {user.name.charAt(0)}
                    </div>
                    {user.streak > 5 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <Flame className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h3>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.level === 'Legend' ? 'bg-purple-100 text-purple-800' :
                      user.level === 'Expert' ? 'bg-red-100 text-red-800' :
                      user.level === 'Advanced' ? 'bg-amber-100 text-amber-800' :
                      user.level === 'Intermediate' ? 'bg-emerald-100 text-emerald-800' :
                      user.level === 'Beginner' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.level}
                    </span>
                    <span className="text-xs text-gray-500">{user.location}</span>
                  </div>

                  {/* Category Expertise */}
                  {user.topCategory !== 'none' && user.topCategory !== 'other' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        {CATEGORIES.find(c => c.id === user.topCategory)?.icon}
                        <span>Expert in {CATEGORIES.find(c => c.id === user.topCategory)?.name}</span>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{user.issuesReported}</div>
                      <div className="text-xs text-gray-600">Reports</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{user.resolutionRate.toFixed(0)}%</div>
                      <div className="text-xs text-gray-600">Resolved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{formatNumber(user.points)}</div>
                      <div className="text-xs text-gray-600">Points</div>
                    </div>
                  </div>

                  {/* Engagement Metrics */}
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {formatNumber(user.totalVotes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {formatNumber(user.totalComments)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatNumber(user.totalViews)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Top Contributors</h3>
                <p className="text-sm text-gray-600">
                  {filteredContributors.length} contributors found • 
                  <span className="text-green-600 ml-2">Live Data</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing {Math.min(filteredContributors.length, 50)} of {leaderboardData.stats.totalContributors}
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="w-4 h-4" />
                  Export Data
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contributor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level & Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metrics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impact
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredContributors.slice(0, 50).map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            user.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                            user.rank === 2 ? 'bg-gray-100 text-gray-800' :
                            user.rank === 3 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.rank}
                          </div>
                          {user.rankChange !== 0 && (
                            <div className={`flex items-center gap-1 text-sm ${
                              user.rankChange > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {user.rankChange > 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              {Math.abs(user.rankChange)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="relative">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3"
                              style={{ 
                                backgroundColor: user.avatarColor || 
                                CATEGORIES.find(c => c.id === user.topCategory)?.color || '#3B82F6' 
                              }}
                            >
                              {user.name.charAt(0)}
                            </div>
                            {user.streak > 7 && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {user.location}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            user.level === 'Legend' ? 'bg-purple-500' :
                            user.level === 'Expert' ? 'bg-red-500' :
                            user.level === 'Advanced' ? 'bg-amber-500' :
                            user.level === 'Intermediate' ? 'bg-emerald-500' :
                            user.level === 'Beginner' ? 'bg-blue-500' :
                            'bg-gray-500'
                          }`}></div>
                          <span className="font-medium">{user.level}</span>
                        </div>
                        {user.topCategory !== 'none' && user.topCategory !== 'other' && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            {CATEGORIES.find(c => c.id === user.topCategory)?.icon}
                            {CATEGORIES.find(c => c.id === user.topCategory)?.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Reports:</span>
                            <span className="font-medium">{user.issuesReported}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Resolved:</span>
                            <span className="font-medium text-green-600">{user.issuesResolved}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Rate:</span>
                            <span className="font-medium">{user.resolutionRate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <ThumbsUp className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">{formatNumber(user.totalVotes)} votes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-green-500" />
                            <span className="text-sm">{formatNumber(user.totalComments)} comments</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-purple-500" />
                            <span className="text-sm">{formatNumber(user.totalViews)} views</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-lg">{formatNumber(user.points)}</div>
                        <div className="text-sm text-gray-500">
                          {user.streak > 0 && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <Flame className="w-3 h-3" />
                              {user.streak}d streak
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-emerald-600 rounded-full"
                                style={{ width: `${user.impactScore}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{user.impactScore}/100</div>
                          </div>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded">
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filteredContributors.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No contributors found</h3>
              <p className="text-gray-600">Try adjusting your search or category filters</p>
            </div>
          )}
        </motion.div>

        {/* Your Ranking */}
        {leaderboardData.userRank && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                      {leaderboardData.userRank.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Your Community Ranking</h3>
                      <p className="text-blue-100">Real-time position based on your contributions</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Your Rank', value: `#${leaderboardData.userRank.rank}`, icon: <Trophy className="w-5 h-5" /> },
                      { label: 'Your Points', value: formatNumber(leaderboardData.userRank.points), icon: <Star className="w-5 h-5" /> },
                      { label: 'Impact Score', value: `${leaderboardData.userRank.impactScore || 0}/100`, icon: <Target className="w-5 h-5" /> },
                      { label: 'Active Streak', value: `${leaderboardData.userRank.streak || 0} days`, icon: <Flame className="w-5 h-5" /> }
                    ].map((stat, index) => (
                      <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-blue-100">{stat.label}</span>
                          {stat.icon}
                        </div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">#{leaderboardData.userRank.rank}</div>
                  <div className="text-blue-200">
                    Top {Math.round((leaderboardData.userRank.rank / leaderboardData.stats.totalContributors) * 100)}% •
                    {leaderboardData.stats.totalContributors} total contributors
                  </div>
                  <div className="mt-4">
                    {leaderboardData.userRank.rank <= 10 ? (
                      <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                        <Crown className="w-5 h-5 text-yellow-400" />
                        <span>Top 10 Contributor! 🎉</span>
                      </div>
                    ) : leaderboardData.userRank.rank <= 50 ? (
                      <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                        <TrendingUp className="w-5 h-5" />
                        <span>#{leaderboardData.userRank.rank - 10} spots to Top 10</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                        <Zap className="w-5 h-5" />
                        <span>Report more issues to move up!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            <span className="inline-flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live Data • Updates every 30 seconds when auto-refresh is enabled
            </span>
          </p>
          <p className="mt-1">
            Last full refresh: {leaderboardData.lastUpdated.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </p>
          <p className="mt-1">Data source: Your actual complaint system API</p>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-red-800 font-medium">{error}</p>
                <button
                  onClick={fetchLiveData}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Click here to retry
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
