import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL, TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY } from '../config/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    if (error?.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
        if (refreshToken) {
          const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const nextToken = refreshRes?.data?.token;
          const nextRefreshToken = refreshRes?.data?.refreshToken;
          if (nextToken) {
            await AsyncStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
            if (nextRefreshToken) {
              await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, nextRefreshToken);
            }
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${nextToken}`
            };
            return api(originalRequest);
          }
        }
      } catch (refreshErr) {
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      }
    }
    return Promise.reject(error);
  }
);

export const extractErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  if (error?.code === 'ECONNABORTED') {
    return 'Request timed out. Check your connection and backend server.';
  }
  return fallback;
};

export default api;
