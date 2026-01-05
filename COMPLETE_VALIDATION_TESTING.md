# Complete Feature Validation Testing Guide

**Status:** All features deployed and ready for testing  
**Application URL:** https://localhost  
**Containers:** All 4 containers running and healthy ✅

---

## Overview of Features to Validate

| Feature | Owner | Joinee | Status |
|---------|-------|--------|--------|
| **1. Lock/Unlock Editor** | Can lock/unlock | Gets read-only when locked | Testing |
| **2. Copy/Paste Restrictions** | No restrictions | Blocked on all attempts | Testing |
| **3. Toast Notifications** | Sees alerts when joinee attempts | No alerts shown | Testing |

---

## SETUP: Create Two Sessions

### Step 1: Open Two Browser Windows/Tabs

**Window/Tab 1: OWNER SESSION**
- Open: https://localhost
- Login with any credentials (e.g., username: "owner")
- Create a new snippet with test code:
  ```javascript
  console.log('Hello from Owner');
  const x = 42;
  function testFn() {
    return 'testing';
  }
  ```
- Copy the snippet share URL
- Keep this window open for all tests

**Window/Tab 2: JOINEE SESSION**
- Open: https://localhost
- Login with different credentials (e.g., username: "joinee" or "jane")
- Paste the shared snippet URL to join the same snippet
- You should see the owner's code appear
- Keep this window open for all tests

---

## TEST 1: Lock/Unlock Editor (Read-Only Mode)

### Test 1.1: Default State (Editor Unlocked)

**In JOINEE Window:**
1. Look at the editor area
2. Try to click and type some text
3. Expected: Text should appear in editor ✅ **(Joinee can edit)**

**Status:** [ ] PASS [ ] FAIL

**What to look for:**
- Text cursor should appear when clicking
- Typing should add text immediately
- No "read-only" messages

---

### Test 1.2: Owner Locks the Editor

**In OWNER Window:**
1. Look for a "🔒 Lock Editor" button (usually near the top or right side)
2. Click the Lock button
3. You should see status change to "🔒 Locked"

**Status:** [ ] PASS [ ] FAIL

**What to look for:**
- Button changes to "🔓 Unlock" or similar
- Status indicator shows "Locked" or lock icon
- Button is clearly visible

---

### Test 1.3: Joinee Gets Read-Only (When Locked)

**In JOINEE Window (immediately after owner locks):**
1. Try to click in the editor and type something
2. Expected: Text should NOT appear ❌ **(Editor is read-only)**
3. Try to select text
4. Expected: Text selection should work (read-only, but can select)

**Status:** [ ] PASS [ ] FAIL

**What to look for:**
- Cursor should NOT appear when clicking
- No text should be typed
- Text is visible but uneditable
- Optional: "Read-only" message or disabled state

---

### Test 1.4: Owner Unlocks the Editor

**In OWNER Window:**
1. Click the unlock button (should now show "🔓 Unlock Editor")
2. Expected: Status changes back to "🔓 Unlocked"

**Status:** [ ] PASS [ ] FAIL

---

### Test 1.5: Joinee Can Edit Again (After Unlock)

**In JOINEE Window (immediately after owner unlocks):**
1. Try to click in the editor and type text again
2. Expected: Text should appear again ✅ **(Joinee can edit)**

**Status:** [ ] PASS [ ] FAIL

**What to look for:**
- Cursor appears when clicking
- Typing works normally
- Any "read-only" message disappears

---

## TEST 2: Copy/Paste Restrictions (Keyboard Shortcuts)

### Test 2.1: Copy Restriction (Ctrl+C)

**In JOINEE Window:**
1. Select some text in the editor (e.g., "console.log")
2. Press **Ctrl+C** (Windows/Linux) or **Cmd+C** (Mac)
3. Open browser console: Press **F12** → Console tab
4. Look for message: `[EditorSecurity] Copy (Ctrl+C) attempt blocked`

**Status:** [ ] PASS [ ] FAIL

**Additional verification:**
- Try to paste the text elsewhere (e.g., in a text box outside the editor)
- Expected: Nothing pastes (copy was blocked)

---

### Test 2.2: Paste Restriction (Ctrl+V)

**In JOINEE Window:**
1. First, copy some text from OUTSIDE the editor (e.g., from browser address bar): `console.log('pasted')`
2. Click in the editor code area
3. Press **Ctrl+V** (Windows/Linux) or **Cmd+V** (Mac)
4. Check browser console (F12 → Console tab)
5. Look for message: `[EditorSecurity] Paste (Ctrl+V) attempt blocked`

**Status:** [ ] PASS [ ] FAIL

**What should happen:**
- The text you copied should NOT appear in the editor
- Console shows the block message
- No errors in console

---

### Test 2.3: Cut Restriction (Ctrl+X)

**In JOINEE Window:**
1. Select some text in the editor (e.g., "return 'testing'")
2. Press **Ctrl+X** (Windows/Linux) or **Cmd+X** (Mac)
3. Check browser console (F12 → Console tab)
4. Look for message: `[EditorSecurity] Cut (Ctrl+X) attempt blocked`

**Status:** [ ] PASS [ ] FAIL

**What should happen:**
- The selected text should NOT be removed
- Console shows the block message
- Selected text remains in the editor

---

### Test 2.4: Right-Click Context Menu Blocked

**In JOINEE Window:**
1. Right-click on the editor code area
2. Expected: Context menu should NOT appear ❌

**Status:** [ ] PASS [ ] FAIL

**What to look for:**
- No context menu appears
- Browser's default right-click menu might still appear (that's okay, the editor's custom menu is blocked)
- Check console for message: `[EditorSecurity] Context menu blocked`

---

### Test 2.5: Copy Works for OWNER (No Restrictions)

**In OWNER Window:**
1. Select some text in the editor
2. Press **Ctrl+C** (or **Cmd+C** on Mac)
3. Check browser console (F12 → Console tab)
4. Expected: NO security block message ✅

**Status:** [ ] PASS [ ] FAIL

**What should happen:**
- Text is copied to clipboard successfully
- NO "[EditorSecurity]" messages in console
- Owner can copy and paste freely

---

## TEST 3: Toast Notifications for Owner

### Test 3.1: Owner Sees Toast When Joinee Tries to Copy

**Setup:**
- Make sure OWNER window is visible and focused
- JOINEE window should also be visible (but doesn't need focus)

**Steps:**
1. In JOINEE Window: Select text and press **Ctrl+C**
2. **Watch OWNER Window for 4 seconds**
3. Expected: RED toast notification appears in bottom-right corner of OWNER window

**Status:** [ ] PASS [ ] FAIL

**Toast should show:**
```
Copy attempt blocked
🔒 Restricted action by [joinee username]
```

**What to verify:**
- Toast appears in bottom-right corner
- Text is white on red background
- Shows the joinee's username
- Toast auto-disappears after ~4 seconds
- No errors in owner's console

---

### Test 3.2: Owner Sees Toast When Joinee Tries to Paste

**In JOINEE Window:**
1. Copy text from outside (e.g., "test paste")
2. Click in editor and press **Ctrl+V**

**Watch OWNER Window:**
Expected: RED toast appears showing:
```
Paste attempt blocked
🔒 Restricted action by [joinee username]
```

**Status:** [ ] PASS [ ] FAIL

---

### Test 3.3: Owner Sees Toast When Joinee Tries to Cut

**In JOINEE Window:**
1. Select text in editor
2. Press **Ctrl+X**

**Watch OWNER Window:**
Expected: RED toast appears showing:
```
Cut attempt blocked
🔒 Restricted action by [joinee username]
```

**Status:** [ ] PASS [ ] FAIL

---

### Test 3.4: Multiple Toasts Stack

**Steps:**
1. In JOINEE Window: Quickly press Ctrl+C, then Ctrl+V, then Ctrl+X
2. Watch OWNER Window

**Expected:** Multiple red toasts appear one after another

**Status:** [ ] PASS [ ] FAIL

**What to verify:**
- Each attempt shows a separate toast
- Toasts stack properly (don't overlap)
- Each toast disappears after 4 seconds

---

### Test 3.5: Toasts Only Show to Owner (Not Joinee)

**In JOINEE Window:**
1. Try to copy/paste code (Ctrl+C, Ctrl+V, Ctrl+X)
2. Watch the JOINEE window closely
3. Expected: NO red toast notifications appear ❌

**Status:** [ ] PASS [ ] FAIL

**What to verify:**
- Only blocking message appears in console (F12)
- No visual toast notifications
- Joinee should only see green toasts for other messages (not red security alerts)

---

## BONUS: Database Auditing

### Test 4.1: Events Logged to Database

**Steps:**
1. Perform several copy/paste/cut attempts in JOINEE window
2. Owner can view "Security Events" in the editor (if viewer component is visible)
3. Look for a "Security Events" button or link

**Expected:** Each attempt is logged with:
- Event type (COPY_ATTEMPT, PASTE_ATTEMPT, CUT_ATTEMPT)
- Joinee username
- Timestamp
- Snippet ID

**Status:** [ ] PASS / [ ] FAIL / [ ] Not visible

---

## Summary Checklist

### Feature 1: Lock/Unlock ✅
- [ ] Test 1.1 PASS - Default unlocked state
- [ ] Test 1.2 PASS - Owner can lock
- [ ] Test 1.3 PASS - Joinee gets read-only
- [ ] Test 1.4 PASS - Owner can unlock
- [ ] Test 1.5 PASS - Joinee can edit again

### Feature 2: Copy/Paste Restrictions ✅
- [ ] Test 2.1 PASS - Ctrl+C blocked for joinee
- [ ] Test 2.2 PASS - Ctrl+V blocked for joinee
- [ ] Test 2.3 PASS - Ctrl+X blocked for joinee
- [ ] Test 2.4 PASS - Right-click blocked for joinee
- [ ] Test 2.5 PASS - Owner can copy/paste freely

### Feature 3: Toast Notifications ✅
- [ ] Test 3.1 PASS - Toast on copy attempt
- [ ] Test 3.2 PASS - Toast on paste attempt
- [ ] Test 3.3 PASS - Toast on cut attempt
- [ ] Test 3.4 PASS - Multiple toasts stack
- [ ] Test 3.5 PASS - Only owner sees toasts

### Feature 4: Database ✅
- [ ] Test 4.1 PASS/SKIP - Events logged

---

## Troubleshooting

### Issue: Lock button not visible
**Solution:**
- Make sure you're logged in as the owner (creator of the snippet)
- Refresh the page
- Open browser console (F12) to check for errors

### Issue: Toasts not appearing
**Solution:**
- Make sure both windows are on the same snippet
- Check browser console (F12 → Console tab) for error messages
- Verify WebSocket connection is working (check Network tab, filter for "ws")

### Issue: Copy/paste still works in joinee
**Solution:**
- Hard refresh both browsers: **Ctrl+F5**
- Check console for security messages
- Verify containers are healthy: `docker ps`

### Issue: "Read-only" not visible
**Solution:**
- The editor should visually disable when locked (cursor won't appear)
- Selection should still be possible
- Look for any visual styling changes (opacity, cursor change, etc.)

---

## Final Validation

Once all tests pass:

1. **Copy the validation results** from this checklist
2. **Count total PASS:** _____ / 15 tests
3. **Report any FAIL:** List them below

**Overall Status:** 
- [ ] ALL PASS - Ready to commit
- [ ] Some FAIL - Need debugging
- [ ] Partial - Some features work, some don't

**Ready to proceed to git commit?**
- [ ] YES - All tests passed
- [ ] NO - Need to fix issues

---

## Next Steps

Once you complete all tests and confirm they pass:

1. Reply: "All tests PASSED - Ready to commit changes"
2. I will commit the changes to GitHub with proper commit messages
3. Changes will include:
   - Owner lock/unlock functionality
   - Joinee copy/paste restrictions
   - Real-time toast notifications for owner
   - Database audit trail

**Important:** Do NOT commit until you've completed all tests and confirmed they pass!
