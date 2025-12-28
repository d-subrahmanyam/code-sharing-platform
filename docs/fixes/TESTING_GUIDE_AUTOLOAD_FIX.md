# Complete Testing Guide - Snippet Auto-Load Fix

## Quick Test (5 minutes)

### Setup: Two Browsers/Tabs
1. Open Browser 1: https://localhost (for Owner - John)
2. Open Browser 2: https://localhost (for Joinee - Jane)

### Test Scenario

**Browser 1 (John - Owner)**:
1. Click "Create Snippet"
2. Title: `"JavaScript Interview Questions"`
3. Code: 
   ```javascript
   function findMax(arr) {
     return Math.max(...arr);
   }
   console.log(findMax([1, 5, 3, 9, 2]));
   ```
4. Language: `javascript`
5. Click "Create"
6. Wait for snippet to load
7. You should see:
   - ✅ Title displayed: "JavaScript Interview Questions"
   - ✅ Code displayed with syntax highlighting
   - ✅ Timer showing ⏱️ 0:XX
   - ✅ Owner label: "👑 OWNER"
   - ✅ Share button visible
   - ✅ Save button visible

**Browser 1 (John - Get Share URL)**:
1. Click "Share" button
2. Copy the generated URL (should look like: `https://localhost/join/new-snippet-ABCD1234`)
3. Keep this URL handy

**Browser 2 (Jane - Joinee)**:
1. Paste the share URL and navigate to it
2. Enter username: `Jane` (or any name)
3. Click "Join"

### Verification Checklist - Jane's Session (THE CRITICAL TEST)

| Item | Expected | Status |
|------|----------|--------|
| **Title auto-loads** | Should immediately see "JavaScript Interview Questions" | ✅ |
| **Code auto-loads** | Should immediately see the JavaScript code | ✅ |
| **NO need to make changes** | Data visible without John making any changes | ✅ |
| **Timer displays** | Should see ⏱️ 0:00 and incrementing | ✅ |
| **Owner label** | Should see "👤 JOINEE" | ✅ |
| **Share button hidden** | Should NOT see "Share" button | ✅ |
| **Save button hidden** | Should NOT see "Save" button | ✅ |
| **Console logs** | Open DevTools → Console and check: `[WebSocket] Snippet Title from presence: JavaScript Interview Questions` | ✅ |

### Real-Time Sync Test

**Browser 1 (John)**:
1. Modify the code - add a comment:
   ```javascript
   // Find maximum number in array
   function findMax(arr) {
   ```

**Browser 2 (Jane)**:
1. Should see the change appear in real-time
2. The comment should appear in Jane's editor
3. No need to refresh or reload

**Browser 1 (John)**:
1. Change the title to: `"JavaScript Interview Questions - Intermediate"`

**Browser 2 (Jane)**:
1. Should see title update to "JavaScript Interview Questions - Intermediate"
2. Real-time sync should work seamlessly

## Comprehensive Test (15 minutes)

### Test 1: Owner Creates Snippet
- [ ] Owner can create new snippet
- [ ] Title field works
- [ ] Code editor works
- [ ] Share button visible
- [ ] Save button visible
- [ ] Timer shows elapsed time

### Test 2: Joinee Joins via Share Link
- [ ] Joinee can access share link
- [ ] Title loads immediately (KEY TEST)
- [ ] Code loads immediately (KEY TEST)
- [ ] No errors in console
- [ ] Presence detected (Owner name visible)
- [ ] Owner label shows "OWNER", Joinee shows "JOINEE"

### Test 3: Real-Time Collaboration
- [ ] Owner changes code → Joinee sees it immediately
- [ ] Owner changes title → Joinee sees it immediately
- [ ] Joinee's presence reflected for Owner
- [ ] Typing indicators work (optional)
- [ ] Join/Leave notifications appear

### Test 4: UI Elements (Owner vs Joinee)
- [ ] **Owner session**: Share ✅, Save ✅ visible
- [ ] **Joinee session**: Share ❌, Save ❌ hidden
- [ ] Owner can still edit when joinee is connected
- [ ] Joinee can see owner's edits in real-time

### Test 5: Multiple Joiners
1. Create snippet with Owner (John)
2. Share URL to Joinee 1 (Jane)
3. Share SAME URL to Joinee 2 (Bob)
4. All three should see each other in active users
5. Edits should sync to both joinee
6. When owner makes change, both joiners see it
7. When Jane makes change, Bob and John see it

### Test 6: Timer Functionality
- [ ] Timer starts at 0:00
- [ ] Timer increments every second
- [ ] Format is MM:SS (e.g., 0:30, 1:45, 10:02)
- [ ] Timer resets when switching to different snippet
- [ ] Timer visible in both owner and joinee sessions

## Console Log Verification

Open DevTools (F12) → Console tab and look for:

### Successful Snippet Load:
```
[EditorPage] Fetching snippet data...
[EditorPage] Loading snippet data: { 
  snippetId: 'abc123',
  authorId: 'user_xyz',
  currentUserId: 'user_abc'
}
✓ Set snippet owner ID: user_xyz
```

### Successful Presence Update:
```
[WebSocket] ===== PRESENCE UPDATE RECEIVED =====
[WebSocket] Snippet Title from presence: JavaScript Interview Questions
[WebSocket] Raw users data: [...]
```

### Owner Detection Success:
```
[EditorPage] 🔍 Owner Detection Status:
  Current User ID: user_abc
  Active Users: Array(2)
  Snippet Owner ID: user_xyz
  Is New Snippet: false
  → IS OWNER: ✓ YES (SnippetOwnerId matches)
```

## Troubleshooting

### Issue: Still seeing empty title
**Check**:
1. Are you on the LATEST deployment? (Rebuild containers)
2. Check console for any errors
3. Is the backend running? (`docker ps` should show all 5 containers)
4. Try hard refresh (Ctrl+Shift+R)

### Issue: Share button still visible for joinee
**Check**:
1. Is the owner actually marked as owner in active users?
2. Check console owner detection logs
3. Try closing and reopening the share link

### Issue: Data loading but slowly
**This is normal**: 
- First load may take 1-2 seconds
- Redux needs to fetch from backend
- WebSocket needs to sync presence
- All should complete within 2 seconds of joining

### Issue: Timer not showing
**Check**:
1. Is `isNew` correctly set to `false`? (Check console logs)
2. Is `resolvedSnippetId` set to actual ID? (Not 'new')
3. Try refreshing page

## Success Indicators

You'll know the fix is working when:

1. ✅ **Instant Load**: Join a shared snippet and see title + code immediately (no changes needed)
2. ✅ **Empty Title Gone**: Console shows actual title, not empty string
3. ✅ **Proper Roles**: Owner sees share/save buttons, Joinee doesn't
4. ✅ **Owner Detection**: Owner detection logs show correct role
5. ✅ **Real-Time Sync**: Changes immediately visible across sessions
6. ✅ **No Errors**: Console has no red errors
7. ✅ **Timer Works**: Elapsed time displays and increments

## Revert Instructions (If Needed)

If you need to go back to previous version:

```bash
git log --oneline
# Find commit: 0a285e6 CRITICAL FIX: Properly resolve...
git reset --hard 0a285e6
docker-compose down && docker-compose up -d
```

## Questions?

Key things to verify in logs if something isn't working:

1. **Is `isNew` false?** Check EditorPage logs
2. **Is `resolvedSnippetId` an actual ID?** Should not be 'new'
3. **Is Redux fetch running?** Look for "Fetching snippet data..."
4. **Is presence message received?** Check for "PRESENCE UPDATE RECEIVED"
5. **Does presence have title?** Check for "Snippet Title from presence: [title]"
