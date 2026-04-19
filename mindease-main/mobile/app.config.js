// Expo config (dynamic) so `.env` values are available at runtime via Constants.expoConfig.extra
// This avoids relying on `process.env` being inlined consistently across devices.

import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra || {}),
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || '',
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || ''
  }
});

