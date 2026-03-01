import React, { useState, useEffect } from 'react';
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
    TrendingUp, TrendingDown, Users, FileText, CheckCircle, Clock,
    AlertTriangle, Calendar, Download, Filter, RefreshCw, MapPin,
    Activity, Award, Target, Zap
} from 'lucide-react';
import axios from 'axios';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AnalyticsPage = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDepartment, setSelectedDepartment] = useState('all');

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange, selectedCategory, selectedDepartment]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const params = {
                timeRange,
                ...(selectedCategory !== 'all' && { category: selectedCategory }),
                ...(selectedDepartment !== 'all' && { department: selectedDepartment })
            };

            const response = await axios.get('/api/analytics/enhanced/comprehensive', { params });
            setAnalytics(response.data.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportData = async (format) => {
        try {
            const response = await axios.get('/api/analytics/enhanced/export', {
                params: { format, timeRange },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `analytics-${Date.now()}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting data:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!analytics) return null;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-gray-600 mt-1">
                        {analytics.dateRange.start.split('T')[0]} - {analytics.dateRange.end.split('T')[0]}
                    </p>
                </div>
                
                <div className="flex gap-3">
                    {/* Time Range Selector */}
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                        <option value="1y">Last Year</option>
                    </select>

                    {/* Export Button */}
                    <button
                        onClick={() => exportData('csv')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchAnalytics}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard
                    title="Total Complaints"
                    value={analytics.overview.complaints.total}
                    icon={<FileText className="text-blue-600" />}
                    trend={analytics.comparison.growth.complaints}
                    subtitle={`${analytics.overview.complaints.active} active`}
                />
                <StatCard
                    title="Resolution Rate"
                    value={`${analytics.overview.complaints.resolutionRate}%`}
                    icon={<CheckCircle className="text-green-600" />}
                    trend={analytics.comparison.growth.resolved}
                    subtitle={`${analytics.overview.complaints.resolved} resolved`}
                />
                <StatCard
                    title="Active Users"
                    value={analytics.overview.users.active}
                    icon={<Users className="text-purple-600" />}
                    trend={null}
                    subtitle={`${analytics.overview.users.engagementRate}% engagement`}
                />
                <StatCard
                    title="Avg Resolution Time"
                    value={analytics.overview.performance.averageResolutionTime 
                        ? `${analytics.overview.performance.averageResolutionTime}h`
                        : 'N/A'}
                    icon={<Clock className="text-orange-600" />}
                    trend={null}
                    subtitle="Average"
                />
            </div>

            {/* Trends Chart */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Complaint Trends</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="created" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Created" />
                        <Area type="monotone" dataKey="resolved" stackId="2" stroke="#10b981" fill="#10b981" name="Resolved" />
                        <Area type="monotone" dataKey="pending" stackId="3" stroke="#f59e0b" fill="#f59e0b" name="Pending" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Category Breakdown */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Category Breakdown</h2>
                    <div className="flex items-center justify-between">
                        <ResponsiveContainer width="50%" height={250}>
                            <PieChart>
                                <Pie
                                    data={analytics.categories}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => entry.category}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="total"
                                >
                                    {analytics.categories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="w-1/2 space-y-2">
                            {analytics.categories.map((cat, index) => (
                                <div key={cat.category} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="text-sm capitalize">{cat.category}</span>
                                    </div>
                                    <span className="text-sm font-bold">{cat.total}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Resolution Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Resolution Time Distribution</h2>
                    <div className="space-y-4">
                        <ResolutionBar
                            label="Under 24 hours"
                            value={analytics.resolution.distribution.under24Hours}
                            percentage={analytics.resolution.distribution.percentages.under24Hours}
                            color="bg-green-500"
                        />
                        <ResolutionBar
                            label="24-48 hours"
                            value={analytics.resolution.distribution.under48Hours - analytics.resolution.distribution.under24Hours}
                            percentage={(parseFloat(analytics.resolution.distribution.percentages.under48Hours) - parseFloat(analytics.resolution.distribution.percentages.under24Hours)).toFixed(2)}
                            color="bg-blue-500"
                        />
                        <ResolutionBar
                            label="48-72 hours"
                            value={analytics.resolution.distribution.under72Hours - analytics.resolution.distribution.under48Hours}
                            percentage={(parseFloat(analytics.resolution.distribution.percentages.under72Hours) - parseFloat(analytics.resolution.distribution.percentages.under48Hours)).toFixed(2)}
                            color="bg-yellow-500"
                        />
                        <ResolutionBar
                            label="Over a week"
                            value={analytics.resolution.distribution.overAWeek}
                            percentage={analytics.resolution.distribution.percentages.overAWeek}
                            color="bg-red-500"
                        />
                    </div>
                </div>
            </div>

            {/* Staff Performance */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Award className="text-yellow-500" />
                    Top Performing Staff
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4">Name</th>
                                <th className="text-left py-3 px-4">Assigned</th>
                                <th className="text-left py-3 px-4">Resolved</th>
                                <th className="text-left py-3 px-4">Resolution Rate</th>
                                <th className="text-left py-3 px-4">Avg Time</th>
                                <th className="text-left py-3 px-4">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics.staff.slice(0, 10).map((member, index) => (
                                <tr key={member.staffId} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{index + 1}.</span>
                                            <span>{member.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">{member.totalAssigned}</td>
                                    <td className="py-3 px-4">{member.resolved}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            parseFloat(member.resolutionRate) >= 80 ? 'bg-green-100 text-green-800' :
                                            parseFloat(member.resolutionRate) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {member.resolutionRate}%
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">{member.avgResolutionHours}h</td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${member.performanceScore}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold">{member.performanceScore}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Department Performance */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Department Performance</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.departments}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="departmentName" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="totalAssigned" fill="#3b82f6" name="Total Assigned" />
                        <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
                        <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Time Patterns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hourly Pattern */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Complaints by Hour of Day</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={analytics.timePatterns.hourlyPattern}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                    <div className="mt-4 text-sm text-gray-600">
                        Peak hour: {analytics.timePatterns.peakHour?._id}:00 with {analytics.timePatterns.peakHour?.count} complaints
                    </div>
                </div>

                {/* Weekly Pattern */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Complaints by Day of Week</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={analytics.timePatterns.weekdayPattern}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8b5cf6" />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 text-sm text-gray-600">
                        Busiest day: {analytics.timePatterns.peakDay?._id} with {analytics.timePatterns.peakDay?.count} complaints
                    </div>
                </div>
            </div>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ title, value, icon, trend, subtitle }) => (
    <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
            <div className="text-gray-600 text-sm font-medium">{title}</div>
            <div>{icon}</div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
        {trend !== null && (
            <div className={`flex items-center gap-1 text-sm ${
                trend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
                {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{Math.abs(trend)}% vs previous period</span>
            </div>
        )}
        {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
    </div>
);

// Resolution Bar Component
const ResolutionBar = ({ label, value, percentage, color }) => (
    <div>
        <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700">{label}</span>
            <span className="text-gray-600">{value} ({percentage}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
            <div
                className={`${color} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    </div>
);

export default AnalyticsPage;