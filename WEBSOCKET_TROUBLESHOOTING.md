# WebSocket Connection Troubleshooting Guide

## Error: `WebSocket connection to 'wss://localhost:8080/app/...' failed`

This error occurs when the frontend is trying to connect using WSS (secure WebSocket) but the server is running on WS (non-secure).

### Quick Fix

1. **Check your frontend `.env` file:**
```env
VITE_REVERB_SCHEME=http
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_APP_KEY=your-actual-app-key
```

2. **Check your backend `.env` file:**
```env
REVERB_SCHEME=http
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_APP_KEY=your-actual-app-key
REVERB_APP_SECRET=your-actual-app-secret
REVERB_APP_ID=your-actual-app-id
```

**Important:** The `REVERB_APP_KEY` in frontend must match `REVERB_APP_KEY` in backend.

### Common Issues

#### 1. Scheme Mismatch
- **Problem:** Frontend uses `https` but server uses `http`
- **Solution:** Set `VITE_REVERB_SCHEME=http` for local development

#### 2. Port Mismatch
- **Problem:** Frontend connects to wrong port
- **Solution:** Ensure `VITE_REVERB_PORT=8080` matches server port

#### 3. Server Not Running
- **Problem:** Reverb server is not started
- **Solution:** Run `php artisan reverb:start` in backend directory

#### 4. CORS/Origin Issues
- **Problem:** Browser blocks WebSocket connection
- **Solution:** Check `allowed_origins` in `config/reverb.php` includes your frontend URL

#### 5. App Key Mismatch
- **Problem:** Frontend and backend use different app keys
- **Solution:** Ensure both `.env` files have the same `REVERB_APP_KEY`

### Step-by-Step Debugging

1. **Verify Reverb Server is Running:**
```bash
cd mbest-backend/laravel
php artisan reverb:start
```
You should see: `Reverb server started on 0.0.0.0:8080`

2. **Check Browser Console:**
- Look for connection state messages
- Check for any CORS errors
- Verify the connection URL matches your config

3. **Test Connection:**
Open browser console and check:
- `ws://localhost:8080/app/...` for HTTP
- `wss://localhost:8080/app/...` for HTTPS

4. **Verify Environment Variables:**
```bash
# Frontend
cd mbest-frontend
cat .env | grep REVERB

# Backend  
cd mbest-backend/laravel
cat .env | grep REVERB
```

### Expected Console Output

**On Success:**
```
✅ Connected to Reverb WebSocket server
Connection details: { host: 'localhost', port: '8080', scheme: 'http', protocol: 'ws' }
```

**On Failure:**
```
❌ Reverb server is unavailable. Make sure Reverb is running: php artisan reverb:start
Connection error: [error details]
```

### Production Setup

For production, use HTTPS/WSS:
```env
VITE_REVERB_SCHEME=https
VITE_REVERB_HOST=your-domain.com
VITE_REVERB_PORT=443
```

And ensure your Reverb server is configured for TLS/SSL.

