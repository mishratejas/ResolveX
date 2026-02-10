// Replace the existing adminService.js with this:

import axios from '../api/axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const adminService = {
    // Dashboard Data
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

    // Chart Data
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

    // Get All Staff
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

    // Get Staff Stats
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

    // Get Staff Performance
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

    // Get All Users
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

    // Get User Stats
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

    // Get All Issues
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

    // Get Issue Stats
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

    // Get Analytics
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

    // Get Departments
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

    // Create Staff
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

    // Update Staff
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

    // Delete Staff
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

    // Bulk Operations
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

    // Export Data
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

    // Admin Logout
    adminLogout: async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.post(`${API_URL}/api/admin/logout`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Clear local storage
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            
            // Dispatch logout event
            window.dispatchEvent(new Event('userLogout'));
            
            return response.data;
        } catch (error) {
            console.error('Error logging out:', error);
            // Clear anyway
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            window.dispatchEvent(new Event('userLogout'));
            throw error;
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