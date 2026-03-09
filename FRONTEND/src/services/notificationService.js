import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (userId, options = {}) => {
  try {
    const { isRead, type, limit = 50, skip = 0 } = options;
    
    const params = new URLSearchParams();
    if (isRead !== undefined) params.append('isRead', isRead);
    if (type) params.append('type', type);
    params.append('limit', limit);
    params.append('skip', skip);

    const response = await axios.get(
      `${API_URL}/notifications/${userId}?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/notifications/${notificationId}/read`
    );
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/notifications/${userId}/read-all`
    );
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/notifications/${notificationId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Clear all notifications for a user
 */
export const clearAllNotifications = async (userId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/notifications/${userId}/clear-all`
    );
    return response.data;
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    throw error;
  }
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (userId) => {
  try {
    const response = await axios.get(
      `${API_URL}/notifications/${userId}/stats`
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