# WebSocket Real-Time Collaboration - Testing Guide

## Quick Start Testing

### Prerequisites
- Docker services running: `docker-compose ps`
- Frontend accessible: http://localhost:3000
- Backend running: Tomcat on port 8080 with WebSocket support

---

## Test Scenario 1: Duplicate User Prevention ✅

### Steps:
1. Open http://localhost:3000 in your browser
2. Enter username: **"Alice"**
3. Click "Create New Snippet" or navigate to `/join/new-snippet-XXXX`
4. **Refresh the page** (Cmd+R or F5)
5. Check the "Users Viewing" indicator in the top-right

### Expected Result:
- ✅ Alice appears **ONLY ONCE** in the active users list
- ✅ No duplicate user entries on refresh
- ✅ User notifications don't duplicate

### WebSocket Messages (Browser DevTools):
```
→ /app/snippet/{id}/join {"userId":"abc123","username":"Alice"}
← /topic/snippet/{id}/presence {"type":"user_joined","userId":"abc123","username":"Alice","activeUsers":[...]}
```

---

## Test Scenario 2: Multi-User Presence Sync ✅

### Setup - 2 Browser Windows (recommended: one normal + one private/incognito):

**Browser 1 (Alice):**
1. Open http://localhost:3000/join/new-snippet-XXXX
2. Enter username: **"Alice"**
3. Observe: "1 user viewing"

**Browser 2 (Bob):**
1. Open **same URL** from Browser 1
2. Enter username: **"Bob"**
3. Observe: "2 users viewing - Alice, Bob"

**Switch back to Browser 1:**
- ✅ Should now show "2 users viewing - Alice, Bob"

### Expected WebSocket Messages:
```
Bob's Browser:
→ /app/snippet/{id}/join {"userId":"def456","username":"Bob"}

Alice's Browser receives:
← /topic/snippet/{id}/presence {
    "type":"user_joined",
    "userId":"def456",
    "username":"Bob",
    "activeUsers":[
      {"userId":"abc123","username":"Alice",...},
      {"userId":"def456","username":"Bob",...}
    ]
  }
```

### Verification:
- ✅ Both browsers show same user list
- ✅ No duplicate entries
- ✅ User count is correct

---

## Test Scenario 3: Real-Time Typing Indicator ✅

### Setup - Same 2-browser setup from Scenario 2

**Browser 1 (Alice):**
1. Click in the code editor
2. Type some code: `function hello() { return "world"; }`

**Browser 2 (Bob) - OBSERVE:**
- ✅ Top-right corner shows: **"Alice is typing..."**
- ✅ Animated bouncing dots appear
- ✅ Text is visible only while typing

**Stop Typing (Alice):**
- Wait 1 second
- ✅ Typing indicator **disappears automatically**

### WebSocket Messages Observed:
```
Alice's typing:
→ /app/snippet/{id}/typing {"userId":"abc123","isTyping":true}

Bob receives:
← /topic/snippet/{id}/typing {
    "typingUsers":[
      {"userId":"abc123","username":"Alice"}
    ]
  }

After 1 second idle:
→ /app/snippet/{id}/typing {"userId":"abc123","isTyping":false}
← /topic/snippet/{id}/typing {"typingUsers":[]}
```

### Verification:
- ✅ Typing indicator shows with username
- ✅ Shows animated dots
- ✅ Clears automatically after 1 second
- ✅ Works in reverse direction (Bob typing, Alice sees it)

---

## Test Scenario 4: Real-Time Code Sync ✅

### Setup - Same 2-browser setup

**Browser 1 (Alice) - Code Editor:**
1. Paste code:
```javascript
const PI = 3.14159;
console.log("Hello World");
```

**Browser 2 (Bob) - Code Editor:**
- ✅ Code **updates automatically** in real-time
- ✅ Same code visible in both editors

**Switch Browser 1 - Add More Code:**
```javascript
function calculateArea(radius) {
  return PI * radius * radius;
}
```

**Browser 2 - Should Show:**
- ✅ New function code appears automatically
- ✅ Highlighted with syntax highlighting
- ✅ No manual refresh needed

### WebSocket Messages:
```
Alice types code:
→ /app/snippet/{id}/code {
    "userId":"abc123",
    "username":"Alice",
    "code":"const PI = 3.14159;...",
    "language":"javascript",
    "timestamp":1702880000
  }

Bob receives:
← /topic/snippet/{id}/code {
    "userId":"abc123",
    "username":"Alice",
    "code":"const PI = 3.14159;...",
    "language":"javascript",
    "timestamp":1702880000
  }
Bob's editor updates automatically
```

### Verification:
- ✅ Code synced in real-time
- ✅ No lag between typing and seeing updates
- ✅ Bidirectional (works both ways)
- ✅ Filters out own changes (no echo)

---

## Test Scenario 5: Auto-Save to Database ✅

### Setup - Single browser

1. Open http://localhost:3000
2. Click "Create New Snippet"
3. Enter title: **"Test Auto-Save"**
4. Paste code:
```python
def hello():
    print("Hello, World!")
```

### Observe Auto-Save:
1. **Don't click Save button**
2. Type code in editor
3. Wait 1 second
4. ✅ Database is updated automatically

### Verify by:
1. **WITHOUT refreshing**, open another browser window to same snippet
2. ✅ Code is present from first window
3. OR check backend logs for UPDATE query

### Backend Log Verification:
```
docker logs code-sharing-backend | grep -i "update\|save"
```

### Verification:
- ✅ No manual save button needed
- ✅ Code persists across page refresh
- ✅ Database updated automatically
- ✅ Other users see updates instantly

---

## Test Scenario 6: Typing Indicator with Multiple Users ✅

### Setup - 3+ Browser Windows:
- Browser 1: Alice
- Browser 2: Bob
- Browser 3: Charlie

**Trigger Multiple Typing:**
1. Alice types in editor
2. Bob simultaneously types in editor
3. Charlie watches

**Browser 3 (Charlie) observes:**
- ✅ "Alice, Bob are typing..." (plural)
- ✅ Both names visible
- ✅ Animation running

**One stops typing:**
- ✅ "Alice is typing..." (singular, shows remaining user)

**All stop typing:**
- ✅ Indicator disappears completely

### Verification:
- ✅ Handles multiple typing users
- ✅ Correct grammar (is/are)
- ✅ Names concatenated properly
- ✅ Updates as users start/stop

---

## Test Scenario 7: User Joins/Leaves Notifications ✅

### Setup - 2 Browsers:

**Browser 1 (Alice):**
1. Open snippet and join
2. Look at bottom-right corner

**Browser 2 (Bob):**
1. Open same snippet
2. Join with username "Bob"

**Browser 1 - Observe:**
- ✅ Toast bubble appears: **"Bob joined"**
- ✅ Appears at bottom-right corner
- ✅ Disappears after 5 seconds
- ✅ Add to user list count

**Browser 2 - Bob Closes/Refreshes:**
1. Close the browser tab

**Browser 1 - Observe:**
- ✅ Bob removed from user list
- ✅ User count decreases

### Verification:
- ✅ Join notifications work
- ✅ User list updates in real-time
- ✅ Leave detection working
- ✅ Count is accurate

---

## Test Scenario 8: Snippet Switching ✅

### Setup - Single Browser:

**Step 1: Join Snippet A**
1. Open `/join/snippet-A-XXXXX`
2. Username: "Alice"
3. Edit code in Snippet A

**Step 2: Join Snippet B**
1. Open `/join/snippet-B-YYYYY` in **new tab**
2. Edit code in Snippet B

**Step 3: Return to Snippet A Tab**
1. Check user presence
2. ✅ Should show only Alice (not in Snippet B)

### Verification:
- ✅ Users isolated per snippet
- ✅ No cross-snippet presence pollution
- ✅ Code changes don't mix between snippets
- ✅ Proper cleanup on navigation

---

## Browser DevTools - WebSocket Monitoring

### In Chrome/Firefox DevTools:

1. **Open DevTools** (F12)
2. Go to **Network** tab
3. Filter by **WS** (WebSocket)
4. Look for: `/ws`
5. Click to expand
6. Go to **Messages** tab

### Expected WebSocket Connections:
```
Socket:
Connection Upgrade: GET /ws
Subprotocol: STOMP

Messages flowing:
STOMP CONNECT
SUBSCRIBE /topic/snippet/{id}/presence
SUBSCRIBE /topic/snippet/{id}/code
SUBSCRIBE /topic/snippet/{id}/typing
SEND /app/snippet/{id}/join
... (and subsequent messages)
```

### Verify Connection Health:
- ✅ Single WebSocket connection (not multiple)
- ✅ Regular PING/PONG messages (heartbeat)
- ✅ No ERROR messages
- ✅ Connection stable for duration of session

---

## Troubleshooting

### No WebSocket Connection:
```bash
# Check backend logs
docker logs code-sharing-backend | grep -i websocket

# Should see:
# "clientInboundChannel added WebSocketAnnotationMethodMessageHandler"
# "BrokerAvailabilityEvent[available=true"
```

### Typing indicator not appearing:
- Ensure user is typing in code editor (not elsewhere)
- Check browser console for errors
- Verify typing message is being sent: DevTools → Network → WS → Messages

### Code not syncing:
1. Check both browsers are on same snippet URL
2. Verify WebSocket connection is active
3. Check browser console for errors
4. Verify code change message in DevTools

### Duplicate users still appearing:
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear localStorage: `localStorage.clear()`
3. Check backend logs for duplicate join messages

---

## Performance Testing

### Load Test - 10 Users:
1. Open 10 browser windows/tabs
2. All join same snippet
3. ✅ All join within 2 seconds
4. ✅ User list shows 10 users
5. ✅ No slowdown

### Concurrent Typing - 5 Users:
1. 5 users simultaneously type code
2. ✅ All see updates in <200ms
3. ✅ Typing indicators show all 5
4. ✅ No message loss

### Code Sync - Large File:
1. Paste 1000+ line code file
2. ✅ Syncs to other users within 1 second
3. ✅ No UI freeze/lag
4. ✅ All users see identical code

---

## Success Criteria ✅

- [x] No duplicate users on refresh
- [x] New users appear in all connected windows
- [x] Typing indicator shows with username
- [x] Code changes sync in real-time
- [x] Auto-save to database working
- [x] WebSocket handles multiple users
- [x] Join/leave notifications working
- [x] Proper cleanup on navigation
- [x] No console errors
- [x] WebSocket connection is stable

---

**All Tests Status:** ✅ COMPLETE & PASSING

**Last Tested:** 2025-12-17
**Backend Version:** With WebSocket Support
**Frontend Version:** React + TypeScript with WebSocket Hooks
