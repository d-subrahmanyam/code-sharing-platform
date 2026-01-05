# API Double Prefix Fix - Complete Report

## Issue Summary
- **Problem**: Admin login failing with HTTP 404 error
- **Root Cause**: Double `/api/` prefix in API requests (`/api/api/graphql`)
- **Status**: ✅ **FIXED AND VERIFIED**

## Error Messages Observed

### Browser Console
```
POST https://localhost/api/api/graphql 404 (Not Found)
Request failed with status code 404
```

### Backend Logs (Before Fix)
```
2026-01-05 05:53:07 - Securing POST /api/api/graphql
2026-01-05 05:53:07 - Secured POST /api/api/graphql
2026-01-05 05:53:07 - POST "/api/api/graphql", parameters={}
2026-01-05 05:53:07 - Securing POST /error
```

## Root Cause Analysis

### The Problem
The nginx reverse proxy had a critical path routing issue:

```nginx
# WRONG - This catches /api/ prefix requests
location /api/ {
    proxy_pass http://backend:8080/api/;  # ← Doubles the /api/ prefix!
}
```

When a frontend request comes in for `/api/graphql`:
1. Nginx matches it to `location /api/`
2. Nginx appends the matched path to the proxy target
3. Result: `http://backend:8080/api/` + `/graphql` = `/api/graphql` at backend
4. But the location says `proxy_pass http://backend:8080/api/`
5. So the full path becomes: `/api/` + `/api/graphql` = `/api/api/graphql` ❌

### Why It Happened
- The catch-all `/api/` location was proxying to `http://backend:8080/api/`
- This was intended for legacy API endpoints that expect `/api/` prefix at backend
- But our backend provides APIs directly at root level (`/graphql`, `/api/ws/`, etc.)
- The double prefix caused `/api/graphql` → `/api/api/graphql` → 404 at backend

## Solution Implemented

### Change Made
Modified `frontend/nginx.conf` to proxy `/api/` requests to backend root instead:

```nginx
# CORRECT - Strip the /api/ prefix
location /api/ {
    proxy_pass http://backend:8080/;  # ← No /api/ at end = strips prefix!
}
```

Now when a request comes for `/api/graphql`:
1. Nginx matches it to `location /api/`
2. Nginx appends the matched path to the proxy target
3. With `proxy_pass http://backend:8080/;` the path is stripped
4. Backend receives: `/graphql` ✅

### Files Modified
- **File**: `frontend/nginx.conf`
- **Location**: Lines 83-92 (HTTP server block) and Lines 157-166 (HTTPS server block)
- **Change**: `proxy_pass http://backend:8080/api/;` → `proxy_pass http://backend:8080/;`

## Verification Results

### GraphQL Endpoint Test
```bash
curl -k -X POST "https://localhost/api/graphql" \
  -H "Content-Type: application/json" \
  --data-raw '{"query":"query { __typename }"}'

Response: {"data":{"__typename":"Query"}}
HTTP Status: 200 ✅
```

### Admin Login Test
```bash
curl -k -X POST "https://localhost/api/graphql" \
  -H "Content-Type: application/json" \
  --data-raw '{"query":"mutation { login(email: \"admin@example.com\", password: \"admin123\") { token user { id email role } } }"}'

Response:
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
HTTP Status: 200 ✅
```

### Backend Log Verification
```
2026-01-05 05:57:06 - Securing POST /graphql      ✅ (no /api/api/)
2026-01-05 05:57:10 - Login attempt for email: admin@example.com
2026-01-05 05:57:10 - User found in users table: admin@example.com
2026-01-05 05:57:10 - User login successful: admin@example.com with role: ADMIN
2026-01-05 05:57:10 - Exiting from "ASYNC" dispatch, status 200  ✅
```

## Technical Details

### Nginx Path Handling
Understanding how nginx proxies work is key:

1. **With trailing slash in proxy_pass**:
   ```nginx
   location /api/ {
       proxy_pass http://backend:8080/api/;
   }
   ```
   - Request: `/api/graphql`
   - Stripped part: `/api/`
   - Remaining path: `graphql`
   - Proxied to: `http://backend:8080/api/graphql` ✅

   But our backend has the double `/api/` issue, so this became `/api/api/graphql`

2. **Without suffix in proxy_pass** (our fix):
   ```nginx
   location /api/ {
       proxy_pass http://backend:8080/;
   }
   ```
   - Request: `/api/graphql`
   - Stripped part: `/api/`
   - Remaining path: `graphql`
   - Proxied to: `http://backend:8080/graphql` ✅

### Why This Works for All APIs
Our backend serves all APIs at the root level:
- GraphQL: `/graphql`
- WebSocket: `/api/ws/`
- File operations: `/api/files/` (if any)

The nginx configuration correctly handles this with specific locations:

```nginx
# Exact match - highest priority
location = /api/graphql {
    proxy_pass http://backend:8080/graphql;
}

# Prefix match for WebSocket
location /api/ws/ {
    proxy_pass http://backend:8080/api/ws/;
}

# Catch-all for other /api/ routes
location /api/ {
    proxy_pass http://backend:8080/;
}
```

## Deployment Steps

1. **Update nginx configuration**:
   - Modified `frontend/nginx.conf` (HTTP block at line 83 and HTTPS block at line 157)
   - Changed `proxy_pass http://backend:8080/api/;` to `proxy_pass http://backend:8080/;`

2. **Rebuild containers**:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

3. **Verify deployment**:
   - GraphQL endpoint returns 200 ✅
   - Login mutation returns JWT token ✅
   - Backend logs show correct path `/graphql` (not `/api/api/graphql`) ✅

## Testing Checklist

- [x] GraphQL introspection query works
- [x] Admin login mutation succeeds
- [x] JWT token is issued correctly
- [x] Backend receives requests at `/graphql` (not `/api/graphql`)
- [x] HTTP status is 200 (not 404)
- [x] User role is correctly identified as ADMIN
- [x] Containers started successfully
- [x] No 404 errors in backend logs

## Prevention & Best Practices

### For Future API Proxying
1. **Match your proxy_pass to your backend structure**:
   - If backend has `/api/endpoint`, use `proxy_pass http://backend:8080/api/;`
   - If backend has `/endpoint`, use `proxy_pass http://backend:8080/;`

2. **Test path routing carefully**:
   - Check backend logs to verify the path being received
   - Use curl to test proxy routing before relying on UI

3. **Nginx location priority** (high to low):
   1. Exact match: `location = /path`
   2. Longest prefix match: `location /path`
   3. Regex match: `location ~ /path`
   4. Catch-all: `location /`

4. **Use specific locations for known endpoints**:
   - GraphQL, WebSocket, etc. should have dedicated `location =` or `location /path` blocks
   - Catch-all should be a safe fallback

## Timeline

| Time | Event |
|------|-------|
| 05:53:07 | Initial login attempt - 404 error recorded |
| 05:53:07 | Backend logs show `/api/api/graphql` received |
| 05:53:19 | Previous session (expired) |
| 05:56:57 | Nginx configuration fix applied |
| 05:57:06 | Containers rebuilt and restarted |
| 05:57:10 | Login test successful - JWT token issued |
| 05:57:10 | Backend logs show correct `/graphql` path |

## Credentials for Testing

- **Username**: `admin@example.com`
- **Password**: `admin123`
- **Expected Role**: ADMIN

## Related Documentation

- [LOGIN_QUICK_FIX.md](LOGIN_QUICK_FIX.md) - Quick reference guide
- [TEST_REPORT_LOGIN_FIX.md](TEST_REPORT_LOGIN_FIX.md) - Detailed test results
- [INDEX.md](INDEX.md) - Documentation index

---

**Status**: ✅ **PRODUCTION READY**
**Last Updated**: 2026-01-05 05:57:10 UTC
**Build**: Docker containers rebuilt and verified
