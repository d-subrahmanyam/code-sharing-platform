# Admin Login Quick Reference

## Status
✅ **RESOLVED** - Admin login now works correctly

## Credentials
- **Email:** `admin@example.com`
- **Password:** `admin123`

## What Was Fixed

### The Problem
- Admin login returned HTTP 404 error
- Error message: "Request failed with status code 404"
- Browser console showed: `api/api/graphql:1 Failed to load resource`

### The Root Causes (2 Issues)

#### Issue #1: Hardcoded API URL ✅ FIXED
- **File:** `frontend/src/api/client.ts` (Line 10)
- **Was:** `const API_BASE_URL = 'http://localhost:8080/api'`
- **Now:** `const API_BASE_URL = '/api'` (uses relative path)

#### Issue #2: Nginx Location Routing ✅ FIXED
- **File:** `frontend/nginx.conf` (Lines 75 & 131)
- **Was:** `location /api/graphql { ... }` (prefix match)
- **Now:** `location = /api/graphql { ... }` (exact match)
- **Why:** The `=` operator ensures exact matching, preventing the catch-all `/api/` location from stealing GraphQL requests

### Technical Details

**The Bug:** Requests to `/api/graphql` were being routed through the `/api/` catch-all location, which proxied them to `http://backend:8080/api/`, resulting in the backend receiving `/api/api/graphql` → 404 error.

**The Fix:** Using exact match (`=`) ensures `/api/graphql` requests go to the specific GraphQL location, which correctly proxies to `http://backend:8080/graphql`.

## How to Test

### 1. Login via UI
```
URL: https://localhost/login
Email: admin@example.com
Password: admin123
```

### 2. Login via API
```bash
curl -k -X POST "https://localhost/api/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { login(email: \"admin@example.com\", password: \"admin123\") { token user { id email role } } }"}'
```

Expected response:
```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzUxMiJ9...",
      "user": {
        "id": "d00ce735-63d0-454e-9d16-88af3187e4de",
        "email": "admin@example.com",
        "role": "ADMIN"
      }
    }
  }
}
```

### 3. Verify Backend
```bash
docker logs code-sharing-backend | grep -i "POST /graphql" | tail -5
```

Should show: `POST /graphql` with HTTP 200

## Files Changed
1. `frontend/src/api/client.ts` - Hardcoded URL fix
2. `frontend/nginx.conf` - Nginx routing fix (2 locations: HTTP & HTTPS)

## Deployment
Containers were rebuilt and restarted with the fixes:
```bash
docker-compose up -d --build
```

## Verification Results
- ✅ GraphQL endpoint responding
- ✅ Admin login successful
- ✅ Correct JWT token issued
- ✅ User role correctly identified as ADMIN
- ✅ Backend logs show correct path routing
- ✅ HTTP 200 responses on all requests

---

For detailed investigation and analysis, see [API_404_LOGIN_FIX.md](./API_404_LOGIN_FIX.md)
