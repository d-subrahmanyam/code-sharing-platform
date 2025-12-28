# State Sync Testing Guide

## Scenario: Verify joinee receives owner's state on join

### Setup
1. Open browser console for both tabs (dev tools F12)
2. One tab for Owner, one for Joinee

### Step 1: Owner creates a new snippet
1. Open first tab: http://localhost:3000/editor/new
2. Enter username: "Alice"
3. Create snippet with:
   - Title: "Test Snippet"
   - Code: "console.log('Hello from Alice');"
   - Language: "javascript"
4. Copy the share URL (something like http://localhost:3000/join/xxx)

### Step 2: Joinee joins the session
1. Open second tab with the share URL
2. Enter username: "Bob"
3. Observe console for:
   - [useWebSocketCollaboration] ✓ Successfully joined snippet
   - [useWebSocketCollaboration] Requesting state sync for {snippetId}
   - [useWebSocketCollaboration] ✓ State sync requested
   - [EditorPage] State sync request received

### Step 3: Verify state sync
**Owner should see:**
- [EditorPage] State sync request received: { requesterId: ... }
- [EditorPage] Owner broadcasting current state...

**Joinee should receive:**
- Code: "console.log('Hello from Alice');"
- Title: "Test Snippet"
- Language: "javascript"

### Step 4: Owner makes changes
1. Owner updates code to: "console.log('Updated by Alice');"
2. Owner updates title to: "Updated Test Snippet"

**Joinee should immediately see:**
- Code update: "console.log('Updated by Alice');"
- Title update: "Updated Test Snippet"

## Expected Console Logs

### Owner Console
```
[useWebSocketCollaboration] ✓ Successfully joined snippet xxx
[Sync] User Bob (user_xxx) requesting state sync for snippet xxx
[EditorPage] State sync request received: {requesterId: 'user_xxx', requesterUsername: 'Bob'}
[EditorPage] Owner broadcasting current state in response to joinee sync request
[sendCodeChange] Sending via WebSocket
[sendMetadataUpdate] Sending via WebSocket
```

### Joinee Console
```
[useWebSocketCollaboration] ✓ Successfully joined snippet xxx
[useWebSocketCollaboration] Requesting state sync for xxx
[useWebSocketCollaboration] ✓ State sync requested
[useWebSocketCollaboration] State sync message received
[WebSocket] Code change from Alice
[WebSocket] ✓ Applying code change from other user
[WebSocket] Metadata update received from Alice
[WebSocket] ✓ Applying metadata changes from owner
```

## Success Criteria
✓ Joinee receives code immediately without waiting for owner to edit
✓ Joinee receives title immediately without waiting for owner to edit
✓ Subsequent changes are still synchronized in real-time
✓ Owner can identify joinee from presence list
✓ Both users can edit and see changes immediately
