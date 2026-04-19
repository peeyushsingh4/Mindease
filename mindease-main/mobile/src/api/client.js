import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  API_BASE_URL,
  API_BASE_URL_CANDIDATES,
  TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
} from '../config/constants';

let activeApiBaseUrl = API_BASE_URL;

const getBaseUrlAtIndex = (index = 0) => API_BASE_URL_CANDIDATES[index] || activeApiBaseUrl;
const getCurrentBaseUrlIndex = (baseURL) => API_BASE_URL_CANDIDATES.indexOf(baseURL || activeApiBaseUrl);
const setActiveApiBaseUrl = (nextBaseUrl) => {
  if (!nextBaseUrl) {
    return;
  }
  activeApiBaseUrl = nextBaseUrl;
  api.defaults.baseURL = nextBaseUrl;
};

const api = axios.create({
  baseURL: activeApiBaseUrl,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    config.baseURL = config.baseURL || activeApiBaseUrl;
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
  (response) => {
    setActiveApiBaseUrl(response?.config?.baseURL);
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;
    const currentBaseUrl = originalRequest?.baseURL || activeApiBaseUrl;
    const currentBaseUrlIndex = getCurrentBaseUrlIndex(currentBaseUrl);

    if (
      originalRequest &&
      !error?.response &&
      (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED')
    ) {
      const nextBaseUrl = getBaseUrlAtIndex(currentBaseUrlIndex + 1);
      if (nextBaseUrl && nextBaseUrl !== currentBaseUrl) {
        originalRequest.baseURL = nextBaseUrl;
        originalRequest.__baseUrlRetryIndex = currentBaseUrlIndex + 1;
        setActiveApiBaseUrl(nextBaseUrl);
        return api(originalRequest);
      }
    }

    if (error?.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
        if (refreshToken) {
          const refreshRes = await axios.post(`${activeApiBaseUrl}/auth/refresh`, { refreshToken });
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
  if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK') {
    return `Cannot reach API at ${activeApiBaseUrl}. Use the same Wi‑Fi as your computer, set EXPO_PUBLIC_API_BASE_URL in .env, or run npm run start:tunnel.`;
  }
  return fallback;
};

export default api;
