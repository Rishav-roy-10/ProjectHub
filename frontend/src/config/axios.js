import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    headers: {
       "Authorization": `Bearer ${localStorage.getItem('token')}`
    },
    withCredentials: true // Enable sending cookies with requests
});

// Add request interceptor to update Authorization header with latest token
axiosInstance.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosInstance;
