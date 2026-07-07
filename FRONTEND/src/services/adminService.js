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
            throw error;
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

    // NEW: Get Pending Staff
    getPendingStaff: async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/staff/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching pending staff:', error);
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
            throw error;
        }
    },

    getStaffDetails: async (staffId) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/staff/${staffId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching staff details:', error);
            throw error;
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
            throw error;
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
            throw error;
        }
    },

    // raw axios instead of using this service.
    deleteUser: async (userId) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    // raw axios instead of using this service.
    bulkUserAction: async (userIds, action) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.post(`${API_URL}/api/admin/users/bulk`, {
                userIds,
                action
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error in bulk user action:', error);
            throw error;
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
            throw error;
        }
    },

    updateIssue: async (complaintId, payload) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.put(`${API_URL}/api/admin/issues/${complaintId}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating issue:', error);
            throw error;
        }
    },

    overridePriority: async (complaintId, priority) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.patch(
                `${API_URL}/api/admin/issues/complaint/${complaintId}/priority`,
                { priority },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            console.error('Error overriding priority:', error);
            throw error;
        }
    },

    // ==================== ANALYTICS ====================
    getAnalytics: async (params = {}, tokenOverride = null) => {
        try {
            const token = tokenOverride || localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/analytics/comprehensive`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
                timeout: 5000
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching analytics:', error);
            throw error;
        }
    },

    // FIX (DUP-4): AdminAnalyticsManager.jsx used to reimplement this call
    // (blob download) with raw axios instead of using this service.
    // Accepts an optional tokenOverride since this page is also used by
    // staff/user roles, not just admins.
    exportAnalyticsData: async (format = 'csv', timeRange = '30d', tokenOverride = null) => {
        try {
            const token = tokenOverride || localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/analytics/export`, {
                params: { format, timeRange },
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                responseType: 'blob',
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting analytics data:', error);
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
            throw error;
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

    // NEW: Approve Staff
    approveStaff: async (staffId) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.patch(`${API_URL}/api/admin/staff/${staffId}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error approving staff:', error);
            throw error;
        }
    },

    // NEW: Reject Staff
    rejectStaff: async (staffId) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.delete(`${API_URL}/api/admin/staff/${staffId}/reject`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error rejecting staff:', error);
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
export const getPendingStaff = adminService.getPendingStaff; // ADDED
export const getStaffStats = adminService.getStaffStats;
export const getStaffDetails = adminService.getStaffDetails;
export const getStaffPerformance = adminService.getStaffPerformance;
export const getIssueStats = adminService.getIssueStats;
export const updateIssue = adminService.updateIssue;
export const overridePriority = adminService.overridePriority;
export const getIssues = adminService.getIssues;
export const getUsers = adminService.getUsers;
export const getUserStats = adminService.getUserStats;
export const deleteUser = adminService.deleteUser;
export const bulkUserAction = adminService.bulkUserAction;
export const getAnalytics = adminService.getAnalytics;
export const exportAnalyticsData = adminService.exportAnalyticsData;
export const getDepartments = adminService.getDepartments;
export const createStaff = adminService.createStaff;
export const updateStaff = adminService.updateStaff;
export const approveStaff = adminService.approveStaff; // ADDED
export const rejectStaff = adminService.rejectStaff; // ADDED
export const deleteStaff = adminService.deleteStaff;
export const bulkActivateStaff = adminService.bulkActivateStaff;
export const bulkDeactivateStaff = adminService.bulkDeactivateStaff;
export const adminLogout = adminService.adminLogout;