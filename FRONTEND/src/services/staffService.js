// TODO: Update with proper error handling and complete API calls
import axios from '../api/axios';
import { API_ENDPOINTS } from '../constants';

const staffService = {
  // Get Assigned Issues
  getAssignedIssues: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${API_ENDPOINTS.STAFF_ISSUES}?${queryString}` : API_ENDPOINTS.STAFF_ISSUES;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching assigned issues:', error);
      throw error;
    }
  },

  // Get Issue by ID
  getIssueById: async (id) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.STAFF_ISSUES}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching issue:', error);
      throw error;
    }
  },

  // Update Issue Status
  updateIssueStatus: async (id, status, notes = '') => {
    try {
      const response = await axios.put(`${API_ENDPOINTS.STAFF_ISSUES}/${id}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Error updating issue status:', error);
      throw error;
    }
  },

  // Update Issue
  updateIssue: async (id, updates) => {
    try {
      const response = await axios.put(`${API_ENDPOINTS.STAFF_ISSUES}/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating issue:', error);
      throw error;
    }
  },

  // Add Comment
  addComment: async (id, comment) => {
    try {
      const response = await axios.post(`${API_ENDPOINTS.STAFF_ISSUES}/${id}/comments`, {
        comment
      });
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Get Comments
  getComments: async (id) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.STAFF_ISSUES}/${id}/comments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  // Get Staff Stats
  getStats: async () => {
    try {
      const response = await axios.get('/api/staff/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching staff stats:', error);
      throw error;
    }
  },

  // Get Dashboard Data
  getDashboardData: async () => {
    try {
      const response = await axios.get('/api/staff/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Assign Issue to Self
  assignToSelf: async (issueId) => {
    try {
      const response = await axios.put(`${API_ENDPOINTS.STAFF_ISSUES}/${issueId}/assign`);
      return response.data;
    } catch (error) {
      console.error('Error assigning issue:', error);
      throw error;
    }
  },

  // Mark Issue as Urgent
  markAsUrgent: async (issueId) => {
    try {
      const response = await axios.put(`${API_ENDPOINTS.STAFF_ISSUES}/${issueId}/urgent`, {
        priority: 'urgent'
      });
      return response.data;
    } catch (error) {
      console.error('Error marking as urgent:', error);
      throw error;
    }
  },

  // Get Departments
  getDepartments: async () => {
    try {
      const response = await axios.get('/api/staff/departments');
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  // Upload Evidence
  uploadEvidence: async (issueId, files) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await axios.post(
        `${API_ENDPOINTS.STAFF_ISSUES}/${issueId}/evidence`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading evidence:', error);
      throw error;
    }
  },

  // Get Activity Log
  getActivityLog: async (issueId) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.STAFF_ISSUES}/${issueId}/activity`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity log:', error);
      throw error;
    }
  }
};

export default staffService;