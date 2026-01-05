# Login & Sessions Debugging - Visual Reference

## Current System State

### Database Users

#### users table (Regular Users)
```
ID                                     | username | email              | role  | password_hash
---------------------------------------|----------|-------------------|-------|------------------
36cc89dc-4e10-4634-b910-09371a4fe9c0 | admin    | admin@example.com  | ADMIN | $2a$10$F2mcsD... (admin123)
c357cab6-8926-44c8-93cf-c87e9a2f2fe2 | demo     | demo@example.com   | USER  | $2a$10$<hash>... (demo123)
```

#### admin_users table (Legacy Admin)
```
ID | username | email                    | password_hash
---+----------+--------------------------+------------------
1  | admin    | admin@codesharing.local  | $2a$10$Vtemhc... (pa55ward)
```

#### session_history table
```
id | snippet_id       | owner_username | participant_count | session_status
---+------------------+----------------+-------------------+----------------
3  | test-snippet-001 | TestOwner      | 1                 | ACTIVE
```

### Authentication Paths

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LOGIN PAGE                                         │
│                    (http://localhost:3000/login)                            │
│                                                                              │
│  Input Fields:                                                              │
│  ┌────────────────────────────┐     ┌────────────────────────────┐        │
│  │ Email/Username             │     │ Password                   │        │
│  │ [                        ] │     │ [                        ] │        │
│  └────────────────────────────┘     └────────────────────────────┘        │
│                                                                              │
│  Option 1:           Option 2:          Option 3:                          │
│  admin@example.com   admin@codesharing.local                              │
│  admin123            pa55ward                                              │
└─────────────────────────────────────────────────────────────────────────────┘
         │                    │                     │
         │ (Option 1)         │ (Option 2)          │ (WRONG)
         │                    │                     │
         ▼                    ▼                     ▼
    ┌─────────┐          ┌─────────┐          ┌──────────┐
    │ GraphQL │          │ GraphQL │          │ ERROR    │
    │ Login   │          │ Login   │          │ User not │
    │ ✅ Works│          │ ✅ Works│          │ found    │
    └────┬────┘          └────┬────┘          └──────────┘
         │                    │
         ├─────────┬──────────┤
         │         │          │
         │    Check users table
         │    (by email)
         │         │
         │    ┌────▼────┐
         │    │ Found   │
         │    │ admin   │
         │    │ @ex.com │
         │    └────┬────┘
         │         │
         │    Check password
         │    "admin123" vs
         │    hash in DB
         │         │
         │    ┌────▼────┐
         │    │ Match ✓ │
         │    └────┬────┘
         │         │
         │    Return:
         │    - token (GraphQL)
         │    - username: admin
         │    - email: admin@example.com
         │    - role: ADMIN
         │         │
         └─────────┴─────────────────────────────┐
                                                 ▼
                    ┌────────────────────────────────────┐
                    │ authSaga checks role               │
                    │                                    │
                    │ If role === ADMIN:                 │
                    │   Call REST /auth/login            │
                    │   with username + password         │
                    └────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────────────┐
                    │ REST /api/auth/login               │
                    │ (AdminAuthController)              │
                    │                                    │
                    │ Input:                             │
                    │ - username: "admin"                │
                    │ - password: "admin123"             │
                    │                                    │
                    │ Check admin_users table first      │
                    │   No match (expects pa55ward)      │
                    │                                    │
                    │ Check users table with ADMIN role  │
                    │   ✅ Found: admin with admin123    │
                    │   ✅ Password matches              │
                    │                                    │
                    │ Return:                            │
                    │ - token (JWT - HSA512)             │
                    │ - expiresIn: 86400                 │
                    │ - username: admin                  │
                    │ - role: ADMIN                      │
                    └────────┬───────────────────────────┘
                             │
                             ▼
                    ┌────────────────────────────────────┐
                    │ Store tokens in Redux:             │
                    │ - graphqlToken: eyJhbGci...        │
                    │ - jwtToken: eyJhbGci...            │
                    │                                    │
                    │ Redirect to /admin                 │
                    └────────┬───────────────────────────┘
                             │
                             ▼
                    ┌────────────────────────────────────┐
                    │ Admin Dashboard (/admin)           │
                    │                                    │
                    │ Load sessions:                     │
                    │ GET /api/admin/sessions            │
                    │ Header:                            │
                    │ Authorization: Bearer <jwtToken>   │
                    │                                    │
                    │ Backend validates JWT:             │
                    │ ✅ Signature valid                 │
                    │ ✅ Not expired                     │
                    │ ✅ Role is ADMIN                   │
                    │                                    │
                    │ Query session_history table        │
                    │ Return 1 session:                  │
                    │ {                                  │
                    │   id: 3,                           │
                    │   snippet_id: "test-snippet-001",  │
                    │   owner: "TestOwner",              │
                    │   status: "ACTIVE",                │
                    │   ...                              │
                    │ }                                  │
                    │                                    │
                    │ Display on dashboard:              │
                    │ ✅ 1 active session shown          │
                    └────────────────────────────────────┘
```

## Failure Points & Symptoms

### Failure Point 1: GraphQL Login
```
Symptom: Can't proceed past login page

Possible Causes:
├─ Email field empty
├─ Password field empty
├─ User doesn't exist in database
│  └─ Symptom: "User not found"
├─ Password doesn't match hash
│  └─ Symptom: "Invalid password"
└─ GraphQL endpoint not accessible
   └─ Symptom: Network error / timeout

Check:
- Database: SELECT COUNT(*) FROM users WHERE email='admin@example.com';
- Logs: docker logs code-sharing-backend | grep login
- Network: Browser DevTools → Network tab
```

### Failure Point 2: REST JWT Endpoint
```
Symptom: Login succeeds but dashboard is empty

Possible Causes:
├─ User is not ADMIN (shouldn't happen)
├─ REST endpoint throws error
│  └─ Check logs: "Failed to fetch JWT"
├─ Endpoint returns 401 Unauthorized
│  └─ Username not found in either table
├─ Endpoint returns 403 Forbidden
│  └─ User found but not ADMIN
└─ Network error
   └─ endpoint unreachable

Check:
- Admin role: SELECT role FROM users WHERE email='admin@example.com';
- Logs: docker logs code-sharing-backend | grep "REST\|admin"
- Manual test: curl -X POST http://localhost:8080/api/auth/login ...
```

### Failure Point 3: Sessions Endpoint
```
Symptom: JWT token obtained but dashboard empty

Possible Causes:
├─ JWT token not sent in request
│  └─ Browser DevTools → Network → check Authorization header
├─ JWT token invalid/expired
│  └─ Symptom: 401 Unauthorized response
├─ JWT token valid but no permission
│  └─ Symptom: 403 Forbidden
└─ Sessions table empty (not a failure)
   └─ No sessions recorded yet

Check:
- Sessions exist: SELECT COUNT(*) FROM session_history;
- Token valid: Check expiration time in JWT
- Logs: docker logs code-sharing-backend | grep sessions
```

### Failure Point 4: Sessions Display
```
Symptom: Endpoint returns 200 OK but no sessions displayed

Possible Causes:
├─ Response is empty array []
│  └─ No sessions recorded (run editor collaboration to create)
├─ Frontend parsing error
│  └─ Check console for JavaScript errors
├─ Sessions exist but filtered out
│  └─ Check dashboard filter settings
└─ CORS error (shouldn't happen internally)
   └─ Check browser console

Check:
- Sessions in DB: SELECT * FROM session_history;
- Response: Use curl to see raw JSON
- Console: Browser DevTools → Console tab
```

## Expected Token Format

### GraphQL Token (JWT)
```
Header: {
  "alg": "HS512"
}

Payload: {
  "sub": "admin",
  "role": "ADMIN",
  "iat": 1704429600
}

Signature: HMAC-SHA512
```

### REST JWT Token (JWT)
```
Header: {
  "alg": "HS512"
}

Payload: {
  "sub": "admin",
  "role": "ADMIN",
  "iat": 1704429600,
  "exp": 1704516000
}

Signature: HMAC-SHA512
```

## Browser DevTools Inspection

### Network Tab
```
Look for these requests in order:

1. POST http://localhost:8080/graphql
   Request body:
   {
     "query": "mutation { login(email: \"admin@example.com\", password: \"admin123\") ... }"
   }
   Response: 200 OK with token and user

2. POST http://localhost:8080/api/auth/login
   Request body:
   {
     "username": "admin",
     "password": "admin123"
   }
   Response: 200 OK with JWT token

3. GET http://localhost:8080/api/admin/sessions
   Request headers:
   Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
   Response: 200 OK with sessions array

4. Page redirects to /admin
```

### Console Tab
```
Expected messages:
✅ No errors
✅ No 404s
✅ No CORS warnings

Possible errors:
❌ "Failed to fetch" - Network issue
❌ "Cannot read property of undefined" - JS parsing error
❌ "CORS error" - Origin not allowed
❌ "Unexpected token" - JSON parsing error
```

### Application Tab
```
Check localStorage:
- auth_token (GraphQL token)
- jwt_token (REST JWT token)

Check cookies:
- Should have session cookie from backend
- Check expiration time
```

## Quick Status Check

To verify current state, run:

```bash
# Database check
echo "=== Checking Users ==="
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
  -c "SELECT email, username, role FROM users WHERE role='ADMIN' LIMIT 1;"

# Sessions check
echo "=== Checking Sessions ==="
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
  -c "SELECT COUNT(*) as session_count FROM session_history;"

# Container check
echo "=== Checking Containers ==="
docker-compose ps

# Backend health
echo "=== Checking Backend Health ==="
docker exec code-sharing-backend curl -s http://localhost:8080/health 2>/dev/null || echo "Not responding"

# Recent logs
echo "=== Recent Backend Logs ==="
docker logs code-sharing-backend --tail 20
```

## Reset to Known Good State

If stuck, execute this recovery script:

```bash
#!/bin/bash

echo "Resetting system to known good state..."

# 1. Stop containers
docker-compose down

# 2. Remove and recreate database
docker volume rm code-sharing-platform_postgres_data 2>/dev/null || true

# 3. Start fresh
docker-compose up -d

# 4. Wait for initialization
sleep 15

# 5. Verify
echo "Verification:"
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
  -c "SELECT email FROM users WHERE role='ADMIN'; SELECT COUNT(*) FROM session_history;"

echo "System ready. Try login with admin@example.com / admin123"
```

## Testing Credentials Matrix

| Email | Password | Table | Expected Result |
|-------|----------|-------|-----------------|
| admin@example.com | admin123 | users | ✅ ADMIN access |
| admin@codesharing.local | pa55ward | admin_users | ✅ ADMIN access |
| admin@example.com | pa55ward | users | ❌ Invalid password |
| admin@codesharing.local | admin123 | admin_users | ❌ Invalid password |
| unknown@test.com | password | - | ❌ User not found |
| demo@example.com | demo123 | users | ⚠️ USER access (can't see admin panel) |

## Metrics to Monitor

After login:
- ✅ Token obtained within 500ms
- ✅ Redirect to /admin within 1s
- ✅ Sessions load within 2s
- ✅ Dashboard displays within 5s

If any take longer:
- Check network latency
- Check database query performance
- Check backend logs for slow queries
