# MindEase (Web + Backend + Mobile)

MindEase is a mental-health support platform with:
- `backend`: Express + Firebase (Firestore + Firebase Auth) API with auth, chat, screening, mood, journal, forum, and appointments.
- `frontend`: React web app.
- `mobile`: Expo React Native mobile app.

## Run Backend
1. Open `backend/.env` (create from your existing env values).
2. Set Firebase backend credentials:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (with escaped `\n`)
   - `FIREBASE_WEB_API_KEY` (for login/refresh flow)
3. Optional AI setup:
   - `OPENAI_API_KEY=<your_key>`
   - `OPENAI_MODEL=gpt-4o-mini`
4. Start:
   - `npm install`
   - `npm run dev`

## Run Mobile App
1. In `mobile`, copy `.env.example` to `.env`.
2. Set:
   - `EXPO_PUBLIC_API_BASE_URL=http://<your-machine-ip>:5000/api` (physical phone)
   - or `http://10.0.2.2:5000/api` (Android emulator)
3. Start:
   - `npm install`
   - `npm run start`

## Notes
- CORS now supports comma-separated `ALLOWED_ORIGINS` in backend `.env`.
- If no OpenAI API key is set, chat gracefully uses a local fallback response.
- Web and mobile token sessions now use Firebase ID tokens with refresh support.
