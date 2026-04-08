# MindEase Mobile
Expo-based mobile client for the MindEase backend API.

## Prerequisites
- Node.js 18+
- Expo CLI (via `npx expo`)

## Setup
1. Copy `.env.example` to `.env`
2. Set `EXPO_PUBLIC_API_BASE_URL` to your backend API base URL
3. Install dependencies:
   - `npm install`
4. Start development server:
   - `npm run start`

## Common commands
- Android emulator: `npm run android`
- iOS simulator: `npm run ios`
- Web preview: `npm run web`

## Notes
- If you use Android emulator, `http://10.0.2.2:5000/api` points to your host machine.
- If you use a physical device, set `EXPO_PUBLIC_API_BASE_URL` to a reachable LAN IP.
