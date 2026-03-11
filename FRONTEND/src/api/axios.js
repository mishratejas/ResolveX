import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const axiosInstance = axios.create({
    baseURL: BASE,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
});

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

let refreshing = false;
let refreshQueue = [];

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Only users have a refresh endpoint
            const userToken = localStorage.getItem('accessToken');
            if (!userToken) return Promise.reject(error);

            if (refreshing) {
                return new Promise((resolve, reject) => {
                    refreshQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return axiosInstance(originalRequest);
                });
            }

            refreshing = true;
            try {
                const res = await axios.post(
                    `${BASE}/api/users/refresh-token`,
                    {},
                    { withCredentials: true }
                );
                const newToken = res.data.accessToken;
                if (newToken) {
                    localStorage.setItem('accessToken', newToken);
                    axiosInstance.defaults.headers.Authorization = `Bearer ${newToken}`;
                    refreshQueue.forEach(p => p.resolve(newToken));
                    refreshQueue = [];
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return axiosInstance(originalRequest);
                }
            } catch (refreshErr) {
                refreshQueue.forEach(p => p.reject(refreshErr));
                refreshQueue = [];
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                localStorage.removeItem('currentWorkspace');
                window.location.href = '/';
            } finally {
                refreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;