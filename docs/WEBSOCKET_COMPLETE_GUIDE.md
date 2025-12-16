# WebSocket Complete Implementation Guide

## ✅ What's Implemented

### 1. Real-time Collaboration Features
- **Live User Presence**: Shows active users viewing the same snippet
- **Auto-Save**: Content syncs across all connected sessions
- **Typing Indicators**: See who is typing in real-time
- **Message Broadcasting**: All updates go through WebSocket (not localStorage)

### 2. WebSocket Architecture

**Backend (Java/Spring)**
- `WebSocketConfig.java`: Configures STOMP protocol
- `WebSocketController.java`: Handles messages and broadcasts
- Endpoints:
  - `/app/typing` - Typing status updates
  - `/app/save` - Content save notifications
  - `/app/join` - User joins snippet
  - `/app/leave` - User leaves snippet

**Frontend (React/TypeScript)**
- `webSocketService.ts`: Core WebSocket connection management
- `useWebSocketCollaboration.ts`: Hook for real-time features
- Broadcasts via STOMP topic subscriptions

### 3. UI Components

**Active Users Indicator** (Top-right)
- Blue box with pulse animation
- Shows count and usernames
- Updates in real-time

**Typing Indicator** (Below active users)
- Purple box with animated dots
- Shows "Username is typing..."
- Auto-clears when typing stops

**Monaco Editor**
- Auto-saves on content change
- Syncs changes from other users
- Real-time cursor awareness

## 🧪 Testing Steps

### Setup
1. Ensure Docker is running:
   ```bash
   docker-compose up -d
   ```

2. Backend running on: `http://localhost:8080`
3. Frontend running on: `http://localhost:5173` (dev) or `http://localhost` (prod)

### Test 1: Create Snippet & Get Share URL
1. Open http://localhost:5173
2. Enter username (e.g., "Alice")
3. Type some code in the editor
4. Click "Create Snippet" button
5. Copy the shortened URL from the modal
   - Should look like: `http://localhost/join/XXX-XXXXX`

### Test 2: Open in New Window
1. Open the shortened URL in a **new incognito/private browser window**
2. Enter a different username (e.g., "Bob")
3. **Expected**: Bob is added, Alice's window shows Bob in "Active Users"
4. **Verify**: No duplicate users on refresh

### Test 3: Typing Indicators
1. With both windows open:
2. Start typing in Bob's window
3. **Expected**: "Bob is typing..." appears in Alice's window
4. Stop typing
5. **Expected**: Indicator disappears

### Test 4: Auto-Save
1. In Alice's window, modify the code
2. **Expected**: Code auto-saves (you'll see debounced saves)
3. Switch to Bob's window
4. **Expected**: Bob's editor updates with Alice's changes

### Test 5: User Leave
1. Close Bob's browser tab/window
2. Wait 5 seconds
3. **Expected**: Alice's "Active Users" updates, Bob disappears

## 🔍 WebSocket Connection Verification

### Check in Browser DevTools

1. **Open DevTools** (F12)
2. Go to **Network** tab
3. Filter by **WS** (WebSocket)
4. **Should see**:
   - `ws://localhost:8080/ws` - Initial connection
   - Message traffic on the connection

### Inspect Messages
1. Open **DevTools Console** or **Network > WS**
2. Look for `SEND` and `RECEIVE` messages:
   - `/app/typing` - Typing events
   - `/app/save` - Save events
   - `/user/queue/updates` - Broadcast messages

## 🐛 Troubleshooting

### No WebSocket Connection
1. Check backend is running: `docker logs code-sharing-platform-backend`
2. Check frontend can reach backend:
   ```bash
   curl http://localhost:8080/api/snippets
   ```
3. Check browser console for errors (F12 → Console)

### Typing Indicator Not Showing
1. Verify typing event is being sent (Network tab)
2. Check WebSocket message arrives (Network > WS)
3. Verify `typingUsers` state updates

### Auto-Save Not Working
1. Verify `save` event sent on editor change
2. Check WebSocket receives the message
3. Verify content updates in other windows

### Duplicate Users After Refresh
1. Fixed with session-based user tracking
2. Browser tab is treated as single session
3. Refresh same tab = same user (no duplicate)

## 📊 Data Flow

```
User Types → onChange event → webSocketService.sendMessage()
    ↓
Backend receives `/app/typing`
    ↓
Broadcasts to `/topic/typing`
    ↓
Other connected clients receive update
    ↓
typingUsers state updates
    ↓
UI re-renders with indicator
```

## 🔧 Configuration

### Backend (application.yml)
```yaml
server:
  port: 8080
spring:
  websocket:
    broker:
      virtual-host: /
      relay-port: 61613
```

### Frontend (webSocketService.ts)
```typescript
// Auto-detects environment
const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const host = window.location.host;
const url = `${protocol}://${host}/ws`;
```

## 📝 Files Modified

- `backend/src/main/java/com/codesharing/websocket/WebSocketController.java`
- `backend/src/main/java/com/codesharing/config/WebSocketConfig.java`
- `frontend/src/services/webSocketService.ts`
- `frontend/src/hooks/useWebSocketCollaboration.ts`
- `frontend/src/pages/EditorPage.tsx`

## ✅ Verification Checklist

- [ ] WebSocket connection established (Network > WS)
- [ ] Active users indicator shows multiple users
- [ ] Typing indicators appear when typing
- [ ] Content auto-saves and syncs
- [ ] Users appear/disappear correctly
- [ ] No duplicate users on refresh
- [ ] All messages use WebSocket (not localStorage)

## 🚀 Production Deployment

When deploying to production:

1. **Backend**: Docker container on port 8080
2. **Frontend**: Served via Nginx on port 80
3. **WebSocket URL**: Auto-detected as `wss://yourdomain.com/ws`
4. **Cross-origin**: Configured in `WebSocketConfig.java`

All features work identically in production mode.

## 📞 Support

For issues:
1. Check Docker logs: `docker-compose logs -f`
2. Check browser console: F12 → Console
3. Check Network tab for WebSocket messages
4. Verify snippet ID in URL matches active session
