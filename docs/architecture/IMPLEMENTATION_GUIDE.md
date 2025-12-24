# Code Sharing Platform - Complete Architecture & Implementation Guide

## Executive Summary

The Code Sharing Platform is a real-time collaborative code editor that allows users to create, edit, and share code snippets with instant synchronization. The system uses a modern cloud-native architecture with:

- **Frontend:** React 18 + TypeScript with Redux state management
- **Backend:** Spring Boot with GraphQL API and WebSocket support
- **Databases:** MongoDB for content, PostgreSQL for URL mapping
- **Real-time:** SockJS/STOMP WebSocket with message broadcasting
- **Infrastructure:** Docker Compose with Nginx reverse proxy

---

## System Architecture Overview

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Docker Compose                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Nginx Reverse Proxy                       │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ Port 80 (HTTP) → Port 443 (HTTPS)                       │ │ │
│  │  │ Port 8000 (HTTP Dev)                                    │ │ │
│  │  │ • Static file serving (React SPA)                       │ │ │
│  │  │ • API reverse proxy → Backend:8080                      │ │ │
│  │  │ • WebSocket proxy (HTTP/1.1 Upgrade)                   │ │ │
│  │  │ • CORS handling                                         │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│          ┌───────────────────┼───────────────────┐               │
│          │                   │                   │               │
│  ┌───────▼─────────┐  ┌──────▼─────────┐  ┌────▼──────────────┐ │
│  │  Frontend       │  │  Backend       │  │  PostgreSQL       │ │
│  │  React/Vite    │  │  Spring Boot   │  │  TinyURL Mapping  │ │
│  │  Node.js        │  │  Java 21       │  │  Port 5432        │ │
│  │  Port 80/443    │  │  Port 8080     │  │                   │ │
│  │  8000 (dev)     │  │  GraphQL API   │  │  Tables:          │ │
│  │                 │  │  WebSocket     │  │  • tiny_urls      │ │
│  │  Redux Store    │  │  STOMP Handler │  │  • users (opt)    │ │
│  │  • Snippets     │  │                │  │                   │ │
│  │  • UI State     │  │  Services:     │  │  Indexes:         │ │
│  │  • Active Users │  │  • Snippet Svc │  │  • short_code     │ │
│  │                 │  │  • User Svc    │  │  • snippet_id     │ │
│  └─────────────────┘  │  • Search Svc  │  │  • created_by     │ │
│                       │                │  └───────────────────┘ │
│                       │  Repositories: │                        │
│                       │  • Snippet     │                        │
│                       │  • TinyURL     │                        │
│                       │  • User        │                        │
│                       └────────────────┘                        │
│                              │                                  │
│                              │ GraphQL/REST                     │
│                              │                                  │
│                       ┌──────▼──────────┐                       │
│                       │  MongoDB        │                       │
│                       │  Code Snippets  │                       │
│                       │  Port 27017     │                       │
│                       │                 │                       │
│                       │  Collections:   │                       │
│                       │  • codeSnippets │                       │
│                       │                 │                       │
│                       │  Indexes:       │                       │
│                       │  • id (UNIQUE)  │                       │
│                       │  • authorId     │                       │
│                       │  • isPublic     │                       │
│                       │  • tags (Array) │                       │
│                       │  • Text (full)  │                       │
│                       └─────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
User Browser (Client)
    ↓
[HTTP/HTTPS/WebSocket]
    ↓
Nginx Reverse Proxy
    ├─ Static Files → React SPA
    ├─ /api/* → GraphQL/REST Backend
    └─ /api/ws → WebSocket Backend
    ↓
Spring Boot Backend
    ├─ GraphQL Resolver Layer
    │   ├─ Queries (search, fetch)
    │   └─ Mutations (create, update, delete)
    ├─ Service Layer (Business Logic)
    │   ├─ SnippetService
    │   ├─ TinyURLService
    │   └─ CollaborationService
    ├─ WebSocket Controller (STOMP)
    │   ├─ Presence Management
    │   ├─ Message Broadcasting
    │   └─ Session Tracking
    └─ Data Access Layer
        ├─ MongoDB (Snippet data)
        ├─ PostgreSQL (URL mappings)
        └─ In-Memory (Active sessions)
    ↓
Databases
    ├─ MongoDB (permanent storage)
    └─ PostgreSQL (mapping storage)
    ↓
[Response back through same path]
```

---

## Core Components Breakdown

### Frontend Components

#### HomePage.tsx
- **Purpose:** Entry point for creating new snippets
- **Key Features:**
  - Username input dialog
  - New snippet creation (generates tiny code)
  - Local snippet list
  - Search existing snippets
- **State Management:** Redux (snippets reducer)
- **WebSocket:** None (static page)

#### EditorPage.tsx
- **Purpose:** Main collaborative code editor
- **Key Features:**
  - Code editor with syntax highlighting
  - Metadata sidebar (title, description, language, tags)
  - User presence panel (active collaborators)
  - Share button (generates link)
  - Save button (persists to database)
- **State Management:** Redux (snippet, UI, users reducers)
- **WebSocket:** Full duplex (presence, code, metadata, typing)
- **Real-time Updates:**
  - Instant code synchronization
  - Metadata updates from owner
  - Typing indicators
  - User join/leave notifications

#### Hooks

**useOwnerJoineeSession**
- 4-level priority system for owner detection
- URL-based detection (fastest)
- WebSocket active users (secondary)
- Snippet owner ID matching (tertiary)
- New snippet fallback (lowest)

**useWebSocketCollaboration**
- Connection lifecycle management
- STOMP subscription setup
- Message handlers for all topics
- Cleanup on unmount

### Backend Components

#### GraphQL Resolvers
```
Root Query
├─ snippet(id) → SnippetService.getSnippet()
├─ snippetByTinyCode(code) → TinyURLService.resolveAndFetch()
├─ searchSnippets(query, limit, offset) → SearchService.search()
└─ userSnippets(userId, limit) → SnippetService.findByAuthor()

Root Mutation
├─ createSnippet(input) → SnippetService.create() + TinyURLService.generateMapping()
├─ updateSnippet(id, input) → SnippetService.update()
└─ deleteSnippet(id) → SnippetService.delete() + TinyURLService.remove()
```

#### CollaborationController (WebSocket)
```
/app/snippet/{id}/join
  → handleUserJoin()
  → Register in active session
  → Fetch snippet from MongoDB
  → Broadcast presence with owner metadata

/app/snippet/{id}/code
  → handleCodeChange()
  → Validate sender
  → Broadcast to /topic/snippet/{id}/code

/app/snippet/{id}/metadata
  → handleMetadataUpdate()
  → Only from owner
  → Broadcast to /topic/snippet/{id}/metadata

/app/snippet/{id}/typing
  → handleTypingIndicator()
  → Build typing status
  → Broadcast to /topic/snippet/{id}/typing-status

/app/snippet/{id}/leave
  → handleUserLeave()
  → Remove from active session
  → Broadcast updated presence
```

#### Service Layer
```
SnippetService
├─ getSnippet(id) → MongoDB query
├─ createSnippet(input) → MongoDB insert + UUID generate
├─ updateSnippet(id, input) → MongoDB update + updatedAt
├─ deleteSnippet(id) → MongoDB delete
├─ findByAuthor(authorId) → MongoDB find
└─ incrementViewCount(id) → MongoDB increment

TinyURLService
├─ resolveCode(code) → PostgreSQL lookup
├─ generateMapping(snippetId) → PostgreSQL insert + code generate
├─ trackAccess(code) → PostgreSQL update access stats
└─ removeMapping(code) → PostgreSQL delete

SearchService
├─ searchPublicSnippets(query) → MongoDB text search
├─ filterByLanguage(lang) → MongoDB filter
└─ filterByTags(tags) → MongoDB array query
```

---

## Real-Time Collaboration Flow

### Session Lifecycle

```
User A (Owner)          User B (Joinee)         Server/Database
    │                        │                          │
    │ Click "New Snippet"    │                          │
    ├─────────────────────────────────────────────────────>
    │ Create with tiny code  │                          │
    │ Store in localStorage  │                          │
    │                        │                          │
    │ URL: /start/TinyCode   │                          │
    │ isOwner = true         │                          │
    │                        │                          │
    │ WebSocket connect      │                          │
    ├──────────────────────────────────────────────────────>
    │                        │                          │
    │ Send /join message     │                          │
    │                        │                          │
    │ Edit title & code      │                          │
    │ Local state updated    │                          │
    │                        │                          │
    │                        │ Click share link         │
    │                        │ /join/TinyCode           │
    │                        ├─────────────────────────>
    │                        │ Resolve tiny code       │
    │                        │ Fetch snippet from DB   │
    │                        │<────────────────────────┤
    │                        │ Load into formData      │
    │                        │ isOwner = false         │
    │                        │ isJoinee = true         │
    │                        │                        │
    │                        │ WebSocket connect      │
    │                        ├──────────────────────────>
    │                        │ Send /join message     │
    │<──────────────────────────────────────────────────
    │ Receive presence       │                        │
    │ (User B joined)        │                        │
    │                        │                        │
    │ Edit title: "New Title"│                        │
    │ Send metadata update   │                        │
    ├──────────────────────────────────────────────────>
    │                        │ Receive metadata       │
    │                        │ Update formData        │
    │                        │ Apply to UI            │
    │                        │ See: "New Title"       │
    │                        │                        │
    │ Type code changes      │                        │
    │ Send code message      │                        │
    ├──────────────────────────────────────────────────>
    │                        │ Receive code           │
    │                        │ Update editor          │
    │                        │ See changes live       │
    │                        │                        │
    │                        │ Type code changes      │
    │                        │ Send code message      │
    │                        ├─────────────────────────>
    │ Receive code           │                        │
    │ Update editor          │                        │
    │ Merge changes          │                        │
    │                        │                        │
    │ Click "Save"           │                        │
    ├──────────────────────────────────────────────────>
    │                        │                        │ MongoDB insert
    │ Confirm saved          │                        │ TinyURL mapping
    │ Redirect home          │                        │<──────────────
    │                        │ Still editing...       │
    │                        │                        │
    │                        │ Close editor           │
    │                        │ WebSocket disconnect   │
    │                        ├─────────────────────────>
    │ Receive leave notice   │                        │
    │ Update active users    │                        │
    │                        │                        │
    └                        └                        ┘
```

### Presence Message Flow (Detailed)

```
[Owner joins at /start/new-code]

EditorPage.tsx
  → useOwnerJoineeSession detects /start route
  → isOwner = true
  → Connect WebSocket
  → Send: /app/snippet/{id}/join { userId, username }

BackendController
  → handleUserJoin()
  → Fetch snippet from MongoDB (fetch title from DB)
  → Get active users list
  → Build PresenceMessage:
    {
      type: "presence_update",
      userId: "owner_id",
      username: "John",
      activeUsers: [
        { userId: "owner_id", username: "John", owner: true }
      ],
      ownerTitle: "Hello World",          ← From DB or owner's formData
      ownerDescription: "...",            ← From owner's formData
      ownerLanguage: "javascript",        ← From owner's formData
      ownerTags: ["js", "hello"],        ← From owner's formData
      timestamp: "2024-01-15T10:30:00Z"
    }
  → Broadcast to /topic/snippet/{id}/presence

[Joinee joins at /join/new-code]

EditorPage.tsx
  → Resolve tiny code → snippetId
  → Fetch snippet from MongoDB
  → Load into formData
  → isOwner = false
  → Connect WebSocket
  → Send: /app/snippet/{id}/join { userId, username }

BackendController
  → handleUserJoin()
  → Fetch snippet from MongoDB
  → Get active users list (now includes owner)
  → Build PresenceMessage with owner metadata
  → Broadcast to /topic/snippet/{id}/presence

JoineeEditorPage.tsx (receiving)
  → onPresenceUpdate(users, snippetTitle, presenceMessage)
  → Extract activeUsers
  → Identify owner (owner: true)
  → Check isOwner = false (joinee context)
  → Extract owner metadata from presenceMessage:
    - ownerTitle → formData.title
    - ownerDescription → formData.description
    - ownerLanguage → formData.language
    - ownerTags → formData.tags
  → Dispatch Redux actions
  → Update UI display
  
OwnerEditorPage.tsx (receiving)
  → onPresenceUpdate(users, snippetTitle, presenceMessage)
  → Extract activeUsers
  → Show "Jane joined" notification
  → Update active users display
```

---

## Key Design Decisions

### 1. Owner Identification (4-Level Priority)

**Why?** Owner needs to be identified before database persistence (no saved ID)

```
Priority 1: URL Route (/start vs /join)
  ├─ /start → isOwner = true
  └─ /join → isOwner = false

Priority 2: WebSocket activeUsers
  ├─ Check if user.owner = true in activeUsers list
  └─ Most reliable after URL

Priority 3: Snippet Owner ID
  ├─ snippetOwnerId === userId
  ├─ Works for existing snippets
  └─ Fails for new snippets (no DB entry)

Priority 4: New Snippet Fallback
  ├─ If isNew && !userId in activeUsers
  └─ Assume owner (last resort)
```

### 2. Session vs Persistent User IDs

**Owner:** Persistent UUID (localStorage)
- Survives browser close/refresh
- Owner can rejoin and maintain ownership
- Used for database authorId field

**Joinee:** Session UUID (sessionStorage)
- Lost when browser tab closes
- Random for each session
- No persistence across visits

### 3. Metadata Synchronization

**Problem:** Owner's metadata not in DB for new snippets

**Solution:** Owner metadata in presence messages
- PresenceMessage includes ownerTitle, ownerDescription, etc.
- Sent on every user join
- Joinee applies immediately without waiting for save
- Metadata updates broadcast via separate topic

### 4. Debounced Code Updates

**Why?** Network efficiency
- 500ms debounce on code changes
- Reduces message frequency from keystroke level
- Prevents flooding with partial changes
- Client-side state updated immediately (instant UI feedback)

### 5. HTTP Fallback Port

**Why?** VS Code Simple Browser SSL certificate issues
- Port 443 (HTTPS): Self-signed cert rejected by browser
- Port 8000 (HTTP): Certificate-free, dev-friendly
- Same routing & functionality
- Production uses HTTPS only

---

## Security Considerations

### Authentication & Authorization

**Current Implementation:**
- Session-based (no login required)
- userId stored in localStorage/sessionStorage
- No backend validation of user identity

**Potential Improvements:**
- JWT token-based authentication
- User registration & login
- Snippet ownership verification
- Collaboration permissions

### WebSocket Security

**Current:**
- Messages broadcasted to all subscribers
- No message validation/sanitization
- No rate limiting

**Improvements:**
- Message signature verification
- Input validation/sanitization
- Rate limiting per user
- Spam/abuse detection

### Data Privacy

**Current:**
- Public snippets searchable
- No encryption of snippets
- No access control

**Improvements:**
- Private snippets (owner only)
- Snippet sharing permissions
- Encryption at rest/transit
- Audit logging

---

## Performance Optimization

### Frontend Optimization

1. **Code Splitting:** React lazy loading for routes
2. **Redux Selectors:** Memoized selectors prevent unnecessary re-renders
3. **Debouncing:** 500ms debounce on code changes
4. **Virtual Scrolling:** For long snippet lists
5. **Service Workers:** Cache static assets

### Backend Optimization

1. **MongoDB Indexes:** Optimized for common queries
2. **Query Batching:** Combine multiple queries
3. **Caching:** In-memory cache for active sessions
4. **Connection Pooling:** Multiple DB connections
5. **Message Compression:** STOMP message compression

### Network Optimization

1. **WebSocket:** Bi-directional, low-latency communication
2. **Message Batching:** Combine multiple updates
3. **Compression:** gzip for HTTP/HTTPS
4. **CDN:** Static assets cached at edge

### Database Optimization

1. **Connection Pool:** Multiple connections (10-20)
2. **Batch Inserts:** Create multiple documents/rows
3. **Projection:** Only fetch needed fields
4. **Pagination:** Limit result sets (default 10-20)
5. **Cleanup:** Remove inactive sessions after timeout

---

## Monitoring & Logging

### Key Metrics to Track

**Application:**
- Active concurrent users
- Snippets created/updated per minute
- Average session duration
- Collaboration sessions created

**Performance:**
- API response times (GraphQL)
- WebSocket message latency
- Database query times
- UI render times

**Errors:**
- GraphQL errors
- WebSocket disconnections
- Database errors
- 404/500 HTTP errors

**Infrastructure:**
- Container resource usage (CPU, memory)
- Database connections
- Network bandwidth
- Disk usage

### Logging Strategy

```
Frontend Logs:
- Action dispatches (Redux)
- Component lifecycle events
- WebSocket connect/disconnect
- Error boundaries

Backend Logs:
- GraphQL query/mutation requests
- WebSocket message routing
- Database operations
- Authentication/authorization events

Format: [TIMESTAMP] [LEVEL] [SOURCE] [MESSAGE]
Example: 2024-01-15T10:30:45.123Z INFO EditorPage User "John" joined snippet
```

---

## Deployment & Operations

### Environment Configuration

```
Development:
- HTTP:HTTPS = 8000:443
- MongoDB: localhost:27017
- PostgreSQL: localhost:5432
- CORS: All origins allowed

Production:
- HTTPS only on 443
- MongoDB: Cloud (e.g., MongoDB Atlas)
- PostgreSQL: Cloud (e.g., AWS RDS)
- CORS: Specific origins only
- SSL/TLS certificates from trusted CA
```

### Backup Strategy

**MongoDB:**
- Daily snapshots
- Retention: 30 days
- Test restore monthly

**PostgreSQL:**
- Hourly incremental backups
- Daily full backups
- Retention: 90 days
- Test restore weekly

### Disaster Recovery

**RTO:** < 4 hours (restore to cloud)
**RPO:** < 1 hour (data loss acceptable)

**Steps:**
1. Identify failure time
2. Restore from latest snapshot
3. Replay transaction logs
4. Verify data integrity
5. Restore services

---

## Future Enhancements

### Phase 2 Features
1. User authentication & profiles
2. Snippet favorites & collections
3. Comments & discussions
4. Version history & rollback
5. Snippet forking
6. Collaborative sessions statistics

### Phase 3 Features
1. Code execution & output
2. Snippet templates
3. IDE extensions
4. Mobile app
5. Real-time video chat
6. Advanced search filters

### Phase 4 Features
1. Snippet monetization
2. Team workspaces
3. Enterprise SSO
4. Advanced analytics
5. AI code suggestions
6. Automated testing

---

## Quick Reference

### Important Files
- Frontend: `frontend/src/pages/EditorPage.tsx`
- Backend: `backend/src/main/java/com/codesharing/platform/`
- Database config: `docker-compose.yml`
- Nginx config: `frontend/nginx.conf`

### Key URLs
- Application: `http://localhost:8000` or `https://localhost`
- GraphQL Playground: `http://localhost:8080/graphql`
- MongoDB Shell: Connect to `localhost:27017`
- PostgreSQL Shell: `psql -h localhost -U postgres`

### Commands
- Start: `docker-compose up -d`
- Stop: `docker-compose down`
- Logs: `docker-compose logs -f service-name`
- Rebuild: `docker-compose up --build -d`

