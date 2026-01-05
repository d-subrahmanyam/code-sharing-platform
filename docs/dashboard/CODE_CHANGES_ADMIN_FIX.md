# Admin Dashboard Fix - Code Changes Summary

**Date**: January 5, 2026  
**Issue**: Admin dashboard not displaying sessions from database  
**Root Cause**: Authentication system mismatch (GraphQL token vs JWT token)  
**Status**: ✅ FIXED AND DEPLOYED

---

## Overview

The admin dashboard required a **JWT token** from the REST `/auth/login` endpoint, but the frontend was only performing **GraphQL authentication** which returns a different token type. The fix integrates both systems so admin users automatically receive JWT tokens during login.

---

## Files Modified

### 1. Frontend - Auth Saga (Authentication Logic)

**File**: `frontend/src/store/sagas/authSaga.ts`

**Changes Made**:
- Added import for `axios` HTTP client and API_BASE_URL configuration
- Enhanced `loginSaga` function to call REST `/auth/login` endpoint for admin users
- After GraphQL login succeeds, if user has ADMIN role, make additional REST call to get JWT token
- Combine both tokens in the login payload

**Key Code Addition**:
```typescript
// If user is an admin, also fetch the JWT token from the REST endpoint
if (loginPayload.user && loginPayload.user.role === 'ADMIN') {
  try {
    const jwtResponse = yield call(
      axios.post,
      `${API_BASE_URL}/auth/login`,
      {
        username: loginPayload.user.username,
        password: action.payload.password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    )

    if (jwtResponse.data && jwtResponse.data.token) {
      loginPayload = {
        ...loginPayload,
        jwtToken: jwtResponse.data.token,
        expiresIn: jwtResponse.data.expiresIn,
      }
    }
  } catch (jwtError: any) {
    console.warn('Failed to fetch JWT token for admin:', jwtError.message)
  }
}
```

**Why This Works**:
- Axios allows making HTTP calls within Redux-Saga
- Username and password are available from GraphQL response and login action
- REST endpoint accepts these credentials and returns JWT
- JWT can be stored and used for admin endpoints

---

### 2. Frontend - Redux Auth Reducer (State Management)

**File**: `frontend/src/store/slices/authSlice.ts`

**Changes Made**:
- Added `jwtToken` field to initial state, loading from localStorage
- When login succeeds, store JWT token in localStorage and Redux state
- When logout happens, clear JWT token from both locations

**Lines Changed**:

```typescript
// In initialState:
jwtToken: localStorage.getItem('adminJwtToken'), // NEW

// In AUTH_LOGIN_SUCCESS/AUTH_REGISTER_SUCCESS:
if (action.payload.jwtToken) {
  localStorage.setItem('adminJwtToken', action.payload.jwtToken)  // NEW
}
const newState = {
  ...state,
  jwtToken: action.payload.jwtToken || state.jwtToken,  // NEW
  // ... rest of state
}

// In AUTH_LOGOUT:
localStorage.removeItem('adminJwtToken')  // NEW
return {
  ...state,
  jwtToken: null,  // NEW
  // ... rest of state
}
```

**Why This Works**:
- Persists JWT token so it survives page refreshes
- Stores it separately from GraphQL token to avoid confusion
- Redux state allows all components to access the token

---

### 3. Frontend - API Client (Request Interceptor)

**File**: `frontend/src/api/client.ts`

**Changes Made**:
- Modified request interceptor to check request URL
- For admin endpoints, use JWT token; for other endpoints, use regular token
- This ensures right token is sent to right endpoint

**Code Change**:
```typescript
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState()
    const token = state.auth.token
    const jwtToken = state.auth.jwtToken  // NEW

    // Use JWT token for admin endpoints, otherwise use regular token  // NEW
    const authToken = config.url?.includes('/admin') && jwtToken ? jwtToken : token  // NEW

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`
    }
    // ... rest of interceptor
  },
  // ...
)
```

**Why This Works**:
- Axios interceptors run before every request
- Can examine the URL and choose appropriate token
- Admin endpoints (containing `/admin` in URL) get JWT token
- Other endpoints get regular GraphQL token
- Backward compatible with non-admin users

---

### 4. Frontend - TypeScript Type Definitions

**File**: `frontend/src/types/redux.ts`

**Changes Made**:
- Added optional `jwtToken` field to `AuthState` interface

**Code Change**:
```typescript
export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  jwtToken?: string | null  // NEW - JWT token for admin endpoints
  loading: boolean
  error: string | null
}
```

**Why This Works**:
- Provides TypeScript type safety for the new jwtToken field
- Prevents "Property does not exist" compilation errors
- Optional (?) field means it's okay if not present
- Allows null values for when user isn't admin

---

## Code Flow Diagram

```
User Login Form
  │
  ├─ Email/Password entered
  │   (e.g., email="admin@example.com", password="pa55ward")
  │
  └─ Dispatch AUTH_LOGIN_REQUEST action
      │
      └─ authSaga.loginSaga() triggered
          │
          ├─ Call GraphQL mutation: login(email, password)
          │   │
          │   └─ Backend returns:
          │       {
          │         "token": "graphql_token_xyz",
          │         "user": {
          │           "id": "123",
          │           "username": "admin",
          │           "email": "admin@example.com",
          │           "role": "ADMIN"
          │         },
          │         "success": true
          │       }
          │
          ├─ Check: Is user.role === 'ADMIN'?
          │   │
          │   ├─ NO: Dispatch AUTH_LOGIN_SUCCESS with only GraphQL token
          │   │
          │   └─ YES: Continue...
          │       │
          │       └─ Call REST POST /api/auth/login
          │           │
          │           ├─ Send: {username: "admin", password: "pa55ward"}
          │           │
          │           └─ Backend returns:
          │               {
          │                 "token": "jwt_token_eyJhbGc...",
          │                 "username": "admin",
          │                 "roleName": "ADMIN",
          │                 "expiresIn": 86400000
          │               }
          │
          ├─ Combine both tokens in payload:
          │   {
          │     "token": "graphql_token_xyz",
          │     "jwtToken": "jwt_token_eyJhbGc...",
          │     "user": {...},
          │     "success": true
          │   }
          │
          └─ Dispatch AUTH_LOGIN_SUCCESS
              │
              └─ authSlice.ts receives action
                  │
                  ├─ Save to localStorage:
                  │   ├─ authToken = "graphql_token_xyz"
                  │   ├─ adminJwtToken = "jwt_token_eyJhbGc..."
                  │   └─ authUser = {id, username, email, role}
                  │
                  └─ Update Redux state:
                      {
                        isAuthenticated: true,
                        user: {...},
                        token: "graphql_token_xyz",
                        jwtToken: "jwt_token_eyJhbGc...",
                        loading: false,
                        error: null
                      }
                          │
                          └─ AdminPage component sees this state
                              │
                              ├─ Checks: isAuthenticated? ✓
                              ├─ Checks: user.role === 'ADMIN'? ✓
                              │
                              └─ Calls apiClient.get('/admin/sessions')
                                  │
                                  └─ apiClient interceptor:
                                      ├─ URL contains '/admin'? YES
                                      ├─ jwtToken exists? YES
                                      │
                                      └─ Add header:
                                          Authorization: Bearer jwt_token_eyJhbGc...
                                          │
                                          └─ Backend JwtAuthenticationInterceptor:
                                              ├─ Extracts JWT token
                                              ├─ Validates signature
                                              ├─ Sets user context
                                              │
                                              └─ AdminController.getAllSessions():
                                                  ├─ Checks user role (from token)
                                                  ├─ Queries database
                                                  │
                                                  └─ Returns: [
                                                      {
                                                        id: 3,
                                                        snippetId: "test-snippet-001",
                                                        ownerUsername: "TestOwner",
                                                        participantCount: 1,
                                                        createdAt: "2026-01-04T17:26:00..."
                                                      }
                                                    ]
                                                      │
                                                      └─ Frontend displays sessions! ✓
```

---

## Backend Code (No Changes - Already Correct)

The backend authentication was already properly implemented. No backend code changes were needed:

### ✅ AdminAuthController - REST Login Endpoint
- Accepts username/password
- Returns JWT token
- Already working correctly

### ✅ JwtAuthenticationInterceptor - Token Validation
- Intercepts `/admin/**` requests
- Validates JWT signature
- Extracts username and role
- Already working correctly

### ✅ AdminController - Sessions Endpoint
- Checks JWT token validation (via interceptor)
- Checks user role from token
- Returns session data
- Already working correctly

### ✅ AdminBootstrapInitializer - Default User Creation
- Creates default admin user: username=`admin`, password=`pa55ward`
- Already working correctly

---

## Configuration

### Default Admin Credentials

```
Username: admin
Password: pa55ward
```

These are hardcoded in `AdminBootstrapInitializer.java`. Change in production!

### Token Expiration

| Token | Expiration |
|-------|-----------|
| GraphQL Token | Session-based (depends on backend config) |
| JWT Token | 86400000 milliseconds = 24 hours |

### API Configuration

```typescript
// In frontend/src/store/sagas/authSaga.ts
const API_BASE_URL = (import.meta.env as any).VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080'
```

This removes the `/api` prefix because the server context path includes it.

---

## Testing the Fix

### Quick Test (Terminal)

```powershell
# 1. Login as admin
$body = @{username="admin"; password="pa55ward"} | ConvertTo-Json
$response = Invoke-WebRequest `
  -Uri "http://localhost:8080/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing

$json = $response.Content | ConvertFrom-Json
$token = $json.token

# 2. Get sessions with JWT token
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$sessions = Invoke-WebRequest `
  -Uri "http://localhost:8080/api/admin/sessions" `
  -Method GET `
  -Headers $headers `
  -UseBasicParsing

$sessions.Content | ConvertFrom-Json | Select-Object -ExpandProperty content
```

Expected output: Session data from database

### Browser Test

1. Go to `http://localhost/admin`
2. Login with `admin` / `pa55ward`
3. Should see dashboard with 1 session visible

---

## Deployment

### Docker Build

```bash
cd code-sharing-platform
docker-compose build frontend
docker-compose down
docker-compose up -d
```

### Verification

```bash
# Check frontend built
docker logs code-sharing-frontend | head -20

# Check backend running
docker logs code-sharing-backend | tail -10

# Test endpoints
docker ps  # Should show all containers running
```

---

## Rollback (If Needed)

If you need to revert these changes:

```bash
# Revert frontend code
git checkout frontend/src/store/sagas/authSaga.ts
git checkout frontend/src/store/slices/authSlice.ts
git checkout frontend/src/api/client.ts
git checkout frontend/src/types/redux.ts

# Rebuild
docker-compose build frontend
docker-compose up -d frontend
```

---

## Performance Impact

- **Login Time**: +1-2 additional HTTP call (REST JWT login) for admins only
- **Memory**: +~200 bytes for additional jwtToken in Redux state
- **Network**: One extra request for admin users during login
- **Overall**: Negligible impact

---

## Security Considerations

1. ✅ JWT tokens are stored in localStorage (acceptable for web apps)
2. ✅ Authorization header is used (not URL parameters)
3. ✅ Token validation happens on backend
4. ✅ JWT signature verification with HS512
5. ⚠️ TODO: Implement token refresh for expired tokens
6. ⚠️ TODO: Change default admin password in production
7. ⚠️ TODO: Consider HTTPS only for token transmission

---

## Related Documentation

- See [ADMIN_DASHBOARD_DEBUG_INVESTIGATION.md](./ADMIN_DASHBOARD_DEBUG_INVESTIGATION.md) for detailed debugging
- See [TESTING_AND_VALIDATION.md](./TESTING_AND_VALIDATION.md) for testing procedures
- See backend AdminAuthController for JWT generation details

---

## Questions?

Refer to the investigation document for complete technical details on:
- Why two authentication systems exist
- How they interact
- What each token is used for
- Complete authentication flow diagram

