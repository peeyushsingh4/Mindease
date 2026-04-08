# MindEase (Web + Backend + Mobile)

MindEase is a mental-health support platform with:
- `backend`: Express + MongoDB API with auth, chat, screening, mood, journal, forum, and appointments.
- `frontend`: React web app.
- `mobile`: Expo React Native mobile app.

## Run Backend
1. Open `backend/.env` (create from your existing env values).
2. Set `JWT_SECRET` and (optionally) `MONGO_URI`.
3. Optional AI setup:
   - `ANTHROPIC_API_KEY=<your_key>`
   - `ANTHROPIC_MODEL=claude-3-5-sonnet-latest` (or another supported model)
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
- If no Anthropic API key is set, chat gracefully uses a local fallback response.
