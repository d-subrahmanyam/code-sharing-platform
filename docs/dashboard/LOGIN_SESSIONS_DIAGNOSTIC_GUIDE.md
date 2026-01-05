# Admin Dashboard Login & Sessions Issue - Complete Diagnostic Guide

## Issue Summary

**Reported Problems:**
1. Cannot login with `admin@example.com` / `admin123` credentials
2. Admin dashboard doesn't show recorded sessions from database
3. Database has sessions but they're not visible in the UI

## Root Cause Analysis

The system has TWO separate authentication paths and TWO user tables. If EITHER credential path fails, the dashboard won't display sessions.

### Authentication Architecture

```
Dual Authentication System
├── Path 1: GraphQL (Primary)
│   ├── Email-based login
│   ├── Checks users table first
│   ├── Falls back to admin_users table
│   └── Returns GraphQL token + user info
│
├── Path 2: REST JWT (Secondary - For Admin Only)
│   ├── Username-based login
│   ├── Checks both user tables
│   └── Returns JWT token for /admin/* endpoints
│
└── Admin Dashboard
    ├── Requires JWT from Path 2
    ├── Uses JWT to call /api/admin/sessions
    └── Displays session data
```

### Why Dashboard Shows Empty Sessions

The dashboard requires **BOTH** authentication paths to succeed:

1. ✅ **Must succeed**: GraphQL login with email + password
2. ✅ **Must succeed**: REST JWT token retrieval (triggered if user is ADMIN)
3. ✅ **Must succeed**: Sessions endpoint call with JWT token
4. ✅ **Must succeed**: Data in session_history table

**If ANY of these fail, dashboard will be empty even if sessions exist in database.**

## Diagnostic Procedure

### Step 1: Verify Database Initialization

Check if the admin user was actually created:

```bash
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
  -c "SELECT id, email, username, role, is_active FROM users WHERE email='admin@example.com';"
```

**Expected Output:**
```
                  id                  |       email       | username | role  | is_active
--------------------------------------+-------------------+----------+-------+-----------
 36cc89dc-4e10-4634-b910-09371a4fe9c0 | admin@example.com | admin    | ADMIN | t
(1 row)
```

**If NO rows returned:**
- The DataInitializer didn't run
- Container was not restarted after code deployment
- **Solution**: Restart backend container: `docker-compose restart backend`

### Step 2: Verify Password Hash in Database

```bash
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
  -c "SELECT email, substring(password_hash, 1, 20) as hash_preview FROM users WHERE email='admin@example.com';"
```

**Expected:**
- Password hash starts with `$2a$10$` (BCrypt format)
- Hash should be ~60 characters long

**If hash is missing or malformed:**
- Password wasn't properly encoded during initialization
- **Solution**: Delete user and restart: 
  ```bash
  docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
    -c "DELETE FROM users WHERE email='admin@example.com';"
  docker-compose restart backend
  ```

### Step 3: Test GraphQL Login

Test the GraphQL endpoint directly:

```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(email: \"admin@example.com\", password: \"admin123\") { success message token user { username email role } } }"
  }'
```

**Expected Response:**
```json
{
  "data": {
    "login": {
      "success": true,
      "message": "Login successful",
      "token": "eyJhbGc...",
      "user": {
        "username": "admin",
        "email": "admin@example.com",
        "role": "ADMIN"
      }
    }
  }
}
```

**If success=false:**
- Check backend logs: `docker logs code-sharing-backend | grep -i "login\|password"`
- Verify password encoder is working
- **Likely issue**: Password "admin123" doesn't match hash in database

### Step 4: Test REST JWT Endpoint

Once GraphQL login works, test the REST endpoint:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "expiresIn": 86400,
  "user": {
    "username": "admin",
    "role": "ADMIN"
  }
}
```

**If 401 Unauthorized:**
- AdminAuthController rejected credentials
- Check: Is user in users table with role=ADMIN?
- Check: Password matches BCrypt hash?

### Step 5: Test Sessions Endpoint

Using the JWT token from Step 4:

```bash
curl -H "Authorization: Bearer <JWT_TOKEN_FROM_STEP_4>" \
  http://localhost:8080/api/admin/sessions
```

**Expected Response:**
```json
[
  {
    "id": 3,
    "snippet_id": "test-snippet-001",
    "owner_username": "TestOwner",
    "session_status": "ACTIVE",
    ...
  }
]
```

**If 401/403:**
- JWT token is invalid or expired
- Go back to Step 4, get fresh token
- Verify token isn't truncated when copying

**If 200 OK but empty array []:**
- Sessions table is empty
- Check: `docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform -c "SELECT COUNT(*) FROM session_history;"`
- If 0 rows: Need to create sessions via collaboration feature

### Step 6: Test Frontend Login

1. Navigate to `http://localhost:3000/login`
2. Enter: `admin@example.com`
3. Enter: `admin123`
4. Click Login
5. Check browser console (F12) for errors
6. Check backend logs: `docker logs code-sharing-backend -f`

**If login button unresponsive:**
- Check console for JavaScript errors
- Check network tab - are requests being sent?
- Verify VITE_API_BASE_URL is correct in frontend

**If login succeeds but dashboard empty:**
- JWT token retrieval failed (check authSaga logs)
- Sessions endpoint returns 403
- Response parsing failed

## Common Issues & Solutions

### Issue 1: "User not found"

**Symptom**: Login shows "User not found" error

**Diagnosis**:
```bash
# Check if user exists
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
  -c "SELECT * FROM users WHERE email='admin@example.com';"
```

**Solutions**:
- **If user doesn't exist**: Restart backend to trigger DataInitializer
  ```bash
  docker-compose restart backend
  ```
- **If user exists but email is different**: Use correct email
  - Check actual email: `SELECT email FROM users WHERE username='admin';`

### Issue 2: "Invalid password"

**Symptom**: Email is recognized but password rejected

**Diagnosis**:
```bash
# Verify password hash exists
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
  -c "SELECT email, LENGTH(password_hash) as hash_length FROM users WHERE email='admin@example.com';"
```

**Expected**: hash_length should be ~60

**Solutions**:
- **If hash_length < 60**: Password wasn't properly encoded
  - Delete user and restart backend
  ```bash
  docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
    -c "DELETE FROM users WHERE email='admin@example.com';"
  docker-compose restart backend
  ```
- **If hash looks correct**: Try password exactly as defined in DataInitializer
  - Current password: `admin123`
  - Check file: `backend/src/main/java/com/codesharing/platform/config/DataInitializer.java`

### Issue 3: "Dashboard Empty But Sessions Exist"

**Symptom**: Login works, dashboard shows, but no sessions displayed

**Diagnosis**:
```bash
# Check sessions exist
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
  -c "SELECT COUNT(*) FROM session_history;"

# Check if JWT token is being generated
docker logs code-sharing-backend | grep "Login successful\|JWT"
```

**Solutions**:
1. **If sessions count = 0**: Create sessions first
   - Use the editor to create a snippet
   - Share it with another user
   - This creates a session record

2. **If JWT not generated**: Check authSaga in frontend
   - Verify ADMIN role is returned from GraphQL
   - Check browser Network tab for /auth/login request
   - Look for error in browser console

3. **If JWT generated but endpoint fails**: Token validation issue
   - Clear browser cookies: `Application → Cookies → Delete all`
   - Logout and login again
   - Get fresh JWT token

### Issue 4: "CORS or Connection Error"

**Symptom**: Frontend can't reach backend

**Diagnosis**:
```bash
# Check backend is accessible
curl -v http://localhost:8080/health

# Check frontend config
docker logs code-sharing-frontend | grep API_BASE_URL
```

**Solutions**:
- **If health check fails**: Backend not running
  ```bash
  docker-compose up -d backend
  ```
- **If API_BASE_URL wrong**: Update frontend environment
  - Check: `docker-compose.yml` → `VITE_API_BASE_URL`
  - Should be: `https://localhost/api` or `http://localhost:8080/api`

## Quick Fixes Checklist

Try these in order:

- [ ] **Step 1**: Restart backend
  ```bash
  docker-compose restart backend
  ```

- [ ] **Step 2**: Verify user exists
  ```bash
  docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
    -c "SELECT COUNT(*) FROM users WHERE email='admin@example.com';"
  ```

- [ ] **Step 3**: Clear browser cache and cookies
  - Open DevTools (F12)
  - Application → Storage → Clear All

- [ ] **Step 4**: Restart all containers
  ```bash
  docker-compose down
  docker-compose up -d
  ```

- [ ] **Step 5**: Check logs for errors
  ```bash
  docker logs code-sharing-backend --tail 50 | grep -i "error\|failed"
  docker logs code-sharing-frontend --tail 50 | grep -i "error"
  ```

## Expected Behavior After Fix

### Login Flow
1. ✅ Enter email `admin@example.com` and password `admin123`
2. ✅ Frontend sends GraphQL login mutation
3. ✅ Backend validates credentials against users table
4. ✅ GraphQL token returned to frontend
5. ✅ authSaga detects ADMIN role
6. ✅ authSaga calls REST /auth/login with username + password
7. ✅ REST endpoint validates and returns JWT token
8. ✅ Frontend stores JWT token
9. ✅ Redirect to /admin page

### Dashboard Display
1. ✅ Admin page loads
2. ✅ Frontend calls GET /api/admin/sessions with JWT in header
3. ✅ Backend validates JWT token
4. ✅ Sessions data retrieved from session_history table
5. ✅ Dashboard displays 1 session: "test-snippet-001"

## Files Modified During Diagnosis

**If you made changes:**
1. Revert database changes: `docker-compose down -v` (this deletes data!)
2. Restart containers fresh: `docker-compose up -d`
3. Wait for DataInitializer to run (~5 seconds)
4. Test login again

## Related Documentation

- [Authentication & Sessions Guide](./AUTHENTICATION_AND_SESSIONS.md)
- [Sessions Display Resolution](./SESSIONS_DISPLAY_RESOLUTION.md)
- Backend code: `backend/src/main/java/com/codesharing/platform/config/DataInitializer.java`
- Backend code: `backend/src/main/java/com/codesharing/platform/security/AdminBootstrapInitializer.java`

## Support

If issues persist:

1. **Collect debugging info**:
   ```bash
   echo "=== Users Table ===" 
   docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
     -c "SELECT email, username, role FROM users LIMIT 5;"
   
   echo "=== Admin Users Table ===" 
   docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
     -c "SELECT username, email FROM admin_users LIMIT 5;"
   
   echo "=== Sessions ===" 
   docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
     -c "SELECT COUNT(*) FROM session_history;"
   
   echo "=== Backend Logs ===" 
   docker logs code-sharing-backend --tail 30
   ```

2. **Check application status**:
   ```bash
   docker-compose ps
   docker exec code-sharing-backend curl -s http://localhost:8080/health
   ```

3. **Review configuration**:
   ```bash
   docker exec code-sharing-backend env | grep -i "SPRING\|JWT"
   ```
