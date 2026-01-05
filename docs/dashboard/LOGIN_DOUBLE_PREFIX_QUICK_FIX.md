# Login Fix - Quick Reference

## Status: ✅ FIXED

## The Problem
- Login failing with: `Request failed with status code 404`
- Browser error: `POST https://localhost/api/api/graphql 404 (Not Found)`
- Backend logs: `POST "/api/api/graphql"` (double `/api/` prefix)

## Root Cause
Nginx was configured to proxy `/api/` requests to `http://backend:8080/api/`, causing path doubling:
- Frontend sends: `/api/graphql`
- Nginx appends to `http://backend:8080/api/`
- Backend receives: `/api/api/graphql` ❌ → 404

## The Fix

### File: `frontend/nginx.conf`

**Change 1 - HTTP Server Block (Line 83-92)**
```diff
  location /api/ {
-     proxy_pass http://backend:8080/api/;
+     proxy_pass http://backend:8080/;
  }
```

**Change 2 - HTTPS Server Block (Line 157-166)**
```diff
  location /api/ {
-     proxy_pass http://backend:8080/api/;
+     proxy_pass http://backend:8080/;
  }
```

**Result**: Frontend sends `/api/graphql` → nginx proxies to `http://backend:8080/graphql` ✅

## How to Apply

1. **Edit the file**: `frontend/nginx.conf`
2. **Find both** `location /api/` blocks (HTTP at ~line 83, HTTPS at ~line 157)
3. **Change**: `proxy_pass http://backend:8080/api/;` → `proxy_pass http://backend:8080/;`
4. **Rebuild containers**:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

## Verification

### GraphQL Endpoint
```bash
curl -k -X POST "https://localhost/api/graphql" \
  -H "Content-Type: application/json" \
  --data-raw '{"query":"query { __typename }"}'

# Expected: {"data":{"__typename":"Query"}}
# Status: 200 ✅
```

### Admin Login
```bash
curl -k -X POST "https://localhost/api/graphql" \
  -H "Content-Type: application/json" \
  --data-raw '{"query":"mutation { login(email: \"admin@example.com\", password: \"admin123\") { token user { id email role } } }"}'

# Expected: JWT token in response
# Status: 200 ✅
```

### Backend Logs
```bash
docker logs code-sharing-backend 2>&1 | grep "POST /graphql"

# Should show: POST /graphql (NOT /api/api/graphql)
# Should show: status 200
```

## Test Credentials
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: ADMIN

## Timeline
- **Issue Found**: Double `/api/` prefix in requests
- **Root Cause**: Nginx catch-all location proxying to `/api/` at backend
- **Fix Applied**: Changed proxy_pass to strip `/api/` prefix
- **Status**: ✅ Working - JWT token issued, login successful

## Key Learning
Nginx location matching works like this:
- `location /api/ { proxy_pass http://backend:8080/; }` → Strips `/api/` prefix
- `location /api/ { proxy_pass http://backend:8080/api/; }` → Keeps `/api/` (doubles it with request path)

Choose the proxy_pass target based on your backend's path structure.

---
**Updated**: 2026-01-05
**Build**: All containers rebuilt and running
