# Admin Dashboard Session Display - Testing Guide

## Overview
This document provides step-by-step testing procedures to verify that the admin dashboard now correctly displays session information when owner/joinee sessions are created.

## Pre-Test Checklist
✅ Backend Docker container rebuilt and running
✅ Frontend Docker container running
✅ PostgreSQL database running with session_history table
✅ MongoDB running with code snippets collection

## Test Scenario 1: Anonymous Owner Session + Joinee

### Setup
1. Open Edge Private Window (or incognito window)
2. Navigate to http://localhost:5173
3. Create a new code snippet:
   - Title: "Test Snippet 1"
   - Language: JavaScript
   - Code: `console.log("Hello World")`
   - Description: "Testing admin dashboard session tracking"
   - IsPublic: Yes
4. Copy the Share URL

### Owner Session Expected Behavior
- Backend SnippetController.createSnippet() called
- AdminDashboardService.createSession() invoked
- SessionHistory record created in PostgreSQL with:
  - snippetId: (auto-generated)
  - ownerId: "anonymous"
  - ownerUsername: "Anonymous"
  - isOwnerAnonymous: true
  - sessionStatus: "ACTIVE"
  - participantCount: 1
- CollaborationController.handleUserJoin() called
- AdminDashboardService.addParticipant() invoked
- ParticipantSession record created with:
  - userId: "anonymous"
  - isOwner: true
  - isAnonymous: true
  - joinedAt: current timestamp

### Frontend Verification
In the Edge private window, you should see:
- Active collaborative editing session
- Snippet title displayed
- Your name as "Anonymous"

### Admin Dashboard Verification
1. Open http://localhost:5173/admin
2. Login with credentials
3. Navigate to Admin Dashboard Sessions tab
4. Expected to see:
   - 1 active session
   - Snippet title: "Test Snippet 1"
   - Owner: "Anonymous"
   - Participants: 1
   - Created timestamp showing current time

### Backend Console Logs (Expected)
```
[SnippetController] Creating session for snippet: xyz123, owner: anonymous, anonymous: true
[SnippetController] Session created for snippet: xyz123
[Collaboration] Tracking participant join: snippetId=xyz123, userId=anonymous, username=Anonymous
[Collaboration] Participant added to session: snippetId=xyz123, userId=anonymous, isOwner=true
```

### Database Verification
Execute SQL:
```sql
SELECT * FROM session_history;
```
Expected: 1 row with snippetId, ownerId="anonymous", ownerUsername="Anonymous"

```sql
SELECT * FROM participant_session;
```
Expected: 1 row with userId="anonymous", isOwner=true

---

## Test Scenario 2: Owner + Multiple Joinees

### Setup (Continuing from Scenario 1)
1. In Brave Private Window, navigate to http://localhost:5173
2. Click "Join Session"
3. Paste the Share URL from previous step
4. Enter name: "Joinee 1"

### Expected Behavior - First Joinee
- CollaborationController.handleUserJoin() called with userId=joinee1
- AdminDashboardService.addParticipant() invoked
- ParticipantSession record created
- sessionHistory.participantCount incremented to 2

### Frontend Verification (Brave Window)
- See "Anonymous" as owner in presence indicator
- See your edits synced in real-time
- See "Joinee 1" in presence list

### Frontend Verification (Edge Window)
- See "Joinee 1" joined in presence indicator
- Participant list updated

### Admin Dashboard Verification
- Session should show: Participants: 2
- Session details should list both participants:
  - "Anonymous" (Owner)
  - "Joinee 1" (Joinee)

---

## Test Scenario 3: Participant Departure & Session Duration

### Setup (Continuing from Scenario 2)
1. In Brave window, make some code changes
2. Wait 30+ seconds
3. Close Brave window (simulating departure)

### Expected Behavior
- CollaborationController.handleUserLeave() called
- AdminDashboardService.markParticipantLeft() invoked
- ParticipantSession.leftAt set to current timestamp
- ParticipantSession.durationSeconds calculated

### Admin Dashboard Verification
- Session still shows but "Joinee 1" status changed
- If viewing session details:
  - Joinee 1 should show:
    - Joined At: (timestamp)
    - Left At: (timestamp)
    - Duration: ~30+ seconds

### Database Verification
```sql
SELECT * FROM participant_session WHERE user_id = 'joinee1';
```
Expected: leftAt is NOT NULL, durationSeconds is calculated

---

## Test Scenario 4: Admin Dashboard Filtering & Search

### Setup
After multiple sessions created in previous scenarios

### Test Search Functionality
1. Go to Admin Dashboard
2. Search for: "Test Snippet 1"
3. Expected: Session appears in results

### Test Sorting
1. Click "Created Date" column header
2. Expected: Sessions sorted by creation date
3. Newest sessions appear first

### Test Pagination
1. If more than 10 sessions exist
2. Navigate to page 2
3. Expected: More sessions displayed

---

## Test Scenario 5: Multiple Concurrent Sessions

### Setup
1. Create Snippet A in Edge Private (Named "Snippet A")
2. Create Snippet B in Firefox Private (Named "Snippet B")
3. Have joinee join Snippet A in Chrome Private
4. Have joinee join Snippet B in Safari Private

### Expected Behavior
- 2 separate SessionHistory records
- Each with own participant list
- Each with independent session tracking

### Admin Dashboard Verification
- Sessions list shows 2 sessions
- Each with different:
  - Snippet titles
  - Snippet IDs
  - Participants
  - Created times

### Database Verification
```sql
SELECT COUNT(*) FROM session_history;
```
Expected: At least 2 rows

```sql
SELECT COUNT(*) FROM participant_session;
```
Expected: At least 4 rows (2 owners + 2 joinee each)

---

## Troubleshooting Guide

### Issue: No sessions appear in admin dashboard

**Check 1: Backend Logs**
```bash
docker logs code-sharing-backend
```
Look for:
- `[SnippetController] Creating session for snippet:` - Should appear when snippet created
- `[Collaboration] Tracking participant join:` - Should appear when user joins
- Error messages indicating what failed

**Check 2: Database Connection**
Verify PostgreSQL is running and session_history table exists:
```bash
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform -c "\dt session_history"
```

**Check 3: Verify Session Creation**
Check if SessionHistory records exist:
```bash
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform -c "SELECT COUNT(*) FROM session_history;"
```

### Issue: Sessions created but not showing in admin dashboard

**Check 1: Admin Endpoint**
Test the endpoint directly:
```bash
curl http://localhost:8080/api/admin/sessions
```
Should return JSON array with sessions

**Check 2: Frontend Caching**
Try:
1. Hard refresh admin page (Ctrl+F5)
2. Clear browser cache
3. Reopen browser

**Issue: Participant count not incrementing**

**Check 1: CollaborationController Logs**
Look for `[Collaboration] Participant added to session:` in logs

**Check 2: Database Participant Records**
```bash
docker exec code-sharing-postgres psql -U postgres -d code_sharing_platform -c "SELECT * FROM participant_session;"
```

---

## Success Criteria

✅ All tests passed when:
1. **Session Creation**: SessionHistory record created when snippet created
2. **Participant Tracking**: ParticipantSession records created when users join
3. **Admin Visibility**: Sessions appear in admin dashboard immediately
4. **Data Accuracy**: Participant counts match actual participants
5. **Duration Tracking**: Session duration calculated correctly
6. **Search Functionality**: Can search for sessions by snippet title
7. **Multiple Sessions**: Can manage multiple concurrent sessions
8. **Departure Tracking**: Departure times recorded correctly

---

## Performance Notes

- Session creation: Should be sub-100ms
- Participant tracking: Should be sub-100ms
- Admin dashboard load: Should be sub-500ms
- Database queries: Should use indexes on snippetId, userId

---

## Next Steps After Testing

1. ✅ If all tests pass:
   - Commit changes to feature branch
   - Create pull request with test evidence
   - Request human review
   - Merge to main when approved

2. ❌ If tests fail:
   - Check backend logs for errors
   - Verify database schema
   - Review code changes in commits
   - Fix issues and rebuild

---

## Test Evidence Checklist

Capture the following for documentation:
- [ ] Screenshot of admin dashboard showing sessions
- [ ] Backend logs showing session creation
- [ ] Database query results showing session records
- [ ] Multiple sessions in admin dashboard
- [ ] Session search working
- [ ] Participant tracking visible

---

## Commands Reference

**Check Backend Logs**
```bash
docker logs -f code-sharing-backend
```

**Access PostgreSQL**
```bash
docker exec -it code-sharing-postgres psql -U postgres -d code_sharing_platform
```

**Query Sessions**
```sql
SELECT id, snippet_id, owner_username, participant_count, session_status, created_at FROM session_history ORDER BY created_at DESC;
```

**Query Participants**
```sql
SELECT p.user_id, p.username, p.is_owner, p.joined_at, p.left_at, s.snippet_id 
FROM participant_session p 
JOIN session_history s ON p.session_history_id = s.id 
ORDER BY p.joined_at DESC;
```

**Verify Table Schemas**
```sql
\d session_history
\d participant_session
```
