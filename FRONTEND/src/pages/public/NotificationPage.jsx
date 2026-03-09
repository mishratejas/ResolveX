import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter, RefreshCw, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import notificationService from '../../services/notificationService';
import { io } from 'socket.io-client';

const NotificationsPage = ({ userId, userType = 'User' }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all');

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const options = {};
      
      if (filter === 'unread') options.isRead = false;
      if (filter === 'read') options.isRead = true;
      if (typeFilter !== 'all') options.type = typeFilter;
      
      options.limit = 100;

      const response = await notificationService.getUserNotifications(userId, options);
      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Socket.IO
  useEffect(() => {
    if (!userId) return;

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('register', userId);
    });

    socket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    fetchNotifications();

    return () => {
      socket.disconnect();
    };
  }, [userId, filter, typeFilter]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllNotificationsAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Delete notification
  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      const wasUnread = !notifications.find(n => n._id === notificationId)?.isRead;
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) return;
    
    try {
      await notificationService.clearAllNotifications(userId);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    const iconClass = "w-6 h-6";
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      default:
        return <Info className={`${iconClass} text-blue-500`} />;
    }
  };

  // Format time
  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now - d) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Bell className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-500">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchNotifications}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckCheck className="w-5 h-5" />
                  <span>Mark All Read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            
            {/* Read/Unread Filter */}
            <div className="flex space-x-2">
              {['all', 'unread', 'read'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="flex space-x-2">
              {['all', 'info', 'success', 'warning', 'error'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    typeFilter === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">
                {filter === 'unread' ? "You're all caught up!" : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-6 hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-base font-semibold ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            {notification.message}
                          </p>
                          
                          {/* Metadata */}
                          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                            <div className="mt-3 bg-gray-100 rounded-lg p-3">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {Object.entries(notification.metadata).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium text-gray-700">{key}: </span>
                                    <span className="text-gray-600">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <span>{formatTime(notification.createdAt)}</span>
                            {notification.emailSent && (
                              <span className="ml-3 flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Email sent
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification._id);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification._id);
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;