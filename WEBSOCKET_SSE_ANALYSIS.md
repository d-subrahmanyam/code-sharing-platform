# WebSocket and SSE Analysis - Code Sharing Platform

## Current Implementation Status

### ❌ **NOT USING WebSockets or SSE**

The application is currently using **localStorage + StorageEvent API** for real-time synchronization, which has significant limitations.

---

## Current Architecture Analysis

### What's Currently Being Used:
```
Browser Window A                           Browser Window B
     │                                          │
     ├─ localStorage changes (code, presence)  │
     │                                          │
     └─ StorageEvent fires ────────────────────┘
                                                │
                                         Updates local state
```

### Limitations of Current Approach:

1. **Same-Origin Only**: Only works within the same domain
2. **Same-Device Only**: Works only in browser tabs/windows on the same machine
3. **No Cross-Device Support**: Mobile, tablet, or different computer = no sync
4. **No Server Persistence During Tab Sync**: StorageEvent only for localStorage changes
5. **No Real Backend Integration**: Presence and typing info NOT shared with server
6. **No Authentication Integration**: Any user can read/write to any snippet's presence
7. **No Conflict Resolution**: Simultaneous edits could cause issues
8. **Manual Polling Needed**: Backend doesn't know about active sessions
9. **No Presence Cleanup**: If browser crashes, presence data stays until timeout

---

## WebSocket vs SSE Comparison

### WebSocket (Bidirectional)
```
Client ←→ Server (persistent connection)
- Real-time both directions
- Lower latency
- More complex implementation
- Better for collaborative editing
- Can handle presence, typing, code changes efficiently
```

**Example Flow:**
```
Window A: User types code
    ↓
Window A: Sends via WebSocket: { type: 'CODE_CHANGE', code: '...', snippetId: 'abc' }
    ↓
Server: Receives, validates, broadcasts to ALL connected clients
    ↓
Window B (same device) + Mobile App + Another Browser = ALL see changes
```

### SSE (Server-Sent Events - Unidirectional)
```
Client ←←← Server (server pushes updates)
- One-way communication (server → client)
- Need separate HTTP POST for client → server
- Simpler than WebSocket for one-way scenarios
- Good for notifications, activity feeds
- Less suitable for collaborative editing
```

**Example Flow:**
```
Window A: User types code
    ↓
Window A: Sends via HTTP POST: { code: '...' }
    ↓
Server: Processes, opens SSE connection to broadcast
    ↓
Window B: Receives via EventSource SSE stream
Window Mobile: Receives via EventSource SSE stream
```

---

## Recommended Solution: WebSocket

### Why WebSocket is Better for This Use Case:

1. **Real-time Bidirectional**: Client can send updates, server broadcasts instantly
2. **Presence Tracking**: Server can manage active users, auto-cleanup on disconnect
3. **Typing Indicators**: Efficient broadcasting to all connected users
4. **Code Sync**: Fast, reliable code change distribution
5. **Cross-Device**: One user on web, another on mobile, both sync perfectly
6. **Server Authority**: Server validates all changes before broadcasting
7. **Conflict Resolution**: Server can implement merge strategies
8. **Performance**: One persistent connection vs many HTTP requests

---

## Implementation Plan

### Backend (Spring Boot):
1. Add Spring WebSocket dependency
2. Create WebSocketConfig for STOMP over WebSocket
3. Implement PresenceController with @MessageMapping
4. Implement CodeChangeController with @MessageMapping
5. Create sessions management service
6. Add persistence for active sessions

### Frontend (React):
1. Install `stompjs` and `sockjs-client`
2. Create WebSocket connection hook
3. Replace localStorage presence sync with WebSocket
4. Replace typing indicator with WebSocket messages
5. Replace code sync with WebSocket messages
6. Handle connection reconnection

### Features to Implement:
- ✅ Real-time user presence (join/leave)
- ✅ Active user list (server authoritative)
- ✅ Typing indicators (efficient broadcast)
- ✅ Code changes (with debouncing)
- ✅ Auto-save with conflict resolution
- ✅ Connection status indicator
- ✅ Automatic reconnection
- ✅ Cross-device synchronization
- ✅ Mobile app support ready

---

## Current localStorage Approach Risks

### Issue 1: Duplicate Users on Refresh (PARTIALLY FIXED)
```
Problem: Using hasJoinedPresenceRef prevents duplicates within session
Risk: If user opens same snippet in 2 tabs, both add to presence
Current Fix: hasJoinedPresenceRef per presenceTrackingId (not per tab)
```

### Issue 2: New Users Not Visible to Others (PARTIALLY FIXED)
```
Problem: StorageEvent only fires in OTHER windows
Window A adds User: localStorage updated
Window B sees StorageEvent ✓
Window C sees StorageEvent ✓
Server: DOESN'T KNOW about these users ✗
```

### Issue 3: Typing Indicator (WORKS BUT LIMITED)
```
Works: Within same browser on same device
Fails: Cross-device, cross-browser, mobile
```

### Issue 4: Auto-save (WORKS BUT FRAGMENTED)
```
Component Level: Yes (localStorage sync works)
Backend Level: Dispatches SNIPPET_UPDATE_REQUEST but asynchronously
No Coordination: What if two users save simultaneously?
No Merge: Last write wins (potential data loss)
```

---

## Recommended Next Steps

### Option 1: Quick Fix (Keep localStorage, Add Polling)
- Keep current localStorage approach
- Add polling to backend every 5 seconds
- Backend returns list of active users
- Less ideal but works for current scope

### Option 2: Proper Solution (WebSocket Implementation)
- Implement WebSocket on backend
- Migrate presence tracking to WebSocket
- Migrate typing indicators to WebSocket
- Migrate code sync to WebSocket
- Full cross-device support
- Production-ready

---

## Summary

| Feature | Current (localStorage) | WebSocket |
|---------|----------------------|-----------|
| Same-Device Multi-Tab | ✅ Works | ✅ Works |
| Cross-Device Sync | ❌ No | ✅ Yes |
| Mobile Support | ❌ No | ✅ Yes |
| Server Presence Tracking | ❌ No | ✅ Yes |
| Real-time Typing | ⚠️ Limited | ✅ Full |
| Code Conflict Resolution | ❌ No | ✅ Possible |
| Connection Status | ❌ No | ✅ Yes |
| Scalable | ❌ No | ✅ Yes |

---

## Files Involved

### Backend Changes Needed:
- `pom.xml` - Add WebSocket dependency
- `CodeSharingPlatformApplication.java` - Configure WebSocket
- `config/WebSocketConfig.java` - NEW
- `controller/CollaborationController.java` - NEW
- `service/PresenceService.java` - NEW
- `entity/ActiveSession.java` - NEW (optional)

### Frontend Changes Needed:
- `hooks/useWebSocket.ts` - NEW
- `hooks/usePresence.ts` - Update to use WebSocket
- `pages/EditorPage.tsx` - Update to use WebSocket
- `services/collaborationService.ts` - NEW

---

**Recommendation**: Implement WebSocket for production-ready collaborative editing.
