# Admin Dashboard Authentication & Authorization

## Overview

The admin dashboard is protected with JWT-based authentication and role-based access control (RBAC). This system allows:

1. **Secure login** with username and password
2. **JWT token generation** for stateless authentication
3. **Role-based access control** with ADMIN and OWNER roles
4. **User management** to add more users with different roles

## Architecture

### Authentication Flow

```
Client (Browser)
    ↓
POST /api/auth/login (username, password)
    ↓
AuthController validates credentials
    ↓
AdminUserService authenticates using BCrypt password hashing
    ↓
JwtUtil generates JWT token
    ↓
LoginResponseDTO returns token + user info
    ↓
Client stores token in localStorage/sessionStorage
    ↓
Client sends token in Authorization header for subsequent requests
    ↓
JwtAuthenticationInterceptor validates token
    ↓
If valid: request proceeds to controller
If invalid/expired: return 401 Unauthorized
```

### Role-Based Access Control (RBAC)

```
┌─────────────────┐
│   JWT Token     │
│  Contains Role  │
└────────┬────────┘
         │
         ├─→ ADMIN Role
         │   ├─ View all sessions (/api/admin/sessions)
         │   ├─ View session details (/api/admin/sessions/:id)
         │   ├─ Create new users (/api/admin/users)
         │   ├─ List all users (/api/admin/users)
         │   ├─ Update user roles (/api/admin/users/:id/role)
         │   └─ Deactivate users (/api/admin/users/:id)
         │
         └─→ OWNER Role
             ├─ View all sessions (/api/admin/sessions)
             ├─ View session details (/api/admin/sessions/:id)
             └─ No user management access
```

## Database Schema

### admin_roles Table
```sql
admin_roles
├── id (PK)
├── role_type (ENUM: ADMIN, OWNER) - unique
├── description (VARCHAR 255)
└── created_at (TIMESTAMP)
```

### admin_users Table
```sql
admin_users
├── id (PK)
├── username (VARCHAR 100) - unique
├── password_hash (VARCHAR 255)
├── full_name (VARCHAR 255)
├── email (VARCHAR 255) - unique
├── role_id (FK → admin_roles.id)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── last_login_at (TIMESTAMP)
```

## API Endpoints

### 1. Authentication Endpoints

#### Login
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "username": "admin",
  "password": "pa55ward"
}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "username": "admin",
  "fullName": "System Administrator",
  "roleName": "ADMIN",
  "expiresIn": 86400000
}

Response (401 Unauthorized):
{
  "error": "Invalid username or password"
}
```

### 2. User Management Endpoints (ADMIN only)

#### Create User
```
POST /api/admin/users
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "username": "john_owner",
  "password": "SecurePass123!",
  "fullName": "John Owner",
  "email": "john@example.com",
  "roleName": "OWNER"
}

Response (201 Created):
{
  "message": "User created successfully",
  "username": "john_owner"
}

Response (403 Forbidden):
{
  "error": "Only ADMIN users can create new users"
}

Response (400 Bad Request):
{
  "error": "Username 'john_owner' already exists"
}
```

#### List All Users
```
GET /api/admin/users
Authorization: Bearer <token>

Response (200 OK):
[
  {
    "id": 1,
    "username": "admin",
    "fullName": "System Administrator",
    "email": "admin@codesharing.local",
    "roleName": "ADMIN",
    "roleDescription": "Full access to admin dashboard, can manage users and view all sessions",
    "isActive": true,
    "createdAt": "2026-01-02T10:30:00",
    "updatedAt": "2026-01-02T15:45:00",
    "lastLoginAt": "2026-01-02T15:45:00"
  },
  {
    "id": 2,
    "username": "john_owner",
    "fullName": "John Owner",
    "email": "john@example.com",
    "roleName": "OWNER",
    "roleDescription": "View-only access to admin dashboard, can only view sessions",
    "isActive": true,
    "createdAt": "2026-01-02T11:00:00",
    "updatedAt": "2026-01-02T11:00:00",
    "lastLoginAt": null
  }
]

Response (403 Forbidden):
{
  "error": "Only ADMIN users can view user list"
}
```

#### Update User Role
```
PUT /api/admin/users/{userId}/role
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "roleName": "ADMIN"
}

Response (200 OK):
{
  "message": "User role updated successfully"
}

Response (403 Forbidden):
{
  "error": "Only ADMIN users can update user roles"
}

Response (400 Bad Request):
{
  "error": "User with ID 999 not found"
}
```

#### Deactivate User
```
DELETE /api/admin/users/{userId}
Authorization: Bearer <token>

Response (200 OK):
{
  "message": "User account deactivated successfully"
}

Response (403 Forbidden):
{
  "error": "Only ADMIN users can deactivate accounts"
}

Response (400 Bad Request):
{
  "error": "User with ID 999 not found"
}
```

### 3. Dashboard Endpoints (Protected - ADMIN & OWNER)

#### List All Sessions
```
GET /api/admin/sessions?page=0&size=25&search=keyword
Authorization: Bearer <token>

Response (200 OK):
{
  "content": [
    {
      "sessionId": "uuid-1",
      "snippetId": "snippet-1",
      "ownerUsername": "user1",
      "ownerEmail": "user1@example.com",
      "isOwnerAnonymous": false,
      "createdAt": "2026-01-02T10:30:00",
      "endedAt": null,
      "duration": "2h 34m",
      "snippetTitle": "My Code Snippet",
      "snippetLanguage": "javascript",
      "participantCount": 3,
      "securityEventCount": 2,
      "sessionStatus": "ACTIVE"
    }
  ],
  "totalElements": 42,
  "totalPages": 2,
  "currentPage": 0,
  "pageSize": 25
}

Response (401 Unauthorized):
{
  "error": "Invalid or expired token"
}
```

#### Get Session Details (Drill-down)
```
GET /api/admin/sessions/{snippetId}
Authorization: Bearer <token>

Response (200 OK):
{
  "sessionId": "uuid-1",
  "snippetId": "snippet-1",
  "owner": {
    "username": "user1",
    "email": "user1@example.com",
    "isAnonymous": false,
    "joinedAt": "2026-01-02T10:30:00"
  },
  "participants": [
    {
      "username": "user2",
      "ipAddress": "192.168.1.100",
      "browserInfo": "Chrome 120.0.0.0 on Windows 10",
      "osInfo": "Windows 10",
      "joinedAt": "2026-01-02T10:35:00",
      "leftAt": null,
      "duration": "2h 29m",
      "isAnonymous": false
    }
  ],
  "securityEvents": [
    {
      "eventType": "COPY_ATTEMPT",
      "timestamp": "2026-01-02T11:00:00",
      "byUser": "user2",
      "message": "Copy attempt blocked"
    }
  ],
  "urls": {
    "ownerUrl": "http://localhost:5173/editor/abc123",
    "joineeUrl": "http://localhost:5173/join/abc123",
    "tinyUrl": "http://localhost/t/abc123"
  },
  "createdAt": "2026-01-02T10:30:00",
  "endedAt": null,
  "duration": "2h 34m",
  "snippetTitle": "My Code Snippet",
  "snippetLanguage": "javascript",
  "sessionStatus": "ACTIVE"
}

Response (401 Unauthorized):
{
  "error": "Invalid or expired token"
}

Response (404 Not Found):
{
  "error": "Session not found"
}
```

## Implementation Details

### 1. Password Hashing
- Passwords are hashed using **BCryptPasswordEncoder** (spring-security-crypto)
- BCrypt includes salt and multiple iterations (12 rounds by default)
- Never store plain-text passwords

### 2. JWT Token Format
- **Algorithm**: HS512 (HMAC with SHA-512)
- **Secret Key**: Configurable via `jwt.secret` property (change in production!)
- **Expiration**: 24 hours by default (configurable via `jwt.expiration`)
- **Token Structure**:
  ```
  Header: {
    "alg": "HS512",
    "typ": "JWT"
  }
  Payload: {
    "sub": "username",
    "role": "ADMIN",
    "iat": 1672574400,
    "exp": 1672660800
  }
  Signature: HMACSHA512(header.payload, secret)
  ```

### 3. Token Validation
- Tokens are validated on every admin API request (except health check)
- Invalid or expired tokens return 401 Unauthorized
- Token claims (username, role) are extracted and passed to controllers

### 4. Role-Based Access
- Roles are checked at the controller level using `request.getAttribute("role")`
- ADMIN role required for all user management endpoints
- ADMIN and OWNER roles can access dashboard endpoints
- Future: Can be enhanced with Spring @PreAuthorize annotations

## Configuration Properties

Add to `application.properties` or `application.yml`:

```properties
# JWT Configuration (optional - defaults provided)
jwt.secret=your-secret-key-change-in-production
jwt.expiration=86400000

# Logging (optional)
logging.level.com.codesharing.platform.security=DEBUG
```

## Security Considerations

### In Development
- Default admin user created with credentials: `admin` / `pa55ward`
- JWT secret defaults to a development key

### In Production
⚠️ **CRITICAL CHANGES REQUIRED**:

1. **Change Default Admin Password**
   - Update the initial password in AdminBootstrapInitializer
   - Or manually change via database before deployment

2. **Configure JWT Secret**
   - Set `jwt.secret` to a strong, random key (32+ characters)
   - Generate using: `openssl rand -base64 32`
   - Store securely in environment variables, not in code

3. **Configure Token Expiration**
   - Adjust `jwt.expiration` based on security requirements
   - 24 hours is default; consider shorter for higher security (e.g., 1-4 hours)

4. **Enable HTTPS**
   - Always use HTTPS in production
   - JWT tokens should only be transmitted over encrypted connections

5. **Rate Limiting**
   - Implement rate limiting on `/api/auth/login` to prevent brute-force attacks
   - Consider implementing account lockout after N failed attempts

6. **Audit Logging**
   - Log all authentication attempts and user management actions
   - Monitor for suspicious activity

## Frontend Implementation

### Login Page Flow

```typescript
// 1. User submits login form
const login = async (username: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  if (response.ok) {
    const data = await response.json();
    // 2. Store token
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('role', data.roleName);
    localStorage.setItem('username', data.username);
    // 3. Redirect to dashboard
    navigate('/admin/dashboard');
  } else {
    // Show error message
    showError('Invalid credentials');
  }
};

// 3. Protected API calls with token
const fetchSessions = async () => {
  const token = localStorage.getItem('adminToken');
  const response = await fetch('/api/admin/sessions', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.clear();
    navigate('/admin/login');
  }
  
  return response.json();
};
```

## Future Enhancements

1. **Multi-Factor Authentication (MFA)**
   - Add TOTP or SMS-based MFA for additional security

2. **OAuth2/SAML Integration**
   - Support enterprise authentication providers

3. **Audit Trail**
   - Complete audit log of all admin actions

4. **Session Management**
   - Ability to invalidate tokens
   - Track active sessions

5. **Permission Granularity**
   - Fine-grained permissions beyond just role names
   - Per-snippet or per-user access controls

6. **API Keys**
   - Support programmatic access for integrations

## Troubleshooting

### "Invalid username or password" on login
- Verify user exists in database: `SELECT * FROM admin_users WHERE username='admin';`
- Check password is hashed correctly (should start with `$2a$`, `$2b$`, or `$2y$`)

### "Invalid or expired token" on API calls
- Check token is included in Authorization header: `Authorization: Bearer <token>`
- Verify token format (should start with `eyJ`)
- Check token expiration time

### "Only ADMIN users can..." error
- Verify user has ADMIN role assigned: `SELECT role_type FROM admin_roles WHERE id=(SELECT role_id FROM admin_users WHERE username='...');`
- Check JWT token contains correct role claim

### Password reset
To manually reset a user's password:
```sql
-- Generate new BCrypt hash (use BCrypt tool or update via AdminUserService)
UPDATE admin_users SET password_hash='<new_bcrypt_hash>' WHERE username='admin';
```
