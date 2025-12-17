# Real-Time Collaboration Testing Guide

This guide will help you test the real-time collaboration features: code sharing, typing indicators, and user presence.

## Prerequisites
- Application running at `https://localhost`
- Two browser windows or tabs open
- Developer Console open (F12) to view logs

## Test Procedure

### 1. Create a New Snippet
1. Go to `https://localhost` in your first browser window
2. Click "Create New Snippet" (or navigate to `/editor/new`)
3. When prompted, enter your username (e.g., "Alice")
4. Wait for the editor to load

### 2. Open Same Snippet in Second Window
1. Copy the URL from the first window (should be like `https://localhost/editor/<snippetId>`)
2. In the second browser window, open the same URL
3. When prompted, enter a different username (e.g., "Bob")

### 3. Test Code Sharing
**In first window (Alice):**
1. Click in the code editor
2. Type some code, e.g.:
   ```javascript
   function hello() {
     console.log("Hello from Alice");
   }
   ```
3. Watch the Developer Console for logs like:
   - `[Editor] Sending code change`
   - `[WebSocketService.sendCodeChange] Sending to: /app/snippet/...`

**In second window (Bob):**
1. The code should appear within 2 seconds
2. Watch the Developer Console for logs like:
   - `[WebSocket] Code change from Alice`
   - Or presence notifications

### 4. Test Typing Indicators
**In first window (Alice):**
1. Type more code
2. Watch for logs like:
   - `[sendCodeChange] Called`
   - `[Editor] Sending typing indicator: true`

**In second window (Bob):**
1. You should see "Alice is typing" appear near the top

### 5. Test User Presence
**In first window (Alice):**
1. Watch for presence notifications when Bob joins
2. Look for "Bob joined" message

**Both windows:**
1. Active users should be displayed with colored avatars in the editor header

## Key Logs to Watch

### Connection Logs
```
[useWebSocketCollaboration] Initializing WebSocket connection...
[WebSocket] ✓ Connected successfully
[useWebSocketCollaboration] ✓ Successfully joined snippet {snippetId}
```

### Code Change Logs
```
[Editor] Sending code change
[sendCodeChange] Called { snippetId, connected: true, ... }
[WebSocketService.sendCodeChange] Sending to: /app/snippet/{id}/code
[WebSocketService.sendCodeChange] ✓ Sent
```

### Receipt Logs (in other window)
```
[WebSocket] Code change received from: Alice
[WebSocket] Presence update received: [...]
[WebSocket] Typing users: [...]
```

## Backend Logs

To monitor backend message handling:
```bash
docker compose logs backend -f | grep -E "CodeChange|Typing|subscribe"
```

Expected backend logs:
```
[CodeChange] Received code change from Alice for snippet {id}
[CodeChange] Code length: 123 Language: javascript
[CodeChange] Broadcasted to /topic/snippet/{id}/code

[Typing] User {userId} is typing in snippet {id}
[Typing] Broadcasting 1 typing users to /topic/snippet/{id}/typing
```

## Troubleshooting

### Code Not Appearing in Second Window
1. Check if `[WebSocketService.sendCodeChange] Sent` appears in sender's console
2. Check if `[WebSocket] Code change received from` appears in receiver's console
3. Check backend logs for `[CodeChange] Received code change`

### Typing Indicator Not Showing
1. Check if `[Editor] Sending typing indicator: true` appears
2. Check if `[WebSocket] Typing users:` appears in other window
3. Ensure both windows have successfully joined the snippet

### User Presence Not Updating
1. Ensure both windows show "X users joined" notifications
2. Check if colored avatars appear in the header
3. Look for `[WebSocket] Presence update received` in console

### Connection Issues
1. Ensure HTTPS certificate is trusted (only an issue with self-signed cert)
2. Check WebSocket URL in Network tab: should be `wss://localhost/api/ws`
3. Verify SockJS connection in console logs

## Dark Mode Testing

To test dark mode:
1. Click the sun/moon icon in the navbar
2. Verify all UI elements change color appropriately:
   - Background should turn dark (gray-800/900)
   - Text should turn light (gray-200)
   - Borders should adjust
3. Editor background should also change
4. Refresh page - dark mode preference should persist (localStorage)

## Browser DevTools Tips

**To filter console logs:**
```
Filter: "WebSocket\|Editor\|Typing\|CodeChange"
```

**To monitor Network tab:**
1. Look for WebSocket connection to `/api/ws`
2. Should stay connected (green indicator)
3. Messages should show in the "Messages" tab

**To check IndexedDB/localStorage:**
1. Open DevTools
2. Application > Storage > Local Storage
3. Should see `currentUsername` stored
4. In Application > IndexedDB (if used for subscriptions)
