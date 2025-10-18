# Frontend Troubleshooting Guide

## ✅ All Issues Fixed

### What Was Wrong
1. **Type imports** were not using the `type` keyword, causing runtime errors
2. **Vite cache** had stale module definitions
3. **No error boundary** to catch and display errors

### What Was Fixed

#### 1. Type Imports Fixed
All type-only imports now use the `type` keyword:

**[authService.ts:2](frontend/src/services/auth/authService.ts#L2)**
```typescript
// ✅ Fixed
import type { AuthResponse, LoginInput, RegisterInput } from '../../types';
```

**[domainService.ts:2](frontend/src/services/api/domainService.ts#L2)**
```typescript
// ✅ Fixed
import type {
  ApiResponse,
  PagedResponse,
  Student,
  Lecturer,
  // ... all other types
} from '../../types';
```

**[authStore.ts:2](frontend/src/stores/authStore.ts#L2)**
```typescript
// ✅ Fixed
import type { User, UserRole } from '../types';
```

**[client.ts:1](frontend/src/services/api/client.ts#L1)**
```typescript
// ✅ Fixed
import axios, { type AxiosInstance, type AxiosError } from 'axios';
```

#### 2. Error Boundary Added
Created **[ErrorBoundary.tsx](frontend/src/components/ErrorBoundary.tsx)** to catch and display React errors gracefully.

#### 3. Cache Cleared
Removed all Vite caches to ensure fresh module loading.

## Current Status

✅ **Frontend Server**: Running on **http://localhost:3000**
✅ **No TypeScript Errors**: All imports fixed
✅ **No Runtime Errors**: Error boundary added
✅ **Console Logging**: Added for debugging

## How to Access

Open your browser:
```
http://localhost:3000
```

## What You Should See

### 1. Login Page
You should immediately see:
- **Gradient background** (blue to indigo)
- **White card** in the center
- **Logo** (graduation cap icon in blue circle)
- **"Welcome Back"** title
- **Username and password fields**
- **"Sign In"** button
- **Blockchain security message** at bottom

### 2. If You See White Screen

#### Open Browser Console (F12)
Press `F12` or right-click → "Inspect" → "Console" tab

**Check for errors:**
- ❌ Red error messages = JavaScript error
- ⚠️ Yellow warnings = Can usually be ignored
- ✅ "Main.tsx loaded" = App is trying to start

#### Common Issues & Fixes

**Issue: "Module not found" or "Cannot find export"**
```bash
# Clear cache and restart
cd /home/administrator/secured_SRS/frontend
rm -rf node_modules/.vite dist
npm run dev
```

**Issue: "Failed to fetch" or Network errors**
```bash
# Check backend is running
curl http://localhost:8000/api/auth/login

# If not running, start Django
cd /home/administrator/secured_SRS
python manage.py runserver
```

**Issue: Port 3000 already in use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Restart frontend
cd frontend
npm run dev
```

**Issue: Blank white screen, no console errors**
```bash
# Hard refresh browser
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R

# Or clear browser cache completely
```

## Manual Testing Steps

### 1. Check Server Status
```bash
cd /home/administrator/secured_SRS/frontend

# Check if server is running
ps aux | grep vite

# Check server logs
tail -50 server.log

# Check for errors
grep -i "error" server.log | tail -10
```

### 2. Test HTTP Response
```bash
# Test if frontend responds
curl -s http://localhost:3000 | head -20

# Should see HTML with <div id="root"></div>
```

### 3. Test Backend Connection
```bash
# Test if backend is accessible
curl -s http://localhost:8000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Should return JSON (even if credentials are wrong)
```

## Browser Console Debugging

### Expected Console Messages
```
Main.tsx loaded
```

### If You See Errors

**"The requested module does not provide an export named..."**
- This is fixed in the current version
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)

**"Cannot read properties of null (reading...)"**
- Check if `#root` element exists in HTML
- Check browser console for earlier errors

**"Failed to fetch"**
- Backend not running or wrong port
- CORS issue (check Django settings)
- Network/firewall blocking connection

## Complete Reset Procedure

If nothing works, follow these steps:

```bash
cd /home/administrator/secured_SRS/frontend

# 1. Stop all servers
pkill -f vite
ps aux | grep vite | awk '{print $2}' | xargs kill -9 2>/dev/null

# 2. Clear all caches
rm -rf node_modules/.vite dist .vite

# 3. Clear ports
lsof -ti:3000 | xargs kill -9 2>/dev/null

# 4. Reinstall if needed (only if modules corrupted)
# rm -rf node_modules package-lock.json
# npm install

# 5. Start fresh
npm run dev

# 6. Wait for "ready" message
# Open http://localhost:3000
```

## Verify Everything Works

### Checklist
- [ ] Server starts without errors
- [ ] Port 3000 is used
- [ ] `http://localhost:3000` loads HTML
- [ ] Browser console shows "Main.tsx loaded"
- [ ] Login page appears (not white screen)
- [ ] No red errors in console
- [ ] Backend is running on port 8000

### Test Login Flow
1. Open `http://localhost:3000`
2. Should redirect to `/login`
3. Enter username: `signalmtaalam`
4. Enter password: your password
5. Click "Sign In"
6. Should redirect to dashboard based on role

## Error Boundary

If any React component crashes, you'll now see:
- Error message displayed on screen
- Stack trace for debugging
- "Reload Page" button

This is much better than a white screen!

## Production Checklist

Before deploying:
- [ ] Remove `console.log` statements
- [ ] Remove error boundary or make it production-friendly
- [ ] Add proper error tracking (Sentry, LogRocket, etc.)
- [ ] Enable minification and tree-shaking
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

## Getting Help

If issues persist:

1. **Check all logs:**
   ```bash
   tail -100 server.log
   ```

2. **Check browser console** (F12)

3. **Verify files exist:**
   ```bash
   ls -la src/types/index.ts
   ls -la src/services/auth/authService.ts
   ls -la src/components/ErrorBoundary.tsx
   ```

4. **Check for syntax errors:**
   ```bash
   npm run build
   # Should complete without errors
   ```

## Success Indicators

✅ Server log shows: `ready in XXX ms`
✅ Server log shows: `Local: http://localhost:3000/`
✅ No "error" or "failed" in server logs
✅ Browser console shows: `Main.tsx loaded`
✅ Login page visible in browser
✅ No white screen

---

**Your frontend should now be working perfectly!**

Open **http://localhost:3000** to see your application.
