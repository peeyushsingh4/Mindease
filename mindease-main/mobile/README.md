# MindEase Mobile (Expo)

React Native client for the Mindease backend. Use **Expo Go** for development.

## Requirements

- Node 18+
- **Expo Go** from the App Store / Play Store — must support **Expo SDK 54** (this repo is pinned to 54 for wider compatibility; still update Expo Go if you see an SDK mismatch).
- Backend running (the app auto-tries local backend ports **5001** and **5000** in development unless you override it in `.env`).

## Setup

```bash
cd mobile
npm install
npx expo-doctor
npm run start:clear
```

Scan the QR code with Expo Go (Android: Camera; iOS: Camera app or Expo Go).

## When Expo Go “doesn’t open” or shows a blank screen

1. **SDK mismatch** — Run `npx expo-doctor`. Update **Expo Go** from the store. This project uses **SDK 54**; if Expo Go is older, upgrade the app from the Play Store / App Store.
2. **Stale Metro cache** — `npm run start:clear` (same as `expo start -c`).
3. **Network** — Phone and computer must reach each other:
   - Same Wi‑Fi, no isolated “guest” network.
   - Try `npm run start:tunnel` if LAN QR codes fail (slower but works across networks).
4. **Firewall** — Allow Node/Expo incoming connections on your Mac/Windows firewall.
5. **Kill stuck Expo Go** — Force-close Expo Go, then reopen and scan again.

## API URL (development)

The app resolves the API host automatically in Expo Go using Metro’s `debuggerHost`, so a **physical device** calls `http://<your-laptop-ip>:5001/api` first and then falls back to `:5000` during development.

Override anytime:

```bash
# mobile/.env
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:5001/api
```

If your machine uses a different port, set `EXPO_PUBLIC_API_BASE_URL` to match exactly.

On the welcome screen (dev builds only), the resolved API URL is shown for debugging.

## Scripts

| Script            | Purpose                          |
|-------------------|----------------------------------|
| `npm run start`   | Default dev server               |
| `npm run start:clear` | Start with clean Metro cache |
| `npm run start:tunnel` | Expo tunnel (network issues) |
| `npm run start:lan`    | Force LAN URL               |
| `npm run doctor`  | `expo-doctor`                    |

## Features mirrored from web

- Sign in, register (including age + emergency contact), anonymous session (age required)
- Dashboard, AI chat (emergency contact required), mood, journal, screenings, appointments

Peer forum and resource hub open in the **device browser** when you set `EXPO_PUBLIC_WEB_APP_ORIGIN` (e.g. your laptop’s IP + `:5173` or your deployed site). Sign in on the web separately, or add in-app `WebView` later if you want a single session.
