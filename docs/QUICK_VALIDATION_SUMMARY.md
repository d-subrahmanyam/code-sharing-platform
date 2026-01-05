# Quick Validation - TL;DR Version

## 3 Features to Test (5 minutes total)

### 1️⃣ Lock/Unlock (1 minute)
- **Owner:** Click Lock button → Check if status shows "Locked"
- **Joinee:** Try typing → Should NOT work (read-only)
- **Owner:** Click Unlock button → Check if status shows "Unlocked"
- **Joinee:** Try typing → Should work again

### 2️⃣ Copy/Paste Blocked (2 minutes)
- **Joinee:** Press Ctrl+C → Check F12 console for "Copy blocked" message
- **Joinee:** Press Ctrl+V → Check F12 console for "Paste blocked" message
- **Joinee:** Press Ctrl+X → Check F12 console for "Cut blocked" message
- **Owner:** Press Ctrl+C → Should work (no block message in console)

### 3️⃣ Toast Notifications (2 minutes)
- **Joinee:** Press Ctrl+C
- **Owner Window:** Look for RED toast in bottom-right corner saying "Copy attempt blocked"
- **Joinee:** Press Ctrl+V
- **Owner Window:** Look for RED toast saying "Paste attempt blocked"

---

## Expected Results

✅ = Feature Working  
❌ = Feature Not Working

| Action | Where | Expected | Result |
|--------|-------|----------|--------|
| Lock editor | Owner button | Status changes to "Locked" | ✅ / ❌ |
| Type when locked | Joinee editor | Text won't appear | ✅ / ❌ |
| Unlock editor | Owner button | Status changes to "Unlocked" | ✅ / ❌ |
| Type when unlocked | Joinee editor | Text appears | ✅ / ❌ |
| Ctrl+C in joinee | Console (F12) | "Copy blocked" message | ✅ / ❌ |
| Ctrl+V in joinee | Console (F12) | "Paste blocked" message | ✅ / ❌ |
| Ctrl+C in owner | Console (F12) | NO "blocked" message | ✅ / ❌ |
| Ctrl+C in joinee | Owner toast | RED notification appears | ✅ / ❌ |
| Ctrl+V in joinee | Owner toast | RED notification appears | ✅ / ❌ |

---

## Browser Console Check (F12)

**For Joinee Security Messages:**
```
[EditorSecurity] Copy (Ctrl+C) attempt blocked
[EditorSecurity] Paste (Ctrl+V) attempt blocked
[EditorSecurity] Cut (Ctrl+X) attempt blocked
```

**For WebSocket Security Events:**
```
[useWebSocketCollaboration] Security event: {...}
```

---

## Start Testing!

1. Open https://localhost (Owner in Tab 1, Joinee in Tab 2)
2. Create snippet in Tab 1, join in Tab 2
3. Run through the 3 features above
4. Count how many work ✅
5. Report results: "X out of 9 tests passed"

**That's it!** 🎉
