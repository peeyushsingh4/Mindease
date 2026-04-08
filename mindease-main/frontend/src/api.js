import axios from 'axios';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

// Create an Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000, // FIX: 8-second timeout — without this, hanging requests freeze the UI forever
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject Token
api.interceptors.request.use(
  (config) => {
    let token = null;
    try {
      token = localStorage.getItem('token');
    } catch (err) {
      console.error('Could not read token from local storage:', err);
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem('token');
      } catch (err) {
        console.error('Could not clear auth token from local storage:', err);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
      }
    }

    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  if (error?.code === 'ECONNABORTED') {
    return 'Request timed out. Please check your connection and try again.';
  }
  return fallback;
};

export { AUTH_UNAUTHORIZED_EVENT };
export { API_BASE_URL };
export default api;
