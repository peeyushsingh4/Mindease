import { Platform } from 'react-native';

const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || `http://${fallbackHost}:5000/api`
).replace(/\/$/, '');

export const TOKEN_STORAGE_KEY = 'mindease.mobile.token';
