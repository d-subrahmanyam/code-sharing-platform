# Admin Login Issue - Final Fix (2026-01-04)

## Problem Summary

When attempting to login with admin credentials (`admin@example.com` / `admin123`), the GraphQL login mutation was returning "User not found" instead of authenticating the admin and redirecting to the admin dashboard.

## Root Cause Analysis

The issue was in the **AuthService** class, which handles GraphQL mutations for user authentication:

### The Bug
```java
// BEFORE: Only checked regular users table
public AuthPayload login(String email, String password) {
    Optional<User> userOptional = userRepository.findByEmail(email);
    if (userOptional.isEmpty()) {
        return new AuthPayload(null, null, false, "User not found");  // ❌ Admin not found!
    }
    // ...
}
```

**Why it failed:**
1. Admin users are stored in the `admin_users` table (AdminUser entity)
2. Regular users are stored in the `users` table (User entity)
3. The `AuthService.login()` method ONLY checked the `users` table
4. Admin credentials could never be found through the GraphQL login
5. The admin dashboard was unreachable because the user never received the ADMIN role

## Solution Implemented

Updated **AuthService** to check both user tables:

### The Fix
```java
// AFTER: Checks both regular users AND admin users
public AuthPayload login(String email, String password) {
    // First, try to authenticate as a regular user
    Optional<User> userOptional = userRepository.findByEmail(email);
    
    if (userOptional.isPresent()) {
        User user = userOptional.get();
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            return new AuthPayload(null, null, false, "Invalid password");
        }
        String token = generateToken(user.getId());
        UserDTO userDTO = new UserDTO(user.getId(), user.getUsername(), user.getEmail(), user.getRole().getValue());
        return new AuthPayload(token, userDTO, true, "Login successful");
    }
    
    // If not found in regular users, try admin users
    Optional<AdminUser> adminUserOptional = adminUserRepository.findByEmail(email);
    
    if (adminUserOptional.isPresent()) {
        AdminUser adminUser = adminUserOptional.get();
        if (!passwordEncoder.matches(password, adminUser.getPasswordHash())) {
            return new AuthPayload(null, null, false, "Invalid password");
        }
        String token = generateToken(adminUser.getId().toString());
        String roleValue = adminUser.getRole() != null ? adminUser.getRole().getRoleType().name() : "ADMIN";
        UserDTO userDTO = new UserDTO(adminUser.getId().toString(), adminUser.getUsername(), adminUser.getEmail(), roleValue);
        return new AuthPayload(token, userDTO, true, "Login successful");
    }
    
    return new AuthPayload(null, null, false, "User not found");
}
```

### Key Changes
1. ✅ Added `AdminUserRepository` dependency to AuthService
2. ✅ Check regular `User` table first
3. ✅ Fall back to `AdminUser` table if not found in `User` table
4. ✅ Extract role from AdminUser's role entity
5. ✅ Return ADMIN role in UserDTO
6. ✅ Maintains backward compatibility with regular users

## Testing

### Test 1: Admin Login ✅
```bash
POST /api/graphql
Query: mutation Login($email: String!, $password: String!) { 
  login(email: $email, password: $password) { 
    token user { id username email role } success message 
  }
}
Variables: { "email": "admin@example.com", "password": "admin123" }

Response:
{
  "data": {
    "login": {
      "token": "token_...",
      "user": {
        "id": "...",
        "username": "admin",
        "email": "admin@example.com",
        "role": "ADMIN"  ✅ Role is returned!
      },
      "success": true,
      "message": "Login successful"
    }
  }
}
```

### Test 2: Admin Dashboard Redirect ✅
1. Navigate to https://localhost/login
2. Enter admin@example.com / admin123
3. LoginPage detects `user.role === 'ADMIN'`
4. ✅ Automatically redirects to `/admin`
5. ✅ Admin dashboard loads successfully

### Test 3: Regular User Unaffected ✅
1. Login with demo@example.com / demo123
2. ✅ Regular user still authenticates successfully
3. ✅ User role is returned correctly
4. ✅ Redirects to home page (not admin)

## Files Modified

- **backend/src/main/java/com/codesharing/platform/service/AuthService.java**
  - Added AdminUserRepository dependency
  - Updated login() method to check both User and AdminUser tables
  - Extracts ADMIN role from AdminUser entity

## Deployment

### Backend Container Rebuild
```bash
docker-compose up --build -d backend
```

### Verification
```bash
docker ps  # All containers should be healthy
docker logs code-sharing-backend  # Check for any errors
```

## Architecture Notes

### User System Overview
```
┌─────────────────────────────────────────┐
│        Authentication System            │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────┐                  │
│  │ GraphQL Auth     │                  │
│  │ /api/graphql     │                  │
│  │ (Regular Users)  │                  │
│  │ (Admin Users)    │  ← NEW!          │
│  └──────────────────┘                  │
│         │                              │
│         ▼                              │
│  ┌──────────────────────────────────┐ │
│  │    AuthService                   │ │
│  │ - Checks User table              │ │
│  │ - Checks AdminUser table (NEW)   │ │
│  └──────────────────────────────────┘ │
│         │                              │
│  ┌──────┴──────┐                      │
│  ▼             ▼                      │
│ User       AdminUser                 │
│ table      table                     │
│(Regular) (Admin)                    │
│                                      │
└─────────────────────────────────────────┘
```

## Security Implications

✅ **Security Maintained:**
- Password validation still required for both user types
- Role verification enforced in frontend and backend
- ADMIN role only granted to AdminUser entities
- No privilege escalation vulnerability
- Admin users cannot escalate to higher privileges

## Future Improvements

1. Consider merging User and AdminUser into a single users table with role field
2. Add JWT token validation for all GraphQL queries
3. Implement token expiration
4. Add audit logging for admin logins
5. Enable multi-factor authentication for admin accounts

## Summary

✅ **Status: COMPLETE**
- Admin users can now login through GraphQL endpoint
- Admin dashboard is accessible after login
- Frontend automatically redirects admin to dashboard
- All containers rebuilt and running
- No breaking changes to existing functionality

**Commit:** c6a2a91 - "fix: Allow admin users to login through GraphQL endpoint"

---

**Fixed:** 2026-01-04  
**Tested:** ✅ Admin login ✅ Dashboard access ✅ Regular user login
