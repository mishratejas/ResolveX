import axios from '../api/axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const adminService = {
    // ==================== DASHBOARD ====================
    getDashboardData: async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    },

    // ==================== CHARTS ====================
    getChartData: async (timeRange = '7d') => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/analytics/chart?range=${timeRange}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching chart data:', error);
            // Return mock data for development
            return {
                success: true,
                data: {
                    dailyComplaints: [
                        { day: 'Mon', complaints: 12, resolved: 8 },
                        { day: 'Tue', complaints: 15, resolved: 10 },
                        { day: 'Wed', complaints: 18, resolved: 12 },
                        { day: 'Thu', complaints: 14, resolved: 11 },
                        { day: 'Fri', complaints: 20, resolved: 15 },
                        { day: 'Sat', complaints: 10, resolved: 7 },
                        { day: 'Sun', complaints: 8, resolved: 6 }
                    ],
                    departments: [
                        { name: 'Water Supply', value: 45, resolved: 38 },
                        { name: 'Electricity', value: 62, resolved: 51 },
                        { name: 'Road Maintenance', value: 38, resolved: 29 },
                        { name: 'Sanitation', value: 29, resolved: 24 }
                    ]
                }
            };
        }
    },

    // ==================== STAFF ====================
    getStaff: async (params = {}) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/staff`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching staff:', error);
            throw error;
        }
    },

    getStaffStats: async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/staff/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching staff stats:', error);
            // Return mock data for development
            return {
                success: true,
                data: {
                    total: 24,
                    active: 22,
                    inactive: 2,
                    departments: [
                        { _id: 'Water Supply', count: 8 },
                        { _id: 'Electricity', count: 6 },
                        { _id: 'Road Maintenance', count: 5 },
                        { _id: 'Sanitation', count: 5 }
                    ],
                    performance: {
                        avgResolutionRate: 76.5,
                        highPerformers: 8,
                        mediumPerformers: 10,
                        lowPerformers: 4
                    }
                }
            };
        }
    },

    getStaffPerformance: async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/staff/top-performers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching staff performance:', error);
            // Return mock data for development
            return {
                success: true,
                data: [
                    { name: 'Rajesh Kumar', department: 'Electricity', assigned: 50, resolved: 47, rate: 94 },
                    { name: 'Anita Sharma', department: 'Water Supply', assigned: 40, resolved: 35, rate: 88 },
                    { name: 'Priya Patel', department: 'Road Maintenance', assigned: 35, resolved: 28, rate: 80 }
                ]
            };
        }
    },

    // ==================== USERS ====================
    getUsers: async (params = {}) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    getUserStats: async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/users/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching user stats:', error);
            // Return mock data for development
            return {
                success: true,
                data: {
                    total: 156,
                    active: 142,
                    verified: 98,
                    growth: {
                        last30Days: 23,
                        last90Days: 67
                    },
                    complaints: {
                        totalUsersWithComplaints: 87,
                        avgComplaintsPerUser: 2.4,
                        avgResolutionRate: 72
                    }
                }
            };
        }
    },

    // ==================== ISSUES/COMPLAINTS ====================
    getIssues: async (params = {}) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/issues`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching issues:', error);
            throw error;
        }
    },

    getIssueStats: async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/issues/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching issue stats:', error);
            // Return mock data for development
            return {
                success: true,
                data: {
                    total: 342,
                    pending: 89,
                    inProgress: 124,
                    resolved: 129,
                    highPriority: 42,
                    assigned: 253,
                    unassigned: 89,
                    overdue: 18,
                    today: 12,
                    thisWeek: 58,
                    thisMonth: 102,
                    resolutionRate: 37.7
                }
            };
        }
    },

    // ==================== ANALYTICS ====================
    getAnalytics: async (params = {}) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/analytics`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching analytics:', error);
            throw error;
        }
    },

    // ==================== DEPARTMENTS ====================
    getDepartments: async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/departments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching departments:', error);
            // Return mock data for development
            return {
                success: true,
                data: [
                    { _id: '1', name: 'Water Supply', category: 'Infrastructure' },
                    { _id: '2', name: 'Electricity', category: 'Infrastructure' },
                    { _id: '3', name: 'Road Maintenance', category: 'Infrastructure' },
                    { _id: '4', name: 'Sanitation', category: 'Health' },
                    { _id: '5', name: 'Police', category: 'Safety' },
                    { _id: '6', name: 'Healthcare', category: 'Health' },
                    { _id: '7', name: 'Education', category: 'Education' }
                ]
            };
        }
    },

    // ==================== STAFF CRUD ====================
    createStaff: async (staffData) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.post(`${API_URL}/api/admin/staff`, staffData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error creating staff:', error);
            throw error;
        }
    },

    updateStaff: async (staffId, updates) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.put(`${API_URL}/api/admin/staff/${staffId}`, updates, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating staff:', error);
            throw error;
        }
    },

    deleteStaff: async (staffId) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.delete(`${API_URL}/api/admin/staff/${staffId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting staff:', error);
            throw error;
        }
    },

    // ==================== BULK OPERATIONS ====================
    bulkActivateStaff: async (staffIds) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.post(`${API_URL}/api/admin/staff/bulk-activate`, 
                { staffIds }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.error('Error activating staff:', error);
            throw error;
        }
    },

    bulkDeactivateStaff: async (staffIds) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.post(`${API_URL}/api/admin/staff/bulk-deactivate`, 
                { staffIds }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.error('Error deactivating staff:', error);
            throw error;
        }
    },

    // ==================== EXPORT ====================
    exportData: async (format = 'csv', type = 'all') => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/analytics/export?format=${format}&type=${type}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    },

    // ==================== AUTH ====================
    adminLogout: async () => {
        try {
            const token = localStorage.getItem('adminToken');
            if (token) {
                await axios.post(`${API_URL}/api/admin/logout`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (error) {
            console.error('Error logging out:', error);
        } finally {
            // Clear local storage regardless
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            localStorage.removeItem('adminId');
            window.dispatchEvent(new Event('userLogout'));
        }
    }
};

// Named exports
export const getDashboardData = adminService.getDashboardData;
export const getChartData = adminService.getChartData;
export const getStaff = adminService.getStaff;
export const getStaffStats = adminService.getStaffStats;
export const getStaffPerformance = adminService.getStaffPerformance;
export const getUsers = adminService.getUsers;
export const getUserStats = adminService.getUserStats;
export const getIssues = adminService.getIssues;
export const getIssueStats = adminService.getIssueStats;
export const getAnalytics = adminService.getAnalytics;
export const getDepartments = adminService.getDepartments;
export const createStaff = adminService.createStaff;
export const updateStaff = adminService.updateStaff;
export const deleteStaff = adminService.deleteStaff;
export const bulkActivateStaff = adminService.bulkActivateStaff;
export const bulkDeactivateStaff = adminService.bulkDeactivateStaff;
export const exportData = adminService.exportData;
export const adminLogout = adminService.adminLogout;

export default adminService;