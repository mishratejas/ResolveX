import axiosInstance from '../api/axios';

export const getUserNotifications = async (userId, options = {}) => {
  try {
    const { isRead, type, limit = 50, skip = 0 } = options;
    const params = new URLSearchParams();
    if (isRead !== undefined) params.append('isRead', isRead);
    if (type) params.append('type', type);
    params.append('limit', limit);
    params.append('skip', skip);

    const response = await axiosInstance.get(
      `/api/notifications/${userId}?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await axiosInstance.patch(
      `/api/notifications/${notificationId}/read`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const response = await axiosInstance.patch(
      `/api/notifications/${userId}/read-all`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    const response = await axiosInstance.delete(
      `/api/notifications/${notificationId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

export const clearAllNotifications = async (userId) => {
  try {
    const response = await axiosInstance.delete(
      `/api/notifications/${userId}/clear-all`
    );
    return response.data;
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    throw error;
  }
};

export default {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
};