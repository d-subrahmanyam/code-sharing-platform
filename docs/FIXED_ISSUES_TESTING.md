# Fixed Issues - Testing Guide

## Issues Fixed ✅

### 1. **Code Sharing Across Windows**
**Status**: Fixed and working

The code editor's onChange handler now properly calls `handleCodeChange()` which sends WebSocket messages to other clients.

**How to Test**:
1. Open https://localhost in two browser windows
2. Create a new snippet in window 1 (enter username: "Alice")
3. Copy the URL and open in window 2 (enter username: "Bob")  
4. Type code in window 1's editor
5. **Expected**: Code appears in window 2 within 2 seconds

**What's Happening Behind the Scenes**:
```
Window 1 (Alice)
    ↓
handleCodeChange() called
    ↓
After 1 second debounce:
sendCodeChange() sends message
    ↓
WebSocket: /app/snippet/{id}/code
    ↓
Backend receives and broadcasts
    ↓
Window 2 (Bob)
    ↓
Editor updates automatically
```

**Logs to Check**:
- Frontend: `[Editor] Sending code change`
- Backend: `[CodeChange] Received code change from Alice`
- Frontend (other window): `[WebSocket] Code change received from Alice`

---

### 2. **Typing Events - Complete Lines Only**
**Status**: Implemented

Typing indicator now publishes when user completes a line (presses Enter), not on every keystroke.

**How to Test**:
1. Open two windows with different users
2. Click in editor in window 1
3. Type some text
4. **Press Enter key**
5. **Expected**: "Alice is typing" message appears in window 2 for 1 second then disappears

**Behavior**:
- Typing indicator ONLY shows when pressing Enter
- Previous behavior of showing on every keystroke removed
- Message disappears after 1 second of timeout

**Logs to Check**:
- Frontend: `[Editor] Complete line entered, sending typing indicator`
- Backend: `[Typing] User {id} is typing`
- Other window: `[WebSocket] Typing users: [...]`

---

### 3. **Dark Mode on HomePage Username Dialog**
**Status**: Fixed

The username dialog now respects dark mode color scheme with proper contrast.

**How to Test**:
1. Go to https://localhost
2. Click "New Snippet" button
3. Check the username dialog:
   - **Light Mode**: White background with dark text ✅
   - **Dark Mode** (toggle sun/moon icon first): Dark background with light text ✅
4. Try entering your username in both modes

**What Was Fixed**:
- Dialog background: `bg-white dark:bg-gray-800`
- Dialog text: `text-gray-900 dark:text-white`
- Input field: `bg-gray-700 dark:text-white` 
- Buttons: `dark:` variants for both primary and secondary
- HomePage background: `dark:bg-gray-900`
- Header: `dark:bg-gray-800 dark:border-gray-700`

**Colors**:
| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Dialog BG | White | Gray-800 |
| Text | Gray-900 | White |
| Input BG | White | Gray-700 |
| Input Border | Gray-300 | Gray-600 |
| Button (Primary) | Blue-600 | Blue-600 |
| Button (Secondary) | Gray-200 | Gray-700 |
| Page BG | Gray-50 | Gray-900 |

---

## Quick Test Checklist

### Test 1: Code Sharing (5 minutes)
- [ ] Open https://localhost in Window 1
- [ ] Click "New Snippet", enter username "Alice"
- [ ] Copy URL to Window 2
- [ ] In Window 2, enter username "Bob"
- [ ] In Window 1, type: `console.log('hello')`
- [ ] **Verify**: Code appears in Window 2 within 2 seconds
- [ ] In Window 2, type more code
- [ ] **Verify**: Code appears in Window 1
- [ ] Open DevTools (F12) and check console logs

### Test 2: Complete Line Typing (3 minutes)
- [ ] In Window 1, click in editor
- [ ] Type some text (don't press Enter yet)
- [ ] **Verify**: No "typing" indicator in Window 2
- [ ] **Press Enter** in Window 1
- [ ] **Verify**: "Alice is typing" appears in Window 2
- [ ] Wait 1 second
- [ ] **Verify**: "typing" message disappears

### Test 3: Dark Mode on HomePage (2 minutes)
- [ ] Go to https://localhost
- [ ] Click "New Snippet"
- [ ] **Verify**: Dialog has light colors (white/light blue)
- [ ] Click theme toggle (sun/moon icon) to enable dark mode
- [ ] Go back to home (or refresh)
- [ ] Click "New Snippet" again
- [ ] **Verify**: Dialog has dark colors (gray-800/dark text)
- [ ] Enter your name and submit

---

## Expected Console Logs

### When Typing Code:
```
[Editor] Code change detected, code length: 15
[Editor] Sending code change, snippetId: abc123, userId: xyz, username: Alice
[sendCodeChange] Called { snippetId: 'abc123', connected: true, ... }
[WebSocketService.sendCodeChange] Sending to: /app/snippet/abc123/code
[WebSocketService.sendCodeChange] ✓ Sent
```

### When Other User Receives Code:
```
[WebSocket] Code change received from: Alice
```

### When Pressing Enter (Typing Indicator):
```
[Editor] Complete line entered, sending typing indicator
[WebSocketService.sendTypingIndicator] Sending to: /app/snippet/abc123/typing
[WebSocketService.sendTypingIndicator] ✓ Sent
```

### In Other Window:
```
[WebSocket] Typing users: [{"userId":"xyz","username":"Alice"}]
[Editor] Typing indicator stopped
```

---

## Backend Logs

```bash
docker compose logs backend -f | grep -E "CodeChange|Typing"
```

Expected output:
```
[CodeChange] Received code change from Alice for snippet abc123
[CodeChange] Code length: 15 Language: javascript
[CodeChange] Broadcasted to /topic/snippet/abc123/code

[Typing] User xyz is typing in snippet abc123
[Typing] Broadcasting 1 typing users to /topic/snippet/abc123/typing
```

---

## Troubleshooting

### Code Not Appearing in Other Window
**Check**:
1. Is `[Editor] Sending code change` in console? If not, onChange handler isn't being called
2. Is `[WebSocketService.sendCodeChange] ✓ Sent` in console? If not, WebSocket send failed
3. Check backend: `docker compose logs backend | grep CodeChange`
4. Look for `[CodeChange] Received code change from` in backend logs

**Solution**:
- Refresh both windows
- Check browser console for errors (DevTools F12)
- Verify both users have successfully joined (look for subscribe logs)

### Typing Indicator Not Showing
**Check**:
1. Are you pressing **Enter** key?
2. Is `[Editor] Complete line entered` in console?
3. Is the other window showing `[WebSocket] Typing users:`?

**Solution**:
- Make sure to press Enter (not just typing)
- Check if both windows are in the same snippet session
- Verify WebSocket connection is established

### Dark Mode Not Working on HomePage
**Check**:
1. Is dark mode enabled globally? (Check sun/moon icon)
2. Refresh the page
3. Check browser's localStorage for theme preference

**Solution**:
- Toggle theme off and on again
- Clear browser cache if issues persist
- Check that `dark:` classes are rendering in HTML (DevTools Inspector)

---

## Performance Notes

- **Code Sync Delay**: 1 second debounce (by design for efficiency)
- **Typing Indicator Timeout**: 1 second (shows for only 1 second after Enter)
- **WebSocket Connection**: Established on EditorPage load
- **Subscriptions**: 3 subscriptions per session (presence, code, typing)

---

## Files Modified

| File | Changes |
|------|---------|
| `frontend/src/pages/HomePage.tsx` | Added dark mode classes to dialog and page backgrounds |
| `frontend/src/pages/EditorPage.tsx` | Updated typing handler to work only on Enter key, added keydown handler |
| `frontend/src/services/webSocketService.ts` | Enhanced logging (no functional changes) |

---

**All three issues have been fixed and tested!** ✅
