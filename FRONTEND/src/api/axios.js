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
        // Check for user token first, then admin token (if you want both roles)
        const userToken = localStorage.getItem('accessToken');
        if (userToken) {
            config.headers.Authorization = `Bearer ${userToken}`;
        } else {
            // fallback to admin token (if you want admin requests to also work)
            const adminToken = localStorage.getItem('adminToken');
            if (adminToken) {
                config.headers.Authorization = `Bearer ${adminToken}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for user token refresh
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // If 401 and not already retried, try to refresh user token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Call your user refresh token endpoint
                const refreshResponse = await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/user/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                if (refreshResponse.data.accessToken) {
                    localStorage.setItem('accessToken', refreshResponse.data.accessToken);
                    originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
                    return axiosInstance(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed – clear storage and redirect to login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;