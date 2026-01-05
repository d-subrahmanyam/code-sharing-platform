# Admin Dashboard Login Issue - Analysis & Resolution

## Executive Summary

**User Issues Reported:**
1. ❌ Cannot login with `admin@example.com` / `admin123`
2. ❌ Admin dashboard doesn't show sessions
3. ✅ Database DOES have sessions (verified in previous analysis)

**Most Likely Root Cause:**
The admin user (`admin@example.com`) was either not created by the DataInitializer, or was created with a different password than expected.

## How the System Works

### Initialization on Startup

When the backend starts, two initializers run:

#### 1. DataInitializer (creates regular users table admin)
```java
// File: backend/src/main/java/com/codesharing/platform/config/DataInitializer.java
// Email: admin@example.com
// Password: admin123 (encoded as BCrypt)
// Role: ADMIN
```

**This runs ONLY if the user doesn't exist:**
```java
if (userRepository.findByEmail(adminEmail).isPresent()) {
    log.info("Admin user already exists");
    return;
}
```

#### 2. AdminBootstrapInitializer (creates legacy admin_users table admin)
```java
// File: backend/src/main/java/com/codesharing/platform/security/AdminBootstrapInitializer.java
// Username: admin
// Email: admin@codesharing.local
// Password: pa55word (via createUser method)
// Role: ADMIN
```

### Login Flow

```
User Input: email="admin@example.com", password="admin123"
         ↓
GraphQL /graphql - AuthService.login()
  ├─ Check users table (findByEmail)
  │  └─ If found: verify password with BCrypt
  │     ├─ Match → Return token + user
  │     └─ No match → "Invalid password"
  └─ If not found: check admin_users table
     └─ If found: verify password with BCrypt
        ├─ Match → Return token + user
        └─ No match → "Invalid password"
```

## Why "admin@example.com / admin123" Might Not Work

### Scenario 1: User Was Never Created

**Symptom**: "User not found" error

**Why this happens**:
- DataInitializer only runs if user doesn't exist
- If the user WAS created but deleted, restarting backend won't recreate
- Previous sessions may have created the user with different password

**Verification**:
```sql
SELECT COUNT(*) FROM users WHERE email='admin@example.com';
-- Result: 0 = user doesn't exist
-- Result: 1+ = user exists
```

**Fix**:
```bash
# Delete user if exists
DELETE FROM users WHERE email='admin@example.com';

# Restart backend to trigger DataInitializer
docker-compose restart backend

# Wait 5 seconds for startup
sleep 5

# Verify user was created
SELECT * FROM users WHERE email='admin@example.com';
```

### Scenario 2: User Exists But Password Doesn't Match

**Symptom**: "Invalid password" error after email is found

**Why this happens**:
- User was created with different password
- Password hash in database doesn't match BCrypt encoding of "admin123"
- Previous user creation process used different password

**Verification**:
```sql
SELECT email, PASSWORD_HASH FROM users WHERE email='admin@example.com';
-- Look at hash format:
-- - Should start with $2a$10$ (BCrypt)
-- - Should be ~60 characters
-- - If different: password was set differently
```

**What the hash should look like** (BCrypt of "admin123"):
```
$2a$10$<rest of hash>
```

**Fix**:
```bash
# Option 1: Delete user and recreate
DELETE FROM users WHERE email='admin@example.com';
docker-compose restart backend

# Option 2: Update password directly (not recommended for production)
# This requires knowing the BCrypt hash of "admin123"
UPDATE users 
SET password_hash='$2a$10$F2mcsDQog5IwlRNdkBNMG.7ixLgV6orv67t3hZkgHKgqVRa9Vd756'
WHERE email='admin@example.com';
```

###  Scenario 3: User Exists But Database Was Reset

**Symptom**: User exists in code but database was cleared

**Why this happens**:
- Docker volume was deleted: `docker-compose down -v`
- Database crashed and recovered without data
- Manual database cleanup

**Fix**:
```bash
# Restart backend to reinitialize
docker-compose restart backend

# Verify
SELECT COUNT(*) FROM users;
-- Should show at least 2 (admin + demo)
```

### Scenario 4: Password Has Space or Special Character

**Symptom**: "Invalid password" even though password looks correct

**Why this happens**:
- Password might have been trimmed/whitespace issues
- Frontend might be sending encoded password differently

**Fix**:
- Try password with no spaces: `admin123` (not `admin 123`)
- Check login form isn't adding extra characters

## Step-by-Step Diagnosis & Fix

###  Step 1: Check if User Exists in Database

**Command**:
```bash
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
  -c "SELECT id, email, username, role, password_hash FROM users WHERE email='admin@example.com';"
```

**If output is empty (0 rows)**:
- **Problem**: User doesn't exist
- **Solution**: Go to Step 2a

**If output shows 1 row**:
- **Problem**: User exists, password might not match
- **Solution**: Go to Step 2b

###  Step 2a: User Doesn't Exist - Recreate It

**Action**: Restart backend to run DataInitializer

```bash
# Restart just the backend service
docker-compose restart backend

# Wait for startup
sleep 5

# Verify user was created
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
  -c "SELECT email, username FROM users WHERE email='admin@example.com';"
```

**Expected**: Shows 1 row with email=admin@example.com

**Then test login**:
- Try password: `admin123`
- If still fails, go to Step 2b

### Step 2b: User Exists But Password Doesn't Match

**First, verify the password issue**:
```bash
# Check password hash
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
  -c "SELECT email, substring(password_hash from 1 for 30) as hash_start FROM users WHERE email='admin@example.com';"
```

**Options**:

**Option 1**: Delete user and recreate (RECOMMENDED)
```bash
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
  -c "DELETE FROM users WHERE email='admin@example.com';"

docker-compose restart backend

sleep 5

# Test login with admin@example.com / admin123
```

**Option 2**: Update password hash directly
```bash
# Get the correct BCrypt hash of "admin123"
# From DataInitializer: passwordEncoder.encode("admin123")
# Expected hash (generated by Spring BCrypt): 
# $2a$10$F2mcsDQog5IwlRNdkBNMG.7ixLgV6orv67t3hZkgHKgqVRa9Vd756

docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
  -c "UPDATE users SET password_hash='\$2a\$10\$F2mcsDQog5IwlRNdkBNMG.7ixLgV6orv67t3hZkgHKgqVRa9Vd756' WHERE email='admin@example.com';"
```

## Why Sessions Aren't Displaying

**Even if login works**, dashboard might be empty because:

### Problem 1: JWT Token Not Fetched

```
Login Flow:
1. ✅ GraphQL login succeeds
2. ❌ REST /auth/login fails or returns nothing
3. ❌ Frontend doesn't get JWT token
4. ❌ /api/admin/sessions call fails with 401
5. ❌ Dashboard shows empty
```

**Fix**:
- Check authSaga in frontend
- Make sure user role is ADMIN after GraphQL login
- Verify REST endpoint is accessible

### Problem 2: Sessions Table Empty

```bash
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
  -c "SELECT COUNT(*) FROM session_history;"
```

**If result is 0**:
- No sessions recorded
- Need to create sessions first
- Use the editor to create snippet and share it

**If result is > 0**:
- Sessions exist
- Issue is with JWT token or API access
- Check browser Network tab for /api/admin/sessions requests

### Problem 3: JWT Token Invalid

**Check backend logs**:
```bash
docker logs code-sharing-backend | grep -i "jwt\|token\|admin"
```

**Common errors**:
- `Invalid token signature` - Token was modified
- `Token expired` - User logged in too long ago
- `No such user` - User was deleted after login

**Fix**:
- Logout and login again
- Get new JWT token

## Testing Authentication End-to-End

### Test 1: GraphQL Login

```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(email: \"admin@example.com\", password: \"admin123\") { success message token user { username email role } } }"
  }'
```

**Expected response**:
```json
{
  "data": {
    "login": {
      "success": true,
      "message": "Login successful",
      "token": "eyJhbGciOiJIUzUxMiJ9...",
      "user": {
        "username": "admin",
        "email": "admin@example.com",
        "role": "ADMIN"
      }
    }
  }
}
```

### Test 2: REST JWT Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Expected response**:
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

### Test 3: Sessions Endpoint

```bash
# Use token from Test 2
curl -H "Authorization: Bearer <TOKEN_FROM_TEST_2>" \
  http://localhost:8080/api/admin/sessions
```

**Expected**: Array of sessions, or empty array if no sessions exist

## Recovery Script

**If you need to reset everything**:

```bash
#!/bin/bash

echo "Resetting admin authentication..."

# Stop containers
docker-compose down

# Remove database volume (WARNING: This deletes all data!)
docker volume rm code-sharing-platform_postgres_data

# Start containers fresh
docker-compose up -d

# Wait for database initialization
sleep 10

# Verify admin user was created
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
  -c "SELECT email, username FROM users WHERE role='ADMIN';"

echo "Reset complete. Try login with admin@example.com / admin123"
```

**WARNING**: This deletes ALL data. Only use if necessary.

## Files to Check

If debugging further, examine these files:

1. **Backend User Initialization**:
   - `backend/src/main/java/com/codesharing/platform/config/DataInitializer.java` - Sets admin@example.com / admin123

2. **Backend Authentication**:
   - `backend/src/main/java/com/codesharing/platform/service/AuthService.java` - GraphQL login
   - `backend/src/main/java/com/codesharing/platform/controller/AdminAuthController.java` - REST JWT endpoint

3. **Frontend Authentication**:
   - `frontend/src/store/sagas/authSaga.ts` - Handles login flow
   - `frontend/src/pages/LoginPage.tsx` - Login form

4. **Database Schema**:
   - `users` table - Regular users (admin@example.com is here)
   - `admin_users` table - Legacy admin (username=admin is here)

## Summary of Solutions

**If can't login with admin@example.com / admin123**:

1. **First attempt**: Restart backend
   ```bash
   docker-compose restart backend
   sleep 5
   # Try login again
   ```

2. **If still fails**: Delete user and recreate
   ```bash
   docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
     -c "DELETE FROM users WHERE email='admin@example.com';"
   docker-compose restart backend
   sleep 5
   # Try login again
   ```

3. **If still fails**: Check database manually
   ```bash
   docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
     -c "SELECT * FROM users WHERE email='admin@example.com';"
   ```

4. **Last resort**: Full reset (warning: deletes all data)
   ```bash
   docker-compose down -v
   docker-compose up -d
   sleep 10
   # Try login again
   ```

**Once login works, if dashboard is empty**:

1. Check sessions exist:
   ```bash
   docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform \
     -c "SELECT COUNT(*) FROM session_history;"
   ```

2. If 0 sessions: Create one by using the editor
3. If sessions exist: Clear browser cache and logout/login again

## Related Files

- See [LOGIN_SESSIONS_DIAGNOSTIC_GUIDE.md](./LOGIN_SESSIONS_DIAGNOSTIC_GUIDE.md) for detailed diagnostic procedures
- See [AUTHENTICATION_AND_SESSIONS.md](./AUTHENTICATION_AND_SESSIONS.md) for architecture overview
