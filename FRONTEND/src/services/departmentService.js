import axios from '../api/axios';

const departmentService = {
  /**
   * Get departments by workspace code (PUBLIC - no auth needed)
   * This is used when users are raising complaints
   * @param {string} workspaceCode - The workspace code (e.g., "WS001")
   * @returns {Promise} Response with departments array
   */
  getDepartmentsByWorkspaceCode: async (workspaceCode) => {
    try {
      const response = await axios.get(
        `/api/admin/departments/workspace/${workspaceCode}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching departments by workspace code:', error);
      throw error;
    }
  },

  /**
   * Get departments for authenticated admin
   * This is used in admin dashboard
   * @returns {Promise} Response with departments array
   */
  getDepartments: async () => {
    try {
      const response = await axios.get('/api/admin/departments');
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  /**
   * Create a new department (Admin only)
   * @param {Object} departmentData - Department details
   * @returns {Promise} Response with created department
   */
  createDepartment: async (departmentData) => {
    try {
      const response = await axios.post('/api/admin/departments', departmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  },

  /**
   * Delete a department (Admin only)
   * @param {string} departmentId - Department ID to delete
   * @returns {Promise} Response with deletion confirmation
   */
  deleteDepartment: async (departmentId) => {
    try {
      const response = await axios.delete(`/api/admin/departments/${departmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  },

  /**
   * Get department statistics (Admin only)
   * @returns {Promise} Response with department stats
   */
  getDepartmentStats: async () => {
    try {
      const response = await axios.get('/api/admin/departments/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching department stats:', error);
      throw error;
    }
  }
};

export default departmentService;