import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every outgoing request
axiosClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('edumonitor_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('edumonitor_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handling: token expired/invalid -> force logout
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('edumonitor_token');
      localStorage.removeItem('edumonitor_user');
      localStorage.removeItem('edumonitor_remember');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('edumonitor_token');
      sessionStorage.removeItem('edumonitor_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
