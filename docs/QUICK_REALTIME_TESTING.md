# Real-Time Collaboration - Quick Start Guide

## 🚀 Start the Application

```bash
cd code-sharing-platform
docker compose up -d
```

Then open: https://localhost

## ✅ Test in 3 Steps

### Step 1: Create Snippet in Window 1
- Go to https://localhost
- Click "Create New Snippet"
- Enter username: `Alice`
- Copy the URL (e.g., `https://localhost/editor/abc123`)

### Step 2: Open Same Snippet in Window 2
- Open new browser window
- Paste the URL
- Enter username: `Bob`

### Step 3: Type Code in Window 1
- Click in code editor
- Type some code
- Watch it appear in Window 2 within 2 seconds ✅

## 📊 Real-Time Features Working

| Feature | Status | How to Test |
|---------|--------|-----------|
| Code Sharing | ✅ | Type code → Appears in other windows |
| Typing Indicators | ✅ | Look for "X is typing" message |
| User Presence | ✅ | See colored avatars with usernames |
| Notifications | ✅ | See "X joined" and "X left" messages |
| Dark Mode | ✅ | Click sun/moon icon in navbar |

## 🔍 Debug Logs

Open browser DevTools (F12) → Console tab

**Look for these logs when typing:**
```
[Editor] Code change detected
[sendCodeChange] ✓ Successfully sent
[WebSocket] Code change received from Alice
```

**Backend logs:**
```bash
docker compose logs backend -f | grep CodeChange
```

## 🛠️ Troubleshooting

### Code not syncing?
1. Check console for `[sendCodeChange] ✓ Successfully sent`
2. Check backend: `docker compose logs backend --tail 50`
3. Look for `[CodeChange] Received code change from`

### Connection failing?
1. Refresh the page
2. Check DevTools Network tab for WebSocket connection
3. Verify URL is https://localhost

### Dark mode not working?
1. Click the sun/moon icon again
2. Check browser console for errors
3. Refresh page to verify persistence

## 📁 Key Files

- **Frontend Editor**: `frontend/src/pages/EditorPage.tsx`
- **WebSocket Hook**: `frontend/src/hooks/useWebSocketCollaboration.ts`
- **WebSocket Service**: `frontend/src/services/WebSocketService.ts`
- **Backend Handler**: `backend/src/main/java/.../CollaborationController.java`

## 🎯 What Was Fixed

**The Main Bug**: Editor's `onValueChange` wasn't calling the handler that sends WebSocket messages.

**The Fix**: Changed Editor to use `onValueChange={handleCodeChange}` which properly sends messages.

**Result**: Real-time collaboration now works! 🎉

## 📚 Full Documentation

- [REALTIME_TESTING_GUIDE.md](docs/REALTIME_TESTING_GUIDE.md) - Step-by-step testing
- [REALTIME_TESTING_SUMMARY.md](docs/REALTIME_TESTING_SUMMARY.md) - Detailed technical explanation
- [REALTIME_COLLABORATION_COMPLETE.md](REALTIME_COLLABORATION_COMPLETE.md) - Implementation summary

## 💡 Tips

- **1 second debounce**: Code sends after 1 second of inactivity (efficient for network)
- **Typing timeout**: "X is typing" message lasts 1 second then disappears
- **Colored avatars**: 10 unique colors assigned per userId consistently
- **Dark mode**: Preference saved in localStorage, persists across sessions

## ✨ Success Indicators

If you see these, everything is working:
- ✅ Code appears in second window within 2 seconds
- ✅ "Alice is typing" message appears in other windows
- ✅ Colored avatars show active users
- ✅ "Bob joined" / "Bob left" notifications appear
- ✅ Dark mode toggle changes all colors
- ✅ Console shows `[sendCodeChange] ✓ Successfully sent`
- ✅ Backend shows `[CodeChange] Received code change from Alice`

## 🐛 Report Issues

If something doesn't work:
1. Open DevTools Console (F12)
2. Note any red error messages
3. Run: `docker compose logs backend --tail 100`
4. Look for error patterns in both logs
5. Compare with expected logs in troubleshooting guide

---

**Everything is ready! Start testing real-time collaboration now.** 🚀
