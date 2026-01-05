# API 404 Error Resolution - Complete Fix

## Problem Summary
Admin login was failing with error:
```
Request failed with status code 404
Error: api/api/graphql:1 Failed to load resource: the server responded with a status of 404
```

## Root Cause Analysis

### Phase 1: Initial Investigation
- Frontend had hardcoded API URL: `http://localhost:8080/api`
- **Issue**: This bypassed nginx proxy, causing CORS errors and wrong host
- **Initial Fix**: Changed to relative path `/api`

### Phase 2: Double /api/ Prefix Issue
- After fix, requests still failing with 404
- Backend logs showed: `POST /api/api/graphql` instead of `POST /graphql`
- **Root Cause**: nginx location routing problem

### Detailed Root Cause
The nginx configuration had two location blocks:

```nginx
location /api/graphql { ... }      # Specific match
location /api/ { ... }              # Prefix/catch-all match
```

In nginx, **prefix matches DO NOT automatically have priority over other prefix matches** when they have the same specificity level. The `/api/` location was catching requests before the more specific `/api/graphql` location.

When `/api/graphql` request matched `/api/` instead of `location /api/graphql`:
1. Request: `/api/graphql`
2. Matched by: `location /api/` 
3. Proxied to: `http://backend:8080/api/` (preserves path)
4. Backend received: `/api/api/graphql` (404 because this path doesn't exist)

## Solution

Changed nginx location matching from **prefix match** to **exact match**:

### Before (BROKEN):
```nginx
location /api/graphql {
    proxy_pass http://backend:8080/graphql;
    ...
}

location /api/ {
    proxy_pass http://backend:8080/api/;
    ...
}
```

### After (FIXED):
```nginx
location = /api/graphql {                    # Exact match with =
    proxy_pass http://backend:8080/graphql;
    ...
}

location /api/ {
    proxy_pass http://backend:8080/api/;
    ...
}
```

**Why this works:**
- `location = /api/graphql` = exact match (highest priority)
- `location /api/` = prefix match (lower priority)
- Nginx checks exact matches first, so exact match wins
- Request `/api/graphql` → matched by `location = /api/graphql` → proxied to `/graphql` ✅

## Changes Made

**File: `frontend/nginx.conf`**

1. **HTTP Server Block (line ~75):**
   - Changed `location /api/graphql` to `location = /api/graphql`

2. **HTTPS Server Block (line ~131):**
   - Changed `location /api/graphql` to `location = /api/graphql`

## Verification

### Test 1: Simple GraphQL Query
```bash
curl -k -X POST "https://localhost/api/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

**Result:** ✅ `{"data":{"__typename":"Query"}}`

### Test 2: Admin Login
```bash
curl -k -X POST "https://localhost/api/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { login(email: \"admin@example.com\", password: \"admin123\") { token user { id email role } } }"}'
```

**Result:** ✅ 
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

### Test 3: Backend Logs
```
2026-01-05 05:49:38 - Secured POST /graphql                    (Correct path!)
2026-01-05 05:49:38 - Login attempt for email: admin@example.com
2026-01-05 05:49:38 - User found in users table: admin@example.com
2026-01-05 05:49:38 - User login successful: admin@example.com with role: ADMIN
2026-01-05 05:49:38 - Exiting from "ASYNC" dispatch, status 200  (Success!)
```

## Key Lessons

1. **nginx Location Matching Priority:**
   - Exact match (`=`) > Regular expression (`~`) > Prefix (`^~`) > Prefix match
   - Always use exact match for single endpoints

2. **Proxy Path Stripping:**
   - `proxy_pass http://backend:8080/graphql` strips the matched location path
   - `proxy_pass http://backend:8080/api/` preserves the remaining path

3. **Double Path Prevention:**
   - When proxying, ensure location definition aligns with proxy_pass destination
   - Test with actual requests to verify correct path reaching backend

## Files Modified
- ✅ `frontend/nginx.conf` - Fixed location matching

## Deployment Status
- ✅ Docker containers rebuilt with fixed nginx config
- ✅ All services running and healthy
- ✅ Admin login functional
- ✅ GraphQL API responding correctly

## Testing Credentials
- **Email:** admin@example.com
- **Password:** admin123
- **Role:** ADMIN
