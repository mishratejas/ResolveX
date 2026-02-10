// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import {
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
//   PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
//   RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
//   Treemap, ScatterChart, Scatter, ZAxis
// } from 'recharts';
// import {
//   Download, Calendar, Filter, RefreshCw, TrendingUp, Users,
//   Clock, CheckCircle, AlertCircle, MapPin, BarChart3, PieChart as PieChartIcon,
//   LineChart as LineChartIcon, Activity, Target, Globe, Zap,
//   ChevronDown, ChevronUp, Eye, Share2, Printer, ExternalLink
// } from 'lucide-react';

// const BASE_URL = import.meta.env.VITE_API_URL || "https://webster-2025.onrender.com";

// const AnalyticsPage = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [analyticsData, setAnalyticsData] = useState(null);
//   const [period, setPeriod] = useState('30');
//   const [department, setDepartment] = useState('all');
//   const [chartType, setChartType] = useState('line');
//   const [timeframe, setTimeframe] = useState('daily');
//   const [exportFormat, setExportFormat] = useState('csv');
//   const [stats, setStats] = useState({
//     total: 0,
//     resolved: 0,
//     pending: 0,
//     inProgress: 0,
//     avgResolutionTime: 0,
//     satisfaction: 0
//   });
//   const [activeTab, setActiveTab] = useState('overview');
//   const [topStaff, setTopStaff] = useState([]);
//   const [geographicData, setGeographicData] = useState([]);
//   const [comparisonData, setComparisonData] = useState([]);
//   const [showExportOptions, setShowExportOptions] = useState(false);

//   useEffect(() => {
//     fetchAnalytics();
//   }, [period, department, timeframe]);

//   const fetchAnalytics = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
      
//       const [
//         analyticsRes,
//         statsRes,
//         staffRes,
//         geoRes,
//         comparisonRes
//       ] = await Promise.all([
//         axios.get(`${BASE_URL}/api/admin/analytics`, {
//           headers: { Authorization: `Bearer ${token}` },
//           params: { 
//             period, 
//             department,
//             timeframe 
//           }
//         }),
//         axios.get(`${BASE_URL}/api/admin/stats/overview`, {
//           headers: { Authorization: `Bearer ${token}` }
//         }),
//         axios.get(`${BASE_URL}/api/admin/staff/top-performers`, {
//           headers: { Authorization: `Bearer ${token}` }
//         }),
//         axios.get(`${BASE_URL}/api/admin/analytics/geographic`, {
//           headers: { Authorization: `Bearer ${token}` }
//         }),
//         axios.get(`${BASE_URL}/api/admin/analytics/comparison`, {
//           headers: { Authorization: `Bearer ${token}` }
//         })
//       ]);

//       if (analyticsRes.data.success) {
//         setAnalyticsData(analyticsRes.data.data);
//       }

//       if (statsRes.data.success) {
//         setStats(statsRes.data.data);
//       }

//       if (staffRes.data.success) {
//         setTopStaff(staffRes.data.data);
//       }

//       if (geoRes.data.success) {
//         setGeographicData(geoRes.data.data);
//       }

//       if (comparisonRes.data.success) {
//         setComparisonData(comparisonRes.data.data);
//       }

//     } catch (error) {
//       console.error('Error fetching analytics:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleExport = async (format) => {
//     try {
//       const token = localStorage.getItem('adminToken');
//       const url = `${BASE_URL}/api/admin/analytics/export`;
      
//       const response = await axios.post(
//         url,
//         { 
//           format, 
//           period, 
//           department,
//           timeframe 
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//           responseType: 'blob'
//         }
//       );

//       const blob = new Blob([response.data], { 
//         type: format === 'pdf' ? 'application/pdf' : 'text/csv' 
//       });
//       const downloadUrl = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = downloadUrl;
//       link.download = `analytics_${new Date().toISOString().split('T')[0]}.${format}`;
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
      
//       setShowExportOptions(false);
//     } catch (error) {
//       console.error('Export error:', error);
//     }
//   };

//   const COLORS = [
//     '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
//     '#82ca9d', '#ff6b6b', '#4ecdc4', '#ffe66d', '#1a535c'
//   ];

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
//         <div className="text-center">
//           <div className="relative">
//             <div className="w-20 h-20 border-4 border-teal-200 rounded-full"></div>
//             <div className="absolute top-0 left-0 w-20 h-20 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
//           </div>
//           <p className="text-gray-600 mt-4">Loading analytics...</p>
//           <p className="text-sm text-gray-500 mt-2">Crunching the numbers</p>
//         </div>
//       </div>
//     );
//   }

//   if (!analyticsData) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center py-20">
//             <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
//               <BarChart3 className="w-12 h-12 text-gray-400" />
//             </div>
//             <h3 className="text-2xl font-bold text-gray-700 mb-2">No Analytics Data</h3>
//             <p className="text-gray-500 mb-6 max-w-md mx-auto">
//               Analytics data will appear here once complaints are submitted and processed.
//             </p>
//             <button
//               onClick={() => navigate('/admin/dashboard')}
//               className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
//             >
//               Go to Dashboard
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const departmentData = Object.entries(analyticsData.distributions?.departments || {}).map(([name, value]) => ({
//     name,
//     value,
//     fill: COLORS[Math.floor(Math.random() * COLORS.length)]
//   }));

//   const statusData = Object.entries(analyticsData.distributions?.status || {}).map(([name, value]) => ({
//     name: name.charAt(0).toUpperCase() + name.slice(1),
//     value,
//     fill: name === 'resolved' ? '#10b981' : 
//           name === 'pending' ? '#f59e0b' : 
//           name === 'in-progress' ? '#3b82f6' : '#6b7280'
//   }));

//   const dailyTrends = analyticsData.trends?.daily || [];
//   const hourlyTrends = analyticsData.trends?.hourly || [];

//   const performanceMetrics = [
//     { name: 'Response Time', value: analyticsData.summary?.avgResponseTime || 0, unit: 'hrs', target: 24 },
//     { name: 'Resolution Rate', value: analyticsData.summary?.resolutionRate || 0, unit: '%', target: 90 },
//     { name: 'Satisfaction', value: analyticsData.summary?.satisfactionScore || 0, unit: '%', target: 85 },
//     { name: 'First Contact', value: analyticsData.summary?.firstContactResolution || 0, unit: '%', target: 70 }
//   ];

//   const StatCard = ({ title, value, icon: Icon, color, trend, description }) => (
//     <div className={`bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 ${color.border} hover:${color.borderDark}`}>
//       <div className="flex items-center justify-between mb-4">
//         <div className={`p-3 rounded-xl ${color.bg}`}>
//           <Icon className={`w-6 h-6 ${color.text}`} />
//         </div>
//         {trend && (
//           <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${trend.bg}`}>
//             {trend.icon}
//             <span className={trend.text}>{trend.value}</span>
//           </div>
//         )}
//       </div>
//       <div>
//         <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
//         <p className="text-gray-600">{title}</p>
//         {description && (
//           <p className="text-xs text-gray-500 mt-2">{description}</p>
//         )}
//       </div>
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
//       {/* Header */}
//       <div className="max-w-7xl mx-auto">
//         <div className="mb-8">
//           <button
//             onClick={() => navigate('/admin/dashboard')}
//             className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
//           >
//             <ChevronUp className="w-4 h-4 transform -rotate-90" />
//             Back to Dashboard
//           </button>
          
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
//             <div>
//               <div className="flex items-center gap-3 mb-2">
//                 <div className="p-2 bg-gradient-to-br from-teal-100 to-blue-100 rounded-xl">
//                   <BarChart3 className="w-6 h-6 text-teal-600" />
//                 </div>
//                 <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
//               </div>
//               <p className="text-gray-600">
//                 Comprehensive insights and performance metrics for your complaint management system
//               </p>
//             </div>
            
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={fetchAnalytics}
//                 className="p-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
//                 title="Refresh Data"
//               >
//                 <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
//               </button>
              
//               <div className="relative">
//                 <button
//                   onClick={() => setShowExportOptions(!showExportOptions)}
//                   className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl hover:from-teal-700 hover:to-blue-700 transition-all flex items-center gap-2"
//                 >
//                   <Download className="w-4 h-4" />
//                   Export
//                   <ChevronDown className="w-4 h-4" />
//                 </button>
                
//                 {showExportOptions && (
//                   <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
//                     <div className="py-2">
//                       <button
//                         onClick={() => handleExport('csv')}
//                         className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
//                       >
//                         <Download className="w-4 h-4" />
//                         CSV Format
//                       </button>
//                       <button
//                         onClick={() => handleExport('pdf')}
//                         className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
//                       >
//                         <Printer className="w-4 h-4" />
//                         PDF Report
//                       </button>
//                       <button
//                         onClick={() => {
//                           // Share functionality
//                           navigator.clipboard.writeText(window.location.href);
//                           alert('Link copied to clipboard!');
//                         }}
//                         className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
//                       >
//                         <Share2 className="w-4 h-4" />
//                         Share Dashboard
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Controls */}
//         <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-8">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 <div className="flex items-center gap-2">
//                   <Calendar className="w-4 h-4" />
//                   Time Period
//                 </div>
//               </label>
//               <select
//                 value={period}
//                 onChange={(e) => setPeriod(e.target.value)}
//                 className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
//               >
//                 <option value="7">Last 7 days</option>
//                 <option value="30">Last 30 days</option>
//                 <option value="90">Last 90 days</option>
//                 <option value="365">Last year</option>
//                 <option value="all">All time</option>
//               </select>
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 <div className="flex items-center gap-2">
//                   <Filter className="w-4 h-4" />
//                   Department
//                 </div>
//               </label>
//               <select
//                 value={department}
//                 onChange={(e) => setDepartment(e.target.value)}
//                 className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
//               >
//                 <option value="all">All Departments</option>
//                 <option value="road">Road</option>
//                 <option value="water">Water</option>
//                 <option value="electricity">Electricity</option>
//                 <option value="sanitation">Sanitation</option>
//                 <option value="other">Other</option>
//               </select>
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 <div className="flex items-center gap-2">
//                   <LineChartIcon className="w-4 h-4" />
//                   Timeframe
//                 </div>
//               </label>
//               <select
//                 value={timeframe}
//                 onChange={(e) => setTimeframe(e.target.value)}
//                 className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
//               >
//                 <option value="hourly">Hourly</option>
//                 <option value="daily">Daily</option>
//                 <option value="weekly">Weekly</option>
//                 <option value="monthly">Monthly</option>
//               </select>
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 <div className="flex items-center gap-2">
//                   <PieChartIcon className="w-4 h-4" />
//                   Chart Type
//                 </div>
//               </label>
//               <select
//                 value={chartType}
//                 onChange={(e) => setChartType(e.target.value)}
//                 className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
//               >
//                 <option value="line">Line Chart</option>
//                 <option value="bar">Bar Chart</option>
//                 <option value="area">Area Chart</option>
//                 <option value="radar">Radar Chart</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="mb-8">
//           <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl inline-flex">
//             {['overview', 'performance', 'geographic', 'staff', 'comparison'].map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setActiveTab(tab)}
//                 className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
//                   activeTab === tab
//                     ? 'bg-white text-gray-900 shadow-sm'
//                     : 'text-gray-600 hover:text-gray-900'
//                 }`}
//               >
//                 {tab.charAt(0).toUpperCase() + tab.slice(1)}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Overview Tab */}
//         {activeTab === 'overview' && (
//           <>
//             {/* Summary Stats */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//               <StatCard
//                 title="Total Complaints"
//                 value={analyticsData.summary?.totalComplaints || 0}
//                 icon={Activity}
//                 color={{
//                   bg: 'bg-blue-50',
//                   text: 'text-blue-600',
//                   border: 'border-blue-100'
//                 }}
//                 trend={{
//                   value: '+12%',
//                   bg: 'bg-green-100',
//                   text: 'text-green-600',
//                   icon: <TrendingUp className="w-3 h-3" />
//                 }}
//                 description="Compared to last period"
//               />
              
//               <StatCard
//                 title="Resolved"
//                 value={analyticsData.summary?.resolvedComplaints || 0}
//                 icon={CheckCircle}
//                 color={{
//                   bg: 'bg-green-50',
//                   text: 'text-green-600',
//                   border: 'border-green-100'
//                 }}
//                 description={`${analyticsData.summary?.resolutionRate || 0}% resolution rate`}
//               />
              
//               <StatCard
//                 title="Pending"
//                 value={analyticsData.summary?.pendingComplaints || 0}
//                 icon={Clock}
//                 color={{
//                   bg: 'bg-yellow-50',
//                   text: 'text-yellow-600',
//                   border: 'border-yellow-100'
//                 }}
//                 description={`${Math.round((analyticsData.summary?.pendingComplaints / analyticsData.summary?.totalComplaints) * 100) || 0}% of total`}
//               />
              
//               <StatCard
//                 title="Avg. Resolution Time"
//                 value={`${analyticsData.summary?.avgResolutionTime || 0}d`}
//                 icon={Zap}
//                 color={{
//                   bg: 'bg-purple-50',
//                   text: 'text-purple-600',
//                   border: 'border-purple-100'
//                 }}
//                 description="Days to resolve"
//               />
//             </div>

//             {/* Charts Row 1 */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//               {/* Trends Chart */}
//               <div className="bg-white rounded-2xl p-6 border border-gray-200">
//                 <div className="flex items-center justify-between mb-6">
//                   <h3 className="text-lg font-semibold text-gray-900">Complaint Trends</h3>
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm text-gray-500">Complaints</span>
//                     <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
//                   </div>
//                 </div>
//                 <div className="h-72">
//                   <ResponsiveContainer width="100%" height="100%">
//                     {chartType === 'line' ? (
//                       <LineChart data={timeframe === 'hourly' ? hourlyTrends : dailyTrends}>
//                         <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                         <XAxis 
//                           dataKey={timeframe === 'hourly' ? 'hour' : 'date'} 
//                           tick={{ fill: '#6b7280' }}
//                         />
//                         <YAxis tick={{ fill: '#6b7280' }} />
//                         <Tooltip
//                           contentStyle={{ 
//                             backgroundColor: 'white',
//                             border: '1px solid #e5e7eb',
//                             borderRadius: '0.5rem'
//                           }}
//                         />
//                         <Legend />
//                         <Line 
//                           type="monotone" 
//                           dataKey="complaints" 
//                           stroke="#3b82f6" 
//                           strokeWidth={2}
//                           dot={{ r: 4 }}
//                           activeDot={{ r: 6 }}
//                         />
//                         <Line 
//                           type="monotone" 
//                           dataKey="resolved" 
//                           stroke="#10b981" 
//                           strokeWidth={2}
//                           dot={{ r: 4 }}
//                         />
//                       </LineChart>
//                     ) : chartType === 'area' ? (
//                       <AreaChart data={dailyTrends}>
//                         <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                         <XAxis dataKey="date" tick={{ fill: '#6b7280' }} />
//                         <YAxis tick={{ fill: '#6b7280' }} />
//                         <Tooltip />
//                         <Area type="monotone" dataKey="complaints" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
//                         <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
//                       </AreaChart>
//                     ) : (
//                       <BarChart data={dailyTrends}>
//                         <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                         <XAxis dataKey="date" tick={{ fill: '#6b7280' }} />
//                         <YAxis tick={{ fill: '#6b7280' }} />
//                         <Tooltip />
//                         <Bar dataKey="complaints" fill="#3b82f6" />
//                         <Bar dataKey="resolved" fill="#10b981" />
//                       </BarChart>
//                     )}
//                   </ResponsiveContainer>
//                 </div>
//               </div>

//               {/* Department Distribution */}
//               <div className="bg-white rounded-2xl p-6 border border-gray-200">
//                 <div className="flex items-center justify-between mb-6">
//                   <h3 className="text-lg font-semibold text-gray-900">Department Distribution</h3>
//                   <PieChartIcon className="w-5 h-5 text-gray-400" />
//                 </div>
//                 <div className="h-72">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <PieChart>
//                       <Pie
//                         data={departmentData}
//                         cx="50%"
//                         cy="50%"
//                         innerRadius={60}
//                         outerRadius={100}
//                         paddingAngle={5}
//                         dataKey="value"
//                         label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                       >
//                         {departmentData.map((entry, index) => (
//                           <Cell key={`cell-${index}`} fill={entry.fill} />
//                         ))}
//                       </Pie>
//                       <Tooltip 
//                         formatter={(value) => [`${value} complaints`, 'Count']}
//                         contentStyle={{ 
//                           backgroundColor: 'white',
//                           border: '1px solid #e5e7eb',
//                           borderRadius: '0.5rem'
//                         }}
//                       />
//                       <Legend />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>
//             </div>

//             {/* Charts Row 2 */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//               {/* Status Distribution */}
//               <div className="bg-white rounded-2xl p-6 border border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-6">Status Distribution</h3>
//                 <div className="h-64">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <BarChart data={statusData} layout="vertical">
//                       <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                       <XAxis type="number" tick={{ fill: '#6b7280' }} />
//                       <YAxis 
//                         type="category" 
//                         dataKey="name" 
//                         tick={{ fill: '#6b7280' }}
//                         width={80}
//                       />
//                       <Tooltip 
//                         formatter={(value) => [`${value} complaints`, 'Count']}
//                         contentStyle={{ 
//                           backgroundColor: 'white',
//                           border: '1px solid #e5e7eb',
//                           borderRadius: '0.5rem'
//                         }}
//                       />
//                       <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
//                         {statusData.map((entry, index) => (
//                           <Cell key={`cell-${index}`} fill={entry.fill} />
//                         ))}
//                       </Bar>
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>

//               {/* Performance Metrics */}
//               <div className="bg-white rounded-2xl p-6 border border-gray-200">
//                 <div className="flex items-center justify-between mb-6">
//                   <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
//                   <Target className="w-5 h-5 text-gray-400" />
//                 </div>
//                 <div className="space-y-6">
//                   {performanceMetrics.map((metric, index) => (
//                     <div key={index} className="space-y-2">
//                       <div className="flex justify-between">
//                         <span className="text-sm text-gray-600">{metric.name}</span>
//                         <span className="text-sm font-semibold">
//                           {metric.value}{metric.unit}
//                         </span>
//                       </div>
//                       <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
//                         <div 
//                           className={`h-full rounded-full ${
//                             metric.value >= metric.target ? 'bg-green-500' : 'bg-yellow-500'
//                           }`}
//                           style={{ width: `${Math.min(100, (metric.value / metric.target) * 100)}%` }}
//                         ></div>
//                       </div>
//                       <div className="flex justify-between text-xs text-gray-500">
//                         <span>0{metric.unit}</span>
//                         <span>Target: {metric.target}{metric.unit}</span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </>
//         )}

//         {/* Performance Tab */}
//         {activeTab === 'performance' && (
//           <div className="space-y-8">
//             {/* Radar Chart for Performance */}
//             <div className="bg-white rounded-2xl p-6 border border-gray-200">
//               <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Overview</h3>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <RadarChart data={performanceMetrics}>
//                     <PolarGrid />
//                     <PolarAngleAxis dataKey="name" />
//                     <PolarRadiusAxis />
//                     <Radar
//                       name="Current"
//                       dataKey="value"
//                       stroke="#3b82f6"
//                       fill="#3b82f6"
//                       fillOpacity={0.6}
//                     />
//                     <Radar
//                       name="Target"
//                       dataKey="target"
//                       stroke="#10b981"
//                       fill="#10b981"
//                       fillOpacity={0.2}
//                     />
//                     <Legend />
//                     <Tooltip />
//                   </RadarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             {/* Hourly Performance */}
//             <div className="bg-white rounded-2xl p-6 border border-gray-200">
//               <h3 className="text-lg font-semibold text-gray-900 mb-6">Hourly Performance Trends</h3>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <AreaChart data={hourlyTrends}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                     <XAxis dataKey="hour" tick={{ fill: '#6b7280' }} />
//                     <YAxis tick={{ fill: '#6b7280' }} />
//                     <Tooltip />
//                     <Area type="monotone" dataKey="complaints" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
//                     <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
//                   </AreaChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Geographic Tab */}
//         {activeTab === 'geographic' && (
//           <div className="space-y-8">
//             <div className="bg-white rounded-2xl p-6 border border-gray-200">
//               <div className="flex items-center justify-between mb-6">
//                 <h3 className="text-lg font-semibold text-gray-900">Geographic Distribution</h3>
//                 <Globe className="w-5 h-5 text-gray-400" />
//               </div>
//               <div className="h-96">
//                 {/* Map visualization would go here */}
//                 <div className="h-full bg-gray-100 rounded-xl flex items-center justify-center">
//                   <div className="text-center">
//                     <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//                     <p className="text-gray-600">Map visualization coming soon</p>
//                     <p className="text-sm text-gray-500 mt-2">
//                       {geographicData.length} locations tracked
//                     </p>
//                   </div>
//                 </div>
//               </div>
//               <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
//                 <div className="text-center p-4 bg-gray-50 rounded-lg">
//                   <div className="text-2xl font-bold text-gray-900">
//                     {geographicData.length}
//                   </div>
//                   <div className="text-sm text-gray-600">Locations</div>
//                 </div>
//                 <div className="text-center p-4 bg-gray-50 rounded-lg">
//                   <div className="text-2xl font-bold text-gray-900">
//                     {analyticsData.geographic?.totalWithLocation || 0}
//                   </div>
//                   <div className="text-sm text-gray-600">With Location</div>
//                 </div>
//                 <div className="text-center p-4 bg-gray-50 rounded-lg">
//                   <div className="text-2xl font-bold text-gray-900">
//                     {analyticsData.geographic?.coverage || '0'}%
//                   </div>
//                   <div className="text-sm text-gray-600">Coverage</div>
//                 </div>
//                 <div className="text-center p-4 bg-gray-50 rounded-lg">
//                   <div className="text-2xl font-bold text-gray-900">
//                     {analyticsData.geographic?.hotspots || 0}
//                   </div>
//                   <div className="text-sm text-gray-600">Hotspots</div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Staff Tab */}
//         {activeTab === 'staff' && (
//           <div className="space-y-8">
//             <div className="bg-white rounded-2xl p-6 border border-gray-200">
//               <div className="flex items-center justify-between mb-6">
//                 <h3 className="text-lg font-semibold text-gray-900">Top Performing Staff</h3>
//                 <Users className="w-5 h-5 text-gray-400" />
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead>
//                     <tr>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Staff</th>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assigned</th>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Resolved</th>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rate</th>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Avg. Time</th>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Satisfaction</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {topStaff.map((staff, index) => (
//                       <tr key={index} className="hover:bg-gray-50">
//                         <td className="px-4 py-3">
//                           <div className="flex items-center gap-3">
//                             <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
//                               <User className="w-4 h-4 text-blue-600" />
//                             </div>
//                             <div>
//                               <div className="font-medium text-gray-900">{staff.name}</div>
//                               <div className="text-sm text-gray-500">{staff.department}</div>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="px-4 py-3">
//                           <div className="font-semibold">{staff.assigned}</div>
//                         </td>
//                         <td className="px-4 py-3">
//                           <div className="font-semibold text-green-600">{staff.resolved}</div>
//                         </td>
//                         <td className="px-4 py-3">
//                           <div className="font-semibold">{staff.rate}%</div>
//                         </td>
//                         <td className="px-4 py-3">
//                           <div className="text-gray-600">{staff.avgTime}d</div>
//                         </td>
//                         <td className="px-4 py-3">
//                           <div className="flex items-center gap-2">
//                             <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
//                               <div 
//                                 className="h-full bg-green-500 rounded-full"
//                                 style={{ width: `${staff.satisfaction}%` }}
//                               ></div>
//                             </div>
//                             <span className="text-sm font-medium">{staff.satisfaction}%</span>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Comparison Tab */}
//         {activeTab === 'comparison' && (
//           <div className="space-y-8">
//             <div className="bg-white rounded-2xl p-6 border border-gray-200">
//               <h3 className="text-lg font-semibold text-gray-900 mb-6">Period Comparison</h3>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={comparisonData}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                     <XAxis dataKey="period" tick={{ fill: '#6b7280' }} />
//                     <YAxis tick={{ fill: '#6b7280' }} />
//                     <Tooltip />
//                     <Legend />
//                     <Bar dataKey="current" fill="#3b82f6" name="Current Period" radius={[4, 4, 0, 0]} />
//                     <Bar dataKey="previous" fill="#94a3b8" name="Previous Period" radius={[4, 4, 0, 0]} />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Insights Section */}
//         <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-6 border border-teal-100 mt-8">
//           <div className="flex items-center gap-3 mb-4">
//             <AlertCircle className="w-5 h-5 text-teal-600" />
//             <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="bg-white/50 p-4 rounded-xl">
//               <p className="text-sm text-gray-700">
//                 <span className="font-semibold">Peak Hours:</span> Most complaints are submitted between 10 AM - 2 PM
//               </p>
//             </div>
//             <div className="bg-white/50 p-4 rounded-xl">
//               <p className="text-sm text-gray-700">
//                 <span className="font-semibold">Department Trends:</span> Road department has the highest resolution rate at 92%
//               </p>
//             </div>
//             <div className="bg-white/50 p-4 rounded-xl">
//               <p className="text-sm text-gray-700">
//                 <span className="font-semibold">Improvement:</span> Resolution time decreased by 15% compared to last month
//               </p>
//             </div>
//             <div className="bg-white/50 p-4 rounded-xl">
//               <p className="text-sm text-gray-700">
//                 <span className="font-semibold">Satisfaction:</span> User satisfaction increased by 8% in the last 30 days
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AnalyticsPage;

// THIS IS THE FIXED VERSION - Replace your AnalyticsPage.jsx with this

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    overview: null,
    topPerformers: [],
    geographic: null,
    comparison: []
  });
  const [timeRange, setTimeRange] = useState('30d');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // ✅ FIXED: Correct API endpoints
      const [overview, topPerformers, geographic, comparison] = await Promise.all([
        axios.get(`${API_URL}/api/admin/analytics/stats/overview`, config),
        axios.get(`${API_URL}/api/admin/analytics/staff/top-performers`, config),
        axios.get(`${API_URL}/api/admin/analytics/geographic`, config),
        axios.get(`${API_URL}/api/admin/analytics/comparison`, config)
      ]);

      setAnalytics({
        overview: overview.data.data,
        topPerformers: topPerformers.data.data,
        geographic: geographic.data.data,
        comparison: comparison.data.data
      });

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Analytics</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Overview Stats */}
      {analytics.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Complaints"
            value={analytics.overview.total}
            icon="📊"
            color="blue"
          />
          <StatCard
            title="Resolved"
            value={analytics.overview.resolved}
            icon="✅"
            color="green"
          />
          <StatCard
            title="Avg Resolution Time"
            value={`${analytics.overview.avgResolutionTime} days`}
            icon="⏱️"
            color="yellow"
          />
          <StatCard
            title="Satisfaction Score"
            value={`${analytics.overview.satisfactionScore}%`}
            icon="⭐"
            color="purple"
          />
        </div>
      )}

      {/* Top Performers */}
      {analytics.topPerformers && analytics.topPerformers.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Top Performing Staff</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resolved</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resolution Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.topPerformers.map((staff, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {staff.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {staff.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {staff.assigned}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {staff.resolved}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {staff.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comparison Chart */}
      {analytics.comparison && analytics.comparison.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Month-over-Month Comparison</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={250}>
              <BarChart data={analytics.comparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" fill="#3b82f6" name="Current Period" />
                <Bar dataKey="previous" fill="#94a3b8" name="Previous Period" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Geographic Distribution */}
      {analytics.geographic && analytics.geographic.points && analytics.geographic.points.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Geographic Distribution</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Complaints with Location</p>
              <p className="text-2xl font-bold text-blue-600">{analytics.geographic.total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Unique Areas</p>
              <p className="text-2xl font-bold text-green-600">
                {Object.keys(analytics.geographic.distribution || {}).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;