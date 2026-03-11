import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, Trash2, X, CheckCircle, AlertTriangle, AlertCircle, Info, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getToken = () =>
  localStorage.getItem('accessToken') ||
  localStorage.getItem('adminToken') ||
  localStorage.getItem('staffToken');

const typeConfig = {
  success: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-500' },
  error:   { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-500' },
  info:    { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-500' },
  update:  { icon: Info, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', dot: 'bg-purple-500' },
};

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const NotificationBell = ({ userId, userType = 'User', variant = 'dark' }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);
  const pollRef = useRef(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await axios.get(`${BASE}/api/notifications/${userId}`, {
        params: { limit: 30 },
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.data?.success) {
        const data = res.data.data;
        const newNotifs = data.notifications || [];
        const newCount = data.unreadCount || 0;

        // Flash bell if new notifications arrived
        if (newCount > prevCountRef.current) {
          // pulse animation is already CSS
        }
        prevCountRef.current = newCount;
        setNotifications(newNotifs);
        setUnreadCount(newCount);
      }
    } catch (err) {
      // Silently fail polling
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();

    const socket = io(BASE, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 10,
      timeout: 8000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('register', userId.toString());
    });

    socket.on('notification', (n) => {
      setNotifications(prev => [n, ...prev.slice(0, 29)]);
      setUnreadCount(c => c + 1);
      if ('Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification(n.title, { body: n.message, icon: '/favicon.ico' });
      }
    });

    pollRef.current = setInterval(() => fetchNotifications(true), 30000);

    if ('Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }

    return () => { socket.disconnect(); clearInterval(pollRef.current); };
  }, [userId, fetchNotifications]);

  const markAsRead = async (id, e) => {
    e?.stopPropagation();
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    try {
      await axios.patch(`${BASE}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
    } catch { fetchNotifications(true); }
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await axios.patch(`${BASE}/api/notifications/${userId}/read-all`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
    } catch { fetchNotifications(true); }
  };

  const deleteNotif = async (id, e) => {
    e?.stopPropagation();
    const wasUnread = notifications.find(n => n._id === id)?.isRead === false;
    setNotifications(prev => prev.filter(n => n._id !== id));
    if (wasUnread) setUnreadCount(c => Math.max(0, c - 1));
    try {
      await axios.delete(`${BASE}/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
    } catch { fetchNotifications(true); }
  };

  const handleClick = (n) => {
    if (!n.isRead) markAsRead(n._id);
    if (n.actionUrl) window.location.href = n.actionUrl;
    setIsOpen(false);
  };

  const unread = notifications.filter(n => !n.isRead);
  const read = notifications.filter(n => n.isRead);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setIsOpen(o => !o); if (!isOpen) fetchNotifications(); }}
        className={`relative p-2 rounded-xl transition-colors group ${
          variant === 'light'
            ? 'hover:bg-white/10'
            : 'hover:bg-gray-100'
        }`}
        aria-label="Notifications"
      >
        <Bell className={`w-5 h-5 transition-all ${
          variant === 'light'
            ? (unreadCount > 0 ? 'text-white' : 'text-white/80 group-hover:text-white')
            : (unreadCount > 0 ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-800')
        }`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-[200] overflow-hidden flex flex-col"
          style={{ maxHeight: '520px' }}>
          
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Notifications</h3>
                <p className="text-white/70 text-xs">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button
                onClick={() => fetchNotifications()}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 bg-gray-50/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                  <Bell className="w-7 h-7 text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">You're all caught up!</p>
                </div>
              </div>
            ) : (
              <div>
                {/* Unread section */}
                {unread.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-blue-50/80 border-b border-blue-100">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">New — {unread.length}</p>
                    </div>
                    {unread.map(n => <NotifItem key={n._id} n={n} onRead={markAsRead} onDelete={deleteNotif} onClick={handleClick} />)}
                  </div>
                )}
                {/* Read section */}
                {read.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Earlier</p>
                    </div>
                    {read.map(n => <NotifItem key={n._id} n={n} onRead={markAsRead} onDelete={deleteNotif} onClick={handleClick} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const NotifItem = ({ n, onRead, onDelete, onClick }) => {
  const cfg = typeConfig[n.type] || typeConfig.info;
  const Icon = cfg.icon;

  return (
    <div
      onClick={() => onClick(n)}
      className={`group flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-white transition-all border-b border-gray-100/80 ${!n.isRead ? 'bg-white' : ''}`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${cfg.bg} ${cfg.border} border flex items-center justify-center mt-0.5`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
            {n.title}
          </p>
          {!n.isRead && (
            <span className={`flex-shrink-0 w-2 h-2 rounded-full ${cfg.dot} mt-1.5`} />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-gray-400 font-medium">{timeAgo(n.createdAt)}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!n.isRead && (
              <button
                onClick={(e) => onRead(n._id, e)}
                className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                title="Mark as read"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => onDelete(n._id, e)}
              className="p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-md transition-all"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationBell;