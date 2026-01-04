# Testing Copy/Paste Prevention Fix

## Overview
This document provides step-by-step instructions to verify that the copy/paste/cut prevention fix is working correctly for joinee sessions.

## Bug That Was Fixed
**Issue:** Joinee users could copy and paste code despite security restrictions.

**Root Cause:** The security event listeners were only being set up when the editor was locked (`isLocked === true`). Since the lock feature is separate from the copy/paste restriction feature, joinee sessions could perform copy/paste operations when the editor wasn't locked.

**Fix Applied:**
- Modified `EditorPage.tsx` lines 607-621 to ALWAYS set up security listeners for joinee sessions
- Changed from: `if (!editorRef.current || !isJoineeSession || !isLocked)` 
- Changed to: `if (!editorRef.current || !isJoineeSession)`
- Now copy/paste restrictions apply to ALL joinee sessions regardless of lock state
- Added keyboard shortcut prevention (Ctrl+C, Ctrl+V, Ctrl+X) to `editorSecurity.ts`

## Test Environment Requirements
1. Two browser windows or tabs
2. Application running on `https://localhost` (frontend)
3. Access to browser developer console (F12)

## Test Scenarios

### Test 1: Basic Copy Prevention
**Objective:** Verify that Ctrl+C is blocked in joinee session

**Steps:**
1. Open `https://localhost` in Browser 1
2. Log in as Owner user (e.g., Username: "owner", Password: "password")
3. Create a new snippet (e.g., "Test Snippet", "console.log('hello')")
4. Copy the snippet URL from the URL bar
5. Open `https://localhost` in Browser 2 (or new tab)
6. Log in as Joinee user (e.g., Username: "joinee", Password: "password")
7. Paste the snippet URL and access the shared snippet
8. In the editor, select some code text
9. Try to copy with Ctrl+C
10. Check browser console (F12) for message: `"[EditorSecurity] Copy (Ctrl+C) attempt blocked"`

**Expected Result:**
- Text should NOT be copied to clipboard
- Console should show security message
- No error messages in console

---

### Test 2: Basic Paste Prevention
**Objective:** Verify that Ctrl+V is blocked in joinee session

**Steps:**
1. From Test 1, keep the joinee session active
2. Copy some text from elsewhere (not in the editor): `console.log('test')`
3. Click in the editor content area
4. Try to paste with Ctrl+V
5. Check browser console for message: `"[EditorSecurity] Paste (Ctrl+V) attempt blocked"`

**Expected Result:**
- Text should NOT appear in the editor
- Console should show security message
- No error messages in console

---

### Test 3: Basic Cut Prevention
**Objective:** Verify that Ctrl+X is blocked in joinee session

**Steps:**
1. From Test 1, keep the joinee session active
2. Select some text in the editor
3. Try to cut with Ctrl+X
4. Check browser console for message: `"[EditorSecurity] Cut (Ctrl+X) attempt blocked"`

**Expected Result:**
- Selected text should remain unchanged
- Text should NOT be copied to clipboard
- Console should show security message
- No error messages in console

---

### Test 4: Context Menu Prevention (Right-Click)
**Objective:** Verify that right-click context menu is blocked in joinee session

**Steps:**
1. From Test 1, keep the joinee session active
2. Right-click on the editor content area
3. Check browser console for message: `"[EditorSecurity] Context menu blocked - editor locked"`

**Expected Result:**
- Context menu should NOT appear
- Console should show security message

---

### Test 5: Drag and Drop Prevention
**Objective:** Verify that drag and drop is blocked in joinee session

**Steps:**
1. From Test 1, keep the joinee session active
2. Select some text in the editor
3. Try to drag it somewhere (e.g., outside the editor)
4. Check browser console for message: `"[EditorSecurity] Drag and drop blocked"`

**Expected Result:**
- Drag and drop should not work
- Console should show security message

---

### Test 6: Keyboard Shortcut Prevention on Mac
**Objective:** Verify that Cmd key shortcuts are blocked on macOS (if testing on Mac)

**Steps:**
1. From Test 1 on a Mac system, keep the joinee session active
2. Select some text in the editor
3. Try to copy with Cmd+C
4. Check browser console for message: `"[EditorSecurity] Copy (Cmd+C) attempt blocked"`

**Expected Result:**
- Text should NOT be copied to clipboard
- Console should show security message for Cmd+C (not Ctrl+C)

---

### Test 7: Owner Can Still Copy/Paste
**Objective:** Verify that owner can still perform copy/paste operations

**Steps:**
1. From Test 1, go to Browser 1 (owner session)
2. Select some text in the editor
3. Try to copy with Ctrl+C
4. The text should copy successfully
5. Try to paste with Ctrl+V
6. The text should paste successfully

**Expected Result:**
- Copy/paste should work normally for owner
- No security messages in console
- Full editing capabilities for owner

---

### Test 8: Security Events Recorded
**Objective:** Verify that security events are being recorded and visible in SecurityEventsViewer

**Steps:**
1. From Test 1, owner session should still be open
2. From the editor page, look for "Security Events" button or link
3. Click to open SecurityEventsViewer component
4. Perform various copy/paste/cut attempts in joinee session
5. Watch the security events list update in real-time

**Expected Result:**
- Events like "COPY_ATTEMPT", "PASTE_ATTEMPT", "CUT_ATTEMPT" should appear
- Events should be timestamped
- Owner can see what joinee tried to do

---

## Verification Checklist

- [ ] Test 1: Ctrl+C blocked for joinee
- [ ] Test 2: Ctrl+V blocked for joinee
- [ ] Test 3: Ctrl+X blocked for joinee
- [ ] Test 4: Right-click context menu blocked
- [ ] Test 5: Drag and drop blocked
- [ ] Test 6: Cmd key shortcuts blocked (if on Mac)
- [ ] Test 7: Owner can still copy/paste
- [ ] Test 8: Security events are recorded

## Expected Console Messages

When performing restricted actions in joinee session, you should see these console warnings:

```
[EditorSecurity] Copy (Ctrl+C) attempt blocked
[EditorSecurity] Paste (Ctrl+V) attempt blocked
[EditorSecurity] Cut (Ctrl+X) attempt blocked
[EditorSecurity] Context menu blocked - editor locked
[EditorSecurity] Drag and drop blocked - editor locked
```

## Troubleshooting

### Issue: Console messages not appearing
**Solution:**
- Verify frontend rebuild was successful (check docker logs)
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh browser (Ctrl+F5)
- Check that `editorRef.current` is properly set (should be the editor element)

### Issue: Still able to copy/paste
**Solution:**
- Check browser console for errors
- Verify containers restarted with latest code (run `docker-compose logs frontend`)
- Check that `isJoineeSession` is correctly set to `true`
- Verify security listeners are being attached to the editor DOM element

### Issue: Security events not showing
**Solution:**
- Verify `recordSecurityEvent` callback is properly wired
- Check backend API is receiving security event requests
- Check SecurityEventsViewer component exists and is properly imported

## Files Changed
1. `frontend/src/pages/EditorPage.tsx` - Lines 607-621 (useEffect hook)
2. `frontend/src/utils/editorSecurity.ts` - Added keyboard shortcut prevention

## Regression Testing

After confirming the fix works, verify these features still work:
- [ ] Owner can lock/unlock editor
- [ ] Joinee receives visual lock status indicator
- [ ] Real-time code sync between owner and joinee
- [ ] WebSocket connection stays alive
- [ ] Security events are visible to owner
