import axios from 'axios';
// Default to 5001 because backend/.env uses PORT=5001 in this repo.
// Can be overridden via VITE_API_BASE_URL (recommended for deployments).
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api').replace(/\/$/, '');
const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';
const REFRESH_STORAGE_KEY = 'refreshToken';

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
  async (error) => {
    const originalRequest = error?.config;
    if (error?.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem(REFRESH_STORAGE_KEY);
        if (refreshToken) {
          const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const nextToken = refreshRes?.data?.token;
          const nextRefreshToken = refreshRes?.data?.refreshToken;
          if (nextToken) {
            localStorage.setItem('token', nextToken);
            if (nextRefreshToken) {
              localStorage.setItem(REFRESH_STORAGE_KEY, nextRefreshToken);
            }
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${nextToken}`
            };
            return api(originalRequest);
          }
        }
      } catch {
        // Fall through to unauthorized handling below.
      }
    }

    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem(REFRESH_STORAGE_KEY);
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
export { REFRESH_STORAGE_KEY };
export default api;
