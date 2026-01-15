# Laravel Reverb WebSocket Setup Guide

## Backend Setup

### 1. Install Laravel Reverb (if not already installed)
```bash
cd mbest-backend/laravel
composer require laravel/reverb
php artisan reverb:install
```

### 2. Configure Reverb
Edit `config/reverb.php` or create it with:

```php
<?php

return [
    'id' => env('REVERB_APP_ID', 'app-id'),
    'key' => env('REVERB_APP_KEY', 'app-key'),
    'secret' => env('REVERB_APP_SECRET', 'app-secret'),
    'app_id' => env('REVERB_APP_ID', 'app-id'),
    'options' => [
        'host' => env('REVERB_HOST', '127.0.0.1'),
        'port' => env('REVERB_PORT', 8080),
        'scheme' => env('REVERB_SCHEME', 'http'),
        'useTLS' => env('REVERB_SCHEME', 'http') === 'https',
    ],
];
```

### 3. Update .env file
Add these to your Laravel `.env` file:

```env
BROADCAST_DRIVER=reverb

REVERB_APP_ID=app-id
REVERB_APP_KEY=app-key
REVERB_APP_SECRET=app-secret
REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=http
```

### 4. Start Reverb Server
```bash
php artisan reverb:start
```

Or use a process manager like Supervisor for production.

## Frontend Setup

### 1. Environment Variables
Create or update `.env` file in `mbest-frontend`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_REVERB_APP_KEY=app-key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

**Important:** The `VITE_REVERB_APP_KEY` must match the `REVERB_APP_KEY` in your Laravel `.env` file.

### 2. Restart Development Server
After updating environment variables:
```bash
npm run dev
```

## Testing the Connection

1. Start Laravel backend:
   ```bash
   cd mbest-backend/laravel
   php artisan serve
   ```

2. Start Reverb server:
   ```bash
   php artisan reverb:start
   ```

3. Start frontend:
   ```bash
   cd mbest-frontend
   npm run dev
   ```

4. Open browser console and check for:
   - "Connected to Reverb WebSocket server" message
   - No WebSocket connection errors

## Troubleshooting

### Connection Error: "WebSocket connection to 'wss://localhost:8080/app/your-app-key'"
- **Issue:** The app key is still set to default "your-app-key"
- **Solution:** Update `VITE_REVERB_APP_KEY` in frontend `.env` to match backend `REVERB_APP_KEY`

### Connection Refused
- **Issue:** Reverb server is not running
- **Solution:** Start Reverb server with `php artisan reverb:start`

### Authentication Failed
- **Issue:** Token not being sent correctly
- **Solution:** Check that user is logged in and token exists in localStorage

### Channel Authorization Failed
- **Issue:** User not authorized for the channel
- **Solution:** Check `routes/channels.php` authorization logic

## Production Setup

For production, you'll need to:
1. Use HTTPS/WSS for secure connections
2. Set up a process manager (Supervisor) for Reverb
3. Configure proper firewall rules
4. Use environment-specific keys and secrets
5. Consider using a load balancer if scaling

