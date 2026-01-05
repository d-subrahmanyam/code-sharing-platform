# Admin Dashboard - Quick Reference & Testing Guide

## Quick Facts

| Item | Details |
|------|---------|
| **Issue** | Admin dashboard showed "No active sessions" despite database having 3 sessions |
| **Root Cause** | Frontend wasn't extracting `content` array from Spring Data Page response |
| **Fix Location** | `frontend/src/pages/AdminPage.tsx` line 45 |
| **Fix Type** | Change: `sessionsRes.data` → `sessionsRes.data?.content` |
| **Status** | ✅ Fixed & Verified |
| **Date Fixed** | January 5, 2026 |

---

## How to Test

### 1. Via Browser (Recommended)
```
1. Open https://localhost
2. Login:
   - Email: admin@example.com
   - Password: admin123
3. Should see Admin Dashboard with:
   - Overview tab: "Active Sessions: 3"
   - Sessions tab: Table with 3 session rows
```

### 2. Via Curl (API Testing)
```bash
# Get JWT token
TOKEN=$(curl -s -k -X POST "https://localhost/api/graphql" \
  -H "Content-Type: application/json" \
  --data '{"query":"mutation { login(email: \"admin@example.com\", password: \"admin123\") { token } }"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Fetch sessions
curl -k "https://localhost/api/admin/sessions" \
  -H "Authorization: Bearer $TOKEN" | jq '.content | length'

# Expected output: 3
```

---

## The Issue Explained Simply

**What Happened:**
- Backend API returns a Spring Data `Page` object
- This object has a `.content` array inside it
- Frontend code was trying to use the entire object as an array
- Therefore sessions weren't displayed

**What Was Wrong:**
```javascript
// WRONG ❌
const sessionsRes = await apiClient.get('/admin/sessions')
setActiveSessions(sessionsRes.data || [])  // Sets whole Page object
// sessionsRes.data = { content: [...], pageable: {...}, ... }
// activeSessions.map() fails because activeSessions is an object, not array
```

**What's Fixed:**
```javascript
// RIGHT ✅
const sessionsRes = await apiClient.get('/admin/sessions')
setActiveSessions(sessionsRes.data?.content || [])  // Extracts content array
// sessionsRes.data.content = [session1, session2, session3]
// activeSessions.map() works because activeSessions is now an array
```

---

## What's in the Database

The system has 3 demo sessions pre-loaded:

| ID | Snippet Title | Language | Owner | Participants | Status |
|----|---------------|----------|-------|--------------|--------|
| 3 | Java Spring Boot API | java | demo | 2 | ACTIVE |
| 2 | Python Data Processing | python | demo | 2 | ACTIVE |
| 1 | React Hooks Tutorial | javascript | demo | 2 | ACTIVE |

All three should display in the Admin Dashboard Sessions tab.

---

## Verification Checklist

After deployment, verify:

- [ ] Admin login works (admin@example.com / admin123)
- [ ] Redirects to /admin path after login
- [ ] Overview tab loads and shows system health status
- [ ] Overview tab shows "Active Sessions: 3"
- [ ] Sessions tab loads without errors
- [ ] Sessions table displays all 3 sessions
- [ ] Each session shows correct ID, Participants, and Start Date
- [ ] Can click on sessions (if additional functionality exists)
- [ ] No console errors in browser DevTools

---

## Related Fixes in This Session

### 1. API 404 Error (Fixed First)
- **Issue:** Login failing with 404 on `/api/api/graphql`
- **Cause:** Axios double-prefixing the API path
- **Fix:** Changed GRAPHQL_ENDPOINT from `/api/graphql` to `/graphql`
- **Doc:** [API_ROUTING_FIX_DEEP_DIVE.md](API_ROUTING_FIX_DEEP_DIVE.md)

### 2. Admin Dashboard Sessions (This Fix)
- **Issue:** Logged-in admin couldn't see sessions
- **Cause:** Frontend not extracting content from paginated response
- **Fix:** Extract `.content` array from API response
- **Doc:** [ADMIN_DASHBOARD_SESSIONS_FIX.md](ADMIN_DASHBOARD_SESSIONS_FIX.md)

---

## API Endpoints Reference

### Admin Sessions Endpoint
```
GET /admin/sessions
Headers: Authorization: Bearer <JWT_TOKEN>
Query Params: page=0&size=25&sort=createdAt,desc
Response: Spring Data Page<SessionListDTO>
```

### Response Structure
```json
{
  "content": [
    {
      "id": 3,
      "snippetId": "demo-snippet-003",
      "ownerUsername": "demo",
      "ownerEmail": "demo@example.com",
      "snippetTitle": "Java Spring Boot API",
      "snippetLanguage": "java",
      "participantCount": 2,
      "createdAt": "2026-01-05T06:14:05.845493",
      "sessionStatus": "ACTIVE"
    }
    // ... more sessions
  ],
  "totalElements": 3,
  "totalPages": 1,
  "empty": false,
  "pageable": {
    "pageNumber": 0,
    "pageSize": 25,
    // ...
  }
}
```

---

## Troubleshooting

### "No active sessions" still showing?

**Check 1:** Clear browser cache
```
- Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
- Clear Browsing Data
- Reload page
```

**Check 2:** Verify API response
```bash
curl -k "https://localhost/api/admin/sessions" \
  -H "Authorization: Bearer <TOKEN>" | jq '.content'
# Should show array with 3 sessions
```

**Check 3:** Check browser console
```
- Open DevTools (F12)
- Look for errors in Console tab
- Check Network tab for failed requests
```

**Check 4:** Verify login was successful
```bash
# Check if you have a valid JWT token
# Token should start with "eyJ..."
```

---

## File Changes Summary

| File | Change | Line | Type |
|------|--------|------|------|
| `frontend/src/pages/AdminPage.tsx` | Extract content array | 45 | Bug Fix |

**One-liner:** Changed `sessionsRes.data` to `sessionsRes.data?.content` to properly extract sessions from paginated API response.

---

## Testing Scenario Walkthrough

### Scenario: Admin wants to view all collaborative sessions

**Expected Flow:**
1. User opens https://localhost
2. User sees login page
3. User enters: admin@example.com / admin123
4. User clicks "Login"
5. System authenticates and redirects to /admin
6. Admin Dashboard loads with Overview tab active
7. Overview shows:
   - System Health: UP ✓
   - Active Sessions: 3
   - Quick Actions button
8. User clicks "Sessions" tab
9. Sessions table displays:
   - Row 1: ID=3, Participants=2, Started=2026-01-05 06:14:05
   - Row 2: ID=2, Participants=2, Started=2026-01-05 06:14:05
   - Row 3: ID=1, Participants=2, Started=2026-01-05 06:14:05
10. ✅ Success - All sessions visible

---

## Document History

| Date | Change | Status |
|------|--------|--------|
| 2026-01-05 | Fixed admin dashboard sessions display | ✅ Complete |
| 2026-01-05 | Created quick reference guide | ✅ Complete |

---

For detailed technical information, see [ADMIN_DASHBOARD_SESSIONS_FIX.md](ADMIN_DASHBOARD_SESSIONS_FIX.md)
