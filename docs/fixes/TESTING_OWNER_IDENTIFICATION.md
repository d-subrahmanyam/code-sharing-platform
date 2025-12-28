# Complete Testing Guide - New Snippet Sharing Owner Identification

## Quick Test (5 minutes)

### Test 1: Basic Owner Identification
1. **Setup**: Open two browser windows/tabs
   - Window A: Chrome (or your browser)
   - Window B: Firefox (or incognito window)

2. **Step 1 - John Creates**
   - Window A: Go to `https://localhost/`
   - Enter username: "John"
   - Click "Create New Snippet"
   - Enter title: "Test Collaboration"
   - Enter some code
   - Click "Share"
   - Copy the URL (should be like `https://localhost/join/new-snippet-XXXXXX`)

3. **Step 2 - Jane Joins**
   - Window B: Paste the URL
   - Enter username: "Jane"
   - Verify active users show:
     - "J👑" (John with crown - OWNER)
     - "Ja" (Jane without crown - JOINEE)

4. **Expected Results** ✓
   - [ ] John's window shows metadata sidebar (left panel)
   - [ ] Jane's window does NOT show metadata sidebar
   - [ ] Both see John marked with 👑 crown icon
   - [ ] Both see Jane without crown
   - [ ] Editor code is synchronized in real-time

---

## Detailed Testing Guide

### Scenario 1: Owner Creates and Joinee Joins

#### Prerequisites
- Backend running on `https://localhost:8443`
- Frontend running on `https://localhost:5173`
- Both in same network session

#### Detailed Steps

**Step 1: Owner Creates Snippet**
```
1. Open https://localhost in Browser A
2. Enter username "John"
3. Navigate to /join/new-snippet-ABC123
   OR create new snippet and click "Share"
4. Expected state:
   - resolvedSnippetId = 'new'
   - snippetOwnerId = John's userId
   - isOwner = true
   - Metadata sidebar VISIBLE
```

**Step 2: Check Owner Status in Console**
```javascript
// Open DevTools Console (F12) in John's window
// Look for log output:
"[EditorPage] 🔍 Owner Detection Status:
  Current User ID: user_abc123...
  Snippet Owner ID: user_abc123...
  Is New Snippet: true
  Is Truly New (no params): true
  Is Shared New Snippet: false
  → IS OWNER: ✓ YES"
```

**Step 3: Joinee Accesses Same URL**
```
1. In Browser B, paste same URL
2. Enter username "Jane"
3. Wait for sidebar to load
4. Expected state:
   - resolvedSnippetId = 'new'
   - snippetOwnerId = John's userId (from John's session)
   - isOwner = false (Jane's ID != John's ID)
   - Metadata sidebar HIDDEN
```

**Step 4: Check Joinee Status in Console**
```javascript
// Open DevTools Console (F12) in Jane's window
// Look for log output:
"[EditorPage] 🔍 Owner Detection Status:
  Current User ID: user_xyz789...
  Snippet Owner ID: user_abc123...  ← Different!
  Is New Snippet: true
  Is Truly New (no params): false  ← Note: FALSE
  Is Shared New Snippet: true  ← Note: TRUE
  IDs Match: false
  → IS OWNER: ✗ NO"
```

**Step 5: Verify UI Elements**

*John's View:*
- [ ] Metadata sidebar visible on left
- [ ] Code editor takes up most of screen
- [ ] Active Users panel shows both users
- [ ] John has crown badge (👑)
- [ ] Jane has regular avatar

*Jane's View:*
- [ ] Metadata sidebar NOT visible (editor full width)
- [ ] Code editor takes up full screen
- [ ] Active Users panel shows both users
- [ ] John has crown badge (👑) - important!
- [ ] Jane has regular avatar (no crown)

---

### Scenario 2: Owner Leaves and Returns

#### Steps
1. **Initial Setup** (from Scenario 1)
   - John and Jane both in session
   - Verify ownership status

2. **John Closes Tab**
   - Close John's browser window entirely
   - Verify Jane still sees code and John marked as owner

3. **John Returns**
   - Reopen `https://localhost/join/new-snippet-ABC123`
   - Enter "John" again
   - Check console for userId:
     ```
     Expected: Same userId as before
     Reason: persistentUserId from localStorage for truly new snippets
     ```
   - Verify:
     - [ ] John is still marked as owner
     - [ ] Metadata sidebar reappears
     - [ ] Jane still in active users
     - [ ] Code persists unchanged

---

### Scenario 3: Multiple Joinee Users

#### Steps
1. **Owner Creates**
   - John creates snippet with `/join/new-snippet-ABC123`
   
2. **First Joinee Joins**
   - Jane joins with same URL
   - Verify Jane is NOT owner

3. **Second Joinee Joins**
   - Mike joins with same URL in third window
   - Verify in all three windows:
     - [ ] John marked as owner (👑)
     - [ ] Jane unmarked
     - [ ] Mike unmarked
     - [ ] All three can see each other
     - [ ] Only John sees metadata sidebar

4. **Joinee Leaves, Another Joins**
   - Jane closes her window
   - Sarah joins with same URL
   - Verify:
     - [ ] John still owner (👑)
     - [ ] Sarah is new joinee
     - [ ] Mike still joinee

---

### Scenario 4: Direct Navigation vs Shared URL

#### Test 4A: Direct Navigation (Truly New)
```
1. John goes directly to: https://localhost/
2. Enters username "John"
3. Creates new snippet OR accesses /editor?new=true
4. Expected:
   - isTrulyNewSnippet = true
   - isOwner = true (always)
   - persistentUserId stored and reused
```

#### Test 4B: Shared Code Navigation (Shared New)
```
1. John creates snippet and gets share code
2. Shares code with Jane
3. Jane accesses: https://localhost/join/new-snippet-ABC123
4. Expected:
   - isTrulyNewSnippet = false (has tinyCode)
   - isSharedNewSnippet = true
   - isOwner = (snippetOwnerId === userId)
   - persistentUserId NOT reused (new unique ID)
```

---

### Scenario 5: Metadata Sidebar Visibility

#### John's View (Owner)
- [ ] Left sidebar visible with:
  - "Snippet by John"
  - "Created: [timestamp]"
  - "Share" button
  - "Edit Snippet Details" button
- [ ] Code editor takes up remaining space

#### Jane's View (Joinee)
- [ ] Left sidebar NOT visible
- [ ] Code editor takes up FULL width
- [ ] Read-only indicator visible (if implemented)
- [ ] Clear distinction from owner view

---

### Scenario 6: Active Users Panel

#### Icon Display
```
Owner's Badge: 👑 (Crown emoji)
  - Applied to: John in all users' sessions
  - Color/styling: Different from regular user
  - Tooltip: "John (Owner)"

Joinee's Badge: Regular avatar
  - Applied to: Jane, Mike, Sarah, etc.
  - Color/styling: Standard user avatar
  - Tooltip: "Jane (Joined)" (if implemented)
```

#### Join Notifications
```
When Jane joins:
  Icon: Regular user icon (not crown)
  Message: "Jane joined the session"
  OR
  Message: "Jane (Joinee) joined - John (Owner) is editing"
```

---

## Debug Mode - Console Logging

### Enable Debug Output
```javascript
// In browser console
localStorage.setItem('DEBUG_OWNER_IDENTIFICATION', 'true')
```

### Expected Console Output

When accessing new-snippet code:
```
═══════════════════════════════════════════
[EditorPage] 🔍 Owner Detection Status:
  Current User ID: user_abc123de4f5g6h7i8
  Snippet Owner ID: user_abc123de4f5g6h7i8
  Is New Snippet: true
  Direct Snippet ID: null
  Tiny Code: new-snippet-ABC123
  Is Truly New (no params): true
  Is Shared New Snippet: false
  Resolved Snippet ID: new
  IDs Match: true
  → IS OWNER: ✓ YES
═══════════════════════════════════════════
```

---

## Build Verification

### Frontend
```bash
cd frontend
npm run type-check
# Expected: ✅ No errors
```

### Backend
```bash
cd backend
mvn clean compile
# Expected: ✅ BUILD SUCCESS
```

---

## Common Issues and Fixes

### Issue 1: Jane Sees Metadata Sidebar
**Symptom**: Jane (joinee) sees left sidebar with snippet details
**Root Cause**: isOwner incorrectly = true for Jane
**Fix**: Check console log for `isTrulyNewSnippet` value
- If false: Good, check `snippetOwnerId === userId`
- If true: Bug in initialization logic

### Issue 2: John Marked as Owner in John's Window, Not Jane's
**Symptom**: John shows crown in his own window, but Jane doesn't see it
**Root Cause**: Owner information not synchronized across WebSocket
**Fix**: Check if useWebSocketCollaboration sends owner metadata

### Issue 3: Different User IDs After Refresh
**Symptom**: John refreshes and gets new userId, loses ownership
**Root Cause**: persistentUserId not being stored or retrieved
**Fix**: Check localStorage:
```javascript
console.log(localStorage.getItem('persistentUserId'))
// Should have value for truly new snippets
```

### Issue 4: Jane Gets John's User ID
**Symptom**: Jane's userId matches John's userId
**Root Cause**: persistentUserId incorrectly reused for shared codes
**Fix**: Check if `isTrulyNewSnippet` correctly = false for Jane
- Should be: `isNew && !directSnippetId && !tinyCode`
- For Jane: `true && !null && !"new-snippet-ABC123"` = false

---

## Performance Checks

### Initial Load Time
- [ ] John's new snippet loads in < 2 seconds
- [ ] Jane joining loads in < 2 seconds

### Real-time Sync
- [ ] Code changes sync in < 500ms
- [ ] User list updates in < 500ms
- [ ] Owner badge displays immediately

### Console Warnings
- [ ] No console errors
- [ ] No "cannot set property" warnings
- [ ] No undefined reference errors

---

## Accessibility Checks

- [ ] Owner badge (👑) has alt text or tooltip
- [ ] Sidebar visibility toggle is keyboard accessible
- [ ] User icons are distinguishable by color-blind users
- [ ] Tooltip text is readable

---

## Final Verification Checklist

### Functional Requirements
- [ ] Owner correctly identified in all scenarios
- [ ] Metadata sidebar visible only to owner
- [ ] User icons show correct owner/joinee markers
- [ ] Real-time synchronization works
- [ ] Multiple joinee support works

### Code Quality
- [ ] TypeScript compilation passes
- [ ] Maven build passes
- [ ] No console errors or warnings
- [ ] Debug logging works as expected

### Browser Compatibility
- [ ] Chrome/Edge - Works ✓
- [ ] Firefox - Works ✓
- [ ] Safari - Works ✓

### Network Requirements
- [ ] HTTPS/WebSocket connectivity confirmed
- [ ] Same origin for frontend/backend
- [ ] CORS properly configured

---

## Quick Reference

| Component | Expected Behavior | Status |
|-----------|------------------|--------|
| Owner Detection Logic | `isTrulyNewSnippet ? true : (snippetOwnerId === userId)` | ✓ |
| Metadata Sidebar | `{isOwner && (` guard | ✓ |
| Owner Badge | Displayed via isOwner prop | ✓ |
| User ID Persistence | Only for truly new snippets | ✓ |
| New-snippet Handler | Sets owner when accessed | ✓ |
| Debug Logging | Shows owner status | ✓ |

---

**Test Date**: _____________
**Tester Name**: _____________
**Browser**: _____________
**Result**: PASS / FAIL

**Notes**:
```


```

---

For issues or clarifications, refer to:
- BUG_FIXES_NEW_SNIPPET_SHARING.md - Detailed fix description
- OWNER_ID_FIX_VISUAL_SUMMARY.md - Visual flow diagrams
- EditorPage.tsx - Source code implementation
