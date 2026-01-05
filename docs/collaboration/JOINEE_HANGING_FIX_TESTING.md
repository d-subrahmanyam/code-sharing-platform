# Joinee Hanging Fix - Testing & Verification Guide

## Pre-Testing Setup

### Requirements

- ✅ Frontend built: `npm run build` in frontend directory
- ✅ Backend running: `mvn spring-boot:run` or Docker container
- ✅ MongoDB and PostgreSQL running
- ✅ WebSocket connection working
- ✅ Two separate browsers or tabs available

### Build Status

```
Frontend Build: ✅ PASSED
└─ No TypeScript errors
└─ Vite build successful in 4.04s
└─ All dependencies resolved

Backend: Should be running on http://localhost:8080
Frontend: Should be running on http://localhost:5173 (dev) or container port (prod)
```

## Test Case 1: Existing Snippet - Single Joinee

### Setup
1. Create a snippet in the application or use existing snippet ID
2. Note the snippet ID (e.g., `abcd1234`)
3. Get the "tiny code" for the snippet

### Test Steps

**Owner Tab:**
```
1. Navigate to: http://localhost:5173/start/{tinyCode}
   └─ Replace {tinyCode} with actual code
2. Wait for code to load (snippet content should appear)
3. Verify console shows:
   └─ "[EditorPage] Owner initial broadcast: sending code to joinee"
   └─ "[EditorPage] ✓ Owner initial code broadcasted"
4. Keep tab open and active
```

**Joinee Tab (New Window/Tab):**
```
1. Open http://localhost:5173/join/{tinyCode}
   └─ Use SAME tinyCode from owner
2. You should see:
   └─ Overlay: "Connecting to Session... Waiting for owner to share their code"
3. You should ALSO see:
   └─ Username input dialog (enter any username)
4. Time the overlay:
   └─ Should disappear within 1-2 seconds ✓
5. After overlay disappears, verify:
   └─ Owner's code is visible
   └─ Code matches exactly what owner has
   └─ Syntax highlighting is correct
6. Check console for:
   └─ "[WebSocket] Code change message received"
   └─ "[WebSocket] ✓ Applying code changes from owner"
   └─ "[WebSocket] Setting joineeReceivedInitialContent to true (code received)"
```

**Verification:**
- [ ] Owner console shows "Owner initial broadcast"
- [ ] Joinee overlay appears briefly (< 2 seconds)
- [ ] Joinee sees identical code as owner
- [ ] No console errors
- [ ] Joinee console shows code received logs

### Expected Result: ✅ PASS

```
Owner can see joinee joined in participant list
Joinee can see owner's code immediately
Both can edit and see changes in real-time
```

---

## Test Case 2: Existing Snippet - Multiple Joinee

### Setup
Same as Test Case 1

### Test Steps

**Owner Tab:**
```
Same as Test Case 1 (steps 1-4)
```

**Joinee Tab 1:**
```
Same as Test Case 1 (steps 1-6)
```

**Joinee Tab 2:**
```
1. Open NEW browser tab/window with http://localhost:5173/join/{tinyCode}
2. Enter different username (e.g., "Joinee2")
3. Verify overlay appears and disappears
4. Check console for code received logs
5. Verify code matches what joinee 1 sees
```

**Verification:**
- [ ] Owner console shows broadcast only once (not repeated per joinee)
- [ ] Both joinee tabs receive code within 2 seconds
- [ ] All three users show in participant list
- [ ] All see identical code
- [ ] All can edit simultaneously

### Expected Result: ✅ PASS

```
Owner broadcasts code once to multiple joinee connections
All joinee instances receive code and overlay disappears
No hanging or delays observed
```

---

## Test Case 3: New Snippet (Both Users Creating)

### Setup
Fresh new snippet creation

### Test Steps

**Owner Tab:**
```
1. Navigate to: http://localhost:5173/start/new
2. Wait for editor to load
3. Type some initial code, e.g.:
   ```
   function hello() {
     console.log("Hello World");
   }
   ```
4. Check console for logs (should NOT see broadcast logs yet)
5. Keep editor open
```

**Joinee Tab:**
```
1. Wait ~3 seconds for owner to create snippet
2. Get the snippet ID from owner (check localStorage or URL)
3. Navigate to: http://localhost:5173/join/{tinyCode}
4. Enter username
5. You should see overlay
6. Owner should have started typing by now
7. Verify code appears as owner types
8. Check console logs
```

**Verification:**
- [ ] Owner doesn't broadcast for "new" snippets (correct behavior)
- [ ] Code appears naturally as owner types (existing behavior)
- [ ] No regression in new snippet workflow
- [ ] Both users can edit once code appears

### Expected Result: ✅ PASS

```
New snippets work as before (no regression)
Fix doesn't interfere with new snippet creation
```

---

## Test Case 4: Owner Has No Code

### Setup
Snippet exists but is empty

### Test Steps

**Owner Tab:**
```
1. Navigate to empty snippet with /start/{tinyCode}
2. Wait for load
3. Verify console does NOT show broadcast logs (no code yet)
4. Type first character
```

**Joinee Tab:**
```
1. Join with /join/{tinyCode}
2. See overlay
3. After owner types, code should appear
4. Overlay should disappear
```

**Verification:**
- [ ] Broadcast doesn't happen for empty snippets
- [ ] Code appears when owner starts typing
- [ ] Overlay disappears normally

### Expected Result: ✅ PASS

```
Empty snippets handled correctly
Fix waits for code before sending
```

---

## Test Case 5: Slow Network Simulation

### Setup
Use Chrome DevTools to throttle network

### Test Steps

**Setup Network Throttling:**
```
1. Open DevTools (F12)
2. Go to Network tab
3. Click "No throttling" dropdown
4. Select "Slow 3G"
5. Keep DevTools open
```

**Owner Tab:**
```
1. Navigate to /start/{tinyCode} with throttling
2. Wait for code to load (will be slower)
3. Check console logs timing
```

**Joinee Tab:**
```
1. While network is still slow, join with /join/{tinyCode}
2. Overlay should appear
3. Observe how long overlay takes to disappear
4. It should still be within reasonable time (< 5 seconds on slow network)
5. Verify no console errors
```

**Verification:**
- [ ] No race conditions with slow network
- [ ] Code eventually appears correctly
- [ ] No WebSocket disconnection errors
- [ ] Overlay disappears after code arrives

### Expected Result: ✅ PASS

```
Fix is robust to network latency
Code still broadcasts even on slow connections
```

---

## Test Case 6: Rapid Disconnect/Reconnect

### Setup
Test resilience to connection drops

### Test Steps

**Owner Tab:**
```
1. Navigate to /start/{tinyCode}
2. Wait for code to load and broadcast
3. Open DevTools → Network
4. Right-click and "Offline"
5. Wait 5 seconds
6. Right-click and "Online"
```

**Joinee Tab:**
```
1. Before owner goes offline: join with /join/{tinyCode}
2. You should see code (already received)
3. When owner goes offline, your connection should drop
4. You should see connection indicator change
5. When owner comes back online, you should reconnect
6. Code should still be there
```

**Verification:**
- [ ] Disconnection handled gracefully
- [ ] No duplicate code sends on reconnect
- [ ] useRef prevents second broadcast on reconnect
- [ ] Code state preserved

### Expected Result: ✅ PASS

```
Reconnection doesn't trigger duplicate broadcasts
Code state is maintained across disconnect/reconnect
```

---

## Console Log Reference

### Owner Logs (Successful Broadcast)

```javascript
// When owner joins with code and detects joinee
[EditorPage] Owner initial broadcast: sending code to joinee {
  codeLength: 245
  language: "javascript"
  activeUsersCount: 2
}

// Immediately after
[Editor] Sending code change, snippetId: snippet123, userId: owner-id, username: Owner

// WebSocket confirmation
[WebSocket] Code change sent successfully

// Final confirmation
[EditorPage] ✓ Owner initial code broadcasted
```

### Joinee Logs (Successful Code Reception)

```javascript
// Connection established
[WebSocket] Connected to WebSocket

// Code received
[WebSocket] Code change message received {
  code: "function hello() { ... }"
  language: "javascript"
  userId: "owner-id"
  username: "Owner"
}

// Applying changes
[WebSocket] ✓ Applying code changes from owner

// State update
[WebSocket] Setting joineeReceivedInitialContent to true (code received)

// Overlay condition
[EditorPage] Joinee loading overlay state: {
  joineeReceivedInitialContent: true  // ← This should be TRUE
  shouldShowOverlay: false              // ← This should be FALSE
}
```

---

## Failure Scenarios & Diagnostics

### Scenario: Overlay Still Visible After 5 Seconds

**Diagnosis Steps:**

1. **Check Owner Console:**
   ```javascript
   // Should see this log
   console.log("[EditorPage] Owner initial broadcast:")
   
   // If NOT present, check:
   - Is user owner? (check isOwner variable)
   - Is code loaded? (check formData.code)
   - Are there 2+ active users? (check activeUsers.length)
   ```

2. **Check Network Tab:**
   - Click WebSocket connection
   - Go to "Messages" tab
   - Look for message to `/app/snippet/{id}/code`
   - Should show code content

3. **Check Backend Logs:**
   - Look for `CollaborationController.handleUserJoin()` logs
   - Verify users are being registered

4. **Check Joinee Console:**
   - Search for "code change message received"
   - If not present, WebSocket subscription issue

**Fix Steps:**
- Refresh both tabs
- Check network connection
- Verify MongoDB has snippet code
- Restart backend if necessary

### Scenario: Duplicate Code Sends

**Diagnosis:**
- Owner console shows broadcast log twice
- Joinee receives code twice

**Cause:**
- Component re-mount (unlikely with useRef guard)
- StrictMode in development causing double render
- Manual test clicking buttons multiple times

**Solution:**
- Normal in StrictMode (expected behavior)
- In production, should only see once

### Scenario: Code Not Visible to Joinee

**Diagnosis:**
- Overlay disappears but code is blank/empty
- Or overlay shows but code never arrives

**Cause:**
- MongoDB snippet not found
- Code field not stored properly
- WebSocket subscription failed

**Solution:**
- Check database for snippet
- Verify backend has code in response
- Check browser DevTools WebSocket frames

---

## Quick Test Checklist

Use this checklist for rapid testing:

```markdown
## Quick Test (5 minutes)

- [ ] Owner opens /start/{code}
- [ ] Joinee opens /join/{code}
- [ ] Overlay appears on joinee
- [ ] Overlay disappears within 2 seconds
- [ ] Joinee sees owner's code
- [ ] Code matches exactly
- [ ] No console errors
- [ ] Both can edit simultaneously
- [ ] Changes sync in real-time

Result: PASS / FAIL
```

---

## Performance Testing

### Metrics to Monitor

1. **Code Broadcast Latency**
   - Measure: Owner broadcasts → Joinee receives
   - Target: < 100ms on local network
   - Acceptable: < 500ms on slow network

2. **Overlay Display Time**
   - Measure: Overlay shows → Overlay disappears
   - Target: < 1 second
   - Acceptable: < 2 seconds

3. **Browser Memory**
   - Monitor: Dev Tools → Memory tab
   - Snapshot before and after session
   - Should not increase significantly

### Monitoring Command

In browser console:
```javascript
// Measure code broadcast time
const start = performance.now()
// [User joins and code is sent]
// [Check when joinee receives in console]
const end = performance.now()
console.log('Broadcast time:', end - start, 'ms')
```

---

## Success Criteria

✅ **The fix is working if:**

1. Joinee overlay appears when joining
2. Overlay disappears within 2 seconds (most cases)
3. Joinee sees exact copy of owner's code
4. No "Waiting for owner" message persists
5. Both users can edit and see changes
6. Console shows expected log messages
7. No errors in DevTools
8. Works with multiple joinee simultaneously
9. No regression in new snippet workflow
10. Performance is acceptable (< 500ms broadcast)

❌ **The fix needs more work if:**

1. Overlay persists > 5 seconds
2. Code is blank/missing
3. Console shows errors
4. Joinee can't edit after code appears
5. Changes don't sync properly
6. Multiple broadcasts happening
7. Joins break existing functionality

---

## Related Files for Testing

- `frontend/src/pages/EditorPage.tsx` - Fix location
- `frontend/src/hooks/useWebSocketCollaboration.ts` - WebSocket logic
- `frontend/src/services/webSocketService.ts` - Message handling
- `backend/src/.../CollaborationController.java` - Backend broadcasting
- `docs/collaboration/JOINEE_HANGING_FIX.md` - Full documentation

---

## Test Results Template

```markdown
# Test Results - Joinee Hanging Fix

Date: [YYYY-MM-DD]
Tester: [Name]
Browser: [Chrome/Firefox/Safari/Edge]
Network: [WiFi/Wired/Throttled]

## Test Case 1: Existing Snippet
Status: [ ] PASS [ ] FAIL
Issues: 
Time to overlay disappear: _____ seconds

## Test Case 2: Multiple Joinee
Status: [ ] PASS [ ] FAIL
Issues:
Broadcast count: ___ (expected: 1)

## Test Case 3: New Snippet
Status: [ ] PASS [ ] FAIL
Issues:

## Test Case 4: Empty Snippet
Status: [ ] PASS [ ] FAIL
Issues:

## Test Case 5: Slow Network
Status: [ ] PASS [ ] FAIL
Issues:

## Overall: [ ] PASS [ ] FAIL

Notes:
```

---

**Fix Status**: ✅ Ready for Testing  
**Build Status**: ✅ Frontend Build Passed  
**Branch**: `fix/joinee-session-hanging`  
**Last Updated**: 2025-01-05
