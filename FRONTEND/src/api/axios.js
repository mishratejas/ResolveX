import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    withCredentials: true, // CRITICAL for cookies
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshResponse = await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/admin/refresh-token`,
                    {},
                    { withCredentials: true }
                );
                
                if (refreshResponse.data.accessToken) {
                    localStorage.setItem('adminToken', refreshResponse.data.accessToken);
                    originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
                    return axiosInstance(originalRequest);
                }
            } catch (refreshError) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminData');
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;