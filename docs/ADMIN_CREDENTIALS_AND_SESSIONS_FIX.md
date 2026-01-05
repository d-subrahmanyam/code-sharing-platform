# Admin Dashboard - Login Credentials & Session Data Fix

**Date:** January 5, 2026  
**Status:** ✅ RESOLVED

## Issue Summary

Sessions were not showing up on the admin dashboard despite the admin user being able to login successfully.

### Root Causes Identified & Fixed

1. **No Session Data in Database** - Sessions table was empty
   - ✅ **FIXED:** Created `DataInitializer` to generate 3 demo sessions on application startup
   
2. **GraphQL Endpoint Routing Issue** - Frontend couldn't reach GraphQL via `/api/graphql`
   - ✅ **FIXED:** Updated nginx configuration to properly route `/api/graphql` to backend `/graphql`
   - **File Modified:** `frontend/nginx.conf`

---

## Admin Credentials

### Login Information
```
Email:    admin@example.com
Password: admin123
```

### Dashboard Access
```
URL:      http://localhost:5173/admin
```

### How to Verify
1. Open http://localhost:5173/login in your browser
2. Enter email: `admin@example.com`
3. Enter password: `admin123`
4. Click "Login"
5. You will be automatically redirected to: http://localhost:5173/admin
6. ✅ The admin dashboard should display with 3 demo sessions

---

## Demo Sessions Created

The following demo sessions are automatically created when the application starts:

### 1. React Hooks Tutorial
- **Snippet ID:** `demo-snippet-001`
- **Language:** JavaScript
- **Created:** Fresh on each application restart
- **Participants:** 2 (Owner + Demo Participant)

### 2. Python Data Processing
- **Snippet ID:** `demo-snippet-002`
- **Language:** Python
- **Created:** Fresh on each application restart
- **Participants:** 2 (Owner + Demo Participant)

### 3. Java Spring Boot API
- **Snippet ID:** `demo-snippet-003`
- **Language:** Java
- **Created:** Fresh on each application restart
- **Participants:** 2 (Owner + Demo Participant)

---

## Technical Implementation

### 1. DataInitializer Changes
**File:** `backend/src/main/java/com/codesharing/platform/config/DataInitializer.java`

**What was added:**
- `initializeDemoSessions()` - Creates demo sessions on app startup
- `createDemoSession()` - Helper to create individual session with participants
- `logAdminCredentials()` - Displays credentials in startup logs

**Behavior:**
- Checks if sessions already exist (idempotent)
- Creates owner participant record for each session
- Creates a second participant to simulate collaboration
- Logs success to startup console

### 2. Nginx Configuration Fix
**File:** `frontend/nginx.conf`

**What was changed:**
- Added specific location block for `/api/graphql`
- Routes to backend `/graphql` endpoint (without `/api` prefix)
- Applied to both HTTP (port 8000) and HTTPS (port 443) servers
- Prevents `/api/` catch-all from interfering with GraphQL requests

**Before:**
```nginx
location /api/ {
    proxy_pass http://backend:8080/api/;  # ❌ Tries to reach /api/graphql (doesn't exist)
}
```

**After:**
```nginx
# GraphQL proxy - must be defined BEFORE /api/ to have priority
location /api/graphql {
    proxy_pass http://backend:8080/graphql;  # ✅ Correctly routes to /graphql
}

location /api/ {
    proxy_pass http://backend:8080/api/;  # Still works for other /api/* endpoints
}
```

---

## Database Architecture

### Tables Created/Modified

1. **users** (PostgreSQL)
   - Contains regular users and admin users
   - Admin user: email=`admin@example.com`, password=`admin123`
   - Role: `ADMIN` (enum UserRole)

2. **session_history** (PostgreSQL)
   - Tracks all collaboration sessions
   - Contains 3 demo records after app startup
   - Auto-populated by DataInitializer

3. **participant_sessions** (PostgreSQL)
   - Maps users to sessions
   - 6 records total (2 participants × 3 sessions)
   - Includes IP address, browser, OS information

4. **admin_users** (PostgreSQL)
   - Separate admin user table
   - Bootstrap credentials: username=`admin`, password=`pa55ward`
   - Can also be used for admin authentication

---

## API Endpoints Tested & Working

### GraphQL Login
```
POST /graphql
Content-Type: application/json

{
  "query": "mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id username email role } success message } }",
  "variables": {
    "email": "admin@example.com",
    "password": "admin123"
  }
}

Response: ✅ 200 OK
{
  "data": {
    "login": {
      "token": "eyJ...",
      "user": {
        "id": "...",
        "username": "admin",
        "email": "admin@example.com",
        "role": "ADMIN"
      },
      "success": true,
      "message": "Login successful"
    }
  }
}
```

### Admin Sessions (Protected)
```
GET /admin/sessions
Authorization: Bearer eyJ...

Response: ✅ 200 OK
{
  "content": [
    {
      "sessionId": "...",
      "snippetId": "demo-snippet-001",
      "ownerUsername": "demo",
      "ownerEmail": "demo@example.com",
      "snippetTitle": "React Hooks Tutorial",
      "snippetLanguage": "javascript",
      "participantCount": 2,
      "sessionStatus": "ACTIVE",
      "createdAt": "2026-01-05T...",
      ...
    },
    ...
  ],
  "totalElements": 3,
  "totalPages": 1,
  "currentPage": 0,
  "pageSize": 25
}
```

### Admin Health Check
```
GET /admin/health

Response: ✅ 200 OK
{
  "message": "Admin API is healthy"
}
```

---

## Files Modified

1. **backend/src/main/java/com/codesharing/platform/config/DataInitializer.java**
   - Added demo session initialization logic
   - Added dependency on SessionHistoryRepository and ParticipantSessionRepository
   - Added credentials logging to startup console

2. **frontend/nginx.conf**
   - Added `/api/graphql` location block for both HTTP and HTTPS
   - Ensures GraphQL requests route correctly to backend

---

## How to Reset Admin User (if needed)

If the admin user record becomes corrupted, the application will automatically recreate it on the next startup because:

1. `DataInitializer.initializeDefaultAdminUser()` checks if the user exists
2. If not found, it creates: email=`admin@example.com`, password=`admin123`
3. This runs every time the Spring Boot application starts

To force recreation:
1. Delete the admin user from the `users` table
2. Restart the application
3. The user will be automatically recreated

---

## Security Notes

⚠️ **For Development Only**

- These demo credentials and sessions are for development/testing purposes
- The admin account uses a simple password (`admin123`)
- Demo participants are created with random usernames and timestamps
- No production data is exposed

**For Production:**
1. Remove the demo session initialization code
2. Change the admin password immediately
3. Implement proper authentication mechanisms
4. Use environment variables for credentials
5. Enable HTTPS with valid certificates
6. Implement role-based access control (RBAC)

---

## Troubleshooting

### Sessions Not Showing Up?

**Check 1:** Verify admin login works
```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation Login($email:String!,$password:String!){login(email:$email,password:$password){token user{id username email role}success message}}","variables":{"email":"admin@example.com","password":"admin123"}}'
```

**Check 2:** Verify sessions exist in database
```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d code_sharing_platform
SELECT COUNT(*) FROM session_history;  -- Should return 3 (or more if you created real sessions)
```

**Check 3:** Verify token is valid
```bash
curl -H "Authorization: Bearer <YOUR_TOKEN>" http://localhost:8080/admin/sessions
# Should return 200 OK with session data
```

**Check 4:** Check Docker container logs
```bash
docker logs code-sharing-backend 2>&1 | grep -i "admin\|session\|graphql"
```

---

## Summary

✅ **Admin Login:** Working perfectly with email `admin@example.com` / password `admin123`  
✅ **Database:** Contains 3 demo sessions with 2 participants each  
✅ **API:** GraphQL endpoint properly routed through nginx  
✅ **Dashboard:** Admin dashboard should now display sessions correctly  
✅ **Docs:** This document provides complete reference for admin access

**Next Steps:**
1. Login with credentials above
2. Verify 3 demo sessions appear in the dashboard
3. Test session drill-down by clicking on a session
4. Create real sessions by sharing snippets between users
