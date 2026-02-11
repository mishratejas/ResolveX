import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Search, Filter, Download, RefreshCw, Calendar, ChevronDown,
    Shield, AlertCircle, CheckCircle, XCircle, Clock, User,
    Activity, Eye, TrendingUp, BarChart2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AuditLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: 'all',
        severity: 'all',
        status: 'all',
        action: 'all',
        startDate: '',
        endDate: '',
        searchTerm: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });
    const [stats, setStats] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchAuditLogs();
        fetchStats();
    }, [filters, pagination.page]);

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/audit`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    ...filters,
                    page: pagination.page,
                    limit: pagination.limit
                }
            });

            if (response.data.success) {
                setLogs(response.data.data.logs);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data.pagination.total,
                    totalPages: response.data.data.pagination.totalPages
                }));
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/audit/statistics`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    days: 30
                }
            });

            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/audit/export`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    ...filters,
                    format: 'csv'
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit-logs-${new Date().toISOString()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting logs:', error);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
            case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SUCCESS': return 'bg-green-100 text-green-800';
            case 'FAILURE': return 'bg-red-100 text-red-800';
            case 'WARNING': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'AUTHENTICATION': return <Shield className="w-4 h-4" />;
            case 'USER_MANAGEMENT': return <User className="w-4 h-4" />;
            case 'ISSUE_MANAGEMENT': return <AlertCircle className="w-4 h-4" />;
            case 'ANALYTICS': return <BarChart2 className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    if (loading && logs.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading audit logs...</p>
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
                        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                        <p className="text-gray-600">Complete activity tracking across the system</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchAuditLogs}
                            className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={handleExport}
                            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Activities</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.totalActivities?.[0]?.count || 0}
                                </p>
                            </div>
                            <Activity className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Success Rate</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {stats.byStatus?.find(s => s._id === 'SUCCESS')?.count || 0}
                                </p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Failed</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {stats.byStatus?.find(s => s._id === 'FAILURE')?.count || 0}
                                </p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Critical Events</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {stats.bySeverity?.find(s => s._id === 'CRITICAL')?.count || 0}
                                </p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-orange-600" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                    >
                        <Filter className="w-4 h-4" />
                        {showFilters ? 'Hide' : 'Show'} Filters
                        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Categories</option>
                                <option value="AUTHENTICATION">Authentication</option>
                                <option value="USER_MANAGEMENT">User Management</option>
                                <option value="STAFF_MANAGEMENT">Staff Management</option>
                                <option value="ISSUE_MANAGEMENT">Issue Management</option>
                                <option value="SYSTEM_CONFIGURATION">System Config</option>
                                <option value="ANALYTICS">Analytics</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                            <select
                                value={filters.severity}
                                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Severities</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="SUCCESS">Success</option>
                                <option value="FAILURE">Failure</option>
                                <option value="WARNING">Warning</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search logs..."
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Timestamp</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Actor</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Severity</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {logs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {new Date(log.timestamp).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <User className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{log.actorName}</div>
                                                <div className="text-xs text-gray-500">{log.actorEmail}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {getCategoryIcon(log.category)}
                                            <span className="text-sm">{log.category}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getSeverityColor(log.severity)}`}>
                                            {log.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getStatusColor(log.status)}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-md truncate">
                                            {log.description}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                {pagination.total} logs
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                    disabled={pagination.page === 1}
                                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2">{pagination.page} / {pagination.totalPages}</span>
                                <button
                                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogsPage;