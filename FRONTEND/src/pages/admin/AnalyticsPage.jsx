import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  Activity,
  Award,
} from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token =
        localStorage.getItem("adminToken") ||
        localStorage.getItem("staffToken") ||
        localStorage.getItem("accessToken");

      // Log the token being used (first few chars only for security)
      console.log("Using token type:", token ? 
        (localStorage.getItem("adminToken") ? "admin" : 
         localStorage.getItem("staffToken") ? "staff" : "user") : "none");

      // Try different possible endpoint paths
      const possibleEndpoints = [
        `${API_URL}/api/analytics/comprehensive`,
        `${API_URL}/api/admin/analytics/comprehensive`,
        `${API_URL}/api/analytics/dashboard`,
        `${API_URL}/api/admin/analytics/dashboard`
      ];

      let response = null;
      let lastError = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log("Trying endpoint:", endpoint);
          response = await axios.get(endpoint, {
            params: { timeRange },
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            timeout: 5000 // 5 second timeout
          });
          console.log("Success with endpoint:", endpoint);
          break; // Exit loop if successful
        } catch (err) {
          lastError = err;
          console.log(`Endpoint ${endpoint} failed:`, err.message);
          // Continue to next endpoint
        }
      }

      if (response && response.data) {
        // Handle different response structures
        const analyticsData = response.data.data || response.data;
        setAnalytics(analyticsData);
      } else {
        throw lastError || new Error("All endpoints failed");
      }
      
    } catch (err) {
      console.error("Error fetching analytics:", err);
      
      // More specific error message
      let errorMessage = "Failed to load analytics. ";
      if (err.code === 'ECONNABORTED') {
        errorMessage += "Request timeout. Server might be slow.";
      } else if (err.response?.status === 401) {
        errorMessage += "Unauthorized. Please login as admin.";
      } else if (err.response?.status === 403) {
        errorMessage += "Access denied. Admin privileges required.";
      } else if (err.response?.status === 404) {
        errorMessage += "Analytics API endpoint not found. Please check server routes.";
      } else {
        errorMessage += err.response?.data?.message || err.message || "Please check the server and try again.";
      }
      
      setError(errorMessage);
      
      // Set fallback demo data for development
      if (process.env.NODE_ENV === 'development') {
        console.log("Using fallback demo data");
        setAnalytics(getDemoAnalytics());
      }
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        `${API_URL}/api/admin/analytics/export`,
        {
          params: { format, timeRange },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `analytics-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error exporting data:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-2xl p-10 shadow border border-red-100 max-w-md text-center">
          <AlertTriangle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Analytics Unavailable
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 mx-auto transition-all"
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          {analytics.dateRange && (
            <p className="text-gray-600 mt-1">
              {analytics.dateRange.start?.split("T")[0]} —{" "}
              {analytics.dateRange.end?.split("T")[0]}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={() => exportData("csv")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Complaints"
          value={analytics.overview?.complaints?.total ?? 0}
          icon={<FileText className="text-blue-600" />}
          trend={analytics.comparison?.growth?.complaints ?? null}
          subtitle={`${analytics.overview?.complaints?.active ?? 0} active`}
        />
        <StatCard
          title="Resolution Rate"
          value={`${analytics.overview?.complaints?.resolutionRate ?? 0}%`}
          icon={<CheckCircle className="text-green-600" />}
          trend={analytics.comparison?.growth?.resolved ?? null}
          subtitle={`${analytics.overview?.complaints?.resolved ?? 0} resolved`}
        />
        <StatCard
          title="Active Users"
          value={analytics.overview?.users?.active ?? 0}
          icon={<Users className="text-purple-600" />}
          trend={null}
          subtitle={`${analytics.overview?.users?.engagementRate ?? 0}% engagement`}
        />
        <StatCard
          title="Avg Resolution Time"
          value={
            analytics.overview?.performance?.averageResolutionTime
              ? `${analytics.overview.performance.averageResolutionTime}h`
              : "N/A"
          }
          icon={<Clock className="text-orange-600" />}
          trend={null}
          subtitle="Average"
        />
      </div>

      {/* Trends Chart - Only render if data exists */}
      {analytics.trends?.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Complaint Trends</h2>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <AreaChart data={analytics.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="created"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="Created"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stackId="2"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Resolved"
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stackId="3"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.3}
                  name="Pending"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <p className="text-gray-500 text-center">No trend data available</p>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Breakdown */}
        {analytics.categories?.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Category Breakdown</h2>
            <div className="flex items-center justify-between">
              <div style={{ width: '50%', height: '250px' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={analytics.categories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="total"
                    >
                      {analytics.categories.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2">
                {analytics.categories.map((cat, index) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-sm capitalize">{cat.category}</span>
                    </div>
                    <span className="text-sm font-bold">{cat.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <p className="text-gray-500 text-center">No category data available</p>
          </div>
        )}

        {/* Resolution Distribution */}
        {analytics.resolution?.distribution ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold mb-4">
              Resolution Time Distribution
            </h2>
            <div className="space-y-4">
              <ResolutionBar
                label="Under 24 hours"
                value={analytics.resolution.distribution.under24Hours || 0}
                percentage={
                  analytics.resolution.distribution.percentages?.under24Hours ?? 0
                }
                color="bg-green-500"
              />
              <ResolutionBar
                label="24–48 hours"
                value={
                  (analytics.resolution.distribution.under48Hours ?? 0) -
                  (analytics.resolution.distribution.under24Hours ?? 0)
                }
                percentage={(
                  parseFloat(
                    analytics.resolution.distribution.percentages
                      ?.under48Hours ?? 0,
                  ) -
                  parseFloat(
                    analytics.resolution.distribution.percentages
                      ?.under24Hours ?? 0,
                  )
                ).toFixed(2)}
                color="bg-blue-500"
              />
              <ResolutionBar
                label="48–72 hours"
                value={
                  (analytics.resolution.distribution.under72Hours ?? 0) -
                  (analytics.resolution.distribution.under48Hours ?? 0)
                }
                percentage={(
                  parseFloat(
                    analytics.resolution.distribution.percentages
                      ?.under72Hours ?? 0,
                  ) -
                  parseFloat(
                    analytics.resolution.distribution.percentages
                      ?.under48Hours ?? 0,
                  )
                ).toFixed(2)}
                color="bg-yellow-500"
              />
              <ResolutionBar
                label="Over a week"
                value={analytics.resolution.distribution.overAWeek ?? 0}
                percentage={
                  analytics.resolution.distribution.percentages?.overAWeek ?? 0
                }
                color="bg-red-500"
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <p className="text-gray-500 text-center">No resolution data available</p>
          </div>
        )}
      </div>

      {/* Staff Performance */}
      {analytics.staff?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="text-yellow-500" /> Top Performing Staff
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Assigned
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Resolved
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Resolution Rate
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Avg Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.staff.slice(0, 10).map((member, index) => (
                  <tr
                    key={member.staffId || index}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-medium">
                          {index + 1}.
                        </span>
                        <span className="font-medium">{member.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{member.totalAssigned || 0}</td>
                    <td className="py-3 px-4">{member.resolved || 0}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          parseFloat(member.resolutionRate || 0) >= 80
                            ? "bg-green-100 text-green-800"
                            : parseFloat(member.resolutionRate || 0) >= 60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {member.resolutionRate || 0}%
                      </span>
                    </td>
                    <td className="py-3 px-4">{member.avgResolutionHours || 0}h</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, member.performanceScore || 0)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold">
                          {member.performanceScore || 0}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Department Performance */}
      {analytics.departments?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Department Performance</h2>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={analytics.departments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="departmentName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="totalAssigned"
                  fill="#3b82f6"
                  name="Total Assigned"
                />
                <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Time Patterns */}
      {analytics.timePatterns && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analytics.timePatterns.hourlyPattern?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-4">Complaints by Hour</h2>
              <div style={{ width: '100%', height: '250px' }}>
                <ResponsiveContainer>
                  <LineChart data={analytics.timePatterns.hourlyPattern}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {analytics.timePatterns.peakHour && (
                <p className="mt-3 text-sm text-gray-500">
                  Peak:{" "}
                  <strong>{analytics.timePatterns.peakHour._id}:00</strong> with{" "}
                  <strong>{analytics.timePatterns.peakHour.count}</strong>{" "}
                  complaints
                </p>
              )}
            </div>
          )}
          {analytics.timePatterns.weekdayPattern?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-4">Complaints by Day</h2>
              <div style={{ width: '100%', height: '250px' }}>
                <ResponsiveContainer>
                  <BarChart data={analytics.timePatterns.weekdayPattern}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {analytics.timePatterns.peakDay && (
                <p className="mt-3 text-sm text-gray-500">
                  Busiest: <strong>{analytics.timePatterns.peakDay._id}</strong>{" "}
                  with <strong>{analytics.timePatterns.peakDay.count}</strong>{" "}
                  complaints
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, subtitle }) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <div className="text-gray-500 text-sm font-medium">{title}</div>
      <div>{icon}</div>
    </div>
    <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
    {trend !== null && (
      <div
        className={`flex items-center gap-1 text-sm ${trend >= 0 ? "text-green-600" : "text-red-600"}`}
      >
        {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{Math.abs(trend)}% vs previous period</span>
      </div>
    )}
    {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
  </div>
);

const ResolutionBar = ({ label, value, percentage, color }) => (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-700">{label}</span>
      <span className="text-gray-500">
        {value} ({percentage}%)
      </span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`${color} h-2 rounded-full transition-all duration-300`}
        style={{ width: `${Math.min(100, percentage)}%` }}
      />
    </div>
  </div>
);

// Demo data for development
function getDemoAnalytics() {
  return {
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    },
    overview: {
      complaints: {
        total: 150,
        active: 45,
        resolved: 95,
        resolutionRate: 63.33
      },
      users: {
        total: 500,
        active: 120,
        engagementRate: 24
      },
      performance: {
        averageResolutionTime: 48.5,
        averageResponseTime: 12.3,
        satisfactionScore: 4.2
      }
    },
    trends: [
      { date: '2024-01-01', created: 5, resolved: 3, pending: 2 },
      { date: '2024-01-02', created: 7, resolved: 4, pending: 3 },
      { date: '2024-01-03', created: 4, resolved: 5, pending: 1 },
    ],
    categories: [
      { category: 'technical', total: 45, pending: 10, resolved: 30, resolutionRate: 66.67 },
      { category: 'billing', total: 35, pending: 8, resolved: 25, resolutionRate: 71.43 },
      { category: 'general', total: 70, pending: 15, resolved: 50, resolutionRate: 71.43 },
    ],
    staff: [
      {
        staffId: '1',
        name: 'John Doe',
        totalAssigned: 25,
        resolved: 20,
        resolutionRate: 80,
        avgResolutionHours: 24,
        performanceScore: 85
      }
    ]
  };
}

export default AnalyticsPage;