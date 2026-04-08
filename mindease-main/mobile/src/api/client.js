import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL, TOKEN_STORAGE_KEY } from '../config/constants';

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
