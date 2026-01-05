# Admin Dashboard Fix - Quick Reference

## 🎯 What Was Fixed

The admin dashboard wasn't displaying sessions from the database because of an **authentication mismatch**: the frontend was using GraphQL tokens but the admin endpoints required JWT tokens.

## ✅ Status

**FIXED AND DEPLOYED** - All containers rebuilt and running

## 🚀 Test It Now

### Browser Test (Quickest)

1. Go to: `http://localhost/admin`
2. Login with:
   - Email/Username: `admin`
   - Password: `pa55ward`
3. Should see **1 session** in the dashboard

### Terminal Test (Verification)

```powershell
# Get JWT token
$body = @{username="admin"; password="pa55ward"} | ConvertTo-Json
$login = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" `
  -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
$token = ($login.Content | ConvertFrom-Json).token

# Get sessions
$headers = @{"Authorization" = "Bearer $token"}
Invoke-WebRequest -Uri "http://localhost:8080/api/admin/sessions" `
  -Method GET -Headers $headers -UseBasicParsing | ForEach-Object { $_.Content | ConvertFrom-Json }
```

Should return session data with `test-snippet-001`.

## 📋 What Was Changed

| File | What Changed | Why |
|------|--------------|-----|
| **authSaga.ts** | Added REST JWT login call for admins | Fetch JWT after GraphQL login |
| **authSlice.ts** | Added jwtToken field | Store JWT separately from GraphQL token |
| **client.ts** | Conditional token selection | Use right token for each endpoint type |
| **redux.ts** | Added jwtToken type | TypeScript type safety |

## 🔐 How It Works Now

```
1. User logs in with email/password (GraphQL)
   ✓ GraphQL token received

2. System checks: Is user admin?
   ✓ If yes → Fetch JWT token using same credentials

3. Two tokens now stored:
   ✓ graphQLToken = for regular API
   ✓ jwtToken = for admin endpoints

4. API client picks correct token:
   ✓ URL has /admin? → Use jwtToken
   ✓ Otherwise → Use graphQLToken

5. Admin dashboard makes requests with JWT:
   ✓ GET /api/admin/sessions
   ✓ Authorization: Bearer <jwtToken>
   ✓ Backend validates JWT and returns sessions
   ✓ Dashboard displays 1 session ✓
```

## 📊 Verification Checklist

- [x] Database has session records (1 found)
- [x] Backend endpoints return correct data
- [x] Frontend code rebuilt with fix
- [x] All containers running and healthy
- [x] JWT token generation working
- [x] Session endpoint responding correctly

## ⚠️ Important Notes

**Default Admin Login**:
- Username: `admin`
- Password: `pa55ward` (NOT `admin123`)
- Change this in production!

**What You'll See**:
- Dashboard shows 1 session: `test-snippet-001`
- Owner: `TestOwner`
- Participants: 1
- Created: `2026-01-04T17:26:00`

## 🐛 If Something's Wrong

**Sessions still not showing?**
1. Check browser console (F12) for errors
2. Check Network tab for failed requests
3. Look for 401 Unauthorized errors
4. Verify localStorage has both tokens

**Login fails?**
1. Verify password is `pa55ward` (not `admin123`)
2. Check backend logs: `docker logs code-sharing-backend`
3. Restart containers: `docker-compose down && docker-compose up -d`

## 📚 Full Documentation

For complete details, see:
- **ADMIN_DASHBOARD_DEBUG_INVESTIGATION.md** - Full root cause analysis
- **CODE_CHANGES_ADMIN_FIX.md** - Detailed code changes
- **TESTING_AND_VALIDATION.md** - Complete testing procedures

## ✨ Summary

The fix integrates two authentication systems so admin users automatically get JWT tokens. This is backward compatible - non-admin users are unaffected.

**Ready to test!** 🎉

