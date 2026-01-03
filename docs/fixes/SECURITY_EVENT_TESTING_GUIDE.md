# Security Events Fix - Testing Guide

## Overview

This document provides step-by-step instructions to test the security event broadcasting fix where the owner should receive notifications when a joinee attempts copy, paste, or cut operations.

---

## Test Environment Setup

### Prerequisites
- Two browser windows/tabs available
- Both frontend and backend containers running
- Network access to localhost (HTTPS or HTTP depending on setup)

### Container Status Check
```bash
docker-compose ps
```

Expected output:
```
✅ code-sharing-backend    Up 23 minutes (healthy)
✅ code-sharing-frontend   Up 23 minutes (healthy)
✅ code-sharing-mongodb    Up 23 minutes (healthy)
✅ code-sharing-postgres   Up 23 minutes (healthy)
```

---

## Test Case 1: Owner Receives Copy Attempt Notification

### Setup
1. **Tab 1 (Owner)**: 
   - Navigate to `https://localhost`
   - Click "New Snippet" button
   - Enter title, code, and language
   - Note the share URL or tiny code shown

2. **Tab 2 (Joinee)**:
   - Use the share URL from Tab 1
   - Or navigate to `/join/{tinyCode}`
   - Enter a username when prompted

### Execute
1. **Tab 1**: Open browser DevTools (F12) → Console tab
2. **Tab 2**: Open browser DevTools → Console tab
3. **Tab 2**: Select some text in the editor
4. **Tab 2**: Press `Ctrl+C` (copy)

### Expected Results

**Tab 1 (Owner) - Visual**:
- ✅ Toast notification appears: `"{username} attempted COPY_ATTEMPT"`
- ✅ Toast is red/pink colored
- ✅ Toast appears in bottom right corner
- ✅ Toast auto-dismisses after 4 seconds

**Tab 1 (Owner) - Console**:
```
[useWebSocketCollaboration] Checking if owner and onSecurityEvent callback provided: { isOwner: true, hasCallback: true }
[useWebSocketCollaboration] ✓ Owner session - setting up security event subscription for snippetId: abc123
[useWebSocketCollaboration] ✓ Subscription request sent to webSocketService
[WebSocketService] subscribeToSecurityEvents called for snippetId: abc123, topic: /topic/snippet/abc123/security-events
[WebSocketService] ✓ Connection ensured, now subscribing to topic: /topic/snippet/abc123/security-events
[WebSocketService] 🎯 SECURITY EVENT RECEIVED on topic: /topic/snippet/abc123/security-events
[useWebSocketCollaboration] ✓✓ Security event callback INVOKED with event: { type: 'SECURITY_EVENT', ... }
[EditorPage] 🎯 onSecurityEvent CALLBACK INVOKED
[Security] Toast notification: Joinee_Username attempted copy_attempt
```

**Tab 2 (Joinee) - Visual**:
- ✅ Copy action is BLOCKED (text not copied to clipboard)
- ✅ Editor stays focused

**Tab 2 (Joinee) - Console**:
```
[EditorSecurity] Copy (Ctrl+C) attempt blocked, calling onSecurityEvent
[EditorSecurity] KeyDown event triggered: { isLocked: true, key: 'c', ctrlKey: true, metaKey: false }
[EditorSecurity] Editor locked, checking for restricted key combinations...
[EditorSecurity] Copy (Ctrl+C) attempt blocked, calling onSecurityEvent
[useEditorLock] Security event processed: { success: true, message: '...', eventType: 'COPY_ATTEMPT', ... }
[EditorLock] Security event broadcast: COPY_ATTEMPT from Joinee_Username for snippet abc123
```

### Test Result
- [ ] ✅ PASS - Owner received notification
- [ ] ❌ FAIL - Owner did NOT receive notification (If failed, check logs for errors)

---

## Test Case 2: Owner Receives Paste Attempt Notification

### Setup
(Same as Test Case 1)

### Execute
1. **Tab 1**: DevTools Console open
2. **Tab 2**: DevTools Console open  
3. **Tab 2**: Click in the editor code area
4. **Tab 2**: Press `Ctrl+V` (paste)

### Expected Results

**Tab 1 (Owner) - Visual**:
- ✅ Toast notification: `"{username} attempted PASTE_ATTEMPT"`

**Tab 1 (Owner) - Console**:
```
[WebSocketService] 🎯 SECURITY EVENT RECEIVED on topic: /topic/snippet/abc123/security-events
[Security] Toast notification: Joinee_Username attempted paste_attempt
```

**Tab 2 (Joinee) - Visual**:
- ✅ Paste action is BLOCKED

### Test Result
- [ ] ✅ PASS - Owner received paste notification
- [ ] ❌ FAIL - Check console for errors

---

## Test Case 3: Owner Receives Cut Attempt Notification

### Setup
(Same as Test Case 1)

### Execute
1. **Tab 1**: DevTools Console open
2. **Tab 2**: DevTools Console open
3. **Tab 2**: Select some text in the editor
4. **Tab 2**: Press `Ctrl+X` (cut)

### Expected Results

**Tab 1 (Owner) - Visual**:
- ✅ Toast notification: `"{username} attempted COPY_ATTEMPT"` (cut is logged as copy)

**Tab 2 (Joinee) - Visual**:
- ✅ Cut action is BLOCKED
- ✅ Text is not removed from editor

### Test Result
- [ ] ✅ PASS - Owner received cut notification
- [ ] ❌ FAIL - Check console for errors

---

## Test Case 4: Joinee Session Does NOT Subscribe to Security Events

### Setup
(Same as Test Case 1)

### Execute
1. **Tab 2 (Joinee)**: Open DevTools → Console
2. **Look for subscription logs**

### Expected Results

**Tab 2 (Joinee) - Console**:
```
[useWebSocketCollaboration] Checking if owner and onSecurityEvent callback provided: { isOwner: false, hasCallback: true }
[useWebSocketCollaboration] ✗ Joinee session - skipping security event subscription (only owner receives these)
```

Should NOT see:
```
❌ [useWebSocketCollaboration] ✓ Subscription request sent to webSocketService
❌ [WebSocketService] subscribeToSecurityEvents called
```

### Test Result
- [ ] ✅ PASS - Joinee doesn't subscribe (correct behavior)
- [ ] ❌ FAIL - Joinee is subscribing (wrong behavior)

---

## Test Case 5: Owner's Own Actions Don't Trigger Notifications

### Setup
1. **Tab 1 (Owner)**: Owner session (not joinee)
2. **Close Tab 2** (Joinee) or use a different snippet

### Execute
1. **Tab 1**: Open DevTools → Console
2. **Tab 1**: Select text and press `Ctrl+C` (copy)
3. **Tab 1**: Text should copy successfully

### Expected Results

**Tab 1 (Owner) - Visual**:
- ✅ Copy action SUCCEEDS (text IS copied)
- ✅ NO toast notification appears
- ✅ Owner can use editor normally

**Tab 1 (Owner) - Console**:
- ✅ NO "SECURITY_EVENT RECEIVED" logs
- ✅ NO toast notifications

### Test Result
- [ ] ✅ PASS - Owner's actions work normally
- [ ] ❌ FAIL - Owner received unwanted notification

---

## Test Case 6: Backend Broadcasting Works Correctly

### Setup
(Same as Test Case 1)

### Execute
1. Open terminal/command prompt
2. Check backend logs:
   ```bash
   docker logs code-sharing-backend -f
   ```
3. **Tab 2 (Joinee)**: Trigger a copy attempt (`Ctrl+C`)

### Expected Results

**Backend Logs** should show:
```
[EditorLock] Security event recorded to database: COPY_ATTEMPT from Joinee_Username
[EditorLock] Security event broadcast: COPY_ATTEMPT from Joinee_Username for snippet abc123
```

### Test Result
- [ ] ✅ PASS - Backend logs show broadcast
- [ ] ❌ FAIL - Backend logs don't show broadcast

---

## Common Issues & Solutions

### Issue 1: Owner Not Receiving Any Notifications

**Symptoms**:
- Tab 1 (Owner): No toast appears
- Console shows no "SECURITY_EVENT RECEIVED" logs

**Solutions**:
1. ✅ Check `isOwner` is true in owner tab console:
   ```javascript
   // In owner console, check
   localStorage.getItem('persistentUserId') // Should exist
   sessionStorage.getItem('sessionUserId')  // Should exist
   ```

2. ✅ Check WebSocket connection:
   ```javascript
   // In owner console
   [WebSocketService] 🎯 Connection ensured
   [useWebSocketCollaboration] ✓ Successfully joined snippet
   ```

3. ✅ Verify subscription setup:
   ```
   Look for: [useWebSocketCollaboration] ✓ Subscription request sent to webSocketService
   ```

4. ✅ Check backend is broadcasting:
   ```bash
   docker logs code-sharing-backend | grep -i "security.*broadcast"
   ```

### Issue 2: Owner Receiving Toast But Joinee's Copy Still Works

**Symptoms**:
- Owner sees notification ✅
- Joinee's copy action succeeds ❌ (should be blocked)

**Solution**:
- The joinee's editor might not be locked
- Check `useEditorLock` is initialized for joinee
- Verify `isJoineeSession` is true

### Issue 3: WebSocket Connection Failed

**Symptoms**:
- Console shows `✗ Failed to connect to WebSocket`
- No subscription logs

**Solutions**:
1. Check containers are running: `docker-compose ps`
2. Check backend logs: `docker logs code-sharing-backend`
3. Verify network: Can you access `https://localhost:8080` in browser?
4. Check WebSocket port: Should be `8080` with path `/ws`

---

## Success Criteria

All tests should PASS:
- [x] Test 1: Copy attempt notification ✅
- [x] Test 2: Paste attempt notification ✅
- [x] Test 3: Cut attempt notification ✅
- [x] Test 4: Joinee doesn't subscribe ✅
- [x] Test 5: Owner's actions unaffected ✅
- [x] Test 6: Backend broadcasting works ✅

---

## Performance Metrics

### Expected Behavior
- **Owner receives notification**: < 1 second after joinee's copy/paste attempt
- **Toast appears and disappears**: Within 4 seconds
- **No performance degradation**: Editor remains responsive

### Measurement
1. Note the time when joinee presses `Ctrl+C`
2. Count seconds until owner's toast appears
3. Should be < 1 second

---

## Rollback Instructions

If testing reveals critical issues:

```bash
# Revert changes
git checkout HEAD -- frontend/src/hooks/useWebSocketCollaboration.ts
git checkout HEAD -- frontend/src/pages/EditorPage.tsx

# Rebuild and restart
npm run build --prefix frontend
docker-compose restart code-sharing-frontend

# Verify
docker-compose ps
```

---

## Logging Guide

### Important Logs to Watch

**Owner Session Logs**:
```
[useWebSocketCollaboration] ✓ Owner session - setting up security event subscription
[WebSocketService] 🎯 SECURITY EVENT RECEIVED
[EditorPage] 🎯 onSecurityEvent CALLBACK INVOKED
[Security] Toast notification:
```

**Joinee Session Logs**:
```
[useWebSocketCollaboration] ✗ Joinee session - skipping security event subscription
[EditorSecurity] (Ctrl+C) attempt blocked
[EditorLock] Security event processed
[EditorLock] Security event broadcast
```

**Backend Logs**:
```
[EditorLock] Security event recorded to database
[EditorLock] Security event broadcast
```

---

## Report Format

When reporting test results:

```
## Test Execution Report

**Date**: [Date]  
**Tester**: [Name]  
**Environment**: Docker (frontend/backend/mongo/postgres)

### Test Results
- [ ] Test 1 (Copy): ✅ PASS / ❌ FAIL
- [ ] Test 2 (Paste): ✅ PASS / ❌ FAIL
- [ ] Test 3 (Cut): ✅ PASS / ❌ FAIL
- [ ] Test 4 (No Subscribe): ✅ PASS / ❌ FAIL
- [ ] Test 5 (Owner Works): ✅ PASS / ❌ FAIL
- [ ] Test 6 (Backend): ✅ PASS / ❌ FAIL

### Issues Found
(List any failures)

### Notes
(Any additional observations)
```

---

**Testing Guide Version**: 1.0  
**Last Updated**: December 29, 2025  
**Status**: Ready for Testing
