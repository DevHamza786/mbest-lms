# Critical Fix: WebSocket Connecting to Wrong Port

## Problem
WebSocket is trying to connect to `ws://localhost:5173` (frontend dev server) instead of `ws://localhost:8080` (Reverb server).

## Root Cause
The `VITE_REVERB_PORT` environment variable is either:
1. Not set in `.env` file
2. Set to `5173` (wrong - that's the frontend port)
3. Not being loaded by Vite

## Solution

### Step 1: Check/Create Frontend .env File

Create or update `mbest-frontend/.env` with:

```env
VITE_REVERB_APP_KEY=3zfuo1xe9mwxccevpwvc
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

**CRITICAL:** `VITE_REVERB_PORT` must be `8080`, NOT `5173`!

### Step 2: Restart Frontend Dev Server

After updating `.env`:

1. **Stop the dev server** (Ctrl+C)
2. **Clear Vite cache** (optional but recommended):
   ```bash
   rm -rf node_modules/.vite
   ```
3. **Restart dev server**:
   ```bash
   npm run dev
   ```

### Step 3: Verify Configuration

After restart, check browser console. You should see:

```
🔧 Echo Environment Variables: {
  VITE_REVERB_HOST: "localhost",
  VITE_REVERB_PORT: "8080",  // ← Must be 8080, not 5173!
  VITE_REVERB_SCHEME: "http",
  ...
}
```

### Step 4: Verify Connection

You should see:
- `✅ Connected to Reverb WebSocket server`
- Connection URL should be: `ws://localhost:8080/app/...` (NOT 5173)

## Port Reference

| Service | Port | Purpose |
|---------|------|---------|
| Frontend Dev Server | 5173 | Vite dev server (serves React app) |
| Reverb WebSocket | 8080 | Real-time WebSocket server |
| Laravel API | 8000 | Backend API server |

## Troubleshooting

### If still connecting to 5173:

1. **Check .env file exists:**
   ```bash
   cat .env | grep REVERB
   ```

2. **Verify Vite loaded it:**
   - Check browser console for "Echo Environment Variables"
   - If port shows as 5173, .env isn't being read

3. **Try hardcoding temporarily:**
   In `src/lib/echo.ts`, change:
   ```typescript
   const REVERB_PORT = '8080'; // Hardcoded for testing
   ```
   If this works, the issue is .env not loading.

4. **Check for .env.local override:**
   - `.env.local` overrides `.env`
   - Make sure it doesn't have wrong port

## Expected Behavior After Fix

1. ✅ WebSocket connects to `ws://localhost:8080`
2. ✅ Console shows: `✅ Connected to Reverb WebSocket server`
3. ✅ Messages broadcast successfully (Laravel logs confirm)
4. ✅ Messages appear in real-time without refresh

