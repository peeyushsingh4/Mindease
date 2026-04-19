import { getApiBaseUrlCandidates, resolveApiBaseUrl } from './resolveApiBaseUrl';

export const API_BASE_URL = resolveApiBaseUrl();
export const API_BASE_URL_CANDIDATES = getApiBaseUrlCandidates();

export const TOKEN_STORAGE_KEY = 'mindease.mobile.token';
export const REFRESH_TOKEN_STORAGE_KEY = 'mindease.mobile.refreshToken';

/** Minimum age — must match backend `MINIMUM_AGE`. */
export const MINIMUM_AGE = 16;

/** Optional: Vite dev server or deployed web app, no trailing slash (opens Forum / Resource in browser). */
export const WEB_APP_ORIGIN = (process.env.EXPO_PUBLIC_WEB_APP_ORIGIN || '').replace(/\/$/, '');
