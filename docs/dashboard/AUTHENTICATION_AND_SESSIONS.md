# Admin Dashboard Authentication & Sessions Guide

## Overview

The Code Sharing Platform has a dual authentication system to support both modern user registration and legacy admin accounts. This document explains how it works and how to troubleshoot common issues.

## Authentication Architecture

### Two User Tables

The system maintains two separate user tables:

#### 1. Regular Users Table (`users`)
- **Purpose**: Modern user registration and regular users
- **Admin User**: 
  - Email: `admin@example.com`
  - Password: `admin123`
  - Role: `ADMIN`
  - Status: Active
- **Used By**: User registration flow, GraphQL authentication
- **Access**: Admin dashboard (`/admin`) when role is ADMIN

#### 2. Legacy Admin Users Table (`admin_users`)
- **Purpose**: Legacy system admin accounts
- **Admin User**:
  - Username: `admin`
  - Email: `admin@codesharing.local`
  - Password: `pa55ward`
  - Role: ADMIN
  - Status: Active
- **Used By**: Legacy admin system, GraphQL authentication fallback
- **Access**: Admin dashboard (`/admin`) when role is ADMIN

### Authentication Flow

```
┌─────────────────────────────────────────┐
│         Frontend Login Page              │
│   (Input: email, password)              │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    GraphQL Login Mutation                │
│    (/api/graphql)                       │
│                                         │
│  1. Check users table first             │
│  2. Fall back to admin_users table      │
│  3. Return token + user info            │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ Success?       │
        └────┬───────────┘
             │
    ┌────────┴────────┐
    │                 │
    NO                YES
    │                 │
    ▼                 ▼
Error          ┌──────────────┐
               │Is ADMIN?     │
               └────┬─────────┘
                    │
                    ├─NO──→ Redirect to home
                    │
                    └─YES→ Fetch JWT Token
                         │
                         ▼
              ┌─────────────────────────┐
              │ REST Login Endpoint     │
              │ (/api/auth/login)       │
              │                         │
              │ Check both tables       │
              │ Verify password         │
              │ Return JWT token        │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │ Admin Dashboard         │
              │ (/admin)                │
              │                         │
              │ Uses JWT for            │
              │ /api/admin/sessions     │
              │ /api/admin/*            │
              └─────────────────────────┘
```

## How to Login

### Method 1: Using Regular User Admin Account (Recommended)

1. Go to login page
2. Email: `admin@example.com`
3. Password: `admin123`
4. Click Login
5. Automatically redirected to admin dashboard

### Method 2: Using Legacy Admin Account

1. Go to login page  
2. Email: `admin@codesharing.local` (NOTE: Use EMAIL, not username)
3. Password: `pa55ward`
4. Click Login
5. Automatically redirected to admin dashboard

## Admin Dashboard Features

### Sessions Display

The admin dashboard shows all recorded collaboration sessions from the `session_history` table.

**Current Sessions in Database:**
- Count: 1 session
- Snippet ID: `test-snippet-001`
- Owner: `TestOwner`
- Participants: 1
- Status: ACTIVE

### Accessing Sessions

1. **URL**: `http://localhost:3000/admin` (after login)
2. **Endpoint**: GET `/api/admin/sessions`
3. **Required**: Valid JWT token (obtained after GraphQL + REST login)
4. **Response**: Array of session records with full details

### Session Data Structure

```json
{
  "id": 3,
  "snippet_id": "test-snippet-001",
  "snippet_title": "Test Title",
  "snippet_language": "javascript",
  "owner_username": "TestOwner",
  "owner_email": "test@example.com",
  "owner_id": "test-owner",
  "participant_count": 1,
  "security_event_count": 0,
  "session_status": "ACTIVE",
  "created_at": "2026-01-04T17:26:00.557918Z",
  "updated_at": "2026-01-04T17:26:00.557918Z"
}
```

## Troubleshooting

### Issue: "Cannot Login" 

**Symptom**: Login button shows error or no response

**Solution**:
1. Verify you're using EMAIL (not username)
   - ❌ Wrong: `admin` / `pa55ward`
   - ✅ Correct: `admin@example.com` / `admin123`
   - ✅ Correct: `admin@codesharing.local` / `pa55ward`

2. Check database has admin user:
   ```bash
   docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
     -c "SELECT id, username, email, role FROM users WHERE role='ADMIN';"
   ```

3. Verify backend is running:
   ```bash
   docker ps | grep backend
   ```

### Issue: "Login Succeeds but Dashboard is Empty"

**Symptom**: Redirects to /admin but no sessions shown

**Possible Causes**:

1. **JWT Token Not Generated**
   - Backend logs show: "Failed to fetch JWT token for admin"
   - Solution: Restart backend
   - Check: `docker logs code-sharing-backend | grep JWT`

2. **Sessions Table Empty**
   - Solution: Need to create sessions via snippet collaboration
   - Verify: `docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform -c "SELECT COUNT(*) FROM session_history;"`

3. **API Endpoint Not Responding**
   - Check backend health: `curl http://localhost:8080/health`
   - Check endpoint: `curl -H "Authorization: Bearer TOKEN" http://localhost:8080/api/admin/sessions`

### Issue: "Wrong Password" Error

**Symptom**: "Authentication failed" message after login attempt

**Solution**:
1. Verify correct password for chosen email:
   - `admin@example.com` uses password `admin123`
   - `admin@codesharing.local` uses password `pa55ward`

2. Check password in database (BCrypt hash):
   ```bash
   docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
     -c "SELECT username, email FROM users WHERE email='admin@example.com';"
   ```

### Issue: "No Admin Role" Error

**Symptom**: Login succeeds but cannot access dashboard

**Solution**:
1. Verify user has ADMIN role:
   ```bash
   docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
     -c "SELECT email, role FROM users WHERE email='admin@example.com';"
   ```

2. Expected output: `admin@example.com | ADMIN`

## Backend API Endpoints

### Authentication Endpoints

#### GraphQL Login (Primary)
- **URL**: `POST /api/graphql`
- **Query**: `login(email: String!, password: String!)`
- **Returns**: 
  ```json
  {
    "token": "eyJhbGci...",
    "user": {
      "id": "...",
      "username": "admin",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
  ```

#### REST JWT Login (Secondary)
- **URL**: `POST /api/auth/login`
- **Body**: 
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Returns**:
  ```json
  {
    "token": "eyJhbGci...",
    "expiresIn": 86400,
    "user": {
      "username": "admin",
      "role": "ADMIN"
    }
  }
  ```

### Admin Endpoints

#### Get All Sessions
- **URL**: `GET /api/admin/sessions`
- **Required Header**: `Authorization: Bearer <JWT_TOKEN>`
- **Returns**: Array of session records

#### Example Request
```bash
curl -H "Authorization: Bearer eyJhbGci..." \
  http://localhost:8080/api/admin/sessions
```

## Code Changes Made

### AdminAuthController.java
**File**: `backend/src/main/java/com/codesharing/platform/controller/AdminAuthController.java`

**Change**: Updated to support both user tables

**Before**:
```java
// Only checked admin_users table
AdminUser admin = adminUserService.authenticate(username, password);
```

**After**:
```java
// Check both tables:
// 1. Try admin_users table first
// 2. Fall back to users table with ADMIN role
// 3. Return JWT from whoever authenticates
```

### authSaga.ts
**File**: `frontend/src/store/sagas/authSaga.ts`

**Feature**: Dual authentication workflow

1. GraphQL login with email + password
2. If user is ADMIN, fetch JWT token from REST endpoint
3. Store both tokens for API requests
4. REST endpoints use JWT, GraphQL endpoints use GraphQL token

## Security Notes

- **Passwords**: Both admin accounts use different passwords (important!)
- **Tokens**: JWT tokens expire after 24 hours (86400 seconds)
- **Password Encoding**: BCrypt with salt (production-ready)
- **Email-Based Login**: Supports modern email-based authentication
- **Legacy Support**: Maintains support for legacy username-based admin accounts

## References

- [Admin Dashboard Implementation](../dashboard/ADMIN_DASHBOARD_IMPLEMENTATION.md)
- [Authentication Architecture](../ARCHITECTURE.md)
- [Session History Schema](../database/SCHEMA.md)

## Support

For issues with authentication:
1. Check the logs: `docker logs code-sharing-backend`
2. Verify credentials: Check both user tables
3. Test endpoints separately (GraphQL first, then REST)
4. Restart backend if JWT generation fails
