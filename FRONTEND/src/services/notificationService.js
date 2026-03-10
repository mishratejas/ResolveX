import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('staffToken') ||
    localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getUserNotifications = async (userId, options = {}) => {
  try {
    const { isRead, type, limit = 50, skip = 0 } = options;
    const params = new URLSearchParams();
    if (isRead !== undefined) params.append('isRead', isRead);
    if (type) params.append('type', type);
    params.append('limit', limit);
    params.append('skip', skip);

    const response = await axios.get(
      `${API_URL}/api/notifications/${userId}?${params.toString()}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/api/notifications/${notificationId}/read`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/api/notifications/${userId}/read-all`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/notifications/${notificationId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

export const clearAllNotifications = async (userId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/notifications/${userId}/clear-all`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    throw error;
  }
};

export const getNotificationStats = async (userId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/notifications/${userId}/stats`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    throw error;
  }
};

export default {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationStats,
};