# Testing New Snippet Security Event Fix

## Overview
This document guides you through testing the fix for the "Invalid IDs" error that occurred when recording security events for newly created snippets.

## What Was Fixed
- **Issue**: When creating a new snippet and a joinee attempted copy/paste, the error `Cannot record security event: Invalid IDs` was logged
- **Root Cause**: New snippets use placeholder IDs ('new', 'new-snippet-XXXXX') that cannot be parsed as numbers
- **Solution**: 
  - Backend now gracefully skips DB recording for invalid IDs
  - WebSocket notifications still broadcast immediately to owner (real-time)
  - DB recording happens automatically once snippet is saved with real numeric ID
  - No more 400 errors in console

## Test Scenario 1: Copy Attempt on New Snippet

### Steps:
1. **Open Application**
   - Navigate to https://localhost in a browser (or http://localhost)
   - Log in as Owner (e.g., owner account)

2. **Create New Snippet**
   - Click "New Snippet" button
   - DO NOT SAVE YET - keep it as 'new' snippet
   - Copy the snippet URL or note the snippet ID (should be something like 'new' or 'new-snippet-...')

3. **Open Joinee Session (in new browser/tab)**
   - Copy the share URL from owner's snippet
   - Open URL in incognito/private window or different browser
   - Log in as Joinee user
   - Verify the code editor appears and is in READ-ONLY mode

4. **Test Copy Prevention**
   - In the Joinee's editor, try to:
     - **Highlight** some code
     - Press **Ctrl+C** (or Cmd+C on Mac)
     - Expected: Copy blocked, NO error message about invalid IDs
     - Check Owner's window: RED TOAST should appear showing "User attempted COPY"

5. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - **Expected NO errors** like:
     ❌ `Cannot record security event: Invalid IDs`
     ❌ `POST /api/editor/record-event 400`
   - You MAY see INFO logs like:
     ✅ `[EditorLock] Security event not recorded to DB (invalid IDs)`
     ✅ `[EditorLock] Security event broadcast: ...`

6. **Save the Snippet**
   - In Owner's window, click "Save Snippet"
   - Give it a name (e.g., "Test Snippet")
   - Verify snippet is saved and now has a numeric ID

7. **Test Copy Prevention Again (With Real ID)**
   - Joinee attempts copy again
   - Expected:
     ✅ Copy still blocked
     ✅ Toast appears on owner's window
     ✅ NO console errors
     ✅ This time event IS recorded to database

## Test Scenario 2: Paste Attempt on New Snippet

### Steps:
1. **Create Another New Snippet** (same as above)

2. **Joinee Attempts Paste**
   - In Joinee's editor, try to paste with **Ctrl+V**
   - Expected:
     ✅ Paste blocked
     ✅ Owner sees RED TOAST: "User attempted PASTE"
     ✅ NO console errors about invalid IDs

3. **Verify no 400 errors**
   - Check Network tab in DevTools
   - Look for POST to `/api/editor/record-event`
   - Should see **200 response** with success message, not 400

## Test Scenario 3: Cut Attempt on New Snippet

### Steps:
1. **Create Another New Snippet**

2. **Joinee Attempts Cut**
   - Highlight code in Joinee's editor
   - Press **Ctrl+X**
   - Expected:
     ✅ Cut blocked
     ✅ Owner sees RED TOAST: "User attempted CUT"
     ✅ NO console errors

## Test Scenario 4: Context Menu Paste

### Steps:
1. **Create Another New Snippet**

2. **Joinee Right-Clicks in Editor**
   - Right-click in Joinee's editor area
   - Expected:
     ✅ Context menu does NOT appear
     ✅ No error messages

3. **Drag & Drop Prevention**
   - Try to drag & drop code into editor
   - Expected:
     ✅ Drag & drop blocked
     ✅ Owner sees toast if applicable

## Validation Checklist

- [ ] New snippet creation works without console errors
- [ ] Joinee copy attempt: blocked + owner toast appears
- [ ] Joinee paste attempt: blocked + owner toast appears
- [ ] Joinee cut attempt: blocked + owner toast appears
- [ ] No "Cannot record security event: Invalid IDs" errors in console
- [ ] No 400 errors for `/api/editor/record-event` endpoint
- [ ] Backend logs show "Not recorded to DB (invalid IDs)" for new snippets
- [ ] Owner toast notifications appear immediately (real-time)
- [ ] After saving snippet, DB recording works normally
- [ ] Lock/unlock functionality still works
- [ ] Owner can lock editor (joinee becomes read-only)
- [ ] Owner can unlock editor (joinee can edit again)

## Expected Console Logs

### When New Snippet Security Event Occurs:
```
[EditorLock] Security event not recorded to DB (invalid IDs): snippetId=new, sessionId=new-snippet-FYBFBU, userId=unknown
[EditorLock] Security event broadcast: COPY from user for snippet new
```

### Network Response (200 OK, not 400):
```json
{
  "success": true,
  "message": "Event notification sent to owner (DB recording pending - no numeric ID yet)",
  "notRecordedToDb": true,
  "recordingReason": "New snippet - will record after snippet is created with real ID",
  "username": "user@example.com",
  "eventType": "COPY",
  "broadcastedToOwner": true
}
```

### Owner's Toast Notification:
- Color: RED background
- Message: "{username} attempted {eventType}"
- Example: "john@example.com attempted COPY"
- Duration: 4 seconds (auto-dismiss)
- Position: Bottom-right corner

## Test Data

**Owner Account:**
- Email: owner@example.com
- Password: (use your existing test account)

**Joinee Account:**
- Email: joinee@example.com
- Password: (use your existing test account)

## Troubleshooting

### If you see "Cannot record security event: Invalid IDs" error:
1. This means the old code is still running
2. Solution: Docker containers are not updated
   - Run: `docker-compose down && docker-compose up -d --build`
   - Wait 30 seconds for startup
   - Try again

### If toast notification doesn't appear:
1. Check that owner is subscribed to WebSocket
2. Check browser console for WebSocket connection errors
3. Verify snippet ID in browser network tab

### If 400 errors still appear:
1. Force refresh backend: `docker-compose up -d --build`
2. Clear browser cache: Ctrl+Shift+Delete
3. Try in incognito/private window

## Success Criteria

**ALL of the following must be true:**
1. ✅ Owner can create new snippets without console errors
2. ✅ Joinee is locked in read-only mode
3. ✅ Copy/paste/cut attempts are blocked
4. ✅ Owner receives REAL-TIME toast notifications
5. ✅ NO "Invalid IDs" errors in console
6. ✅ NO 400 errors from backend
7. ✅ Owner window shows red toast with attempt details
8. ✅ Toast auto-dismisses after 4 seconds
9. ✅ Lock/unlock works correctly
10. ✅ After saving snippet, DB recording works

When all criteria are met, the fix is **COMPLETE AND WORKING!**

