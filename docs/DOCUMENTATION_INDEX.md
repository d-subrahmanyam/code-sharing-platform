# Architecture Documentation Index

## Quick Navigation

This index provides a comprehensive guide to all architecture and design documentation for the Code Sharing Platform.

---

## 📋 Main Documentation Files

All architecture documentation has been moved to **`docs/architecture/`** folder.

### 1. **architecture/ARCHITECTURE_OVERVIEW.md**
   - **Purpose:** High-level system architecture with Mermaid diagrams
   - **Contents:**
     - System architecture overview
     - Technology stack & versions
     - Core components breakdown
     - 6 major flow sequence diagrams:
       - Create New Snippet & Share
       - Join Existing Session
       - Real-Time Code Collaboration
       - Metadata Synchronization
       - Presence & Active Users
       - Typing Indicators
     - WebSocket message types (5 types)
     - Database storage overview
   - **Best For:** Getting a quick visual understanding of how the system works
   - **Level:** Intermediate (assumes knowledge of web architecture)

### 2. **architecture/USE_CASES_SEQUENCE_DIAGRAMS.md**
   - **Purpose:** Detailed sequence diagrams for each major use case
   - **Contents:**
     - **Use Case 1:** Owner creates and shares new snippet
     - **Use Case 2:** Joinee joins collaboration session
     - **Use Case 3:** Real-time code synchronization
     - **Use Case 4:** Owner updates metadata & syncs to joinee
     - **Use Case 5:** Save snippet to database
     - **Use Case 6:** Typing indicators
     - **Use Case 7:** User leaves session
     - Data flow diagrams (frontend→backend, real-time sync)
     - Message sequence summary table
   - **Best For:** Understanding exact sequence of events for specific features
   - **Level:** Beginner-Intermediate (detailed, step-by-step flows)

### 3. **architecture/API_SPECIFICATION.md**
   - **Purpose:** Complete API documentation (GraphQL & WebSocket)
   - **Contents:**
     - **GraphQL API:**
       - 3 core queries (GetSnippet, GetSnippetByTinyCode, SearchSnippets)
       - 3 core mutations (CreateSnippet, UpdateSnippet, DeleteSnippet)
       - Request/response examples
       - Input types & validation
     - **WebSocket STOMP:**
       - 5 message topics (presence, code, metadata, typing, join/leave)
       - Message formats & JSON structures
       - Connection flow diagram
       - Receiving/sending logic
     - **Error Handling:**
       - GraphQL error examples
       - WebSocket error handling
       - HTTP status codes
     - **Rate Limiting & Authentication:**
       - Message frequency limits
       - Connection limits
       - Session management
   - **Best For:** Developers implementing API clients or integrations
   - **Level:** Advanced (requires API knowledge)

### 4. **architecture/DATABASE_SCHEMA_STORAGE.md**
   - **Purpose:** Complete database schema & query patterns
   - **Contents:**
     - **MongoDB:**
       - CodeSnippet collection schema (with validation rules)
       - 7 index definitions with use cases
       - Example documents
       - Query patterns (6 common queries)
     - **PostgreSQL:**
       - TinyURLs table schema (with foreign keys)
       - Optional Users table for future auth
       - Example records
       - Query patterns (7 common queries)
     - **Data Relationships:**
       - Entity relationship diagram
       - Data flow through system (3 major flows)
     - **Indexing Strategy:**
       - MongoDB indexes & performance tips
       - PostgreSQL indexes & optimization
     - **Consistency & Transactions:**
       - Multi-document transactions (MongoDB)
       - Transactional integrity (PostgreSQL)
       - Eventual consistency handling
   - **Best For:** Database administrators & backend developers
   - **Level:** Advanced (requires database knowledge)

### 5. **architecture/IMPLEMENTATION_GUIDE.md**
   - **Purpose:** Comprehensive implementation & architectural guide
   - **Contents:**
     - **System Architecture:**
       - Deployment architecture diagram
       - Data flow architecture
     - **Core Components:**
       - Frontend components (HomePage, EditorPage)
       - Custom hooks (useOwnerJoineeSession, useWebSocketCollaboration)
       - Backend components (GraphQL, WebSocket Controller, Services)
       - Service layer breakdown
     - **Real-Time Collaboration:**
       - Session lifecycle diagram
       - Detailed presence message flow
     - **Key Design Decisions:**
       - 4-level owner identification priority
       - Session vs persistent user IDs
       - Metadata synchronization approach
       - Debounced code updates
       - HTTP fallback port
     - **Security Considerations:**
       - Current security model
       - Potential improvements
       - WebSocket security
       - Data privacy
     - **Performance Optimization:**
       - Frontend optimization strategies
       - Backend optimization strategies
       - Network optimization
       - Database optimization
     - **Monitoring & Operations:**
       - Key metrics to track
       - Logging strategy
       - Environment configuration
       - Backup & disaster recovery
       - Future enhancement roadmap
   - **Best For:** Architects & technical leads planning future work
   - **Level:** Advanced (strategic overview)

---

## 🎯 Navigation by Role

### For New Developers
1. Start with **architecture/ARCHITECTURE_OVERVIEW.md** → Get visual understanding
2. Read **architecture/USE_CASES_SEQUENCE_DIAGRAMS.md** → Understand workflows
3. Reference **architecture/API_SPECIFICATION.md** → Learn API contracts
4. Check **architecture/DATABASE_SCHEMA_STORAGE.md** → Understand data models

### For Backend Developers
1. **architecture/API_SPECIFICATION.md** → GraphQL & WebSocket APIs
2. **architecture/DATABASE_SCHEMA_STORAGE.md** → Schema & query patterns
3. **architecture/IMPLEMENTATION_GUIDE.md** → System architecture & design decisions
4. **architecture/USE_CASES_SEQUENCE_DIAGRAMS.md** → Data flow through services

### For Frontend Developers
1. **architecture/ARCHITECTURE_OVERVIEW.md** → System overview
2. **architecture/USE_CASES_SEQUENCE_DIAGRAMS.md** → Component interactions
3. **architecture/API_SPECIFICATION.md** → GraphQL queries & WebSocket messages
4. **architecture/IMPLEMENTATION_GUIDE.md** → Frontend component breakdown

### For DevOps/Infrastructure
1. **architecture/IMPLEMENTATION_GUIDE.md** → Deployment & operations section
2. **architecture/DATABASE_SCHEMA_STORAGE.md** → Database backup/restore
3. **architecture/ARCHITECTURE_OVERVIEW.md** → Deployment architecture
4. **architecture/API_SPECIFICATION.md** → Rate limiting & scaling

### For Technical Leads
1. **architecture/IMPLEMENTATION_GUIDE.md** → Complete strategic overview
2. **architecture/ARCHITECTURE_OVERVIEW.md** → High-level architecture
3. **architecture/USE_CASES_SEQUENCE_DIAGRAMS.md** → Feature workflows
4. **architecture/API_SPECIFICATION.md** → API design & contracts

---

## 📚 Documentation Map

```
┌─────────────────────────────────────────────────────────────┐
│           ARCHITECTURE DOCUMENTATION STRUCTURE              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ARCHITECTURE_OVERVIEW.md                                  │
│  └─ System diagram                                         │
│  └─ Technology stack                                       │
│  └─ 6 Mermaid sequence diagrams                           │
│  └─ Component overview                                     │
│                                                             │
│  architecture/USE_CASES_SEQUENCE_DIAGRAMS.md              │
│  ├─ Use Case 1: Create & Share Snippet                    │
│  ├─ Use Case 2: Join Session                              │
│  ├─ Use Case 3: Real-time Collaboration                   │
│  ├─ Use Case 4: Metadata Sync                             │
│  ├─ Use Case 5: Save to Database                          │
│  ├─ Use Case 6: Typing Indicators                         │
│  ├─ Use Case 7: Leave Session                             │
│  └─ Data flow diagrams                                     │
│                                                             │
│  architecture/API_SPECIFICATION.md                         │
│  ├─ GraphQL API (3 queries, 3 mutations)                 │
│  ├─ WebSocket STOMP (5 topics)                            │
│  ├─ Message formats (TypeScript interfaces)               │
│  ├─ Error handling                                        │
│  └─ Rate limiting & authentication                        │
│                                                             │
│  architecture/DATABASE_SCHEMA_STORAGE.md                  │
│  ├─ MongoDB CodeSnippets collection                       │
│  │  ├─ Schema validation                                 │
│  │  ├─ 7 indexes                                         │
│  │  ├─ Query patterns                                    │
│  │  └─ Example documents                                 │
│  ├─ PostgreSQL TinyURLs table                            │
│  │  ├─ Schema definition                                 │
│  │  ├─ Indexes & optimization                            │
│  │  ├─ Query patterns                                    │
│  │  └─ Example records                                   │
│  ├─ Data relationships (ER diagram)                       │
│  ├─ Indexing strategy                                     │
│  └─ Transactions & consistency                            │
│                                                             │
│  architecture/IMPLEMENTATION_GUIDE.md                      │
│  ├─ Deployment architecture                               │
│  ├─ Data flow architecture                                │
│  ├─ Frontend components & hooks                           │
│  ├─ Backend services & controllers                        │
│  ├─ Real-time collaboration flow                          │
│  ├─ Key design decisions (5 major)                       │
│  ├─ Security considerations                               │
│  ├─ Performance optimization                              │
│  ├─ Monitoring & logging                                  │
│  ├─ Operations & backup strategy                          │
│  └─ Future enhancements roadmap                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Cross-Reference Guide

### By Topic

#### Real-Time Collaboration
- **architecture/ARCHITECTURE_OVERVIEW.md** - 6 collaboration flow diagrams
- **architecture/USE_CASES_SEQUENCE_DIAGRAMS.md** - Detailed sequence flows (UC2-UC6)
- **architecture/API_SPECIFICATION.md** - WebSocket STOMP topic specifications
- **architecture/IMPLEMENTATION_GUIDE.md** - Session lifecycle & presence flow

#### User Identification & Authentication
- **architecture/IMPLEMENTATION_GUIDE.md** - 4-level priority system (Design Decisions #1)
- **architecture/API_SPECIFICATION.md** - Session management & CORS config
- **architecture/USE_CASES_SEQUENCE_DIAGRAMS.md** - Join session flow (UC2)

#### Code Synchronization
- **architecture/ARCHITECTURE_OVERVIEW.md** - Real-time collaboration diagram
- **architecture/USE_CASES_SEQUENCE_DIAGRAMS.md** - Code sync flow (UC3)
- **architecture/API_SPECIFICATION.md** - Code change message format
- **architecture/IMPLEMENTATION_GUIDE.md** - Debouncing strategy (Design Decision #4)

#### Metadata Management
- **architecture/ARCHITECTURE_OVERVIEW.md** - Metadata sync diagram
- **architecture/USE_CASES_SEQUENCE_DIAGRAMS.md** - Owner metadata update (UC4)
- **architecture/API_SPECIFICATION.md** - Metadata update message format
- **architecture/IMPLEMENTATION_GUIDE.md** - Metadata in presence messages (Design Decision #3)

#### Data Persistence
- **architecture/USE_CASES_SEQUENCE_DIAGRAMS.md** - Save flow (UC5)
- **architecture/DATABASE_SCHEMA_STORAGE.md** - MongoDB & PostgreSQL schemas
- **architecture/API_SPECIFICATION.md** - CreateSnippet & UpdateSnippet mutations
- **architecture/IMPLEMENTATION_GUIDE.md** - Data flow through system

#### Sharing & URL Generation
- **architecture/USE_CASES_SEQUENCE_DIAGRAMS.md** - Create & share flow (UC1)
- **architecture/DATABASE_SCHEMA_STORAGE.md** - TinyURL table & queries
- **architecture/API_SPECIFICATION.md** - TinyURL resolution query

#### Performance
- **architecture/IMPLEMENTATION_GUIDE.md** - Performance optimization strategies
- **architecture/DATABASE_SCHEMA_STORAGE.md** - Indexing strategy & query optimization
- **architecture/ARCHITECTURE_OVERVIEW.md** - Technology choices (optimized stack)

---

## 📖 Reading Sequences

### 1. Understanding the Basics (30 min)
1. ARCHITECTURE_OVERVIEW.md - Skip technical details
2. View all 6 Mermaid diagrams
3. Read component overview

### 2. Learning Feature Workflows (1 hour)
1. architecture/USE_CASES_SEQUENCE_DIAGRAMS.md - All use cases
2. Focus on sequence diagrams
3. Understand message flow

### 3. Deep Dive - System Design (2 hours)
1. architecture/IMPLEMENTATION_GUIDE.md - All sections
2. architecture/ARCHITECTURE_OVERVIEW.md - Detailed reading
3. architecture/USE_CASES_SEQUENCE_DIAGRAMS.md - Data flows

### 4. API Implementation (1.5 hours)
1. architecture/API_SPECIFICATION.md - Complete reading
2. GraphQL examples
3. WebSocket message types

### 5. Database Understanding (1 hour)
1. architecture/DATABASE_SCHEMA_STORAGE.md - Schema sections
2. Index strategies
3. Query patterns

### 6. Complete Technical Mastery (3+ hours)
- Read all documents in full
- Cross-reference topics
- Study design decisions

---

## 🎓 Learning Outcomes by Document

### architecture/ARCHITECTURE_OVERVIEW.md
After reading, you will understand:
- ✅ What technologies are used and why
- ✅ How components communicate
- ✅ Major data flows in the system
- ✅ Real-time collaboration mechanisms
- ✅ Database architecture

### architecture/USE_CASES_SEQUENCE_DIAGRAMS.md
After reading, you will understand:
- ✅ Step-by-step execution of features
- ✅ User interaction flows
- ✅ Server-side message handling
- ✅ Data transformations through system
- ✅ Edge cases & error scenarios

### architecture/API_SPECIFICATION.md
After reading, you will understand:
- ✅ GraphQL query/mutation syntax
- ✅ WebSocket message formats
- ✅ Request/response structures
- ✅ Error handling approaches
- ✅ How to integrate with the API

### architecture/DATABASE_SCHEMA_STORAGE.md
After reading, you will understand:
- ✅ Complete data models
- ✅ Index optimization strategies
- ✅ Query performance patterns
- ✅ Data consistency approaches
- ✅ Backup & recovery procedures

### architecture/IMPLEMENTATION_GUIDE.md
After reading, you will understand:
- ✅ Why architectural decisions were made
- ✅ Security & performance implications
- ✅ Deployment & operational concerns
- ✅ Future growth opportunities
- ✅ Monitoring & troubleshooting

---

## 🔍 Finding Specific Information

### "How does real-time code sync work?"
→ architecture/USE_CASES_SEQUENCE_DIAGRAMS.md (UC3) + architecture/API_SPECIFICATION.md (Code Changes Topic)

### "What's the database schema?"
→ architecture/DATABASE_SCHEMA_STORAGE.md (MongoDB & PostgreSQL sections)

### "How do I create a new snippet?"
→ architecture/USE_CASES_SEQUENCE_DIAGRAMS.md (UC1) + architecture/API_SPECIFICATION.md (CreateSnippet mutation)

### "How do I join a collaborative session?"
→ architecture/USE_CASES_SEQUENCE_DIAGRAMS.md (UC2) + architecture/IMPLEMENTATION_GUIDE.md (Session lifecycle)

### "What are the API endpoints?"
→ architecture/API_SPECIFICATION.md (All sections)

### "How is ownership determined?"
→ architecture/IMPLEMENTATION_GUIDE.md (Key Design Decisions #1) + architecture/USE_CASES_SEQUENCE_DIAGRAMS.md (UC1 & UC2)

### "What performance optimizations exist?"
→ architecture/IMPLEMENTATION_GUIDE.md (Performance Optimization section)

### "How do I deploy this?"
→ architecture/IMPLEMENTATION_GUIDE.md (Deployment & Operations section)

### "What are future plans?"
→ architecture/IMPLEMENTATION_GUIDE.md (Future Enhancements section)

---

## 📋 Document Statistics

| Document | Lines | Diagrams | Code Examples | Sections |
|----------|-------|----------|---------------|----------|
| architecture/ARCHITECTURE_OVERVIEW.md | 500+ | 6 Mermaid | 10+ JSON | 8 |
| architecture/USE_CASES_SEQUENCE_DIAGRAMS.md | 700+ | 7 Mermaid | 15+ JSON | 9 |
| architecture/API_SPECIFICATION.md | 600+ | 2 Mermaid | 20+ JSON/GraphQL | 8 |
| architecture/DATABASE_SCHEMA_STORAGE.md | 800+ | 1 ER diagram | 30+ SQL/JS | 7 |
| architecture/IMPLEMENTATION_GUIDE.md | 900+ | 3 Diagrams | 15+ Examples | 12 |
| **TOTAL** | **3,500+** | **19 Diagrams** | **90+ Examples** | **44 Sections** |

---

## ✅ Verification Checklist

Use this checklist to verify you have the right understanding:

### Core Architecture
- [ ] Can you describe the 4 major components (Frontend, Backend, MongoDB, PostgreSQL)?
- [ ] Can you explain the data flow from user input to database storage?
- [ ] Do you understand how real-time updates work?

### Workflows
- [ ] Can you walk through creating a new snippet?
- [ ] Can you explain how a joinee joins a session?
- [ ] Can you describe code synchronization between users?
- [ ] Can you explain how metadata changes are propagated?

### APIs
- [ ] Can you write a GraphQL query to fetch a snippet?
- [ ] Can you describe the WebSocket message format for code changes?
- [ ] Do you understand the presence message structure?

### Databases
- [ ] Can you describe the MongoDB schema for code snippets?
- [ ] Can you explain the PostgreSQL tiny URL mapping?
- [ ] Do you understand the index strategy?

### Design
- [ ] Can you explain why snippets are stored in MongoDB vs PostgreSQL?
- [ ] Can you describe the 4-level priority system for owner detection?
- [ ] Do you understand why code updates are debounced?

---

## 📞 Questions & Answers

**Q: Where should I look for REST API endpoints?**
A: architecture/API_SPECIFICATION.md - GraphQL section (REST not used; GraphQL is the API)

**Q: How do I optimize database queries?**
A: architecture/DATABASE_SCHEMA_STORAGE.md - Indexing Strategy section

**Q: Why do we use both MongoDB and PostgreSQL?**
A: architecture/IMPLEMENTATION_GUIDE.md - Key Design Decisions section

**Q: How is typing indicator timing implemented?**
A: architecture/USE_CASES_SEQUENCE_DIAGRAMS.md - Use Case 6

**Q: What happens when a user leaves?**
A: architecture/USE_CASES_SEQUENCE_DIAGRAMS.md - Use Case 7

**Q: How are WebSocket connections managed?**
A: architecture/ARCHITECTURE_OVERVIEW.md - WebSocket Message Types section

---

## 📝 Version & Maintenance

**Last Updated:** 2024-01-15
**Version:** 1.0 (Initial release)
**Maintained By:** Architecture Team
**Review Cycle:** Quarterly

**Related Files in Repository:**
- frontend/src/hooks/useOwnerJoineeSession.ts
- frontend/src/pages/EditorPage.tsx
- frontend/src/services/webSocketService.ts
- backend/src/main/java/com/codesharing/platform/websocket/CollaborationController.java
- docker-compose.yml
- frontend/nginx.conf

