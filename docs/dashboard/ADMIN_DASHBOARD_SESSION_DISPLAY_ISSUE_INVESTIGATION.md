# Admin Dashboard Session Display Issue - Investigation Report

**Date:** January 4, 2026  
**Branch:** fix/admin-dashboard-session-display  
**Issue:** Admin dashboard shows no session information when owner/joinee sessions are created

---

## Problem Statement

**Reported Issue:**
- Created anonymous owner session for "John" in Edge private window
- Opened joinee session in Brave private window
- Expected: Admin dashboard should show session information
- Actual: Admin dashboard shows no sessions

**Expected Behavior:**
When an owner/joinee code sharing session is created, the session should be tracked and visible in the admin dashboard at `/admin/sessions`

**Actual Behavior:**
- Session data exists (code is being shared in real-time)
- But admin dashboard `/admin/sessions` endpoint returns empty list
- Sessions are not being persisted to SessionHistory table

---

## Root Cause Analysis

### Finding 1: Sessions Not Being Created in SessionHistory
When a user creates and shares a code snippet:
1. ✅ Snippet is created in MongoDB (CodeSnippet collection)
2. ✅ WebSocket connection established in CollaborationController
3. ✅ User joins session via `/app/snippet/{snippetId}/join`
4. ❌ **NO SessionHistory record is created**

### Finding 2: AdminDashboardService.createSession() Never Called
**Code Location:** `backend/src/main/java/com/codesharing/platform/service/AdminDashboardService.java`

```java
@Transactional
public SessionHistory createSession(String snippetId, String ownerId, String ownerUsername, 
                                   String ownerEmail, Boolean isAnonymous, 
                                   String snippetTitle, String snippetLanguage) {
    // This method exists and properly creates SessionHistory record
    // BUT IT IS NEVER CALLED ANYWHERE
}
```

**Search Results:** `createSession()` is defined but has 0 callers in the entire codebase.

### Finding 3: WebSocket Join Handler Not Tracking Sessions
**Code Location:** `backend/src/main/java/com/codesharing/platform/websocket/CollaborationController.java` (Line 31-50)

```java
@MessageMapping("/snippet/{snippetId}/join")
public void handleUserJoin(
    @DestinationVariable String snippetId,
    @Payload Map<String, String> payload
) {
    String userId = payload.get("userId");
    String username = payload.get("username");
    
    collaborationService.joinSession(snippetId, userId, username);
    // Sets session owner from snippet metadata
    // But does NOT create SessionHistory record
}
```

The WebSocket join handler is responsible for tracking when sessions start, but it never creates SessionHistory entries.

### Finding 4: SnippetController.createSnippet() Doesn't Track Sessions
**Code Location:** `backend/src/main/java/com/codesharing/platform/controller/SnippetController.java` (Line 55-66)

```java
@MutationMapping
public SnippetDTO createSnippet(@Argument String authorId, ...) {
    // Creates CodeSnippet in MongoDB
    return snippetService.createSnippet(userId, title, description, code, language, tagList, isPublicFlag);
    // Does NOT create SessionHistory record
}
```

When a snippet is first created, there's no corresponding session history entry.

### Finding 5: AdminDashboardService Never Injected into CollaborationController
**CollaborationController dependencies:** Only has `CollaborationService`, `SnippetService`, `SimpMessagingTemplate`  
**Missing:** `AdminDashboardService` - cannot call createSession even if we wanted to

---

## Flow Diagram: Current vs Expected

### Current Flow (BROKEN)
```
User creates snippet (GraphQL)
    ↓
SnippetController.createSnippet()
    ↓
SnippetService.createSnippet()
    ├─ ✅ Creates CodeSnippet in MongoDB
    └─ ❌ No SessionHistory record
        
User joins session (WebSocket)
    ↓
CollaborationController.handleUserJoin()
    ├─ ✅ Tracks in CollaborationService (in-memory)
    └─ ❌ No SessionHistory record
    
Admin visits dashboard
    ↓
AdminController.getAllSessions()
    ↓
AdminDashboardService.getAllSessions()
    ↓
SessionHistoryRepository.findAllByOrderByCreatedAtDesc()
    ↓
Database query returns: EMPTY LIST ❌
```

### Expected Flow (FIXED)
```
User creates snippet (GraphQL)
    ↓
SnippetController.createSnippet()
    ↓
SnippetService.createSnippet()
    ├─ ✅ Creates CodeSnippet in MongoDB
    └─ ✅ Creates SessionHistory in PostgreSQL
        
User joins session (WebSocket)
    ↓
CollaborationController.handleUserJoin()
    ├─ ✅ Tracks in CollaborationService (in-memory)
    └─ ✅ Updates SessionHistory with participant info
    
Admin visits dashboard
    ↓
AdminController.getAllSessions()
    ↓
AdminDashboardService.getAllSessions()
    ↓
SessionHistoryRepository.findAllByOrderByCreatedAtDesc()
    ↓
Database query returns: [Session 1, Session 2, ...] ✅
```

---

## Required Code Changes

### Change 1: SnippetController - Inject AdminDashboardService
**File:** `backend/src/main/java/com/codesharing/platform/controller/SnippetController.java`

Add dependency injection and call createSession when snippet is created.

### Change 2: SnippetController.createSnippet() - Track Session
After creating snippet, create corresponding SessionHistory record.

### Change 3: CollaborationController - Inject AdminDashboardService
**File:** `backend/src/main/java/com/codesharing/platform/websocket/CollaborationController.java`

Add dependency injection to access session tracking service.

### Change 4: CollaborationController.handleUserJoin() - Add Participant Tracking
When a user joins:
1. Check if SessionHistory exists for this snippetId
2. If not, create it (for cases where WebSocket join happens before snippet creation)
3. Add participant to session
4. Track browser/OS information

### Change 5: CollaborationController.handleUserLeave() - Track Departure
When user leaves, update participant information (departure time, session duration).

### Change 6: SessionHistoryRepository - Add Query Methods
Ensure repository has proper queries:
- `findAllByOrderByCreatedAtDesc(Pageable)` - List all sessions
- `searchSessions(String query, Pageable)` - Search by title/owner
- `findBySnippetId(String)` - Get specific session

---

## Implementation Plan

### Phase 1: Database & Service Layer
1. Verify SessionHistoryRepository queries exist
2. Verify ParticipantSessionRepository is properly configured
3. Test AdminDashboardService methods manually

### Phase 2: SnippetController Integration
1. Inject AdminDashboardService into SnippetController
2. Modify createSnippet() to call adminDashboardService.createSession()
3. Add logging to track session creation

### Phase 3: CollaborationController Integration
1. Inject AdminDashboardService into CollaborationController
2. Modify handleUserJoin() to create/update SessionHistory
3. Add participant tracking with browser/OS information
4. Modify handleUserLeave() to mark participant as left

### Phase 4: Testing
1. Create snippet → Verify SessionHistory record created
2. Join session → Verify participant added
3. View admin dashboard → Verify sessions listed
4. Search sessions → Verify search works
5. View session details → Verify participant info shown

---

## Affected Entities

### SessionHistory (PostgreSQL)
- snippetId: Identifier linking to CodeSnippet
- ownerId, ownerUsername, ownerEmail: Owner information
- isOwnerAnonymous: Whether owner is anonymous
- snippetTitle, snippetLanguage: Code metadata
- participantCount: Total participants
- sessionStatus: ACTIVE, COMPLETED, ABANDONED
- createdAt, endedAt: Timestamps
- securityEventCount: Number of security events

### ParticipantSession (PostgreSQL)
- sessionHistory: Reference to SessionHistory
- userId, username: Participant identifier
- isOwner, isAnonymous: Participant role
- ipAddress, userAgent: Connection info
- browserName, browserVersion, osName, osVersion: Device info
- joinedAt, leftAt: Participation timing
- durationSeconds: How long they participated

---

## Testing Scenarios

### Scenario 1: Anonymous Owner Session
1. Create snippet as anonymous user
   - ✅ Should create SessionHistory with isOwnerAnonymous = true
2. Owner joins session via WebSocket
   - ✅ Should add participant with isOwner = true
3. View admin dashboard
   - ✅ Should show session with "Anonymous" as owner

### Scenario 2: Anonymous Owner + Joinee Session
1. Owner creates snippet (anonymous)
   - ✅ Should create SessionHistory
2. Joinee joins via shared URL
   - ✅ Should add participant with isOwner = false
3. View admin dashboard
   - ✅ Should show session with 2 participants

### Scenario 3: Session Duration Tracking
1. Create and join session
   - ✅ joinedAt recorded
2. Leave session (WebSocket disconnect)
   - ✅ leftAt recorded
   - ✅ durationSeconds calculated
3. View session details
   - ✅ Should show each participant's duration

### Scenario 4: Multiple Sessions
1. Create multiple snippets
   - ✅ Should see multiple SessionHistory records
2. View admin dashboard with pagination
   - ✅ Should paginate correctly
3. Search for specific session
   - ✅ Should filter by title/owner name

---

## Database Schema Expected

### session_history table
```
id (BIGINT PRIMARY KEY)
snippet_id (VARCHAR)
collaboration_session_id (VARCHAR)
owner_id (VARCHAR)
owner_username (VARCHAR NOT NULL)
owner_email (VARCHAR)
is_owner_anonymous (BOOLEAN NOT NULL)
owner_ip_address (VARCHAR)
owner_user_agent (TEXT)
owner_browser_name (VARCHAR)
owner_browser_version (VARCHAR)
owner_os_name (VARCHAR)
owner_os_version (VARCHAR)
created_at (TIMESTAMP NOT NULL)
ended_at (TIMESTAMP)
duration_seconds (BIGINT)
snippet_title (VARCHAR)
snippet_description (TEXT)
snippet_language (VARCHAR)
snippet_tags (VARCHAR)
participant_count (INT NOT NULL DEFAULT 1)
security_event_count (INT DEFAULT 0)
session_status (VARCHAR NOT NULL)
updated_at (TIMESTAMP NOT NULL)

INDEXES:
  idx_session_snippet_id (snippet_id)
  idx_session_owner_id (owner_id)
  idx_session_created_at (created_at)
  idx_session_status (session_status)
```

### participant_session table
```
id (BIGINT PRIMARY KEY)
session_history_id (BIGINT FOREIGN KEY)
user_id (VARCHAR)
username (VARCHAR)
is_owner (BOOLEAN)
is_anonymous (BOOLEAN)
ip_address (VARCHAR)
user_agent (TEXT)
browser_name (VARCHAR)
browser_version (VARCHAR)
os_name (VARCHAR)
os_version (VARCHAR)
joined_at (TIMESTAMP NOT NULL)
left_at (TIMESTAMP)
duration_seconds (BIGINT)
created_at (TIMESTAMP NOT NULL)
updated_at (TIMESTAMP NOT NULL)
```

---

## Success Criteria

✅ **When session is created:**
- SessionHistory record appears in PostgreSQL
- Participant information is recorded
- Session shows in admin dashboard

✅ **When participant joins:**
- ParticipantSession record created with device info
- Participant count incremented
- Admin dashboard updated

✅ **When participant leaves:**
- leftAt timestamp recorded
- durationSeconds calculated
- Session status updated if all participants left

✅ **Admin Dashboard:**
- Lists all sessions with owner name, creation time, participant count
- Searches work correctly
- Drill-down shows participants and events
- Pagination works

---

## Next Steps

1. ✅ Analysis Complete
2. ⏳ Implement Phase 1-4 changes
3. ⏳ Test all scenarios
4. ⏳ Document final fixes
5. ⏳ Push to GitHub for review
