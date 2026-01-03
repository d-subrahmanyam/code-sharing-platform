# Admin Dashboard Authentication - Quick Reference

## Login Flow (3 Steps)

### Step 1: Send Login Request
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "pa55ward"
}
```

### Step 2: Receive JWT Token
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTY3MjU3NDQwMCwiZXhwIjoxNjcyNjYwODAwfQ.signature",
  "username": "admin",
  "fullName": "System Administrator",
  "roleName": "ADMIN",
  "expiresIn": 86400000
}
```

### Step 3: Use Token in Protected Requests
```bash
GET /api/admin/sessions
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

## Credentials

| Field | Value | Note |
|-------|-------|------|
| Username | admin | ⚠️ Change in production |
| Password | pa55ward | ⚠️ Change in production |
| Role | ADMIN | Full access |

## Available Roles

| Role | Permissions |
|------|-------------|
| ADMIN | View sessions, manage users, create/update/delete users |
| OWNER | View sessions only (read-only) |

## API Endpoints

### Public (No Token Required)
```
POST   /api/auth/login          Login and get token
GET    /api/admin/health        Health check
```

### Admin Only (Token Required)
```
POST   /api/admin/users         Create new user
GET    /api/admin/users         List all users
PUT    /api/admin/users/{id}/role   Change user role
DELETE /api/admin/users/{id}    Deactivate user
```

### Admin & Owner (Token Required)
```
GET    /api/admin/sessions               List sessions (paginated, 25/page)
GET    /api/admin/sessions/{snippetId}   Get session details
```

## Create New User

```bash
# 1. Login as admin first
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"pa55ward"}' | jq -r '.token')

# 2. Create new OWNER user
curl -X POST http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "SecurePass123!",
    "fullName": "John Doe",
    "email": "john@example.com",
    "roleName": "OWNER"
  }'

# Response:
# {
#   "message": "User created successfully",
#   "username": "john"
# }

# 3. New user can now login with john/SecurePass123!
```

## List All Users

```bash
TOKEN="eyJhbGciOiJIUzUxMiJ9..."

curl -X GET http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer $TOKEN"

# Response:
# [
#   {
#     "id": 1,
#     "username": "admin",
#     "fullName": "System Administrator",
#     "email": "admin@codesharing.local",
#     "roleName": "ADMIN",
#     "isActive": true,
#     "createdAt": "2026-01-02T10:30:00",
#     "lastLoginAt": "2026-01-02T15:45:00"
#   },
#   {
#     "id": 2,
#     "username": "john",
#     "fullName": "John Doe",
#     "email": "john@example.com",
#     "roleName": "OWNER",
#     "isActive": true,
#     "createdAt": "2026-01-02T11:00:00",
#     "lastLoginAt": null
#   }
# ]
```

## Change User Role (ADMIN → OWNER)

```bash
TOKEN="eyJhbGciOiJIUzUxMiJ9..."

curl -X PUT http://localhost:8080/api/admin/users/2/role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roleName": "ADMIN"}'

# Response:
# {
#   "message": "User role updated successfully"
# }
```

## Deactivate User Account

```bash
TOKEN="eyJhbGciOiJIUzUxMiJ9..."

curl -X DELETE http://localhost:8080/api/admin/users/2 \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "message": "User account deactivated successfully"
# }
```

## Get Sessions List

```bash
TOKEN="eyJhbGciOiJIUzUxMiJ9..."

# Default: page 0, size 25, sorted by creation date (latest first)
curl -X GET "http://localhost:8080/api/admin/sessions?page=0&size=25" \
  -H "Authorization: Bearer $TOKEN"

# With search
curl -X GET "http://localhost:8080/api/admin/sessions?search=javascript&page=0&size=25" \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "content": [
#     {
#       "sessionId": "uuid-1",
#       "snippetId": "snippet-1",
#       "ownerUsername": "user1",
#       "ownerEmail": "user1@example.com",
#       "isOwnerAnonymous": false,
#       "createdAt": "2026-01-02T10:30:00",
#       "duration": "2h 34m",
#       "participantCount": 3,
#       "securityEventCount": 2,
#       "sessionStatus": "ACTIVE"
#     }
#   ],
#   "totalElements": 42,
#   "totalPages": 2,
#   "currentPage": 0,
#   "pageSize": 25
# }
```

## Get Session Details (Drill-down)

```bash
TOKEN="eyJhbGciOiJIUzUxMiJ9..."

curl -X GET "http://localhost:8080/api/admin/sessions/snippet-1" \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "sessionId": "uuid-1",
#   "snippetId": "snippet-1",
#   "owner": {
#     "username": "user1",
#     "email": "user1@example.com"
#   },
#   "participants": [
#     {
#       "username": "user2",
#       "ipAddress": "192.168.1.100",
#       "browserInfo": "Chrome 120.0.0.0 on Windows 10",
#       "joinedAt": "2026-01-02T10:35:00",
#       "duration": "2h 29m"
#     }
#   ],
#   "securityEvents": [
#     {
#       "eventType": "COPY_ATTEMPT",
#       "timestamp": "2026-01-02T11:00:00",
#       "byUser": "user2"
#     }
#   ],
#   "urls": {
#     "ownerUrl": "http://localhost:5173/editor/abc123",
#     "joineeUrl": "http://localhost:5173/join/abc123"
#   }
# }
```

## Error Responses

### Invalid Credentials (401)
```json
{
  "error": "Invalid username or password"
}
```

### Missing Token (401)
```json
{
  "error": "Missing or invalid Authorization header"
}
```

### Invalid Token (401)
```json
{
  "error": "Invalid or expired token"
}
```

### Forbidden - Not Admin (403)
```json
{
  "error": "Only ADMIN users can create new users"
}
```

### Not Found (404)
```json
{
  "error": "Session not found"
}
```

## Configuration

### Default (Development)
```properties
jwt.secret=admin-dashboard-secret-key-change-in-production
jwt.expiration=86400000
```

### Production (Required)
```properties
jwt.secret=<strong-random-key-32-characters-minimum>
jwt.expiration=86400000
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid username or password" | Verify credentials are correct (admin/pa55ward) |
| "Invalid or expired token" | Token may have expired (24h), login again |
| "Missing or invalid Authorization header" | Include header: `Authorization: Bearer <token>` |
| "Only ADMIN users can..." | User role is not ADMIN, contact admin |
| Database tables missing | Application auto-creates tables on startup |

## Security Notes

- ✅ Passwords are hashed with BCrypt (not reversible)
- ✅ Tokens are signed with HMAC-SHA512
- ✅ Tokens expire after 24 hours
- ✅ All admin endpoints require token
- ⚠️ Always use HTTPS in production
- ⚠️ Change default admin password in production
- ⚠️ Keep JWT secret secure

## Next Steps

1. Test authentication with curl commands above
2. Build frontend login page
3. Store token in browser (localStorage/sessionStorage)
4. Add token to all admin requests
5. Implement logout to clear token
6. Build user management UI
7. Deploy to production with updated passwords

## Files Location

Configuration:
- `application.properties` - JWT secret and expiration

Code:
- `backend/src/main/java/com/codesharing/platform/security/` - Security classes
- `backend/src/main/java/com/codesharing/platform/controller/` - Auth controllers
- `backend/src/main/java/com/codesharing/platform/dto/` - Request/response DTOs

Documentation:
- `docs/dashboard/AUTHENTICATION_AUTHORIZATION.md` - Full guide
- `docs/dashboard/ADMIN_DATABASE_SETUP.md` - Database setup
- `docs/dashboard/AUTHENTICATION_IMPLEMENTATION.md` - Implementation details
