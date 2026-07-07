import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const axiosInstance = axios.create({
    baseURL: BASE,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
});

// Each role keeps its own access token in localStorage and its own HttpOnly
// refresh cookie on the backend (refreshToken / adminRefreshToken / staffRefreshToken),
// so a browser can hold a user session and an admin/staff session at the same time
// without one refresh silently overwriting another.
const ROLE_CONFIG = {
    user: {
        tokenKey: 'accessToken',
        refreshUrl: '/api/users/refresh-token',
        clearKeys: ['accessToken', 'user', 'currentWorkspace'],
        onExpire: '/'
    },
    admin: {
        tokenKey: 'adminToken',
        refreshUrl: '/api/admin/refresh-token',
        clearKeys: ['adminToken', 'admin', 'currentWorkspace'],
        onExpire: '/'
    },
    staff: {
        tokenKey: 'staffToken',
        refreshUrl: '/api/staff/refresh-token',
        clearKeys: ['staffToken', 'staff'],
        onExpire: '/'
    }
};

const getActiveRole = () => {
    if (localStorage.getItem('accessToken')) return 'user';
    if (localStorage.getItem('adminToken')) return 'admin';
    if (localStorage.getItem('staffToken')) return 'staff';
    return null;
};

const getToken = () =>
    localStorage.getItem('accessToken') ||
    localStorage.getItem('adminToken') ||
    localStorage.getItem('staffToken');

axiosInstance.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// Separate refresh lock + queue per role, so a user-session refresh in one tab
// doesn't get tangled up with an admin/staff refresh happening in another.
const refreshing = { user: false, admin: false, staff: false };
const refreshQueues = { user: [], admin: [], staff: [] };

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const role = getActiveRole();
            if (!role) return Promise.reject(error);

            const { tokenKey, refreshUrl, clearKeys, onExpire } = ROLE_CONFIG[role];

            if (refreshing[role]) {
                return new Promise((resolve, reject) => {
                    refreshQueues[role].push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return axiosInstance(originalRequest);
                });
            }

            refreshing[role] = true;
            try {
                const res = await axios.post(
                    `${BASE}${refreshUrl}`,
                    {},
                    { withCredentials: true }
                );
                const newToken = res.data.accessToken;
                if (newToken) {
                    localStorage.setItem(tokenKey, newToken);
                    refreshQueues[role].forEach(p => p.resolve(newToken));
                    refreshQueues[role] = [];
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return axiosInstance(originalRequest);
                }
            } catch (refreshErr) {
                refreshQueues[role].forEach(p => p.reject(refreshErr));
                refreshQueues[role] = [];
                clearKeys.forEach(key => localStorage.removeItem(key));
                window.location.href = onExpire;
            } finally {
                refreshing[role] = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;