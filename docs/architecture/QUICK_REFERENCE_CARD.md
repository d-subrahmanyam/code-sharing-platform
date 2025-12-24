# Quick Reference Card

## 📚 Find Documentation in 10 Seconds

### I want to understand...

| Topic | Go To | Section |
|-------|-------|---------|
| **System overview** | ARCHITECTURE_OVERVIEW.md | System Architecture |
| **How to create a snippet** | USE_CASES_SEQUENCE_DIAGRAMS.md | Use Case 1 |
| **How to join a session** | USE_CASES_SEQUENCE_DIAGRAMS.md | Use Case 2 |
| **Real-time code sync** | USE_CASES_SEQUENCE_DIAGRAMS.md | Use Case 3 |
| **WebSocket messages** | API_SPECIFICATION.md | WebSocket STOMP |
| **GraphQL API** | API_SPECIFICATION.md | GraphQL Endpoint |
| **Database schema** | DATABASE_SCHEMA_STORAGE.md | Collections/Tables |
| **Design decisions** | IMPLEMENTATION_GUIDE.md | Key Design Decisions |
| **Performance tips** | IMPLEMENTATION_GUIDE.md | Performance Optimization |
| **How to deploy** | IMPLEMENTATION_GUIDE.md | Deployment & Operations |
| **Owner identification** | IMPLEMENTATION_GUIDE.md | Design Decision #1 |
| **Metadata sync** | IMPLEMENTATION_GUIDE.md | Design Decision #3 |
| **Query patterns** | DATABASE_SCHEMA_STORAGE.md | Query Patterns |
| **Error handling** | API_SPECIFICATION.md | Error Handling |
| **All diagrams** | ARCHITECTURE_OVERVIEW.md | 6 Sequence Diagrams |

---

## 🎯 Most Important Diagrams

### 1. System Architecture
- **File:** ARCHITECTURE_OVERVIEW.md
- **Shows:** Frontend → Nginx → Backend, WebSocket, Databases
- **Use:** Understand component layout

### 2. Create & Share Flow
- **File:** USE_CASES_SEQUENCE_DIAGRAMS.md, Use Case 1
- **Shows:** Owner creates snippet, generates code, saves to DB
- **Use:** Understand initial flow

### 3. Join Session Flow
- **File:** USE_CASES_SEQUENCE_DIAGRAMS.md, Use Case 2
- **Shows:** Joinee opens link, resolves tiny code, joins WebSocket
- **Use:** Understand session joining

### 4. Real-Time Sync
- **File:** USE_CASES_SEQUENCE_DIAGRAMS.md, Use Case 3
- **Shows:** Bidirectional code updates via WebSocket
- **Use:** Understand live collaboration

### 5. Metadata Sync
- **File:** USE_CASES_SEQUENCE_DIAGRAMS.md, Use Case 4
- **Shows:** Owner changes title, broadcasts to joinee
- **Use:** Understand metadata propagation

### 6. WebSocket Topics
- **File:** ARCHITECTURE_OVERVIEW.md
- **Shows:** 5 message topics with publish/subscribe
- **Use:** Understand real-time messaging

---

## 🔧 API Quick Reference

### GraphQL Queries
```graphql
# Get snippet
query GetSnippet($id: ID!) {
  snippet(id: $id) { ... }
}

# Get by tiny code
query GetSnippetByTinyCode($code: String!) {
  snippetByTinyCode(tinyCode: $code) { ... }
}

# Search
query SearchSnippets($query: String!) {
  searchSnippets(query: $query) { ... }
}
```

### GraphQL Mutations
```graphql
mutation CreateSnippet($input: CreateSnippetInput!) {
  createSnippet(input: $input) { ... }
}

mutation UpdateSnippet($id: ID!, $input: UpdateSnippetInput!) {
  updateSnippet(id: $id, input: $input) { ... }
}

mutation DeleteSnippet($id: ID!) {
  deleteSnippet(id: $id)
}
```

### WebSocket Topics
- **Presence:** `/topic/snippet/{id}/presence`
- **Code:** `/topic/snippet/{id}/code`
- **Metadata:** `/topic/snippet/{id}/metadata`
- **Typing:** `/topic/snippet/{id}/typing-status`
- **Send:** `/app/snippet/{id}/join|leave|code|metadata|typing`

---

## 💾 Database Quick Reference

### MongoDB - CodeSnippet Collection
```javascript
db.codeSnippets.findOne({ id: snippetId })
db.codeSnippets.find({ authorId: userId })
db.codeSnippets.find({ isPublic: true })
db.codeSnippets.find({ $text: { $search: query } })
```

### PostgreSQL - TinyURLs Table
```sql
SELECT snippet_id FROM tiny_urls WHERE short_code = 'ABC123'
UPDATE tiny_urls SET access_count = access_count + 1 WHERE short_code = 'ABC123'
SELECT * FROM tiny_urls WHERE created_by = 'user_id'
```

### Indexes
- **MongoDB:** id, authorId, isPublic, language, tags, text search, compound
- **PostgreSQL:** short_code (unique), snippet_id, created_by, is_active, created_at

---

## 🏗️ Architecture at a Glance

```
Browser (React)
    ↓ HTTP/HTTPS/WebSocket
Nginx (Reverse Proxy)
    ├─ Port 80/443/8000
    ├─ Static files
    ├─ /api/* → GraphQL
    └─ /api/ws → WebSocket
    ↓
Spring Boot Backend
    ├─ GraphQL API
    ├─ WebSocket Controller
    ├─ Services Layer
    └─ Repositories
    ↓
Databases
    ├─ MongoDB (snippets)
    └─ PostgreSQL (URLs)
```

---

## 🔑 Key Concepts

### Owner Identification (4-Level Priority)
1. **URL:** /start = owner, /join = joinee
2. **activeUsers:** owner flag in presence
3. **snippetOwnerId:** Match with userId
4. **New snippet:** Fallback assumption

### User IDs
- **Owner:** persistentUserId (UUID, localStorage)
- **Joinee:** sessionUserId (UUID, sessionStorage)

### Message Flow
1. **Frontend:** User action → state update → WebSocket send
2. **Backend:** Receive → validate → process → broadcast
3. **Database:** Query/Insert/Update as needed
4. **Response:** Back to client → update display

### Real-Time Pattern
1. Client types/changes
2. Debounce 500ms
3. Send WebSocket message
4. Backend broadcasts to topic
5. All subscribers receive
6. Update local state & UI

---

## 📊 File Structure

```
Code Sharing Platform/
├─ frontend/
│  ├─ src/
│  │  ├─ pages/EditorPage.tsx (main component)
│  │  ├─ hooks/useOwnerJoineeSession.ts (custom hook)
│  │  ├─ hooks/useWebSocketCollaboration.ts (WebSocket management)
│  │  ├─ services/webSocketService.ts (STOMP client)
│  │  └─ redux/ (state management)
│  └─ nginx.conf (port 80/443/8000)
│
├─ backend/
│  └─ src/main/java/com/codesharing/platform/
│     ├─ websocket/CollaborationController.java
│     ├─ service/SnippetService.java
│     ├─ service/TinyURLService.java
│     └─ repository/ (data access)
│
├─ docker-compose.yml (orchestration)
│
└─ docs/
   ├─ ARCHITECTURE_OVERVIEW.md
   ├─ USE_CASES_SEQUENCE_DIAGRAMS.md
   ├─ API_SPECIFICATION.md
   ├─ DATABASE_SCHEMA_STORAGE.md
   ├─ IMPLEMENTATION_GUIDE.md
   ├─ DOCUMENTATION_INDEX.md
   └─ (other docs)
```

---

## 🚀 Quick Start Commands

### Docker
```bash
docker-compose up -d              # Start all containers
docker-compose down               # Stop all containers
docker-compose up --build -d      # Rebuild and start
docker-compose logs -f backend    # Watch backend logs
```

### URLs
```
Application:        http://localhost:8000
GraphQL Endpoint:   http://localhost:8080/graphql
MongoDB:            localhost:27017
PostgreSQL:         localhost:5432
```

### Develop
```bash
npm start          # Start frontend (dev)
mvn spring-boot:run  # Start backend (dev)
docker ps          # Check container status
```

---

## ⚡ Performance Tips

### Frontend
- Debounce code changes (500ms)
- Use Redux selectors (memoized)
- Virtual scroll long lists
- Lazy load components

### Backend
- Use indexes on: id, authorId, isPublic, tags
- Cache active sessions in memory
- Batch message broadcasts
- Connection pooling (10-20)

### Database
- Create compound indexes
- Monitor slow queries
- Archive old snippets
- Regular backups

---

## 🔒 Security Checklist

- [ ] Validate all user inputs
- [ ] Sanitize WebSocket messages
- [ ] Check ownership before updates
- [ ] Rate limit API endpoints
- [ ] Use HTTPS in production
- [ ] Add authentication layer
- [ ] Implement CORS properly
- [ ] Log security events

---

## 📈 Monitoring Metrics

### Track These
- Active concurrent users
- Snippets created per minute
- Average session duration
- API response times
- WebSocket latency
- Database query times
- Error rate
- Resource usage (CPU, memory)

### Set Alerts For
- API latency > 1s
- Error rate > 5%
- Database query > 500ms
- Active connections > 80
- Memory usage > 80%
- Disk space < 10%

---

## 📚 Documentation Files

| File | Lines | Purpose |
|------|-------|---------|
| ARCHITECTURE_OVERVIEW.md | 500+ | System overview + diagrams |
| USE_CASES_SEQUENCE_DIAGRAMS.md | 700+ | Detailed workflows |
| API_SPECIFICATION.md | 600+ | API reference |
| DATABASE_SCHEMA_STORAGE.md | 800+ | Schema & queries |
| IMPLEMENTATION_GUIDE.md | 900+ | Design & operations |
| DOCUMENTATION_INDEX.md | 400+ | Navigation guide |
| **Total** | **3,500+** | **Complete knowledge base** |

---

## ❓ Common Questions

**Q: How do I add a new feature?**
A: Check USE_CASES_SEQUENCE_DIAGRAMS.md for similar flows, then implement frontend/API/database changes.

**Q: How do I debug a real-time sync issue?**
A: Check WebSocket messages in browser DevTools, verify backend logic in CollaborationController.

**Q: How do I optimize a slow query?**
A: Check DATABASE_SCHEMA_STORAGE.md indexes, use EXPLAIN ANALYZE, add appropriate index.

**Q: How do I deploy to production?**
A: See IMPLEMENTATION_GUIDE.md operations section, set up SSL, configure environment variables.

**Q: How do I add authentication?**
A: See IMPLEMENTATION_GUIDE.md security section, add JWT tokens, user registration/login.

---

## 🎓 Learning Path

1. **Start Here:** This Quick Reference Card (5 min)
2. **Overview:** ARCHITECTURE_OVERVIEW.md diagrams (15 min)
3. **Workflows:** USE_CASES_SEQUENCE_DIAGRAMS.md all flows (30 min)
4. **Deep Dive:** IMPLEMENTATION_GUIDE.md full read (45 min)
5. **Reference:** API_SPECIFICATION.md when implementing (15 min)
6. **Database:** DATABASE_SCHEMA_STORAGE.md as needed (15 min)

**Total Time to Mastery:** ~2 hours

---

## 📞 Need More Info?

- **System Overview?** → ARCHITECTURE_OVERVIEW.md
- **How something works?** → USE_CASES_SEQUENCE_DIAGRAMS.md
- **API Details?** → API_SPECIFICATION.md
- **Database?** → DATABASE_SCHEMA_STORAGE.md
- **Design Decisions?** → IMPLEMENTATION_GUIDE.md
- **Navigation?** → DOCUMENTATION_INDEX.md
- **This Card** → QUICK_REFERENCE_CARD.md

