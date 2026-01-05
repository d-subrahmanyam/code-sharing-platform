# Admin Dashboard - Quick Testing & Validation Guide

**Status**: Ready for Testing  
**Date**: January 5, 2026

## Pre-Testing Checklist

- [x] Backend running and healthy
- [x] Frontend rebuilt and deployed
- [x] PostgreSQL contains session records
- [x] MongoDB running (for snippets)
- [x] All Docker containers running
- [x] JWT authentication implemented
- [x] REST login endpoint working (verified)
- [x] Admin user exists with credentials: `admin` / `pa55ward`

---

## Quick Manual Test (Browser)

### 1. Login as Admin

```
URL: http://localhost/admin (or https://localhost/admin)
Expected Redirect: Login page
```

Login credentials:
- **Email**: admin (or admin@codesharing.local)
- **Password**: pa55ward

### 2. Verify Admin Dashboard Loads

Expected outcomes:
- ✅ Redirects to `/admin` dashboard
- ✅ Shows "Admin Dashboard" header
- ✅ Shows navigation tabs: Overview, Sessions, Users
- ✅ Shows dashboard content (not error or loading)

### 3. Check Sessions Tab

Expected outcomes:
- ✅ "Sessions" tab is clickable
- ✅ Shows at least 1 session in the table:
  - Snippet ID: `test-snippet-001`
  - Owner: `TestOwner`
  - Created: `2026-01-04T17:26:00.557918`
  - Participants: 1

### 4. Browser DevTools Verification

**Console Tab**:
- ❌ Should NOT see errors
- ❌ Should NOT see "401 Unauthorized"
- ❌ Should NOT see "Missing or invalid Authorization header"

**Network Tab**:
1. Filter: `auth` or `admin`
2. Look for these successful requests:
   - ✅ `POST /api/auth/login` → Status: 200
     - Response preview: `{"token":"eyJhbGci...","username":"admin"...}`
   - ✅ `GET /api/admin/sessions` → Status: 200
     - Response preview: `{"content":[{"id":3,"snippetId":"test-snippet-001"...`

3. Check request headers:
   - Request to `/admin/sessions` should have:
   ```
   Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
   Content-Type: application/json
   ```

**Storage Tab** (or Console):
- ✅ `localStorage.authToken` - Contains GraphQL token
- ✅ `localStorage.adminJwtToken` - Contains JWT token for admin
- ✅ `localStorage.authUser` - Contains user data with role=ADMIN

---

## Automated Testing (Terminal/PowerShell)

### Test 1: Admin User Login

```powershell
$body = @{username="admin"; password="pa55ward"} | ConvertTo-Json
$response = Invoke-WebRequest `
  -Uri "http://localhost:8080/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing

if ($response.StatusCode -eq 200) {
  $json = $response.Content | ConvertFrom-Json
  Write-Host "✓ Login successful"
  Write-Host "✓ Username: $($json.username)"
  Write-Host "✓ Role: $($json.roleName)"
  Write-Host "✓ Token length: $($json.token.Length)"
} else {
  Write-Host "✗ Login failed with status $($response.StatusCode)"
}
```

**Expected Output**:
```
✓ Login successful
✓ Username: admin
✓ Role: ADMIN
✓ Token length: 194
```

### Test 2: Query Admin Sessions Endpoint

```powershell
# 1. Get JWT token
$loginBody = @{username="admin"; password="pa55ward"} | ConvertTo-Json
$loginResponse = Invoke-WebRequest `
  -Uri "http://localhost:8080/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $loginBody `
  -UseBasicParsing -ErrorAction Stop

$token = ($loginResponse.Content | ConvertFrom-Json).token

# 2. Use token to get sessions
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$sessionsResponse = Invoke-WebRequest `
  -Uri "http://localhost:8080/api/admin/sessions" `
  -Method GET `
  -Headers $headers `
  -UseBasicParsing -ErrorAction Stop

if ($sessionsResponse.StatusCode -eq 200) {
  $json = $sessionsResponse.Content | ConvertFrom-Json
  Write-Host "✓ Sessions endpoint successful"
  Write-Host "✓ Sessions found: $($json.content.Count)"
  if ($json.content.Count -gt 0) {
    Write-Host "✓ First session: $($json.content[0].snippetId)"
  }
} else {
  Write-Host "✗ Sessions endpoint failed with status $($sessionsResponse.StatusCode)"
}
```

**Expected Output**:
```
✓ Sessions endpoint successful
✓ Sessions found: 1
✓ First session: test-snippet-001
```

### Test 3: Database Verification

```bash
# Login to PostgreSQL container and check sessions
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform -c "
SELECT 
  id,
  snippet_id,
  owner_username,
  participant_count,
  created_at,
  ended_at
FROM session_history
ORDER BY created_at DESC
LIMIT 10;
"
```

**Expected Output**:
```
 id |    snippet_id    | owner_username | participant_count |         created_at          | ended_at
----+------------------+----------------+-------------------+-----------------------------+----------
  3 | test-snippet-001 | TestOwner      |                 1 | 2026-01-04 17:26:00.557918 |
```

---

## Validation Checklist

### Frontend Functionality

- [ ] Admin can login successfully
- [ ] Dashboard loads without errors
- [ ] Sessions tab shows 1+ session
- [ ] Session data matches database
- [ ] Can click on session for details (if implemented)
- [ ] Logout button works

### Backend API

- [ ] `/api/auth/login` accepts credentials and returns JWT
- [ ] `/api/admin/sessions` requires JWT token (401 without it)
- [ ] `/api/admin/sessions` returns correct session data
- [ ] JWT token validation works (expired tokens rejected)
- [ ] Backend logs show successful authentication

### Database

- [ ] Sessions are persisted in PostgreSQL
- [ ] Session records have all required fields
- [ ] Participant sessions are linked correctly
- [ ] No data corruption or inconsistencies

### Security

- [ ] JWT token cannot be used without admin role
- [ ] Missing Authorization header returns 401
- [ ] Invalid JWT token returns 401
- [ ] Non-admin users cannot access admin endpoints

---

## Troubleshooting

### Issue: Login Fails (401 Unauthorized)

**Check**:
1. Admin user exists: `docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform -c "SELECT * FROM admin_users WHERE username='admin';"`
2. Password is correct: `pa55ward` (not `admin123`)
3. Backend is running: `docker ps | grep backend`
4. Backend logs show user found: `docker logs code-sharing-backend | grep "Login"`

**Solution**: 
- If user doesn't exist: Restart backend to trigger AdminBootstrapInitializer
- If password wrong: Check AdminBootstrapInitializer.java for default password
- If backend not running: `docker-compose up -d`

### Issue: Dashboard Loads But Shows No Sessions

**Check**:
1. Network tab shows successful `/api/admin/sessions` call (200 status)
2. Response contains data (not empty array)
3. localStorage contains both tokens
4. Browser console has no errors

**Solution**:
- If 401 on sessions call: Token not being sent in header
- If 200 but no data: Database is empty (no sessions created)
- If error in console: Check apiClient configuration

### Issue: Sessions Endpoint Returns 401

**Check**:
1. Authorization header is present
2. Header format is correct: `Bearer <token>`
3. Token is valid JWT (not GraphQL token)
4. Backend interceptor is configured

**Solution**:
- Verify token with: `jq -R 'split(".") | .[0],.[1] | @base64d' <<< "<token>"`
- Should see JWT header: `{"alg":"HS512"}`

### Issue: Token Doesn't Work for Admin Endpoints

**Check**:
1. Token is JWT format (not GraphQL token)
2. Token has valid role claim
3. Backend interceptor is active
4. URL pattern matches `/admin/**`

**Solution**:
- Decode token to see claims
- Check backend interceptor logs
- Verify path pattern in WebSecurityConfig

---

## Performance Testing

### Measurement: Login Time

```powershell
$startTime = Get-Date
$loginBody = @{username="admin"; password="pa55ward"} | ConvertTo-Json
$response = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" `
  -Method POST -ContentType "application/json" -Body $loginBody -UseBasicParsing
$elapsed = ((Get-Date) - $startTime).TotalMilliseconds
Write-Host "Login time: ${elapsed}ms"
```

Expected: < 500ms

### Measurement: Sessions Load Time

```powershell
$loginBody = @{username="admin"; password="pa55ward"} | ConvertTo-Json
$loginResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" `
  -Method POST -ContentType "application/json" -Body $loginBody -UseBasicParsing
$token = ($loginResponse.Content | ConvertFrom-Json).token
$headers = @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}

$startTime = Get-Date
$response = Invoke-WebRequest -Uri "http://localhost:8080/api/admin/sessions" `
  -Method GET -Headers $headers -UseBasicParsing
$elapsed = ((Get-Date) - $startTime).TotalMilliseconds
Write-Host "Sessions load time: ${elapsed}ms"
```

Expected: < 200ms

---

## Success Criteria

| Criteria | Expected | Status |
|----------|----------|--------|
| Admin login works | 200 OK with JWT token | ⏳ |
| Dashboard loads | No console errors | ⏳ |
| Sessions appear | At least 1 session visible | ⏳ |
| Network requests succeed | All requests 200 OK | ⏳ |
| No auth errors | No 401/403 responses | ⏳ |
| Token storage | Both tokens in localStorage | ⏳ |
| Database intact | 1+ sessions in PostgreSQL | ✅ |
| Backend healthy | All endpoints responding | ✅ |

---

## Test Results

### Date: [TODAY]

**Tester**: [YOUR NAME]

**Results**:

Login Test:
- [ ] PASS / [ ] FAIL
- Time: _____ ms
- Notes: _______________________

Dashboard Load:
- [ ] PASS / [ ] FAIL
- Time: _____ ms
- Notes: _______________________

Sessions Display:
- [ ] PASS / [ ] FAIL
- Sessions visible: ___
- Notes: _______________________

Network Requests:
- [ ] PASS / [ ] FAIL
- Auth call status: ___
- Sessions call status: ___
- Notes: _______________________

**Overall Status**: [ ] PASS [ ] FAIL

**Issues Found**:
- [ ] None
- [ ] Issue 1: _________________________________
- [ ] Issue 2: _________________________________

**Sign-off**: _______________ Date: __________

