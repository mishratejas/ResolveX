// TODO: Update with proper error handling and pagination
import axios from "../api/axios";
import { API_ENDPOINTS } from "../constants";

const complaintService = {
  // Get All Complaints - with workspace filter
  getAll: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString
        ? `${API_ENDPOINTS.COMPLAINTS}?${queryString}`
        : API_ENDPOINTS.COMPLAINTS;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching complaints:", error);
      throw error;
    }
  },

  // Get Complaint by ID
  getById: async (id) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.COMPLAINTS}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching complaint:", error);
      throw error;
    }
  },

  getMyComplaints: async (workspaceId = null) => {
    try {
      let url = API_ENDPOINTS.MY_COMPLAINTS;
      if (workspaceId) {
        url += `?workspaceId=${workspaceId}`;
      }
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching my complaints:", error);
      throw error;
    }
  },

  // Get User's Issues (for profile) - with workspace filter
  getUserIssues: async (workspaceId = null) => {
    try {
      let url = "/api/user_issues/my";
      if (workspaceId) {
        url += `?workspaceId=${workspaceId}`;
      }
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching user issues:", error);
      throw error;
    }
  },

  // Create Complaint - with workspace ID
  create: async (complaintData) => {
    try {
      // Get current workspace from localStorage
      const currentWorkspace = JSON.parse(
        localStorage.getItem("currentWorkspace"),
      );

      // Add adminId (workspace ID) to complaint data
      const dataToSend = {
        ...complaintData,
        adminId: currentWorkspace?.id,
      };

      const response = await axios.post("/api/user_issues", dataToSend);
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        return error.response.data;
      }
      console.error("Error creating complaint:", error);
      throw error;
    }
  },

  // Update Complaint
  update: async (id, updates) => {
    try {
      const response = await axios.put(
        `${API_ENDPOINTS.COMPLAINTS}/${id}`,
        updates,
      );
      return response.data;
    } catch (error) {
      console.error("Error updating complaint:", error);
      throw error;
    }
  },

  // Delete Complaint
  delete: async (id) => {
    try {
      const response = await axios.delete(`${API_ENDPOINTS.COMPLAINTS}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting complaint:", error);
      throw error;
    }
  },

  // Vote on Complaint
  vote: async (id, userId) => {
    try {
      const response = await axios.put(
        `${API_ENDPOINTS.COMPLAINTS}/${id}/vote`,
        { userId },
      );
      return response.data;
    } catch (error) {
      console.error("Error voting on complaint:", error);
      throw error;
    }
  },
upvoteComplaint: async (complaintId) => {
  try {
    console.log("📤 Attempting to upvote complaint ID:", complaintId);
    
    // Ensure complaintId is a string and trim any whitespace
    const id = String(complaintId).trim();
    
    if (!id) {
      throw new Error("Complaint ID is required");
    }
    
    // Make sure the URL is correctly formatted - using :id parameter
    const url = `/api/user_issues/${id}/upvote`;
    console.log("📤 Request URL:", url);
    
    const response = await axios.put(url);
    
    console.log("📥 Upvote response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error upvoting complaint:", error);
    
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      throw error; // Throw the original error to preserve status code
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error("No response from server");
    } else {
      console.error("Request setup error:", error.message);
      throw new Error("Request failed: " + error.message);
    }
  }
},
  // Add Comment
  addComment: async (id, comment) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.COMPLAINTS}/${id}/comments`,
        { comment },
      );
      return response.data;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },

  // Get Comments
  getComments: async (id) => {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.COMPLAINTS}/${id}/comments`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }
  },

  // Get Stats
  getStats: async () => {
    try {
      const response = await axios.get("/api/user_issues/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching stats:", error);
      throw error;
    }
  },

  // Search Complaints
  search: async (query, filters = {}) => {
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters,
      });
      const response = await axios.get(
        `${API_ENDPOINTS.COMPLAINTS}/search?${params}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error searching complaints:", error);
      throw error;
    }
  },

  // Filter Complaints
  filter: async (filters) => {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const response = await axios.get(
        `${API_ENDPOINTS.COMPLAINTS}?${queryString}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error filtering complaints:", error);
      throw error;
    }
  },
  checkDuplicate: async (complaintData) => {
    try {
      const response = await axios.post(
        "/api/user_issues/check-duplicate",
        complaintData,
      );
      return response.data;
    } catch (error) {
      console.error("Error checking duplicates:", error);
      throw error;
    }
  },
};

export default complaintService;
