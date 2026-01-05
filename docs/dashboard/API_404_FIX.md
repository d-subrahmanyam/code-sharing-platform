# API 404 Error Fix - Documentation

## 🐛 Issue
**Error**: "Request failed with status code 404" when trying to login
**Root Cause**: Frontend was hardcoding API endpoint URL, bypassing nginx proxy
**Status**: ✅ **FIXED**

---

## 📝 Problem Analysis

### Symptom
- Login form displays error: "Request failed with status code 404"
- Backend logs show: `POST "/api/graphql"` → `404 NOT_FOUND`
- But backend GraphQL endpoint exists at `/graphql`

### Root Cause
**File**: `frontend/src/api/client.ts` (Line 9)

```typescript
// BROKEN: Hardcoded backend URL
const API_BASE_URL = (import.meta.env as any).VITE_API_BASE_URL || 'http://localhost:8080/api'
```

**Problem Flow**:
1. Frontend requests: `http://localhost:8080/api/graphql`
2. This **bypasses nginx entirely**
3. Goes directly to backend at port 8080
4. Backend doesn't have `/api/graphql` endpoint (only has `/graphql`)
5. Result: 404 error

### Why It's Wrong
- Frontend served on port 8000 (via nginx)
- Backend served on port 8080 (direct)
- nginx is configured to proxy `/api/*` → backend `/`
- But hardcoded URL goes directly to backend, skipping proxy

---

## ✅ Solution

### File Changed
`frontend/src/api/client.ts` (Line 9)

### Before
```typescript
const API_BASE_URL = (import.meta.env as any).VITE_API_BASE_URL || 'http://localhost:8080/api'
```

### After
```typescript
const API_BASE_URL = (import.meta.env as any).VITE_API_BASE_URL || '/api'
```

### How It Works Now
1. Frontend requests: `/api/graphql` (relative path)
2. Browser sends to current host: `https://localhost:8000/api/graphql`
3. nginx intercepts and proxies to: `http://backend:8080/graphql`
4. Backend responds with GraphQL data
5. ✅ Login succeeds

---

## 🔄 Request Flow Diagram

### Before (Broken)
```
Browser              Nginx          Backend
  |                   |               |
  | GET /login        |               |
  |---------->|                       |
  |           | 200 index.html        |
  |<----------|                       |
  |                                   |
  | POST /api/graphql (hardcoded)    |
  | http://localhost:8080/api/        |
  |-----BYPASS NGINX---DIRECT-->|
  |                             | 404! ❌
  |<-----------ERROR------------|
```

### After (Fixed)
```
Browser              Nginx          Backend
  |                   |               |
  | GET /login        |               |
  |---------->|                       |
  |           | 200 index.html        |
  |<----------|                       |
  |                                   |
  | POST /api/graphql (relative)     |
  |---------->| http://backend:8080  |
  |           |  /graphql            |
  |           |--------->|            |
  |           |          | GraphQL    |
  |           |<---------|            |
  |<----------|✅ success             |
```

---

## 🧪 Verification

### Test 1: Login Works
```
URL: https://localhost:8000/login
Email: admin@example.com
Password: admin123
Result: ✅ Login succeeds
```

### Test 2: GraphQL Through Proxy
```
Request: POST /api/graphql (relative path)
Routed through: nginx
Reaches: http://backend:8080/graphql
Result: ✅ Works
```

### Test 3: No Hardcoded URLs
```
Before: 'http://localhost:8080/api' ❌
After: '/api' ✅
```

---

## 🚀 Deployment

### Build & Start
```bash
docker-compose down
docker-compose up -d --build
```

### Build Output
```
Frontend: npm run build (10.9s)
Backend: Using cached build
Containers: All started and healthy
```

---

## 🔑 Key Insight

**Best Practice**: Use relative URLs for API calls, not hardcoded absolute URLs

**Why**:
- Relative URLs respect the current host
- Work through proxies automatically
- No environment-specific hardcoding needed
- Works in development and production

**Pattern**:
```typescript
// ❌ Bad: Hardcoded URL
const API_URL = 'http://localhost:8080/api'

// ✅ Good: Relative path
const API_URL = '/api'

// ✅ Also good: Environment variable (with fallback)
const API_URL = process.env.REACT_APP_API_URL || '/api'
```

---

## 📊 Impact

| Item | Impact |
|------|--------|
| **Files Changed** | 1 (client.ts) |
| **Lines Modified** | 1 |
| **API Calls** | All now go through nginx |
| **Login** | ✅ Works |
| **GraphQL** | ✅ Responds |
| **Admin Dashboard** | ✅ Accessible |

---

## 🔗 Related Issues

### Session 1: Login Hanging
- **Cause**: Redux state mismatch
- **Status**: ✅ Fixed previously

### Session 2: 404 Error (This Issue)
- **Cause**: Hardcoded API URL bypassing proxy
- **Status**: ✅ Fixed now

---

## 📞 Troubleshooting

### Still Getting 404?
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Check containers: `docker ps`
3. Check logs: `docker logs code-sharing-backend | grep graphql`

### GraphQL Still Not Working?
1. Verify proxy is correct: `docker logs code-sharing-frontend`
2. Test backend directly: `docker exec code-sharing-backend curl -X POST http://localhost:8080/graphql -d '{"query":"{ __typename }"}'`

---

## ✅ Completion

- [x] Root cause identified (hardcoded URL)
- [x] Fix implemented (relative path)
- [x] Containers rebuilt
- [x] Login tested - works ✅
- [x] Documentation created

---

**Status**: ✅ **COMPLETE**  
**Date**: January 5, 2026  
**Admin Login**: ✅ **WORKING**

