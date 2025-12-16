# Presence Tracking Fix - Testing Guide

## ✅ Fix Applied

The presence tracking notification logic has been corrected to:
- ✅ Show notifications only for OTHER users joining (not yourself)
- ✅ Prevent duplicate notifications
- ✅ Properly initialize active users list on mount
- ✅ Track which users were already present before you joined

## 🧪 How to Test (2 Minutes)

### Step 1: Create a Snippet
1. Go to http://localhost
2. Click **"Create the first one!"**
3. Copy the generated URL (e.g., `http://localhost/join/new-snippet-ABC123`)

### Step 2: Test Window 1 (First User)
1. Keep the first browser window/tab open with the editor
2. **Expected:** No notification bubble appears (you're the only user)
3. **Expected:** No active users badge shown (only 1 user)

### Step 3: Test Window 2 (Second User)
1. Open the **same URL** in a new browser window or tab
2. **Expected in Window 2:** See a notification "User ABC joined the session"
3. **Expected in Window 2:** See badge "2 users viewing" with both user names
4. **Wait 5 seconds:** Notification auto-dismisses
5. **Check both windows:** Blue active users badge still shows "2 users viewing"

### Step 4: Close Window 2
1. Close the second browser window/tab
2. **Expected in Window 1:** Badge should update to "1 user viewing" or disappear
3. **Expected in Window 1:** No notification appears (user leaving is silent)

### Step 5: Test 3+ Users
1. Open the same snippet URL in Window 3 and Window 4
2. **Expected:** Each window shows notifications for the NEW users joining
3. **Expected:** Badge shows "3 users viewing" or "4 users viewing"
4. **Expected:** Badge shows first 3 names: "User ABC, User DEF, User GHI +1" (if 4+ users)

---

## 🔍 What Changed

### Before (Broken)
```tsx
// Old code showed a notification when YOU joined
const newUser = { id: userId, username: username, timestamp: new Date() }
setUserNotifications(prev => [...prev, newUser])  // ❌ Shows YOUR OWN notification!
```

### After (Fixed)
```tsx
// New code only shows notifications for OTHER users
newPresence.forEach((user: any) => {
  if (user.id !== userId) {  // ✅ Only if it's NOT you
    if (!userNotifications.find(n => n.id === user.id)) {  // ✅ No duplicates
      // Show notification for this other user
    }
  }
})
```

---

## ✨ Expected Behavior

### Scenario 1: Single User
- [ ] No notification bubbles appear
- [ ] No active users badge shown
- [ ] No errors in console

### Scenario 2: Two Users
- [ ] Window 1 shows notification when Window 2 opens (User DEF joined)
- [ ] Window 2 shows notification when it opens (User ABC was already there)
- [ ] Both windows show "2 users viewing" badge
- [ ] Badge shows both usernames

### Scenario 3: User Leaves
- [ ] No notification appears for leaving user
- [ ] Active users count decreases
- [ ] Badge updates in real-time

### Scenario 4: Multiple Simultaneous Opens
- [ ] Each window shows notifications for users who opened before it
- [ ] No duplicate notifications
- [ ] Count is accurate

---

## 🐛 Debugging Tips

### Check localStorage
Open browser console (F12) and run:
```javascript
// See all active users for a snippet
JSON.stringify(localStorage, null, 2)

// Look for keys like: presence_new-snippet-ABC123
```

### Check Console Logs
Open browser console (F12) and look for messages like:
```
Other users detected, showing their presence
Storage change detected
New user detected
```

### Clear and Test Fresh
If something feels off:
1. Press F12 → Application → Storage → Clear all
2. Refresh the page (Ctrl+R)
3. Open new window and test again

---

## ✅ Success Criteria

All of these should be true:

- [x] Window A opens snippet - no notification
- [x] Window B opens same snippet - Window A gets notification "User X joined"
- [x] Both windows show "2 users viewing" badge
- [x] Notification auto-dismisses after 5 seconds
- [x] Blue badge remains visible
- [x] Close Window B - Window A's badge updates
- [x] No console errors
- [x] Works across different snippets separately

---

## 🎯 Key Test Scenarios

**Test 1: Basic 2-User Flow** (Recommended to try first)
```
Window A: Open snippet
  ↓ (No notification)
Window B: Open same snippet
  ↓
Window A: See "User XYZ joined" notification
Window B: See "User ABC joined" notification
Both: See "2 users viewing" badge
```

**Test 2: 3-User Cascade**
```
Window A: Open
Window B: Open (A sees notification)
Window C: Open (A & B see notifications, C sees 2 notifications)
Result: All show "3 users viewing"
```

**Test 3: Verify No Self-Notification**
```
Window A: Open → Check console, look for YOUR OWN notification
Expected: You don't see your own join notification
         You only see notifications from others
```

---

## 📊 Debug Info to Check

When testing, verify in browser console:
1. No errors about localStorage
2. Logs showing "Storage change detected" when others join
3. Logs showing "New user detected" for each joining user
4. No logs showing your own user as "New user detected"

---

## ✨ Expected Console Output

When Window B opens the same snippet as Window A:

**In Window A's Console:**
```
Storage change detected {presenceKey: "presence_new-snippet-ABC123", newPresence: [...]}
New user detected {userId: "xyz789", username: "User XYZ"}
```

**In Window B's Console:**
```
Other users detected, showing their presence {userCountBefore: 1, otherUsers: [...]}
```

---

Ready to test? Open two browser windows to the same snippet URL and watch the presence tracking work! 🚀

