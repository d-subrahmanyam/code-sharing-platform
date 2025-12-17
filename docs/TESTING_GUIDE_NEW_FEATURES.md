# Quick Testing Guide - New Features

## Application URLs
- **Frontend**: http://localhost or https://localhost
- **Backend API**: http://localhost:8080/api
- **WebSocket**: wss://localhost/api/ws

## Feature Testing Checklist

### ✅ Feature 1: Line Numbers in Editor
**Location**: Main code editor area (left side)

**How to Test**:
1. Navigate to the editor page
2. Create a new snippet or open an existing one
3. Look for line numbers in a column on the left side of the code editor
4. Verify:
   - Line numbers are visible and aligned with code
   - Numbers are in gray color (subtle)
   - Numbers increment correctly (1, 2, 3, etc.)
   - Numbers sync with code lines

**Expected Result**: ✅ Line numbers appear in a dark column on the left side of the editor

---

### ✅ Feature 2: Status Bar
**Location**: Bottom of the editor area, just below the code

**How to Test**:
1. Open the editor
2. Look at the bottom for a dark bar with metadata
3. Verify you see:
   - **Line number**: Changes as you type or move cursor
   - **Language**: Shows current selected language (e.g., "Language: javascript")
   - **Who's editing**: Shows "(empty)" if alone, or "Editing: user1, user2" if others are typing

**Expected Result**: ✅ Status bar visible with line number, language, and optional editing users list

---

### ✅ Feature 3: Removed Flickering User Bubble
**Location**: Used to be at top-right corner

**How to Test**:
1. Open the editor with the application
2. Start typing in the editor
3. Watch the interface carefully for any flickering indicators at top-right
4. Verify:
   - No flickering "X users" bubble appears
   - No animated "viewing" indicator
   - Interface remains smooth while typing

**Expected Result**: ✅ No flickering indicators - smooth typing experience

---

### ✅ Feature 4: Owner-Only Field Locking
**Location**: Title, Description, Language fields in the sidebar

**Test Case A: As Snippet Owner (You Created It)**:
1. Create a new snippet
2. Look at the sidebar fields (Title, Description, Language)
3. Verify:
   - Fields are enabled (full opacity)
   - No "(Read-only)" badge appears
   - You can type in all three fields
   - Changes save normally

**Test Case B: As Non-Owner (Someone Shared with You)**:
1. Have another user create and share a snippet with you
2. Open the shared snippet link
3. Look at the sidebar fields
4. Verify:
   - Fields appear slightly faded (60% opacity)
   - "(Read-only)" badge appears next to each label
   - Cursor changes to "not-allowed" when hovering over fields
   - Try to click/type - changes should be blocked

**Expected Result**: 
- ✅ Owners can edit: Title, Description, Language
- ✅ Non-owners cannot edit these fields
- ✅ Code editor remains editable for everyone

---

### ✅ Feature 5: Toast Notifications for Copy
**Location**: Bottom-left corner of screen

**How to Test**:
1. Open a snippet with a share link
2. Click the split share button's right icon (copy icon)
3. Verify:
   - A green toast notification appears at bottom-left
   - It says "Link copied to clipboard!"
   - It disappears after 3 seconds automatically
   - NO browser alert dialog appears
4. Repeat by clicking "Copy Link" in the share modal
5. Verify same toast behavior

**Expected Result**: ✅ Green toast notification shows and auto-dismisses (not an alert)

---

### ✅ Feature 6: Split Share Button with Icons
**Location**: Top-right area of the editor (green buttons)

**Visual Test**:
1. Look at the share button area
2. Verify you see TWO connected buttons:
   - **Left Button**: Share icon (📤 looking icon) + "Share" text
   - **Right Button**: Copy icon (📋 clipboard icon) only

**Functionality Test**:
1. Click the left side (Share + text) → Should open modal dialog
2. Click the right side (Copy icon) → Should copy link and show toast

**Expected Result**: 
- ✅ Share button has split design with two distinct areas
- ✅ Uses FiShare2 (share) and FiCopy (clipboard) icons
- ✅ Left opens modal, right copies directly

---

## Multi-User Testing Scenarios

### Scenario 1: See Who's Typing
**Setup**: Two browsers/tabs with same snippet

**Steps**:
1. Open snippet in Browser A (logged in as User A)
2. Open same snippet in Browser B (logged in as User B)
3. In Browser B, click in the editor and start typing
4. In Browser A, look at status bar bottom-right
5. Verify: "Editing: User B" shows with animated indicator

**Expected Result**: ✅ Typing user name appears in status bar

---

### Scenario 2: Edit Permissions
**Setup**: 
- User A creates a snippet
- User A shares link with User B

**Steps**:
1. User A: Open snippet, verify all fields are editable
2. User A: Share link with User B (via copy button)
3. User B: Open link in new browser
4. User B: Try to edit title → Should be blocked
5. User B: Can still edit code and comments

**Expected Result**: ✅ Only User A can edit metadata; User B can only view

---

## Browser Console Checks
Open DevTools (F12) and verify no errors:

```javascript
// Check for errors in Console tab
// Look for any red error messages
// Common error to avoid: "Cannot find name 'xyz'"
```

---

## Expected Improvements from Old Version

| Area | Before | After |
|------|--------|-------|
| Code Reference | Hard to count lines | Line numbers visible |
| Editor Status | No feedback | Status bar shows metadata |
| User Experience | Flickering distracting | Smooth, no flickering |
| Field Safety | Anyone could edit | Only owner can edit |
| Copy Feedback | Loud alert popup | Subtle toast notification |
| Share UI | Generic button | Split button with icons |

---

## Troubleshooting

### Issue: Line numbers not showing
- **Check**: Code is present in editor
- **Check**: Look at left side of editor
- **Fix**: Refresh page (F5) if just deployed

### Issue: Fields don't lock for non-owner
- **Check**: Share link used to access snippet (not direct ID)
- **Check**: Browser shows "(Read-only)" badges
- **Fix**: Clear browser cache and reload

### Issue: Toast not showing on copy
- **Check**: Click the right side of split button (copy icon)
- **Check**: Bottom-left corner for 3 seconds
- **Fix**: Refresh page if just deployed

### Issue: Share button not split
- **Check**: Frontend rebuild completed successfully
- **Check**: Browser cache cleared
- **Fix**: Hard refresh (Ctrl+Shift+R) or Cmd+Shift+R on Mac

---

## Performance Expectations
- ✅ Line numbers should not lag
- ✅ Status bar should update smoothly
- ✅ Toast should appear instantly
- ✅ Field disable/enable should be instant

---

## Testing Complete Checklist
- [ ] Line numbers visible and correct
- [ ] Status bar shows line number
- [ ] Status bar shows language
- [ ] Status bar shows editing users
- [ ] No flickering during editing
- [ ] Owner can edit title
- [ ] Owner can edit description
- [ ] Owner can edit language
- [ ] Non-owner cannot edit title
- [ ] Non-owner cannot edit description
- [ ] Non-owner cannot edit language
- [ ] Non-owner can edit code
- [ ] Toast shows on copy action
- [ ] Toast disappears after 3 seconds
- [ ] No alert dialog on copy
- [ ] Share button is split design
- [ ] Share button opens modal on left click
- [ ] Share button copies on right click
- [ ] Share button shows correct icons
