import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Must match the backend `PORT` in development (see `backend/.env`). */
const DEFAULT_DEV_API_PORTS = [5001, 5000];

const unique = (values) => [...new Set(values.filter(Boolean))];

function resolveDevHostCandidates() {
  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ||
    Constants.debuggerHost ||
    (typeof Constants.manifest2 === 'object' &&
      Constants.manifest2?.extra?.expoGo?.debuggerHost) ||
    null;

  const hosts = [];
  if (debuggerHost) {
    const host = String(debuggerHost).split(':')[0];
    if (host) {
      hosts.push(host);
    }
  }

  if (Platform.OS === 'android') {
    hosts.push('10.0.2.2');
  }

  hosts.push('localhost');
  return unique(hosts);
}

export function getApiBaseUrlCandidates() {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const fromExtra = Constants.expoConfig?.extra?.apiBaseUrl?.trim();
  const configured = fromEnv || fromExtra;
  if (configured) {
    return [String(configured).replace(/\/$/, '')];
  }

  if (!__DEV__) {
    const prod = process.env.EXPO_PUBLIC_API_BASE_URL_PROD?.trim();
    if (prod) {
      return [prod.replace(/\/$/, '')];
    }
    return [`http://127.0.0.1:${DEFAULT_DEV_API_PORTS[0]}/api`];
  }

  const hosts = resolveDevHostCandidates();
  return hosts.flatMap((host) => DEFAULT_DEV_API_PORTS.map((port) => `http://${host}:${port}/api`));
}

/**
 * Resolves the API base URL for Expo Go, simulators, and physical devices.
 * - Set `EXPO_PUBLIC_API_BASE_URL` in `.env` to override (recommended for odd networks
 *   or if you intentionally run the backend on a non-default port such as 5001).
 * - In Expo Go, uses the Metro/dev machine host from `debuggerHost` so a physical
 *   phone can reach your laptop (same Wi‑Fi).
 * - In development, automatically falls back across the common local backend ports
 *   used in this repo (`5001`, then `5000`).
 */
export function resolveApiBaseUrl() {
  return getApiBaseUrlCandidates()[0];
}
