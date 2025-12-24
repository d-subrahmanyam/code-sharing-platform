# Code Sharing Platform - Database Schema & Storage

## Table of Contents
1. [MongoDB Collections](#mongodb-collections)
2. [PostgreSQL Tables](#postgresql-tables)
3. [Data Relationships](#data-relationships)
4. [Indexing Strategy](#indexing-strategy)
5. [Data Flow & Storage](#data-flow--storage)
6. [Query Patterns](#query-patterns)

---

## MongoDB Collections

### Collection: CodeSnippet

**Purpose:** Store code snippets with all metadata and collaboration state  
**Database:** `code_sharing_db`  
**TTL:** No automatic expiry (snippets are permanent)  

#### Schema

```javascript
db.createCollection("codeSnippets", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "title", "code", "authorId", "language", "createdAt"],
      properties: {
        _id: {
          bsonType: "objectId",
          description: "Primary key - MongoDB auto-generated ObjectId converted to UUID string"
        },
        // Snippet Identity
        id: {
          bsonType: "string",
          pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
          description: "UUID format primary key for application use"
        },
        title: {
          bsonType: "string",
          minLength: 1,
          maxLength: 255,
          description: "Snippet title/name"
        },
        description: {
          bsonType: "string",
          maxLength: 2000,
          description: "Detailed description of snippet"
        },
        
        // Code Content
        code: {
          bsonType: "string",
          description: "The actual code content"
        },
        language: {
          bsonType: "string",
          enum: ["javascript", "python", "java", "cpp", "csharp", "sql", "html", "css", "other"],
          description: "Programming language of the snippet"
        },
        
        // Metadata
        tags: {
          bsonType: "array",
          items: {
            bsonType: "string",
            maxLength: 50
          },
          maxItems: 10,
          description: "Searchable tags/categories"
        },
        
        // Ownership & Sharing
        authorId: {
          bsonType: "string",
          pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
          description: "Persistent UUID of snippet creator (owner)"
        },
        authorUsername: {
          bsonType: "string",
          maxLength: 100,
          description: "Username of snippet creator"
        },
        isPublic: {
          bsonType: "bool",
          description: "Whether snippet is searchable/discoverable"
        },
        
        // Timestamps
        createdAt: {
          bsonType: "date",
          description: "Snippet creation timestamp"
        },
        updatedAt: {
          bsonType: "date",
          description: "Last modification timestamp"
        },
        
        // Collaboration Metadata
        viewCount: {
          bsonType: "int",
          description: "Number of times snippet has been viewed"
        },
        collaborators: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              userId: { bsonType: "string" },
              username: { bsonType: "string" },
              joinedAt: { bsonType: "date" },
              leftAt: { bsonType: "date" }
            }
          },
          description: "History of users who have joined this snippet"
        }
      }
    }
  }
});
```

#### Example Document

```json
{
  "_id": ObjectId("65a1b2c3d4e5f6a7b8c9d0e1"),
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Hello World Function",
  "description": "A simple greeting function that prints 'Hello, World!'",
  "code": "function hello() {\n  console.log('Hello, World!');\n}\n\nhello();",
  "language": "javascript",
  "tags": ["javascript", "hello", "beginner", "function"],
  "authorId": "persistent-user-id-123",
  "authorUsername": "John",
  "isPublic": true,
  "createdAt": ISODate("2024-01-15T10:30:00.000Z"),
  "updatedAt": ISODate("2024-01-15T10:35:00.000Z"),
  "viewCount": 42,
  "collaborators": [
    {
      "userId": "persistent-user-id-123",
      "username": "John",
      "joinedAt": ISODate("2024-01-15T10:30:00.000Z"),
      "leftAt": null
    },
    {
      "userId": "session-user-id-456",
      "username": "Jane",
      "joinedAt": ISODate("2024-01-15T10:32:00.000Z"),
      "leftAt": ISODate("2024-01-15T10:45:00.000Z")
    }
  ]
}
```

#### Indexes

```javascript
// Index 1: Primary lookup by custom ID
db.codeSnippets.createIndex({ "id": 1 }, { unique: true });

// Index 2: Author lookup - find all snippets by user
db.codeSnippets.createIndex({ "authorId": 1, "createdAt": -1 });

// Index 3: Public snippets for discovery
db.codeSnippets.createIndex({ "isPublic": 1, "createdAt": -1 });

// Index 4: Language filtering
db.codeSnippets.createIndex({ "language": 1, "isPublic": 1 });

// Index 5: Tags for search
db.codeSnippets.createIndex({ "tags": 1 });

// Index 6: Text search on title and description
db.codeSnippets.createIndex(
  { "title": "text", "description": "text", "code": "text" },
  { default_language: "english", weights: { title: 10, description: 5, code: 1 } }
);

// Index 7: Compound index for public filtered search
db.codeSnippets.createIndex({ "isPublic": 1, "language": 1, "tags": 1 });
```

#### Query Patterns

```javascript
// 1. Get snippet by ID
db.codeSnippets.findOne({ id: "550e8400-e29b-41d4-a716-446655440000" });

// 2. Get all snippets by author
db.codeSnippets.find({ authorId: "persistent-user-id-123" })
  .sort({ createdAt: -1 })
  .limit(10);

// 3. Full text search
db.codeSnippets.find(
  { $text: { $search: "javascript hello" }, isPublic: true },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } });

// 4. Find public snippets by language
db.codeSnippets.find({ isPublic: true, language: "javascript" })
  .sort({ viewCount: -1 });

// 5. Find snippets with specific tag
db.codeSnippets.find({ tags: "beginner", isPublic: true })
  .sort({ createdAt: -1 });

// 6. Update code and timestamp
db.codeSnippets.updateOne(
  { id: "550e8400-e29b-41d4-a716-446655440000" },
  {
    $set: {
      code: "function hello() { ... }",
      updatedAt: new Date()
    }
  }
);

// 7. Increment view count
db.codeSnippets.updateOne(
  { id: "550e8400-e29b-41d4-a716-446655440000" },
  { $inc: { viewCount: 1 } }
);
```

---

## PostgreSQL Tables

### Table: TinyURLs

**Purpose:** Map short codes to snippet IDs for sharing via tiny URLs  
**Database:** `code_sharing_db`  
**Engine:** InnoDB  

#### Schema

```sql
CREATE TABLE tiny_urls (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-increment primary key',
  
  -- Tiny URL Data
  short_code VARCHAR(10) UNIQUE NOT NULL COMMENT 'Unique short code (e.g., ABC123)',
  snippet_id VARCHAR(36) NOT NULL COMMENT 'Foreign key to MongoDB snippet UUID',
  
  -- Ownership & Metadata
  created_by VARCHAR(36) NOT NULL COMMENT 'UUID of user who created this mapping',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When mapping was created',
  
  -- Access Tracking
  access_count INT DEFAULT 0 COMMENT 'Number of times this tiny URL has been accessed',
  last_accessed_at TIMESTAMP NULL COMMENT 'Last time this URL was accessed',
  
  -- Expiration & Status
  expires_at TIMESTAMP NULL COMMENT 'Optional expiration date for temporary shares',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether this mapping is still valid',
  
  -- Indexes
  KEY idx_short_code (short_code),
  KEY idx_snippet_id (snippet_id),
  KEY idx_created_by (created_by),
  KEY idx_is_active (is_active),
  KEY idx_created_at (created_at DESC),
  
  CONSTRAINT fk_snippet_id FOREIGN KEY (snippet_id) 
    REFERENCES snippets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Maps short codes to snippet IDs for URL sharing';
```

#### Example Records

```sql
-- Example 1: Active mapping
INSERT INTO tiny_urls 
(short_code, snippet_id, created_by, created_at, access_count, last_accessed_at, is_active)
VALUES (
  'ABC123',
  '550e8400-e29b-41d4-a716-446655440000',
  'persistent-user-id-123',
  '2024-01-15 10:30:00',
  12,
  '2024-01-15 10:45:00',
  TRUE
);

-- Example 2: New mapping (not accessed yet)
INSERT INTO tiny_urls 
(short_code, snippet_id, created_by, created_at, is_active)
VALUES (
  'XYZ789',
  '550e8400-e29b-41d4-a716-446655440001',
  'persistent-user-id-123',
  '2024-01-15 11:00:00',
  TRUE
);

-- Example 3: Temporary share (expires in 1 week)
INSERT INTO tiny_urls 
(short_code, snippet_id, created_by, created_at, expires_at, is_active)
VALUES (
  'TMP456',
  '550e8400-e29b-41d4-a716-446655440002',
  'persistent-user-id-456',
  '2024-01-15 11:30:00',
  '2024-01-22 11:30:00',
  TRUE
);
```

#### Query Patterns

```sql
-- 1. Resolve tiny code to snippet ID (most common)
SELECT snippet_id FROM tiny_urls 
WHERE short_code = 'ABC123' AND is_active = TRUE;

-- 2. Track access (update access count and timestamp)
UPDATE tiny_urls 
SET access_count = access_count + 1, 
    last_accessed_at = NOW()
WHERE short_code = 'ABC123';

-- 3. Get all mappings created by a user
SELECT short_code, snippet_id, created_at, access_count 
FROM tiny_urls
WHERE created_by = 'persistent-user-id-123'
ORDER BY created_at DESC;

-- 4. Find expired temporary shares
SELECT short_code, snippet_id, expires_at
FROM tiny_urls
WHERE expires_at IS NOT NULL AND expires_at < NOW();

-- 5. Deactivate a mapping
UPDATE tiny_urls 
SET is_active = FALSE 
WHERE short_code = 'ABC123';

-- 6. Most popular mappings
SELECT short_code, snippet_id, access_count 
FROM tiny_urls
WHERE is_active = TRUE
ORDER BY access_count DESC
LIMIT 10;

-- 7. Recently accessed mappings
SELECT short_code, snippet_id, last_accessed_at 
FROM tiny_urls
WHERE is_active = TRUE AND last_accessed_at IS NOT NULL
ORDER BY last_accessed_at DESC;
```

### Table: Users (Optional - for future authentication)

**Purpose:** Store user profiles and authentication data  
**Status:** Currently optional (not used in current session-based architecture)  

#### Schema

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID matching persistentUserId',
  
  -- Profile
  username VARCHAR(100) UNIQUE NOT NULL COMMENT 'Display name',
  email VARCHAR(255) UNIQUE COMMENT 'Email address (optional)',
  avatar_url VARCHAR(500) COMMENT 'Profile picture URL',
  bio TEXT COMMENT 'User biography',
  
  -- Account Status
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Stats
  total_snippets INT DEFAULT 0,
  total_collaborations INT DEFAULT 0,
  reputation_score INT DEFAULT 0,
  
  -- Indexes
  KEY idx_username (username),
  KEY idx_email (email),
  KEY idx_created_at (created_at DESC),
  KEY idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User profiles and account information';
```

---

## Data Relationships

### Relationship Diagram

```
┌─────────────────────────┐
│      MongoDB            │
│   CodeSnippets          │
├─────────────────────────┤
│ _id (ObjectId)          │
│ id (UUID) - PRIMARY     │
│ title                   │
│ code                    │
│ authorId (UUID)         │◄─┐
│ language                │  │
│ tags                    │  │
│ isPublic                │  │
│ createdAt               │  │
│ updatedAt               │  │
│ viewCount               │  │
│ collaborators[]         │  │
└─────────────────────────┘  │
                             │
                    ┌────────┘
                    │
                    │ snippet_id FK
                    │
┌─────────────────────────────────────┐
│      PostgreSQL                     │
│       TinyURLs                      │
├─────────────────────────────────────┤
│ id (BIGINT) - PRIMARY               │
│ short_code (VARCHAR) - UNIQUE       │
│ snippet_id (VARCHAR) ──────────┐    │
│ created_by (VARCHAR) ──────────┼──┐ │
│ created_at                     │  │ │
│ access_count                   │  │ │
│ last_accessed_at               │  │ │
│ expires_at                     │  │ │
│ is_active                      │  │ │
└─────────────────────────────────────┘  │
                    │  created_by FK     │
                    │                    │
                    ▼                    │
        ┌──────────────────────┐         │
        │      Users           │         │
        ├──────────────────────┤         │
        │ id (UUID) - PRIMARY  │◄────────┘
        │ username             │
        │ email                │
        │ avatar_url           │
        │ created_at           │
        │ last_login_at        │
        │ is_active            │
        └──────────────────────┘
```

### Data Flow Through System

#### 1. Create New Snippet Flow

```
User Input (Browser)
    ↓
EditorPage Component (formData state)
    ↓
Redux Store (SNIPPET_CREATE_REQUEST)
    ↓
Saga Middleware
    ↓
GraphQL createSnippet Mutation
    ↓
Backend Service Layer
    ↓
MongoDB save CodeSnippet
    ├─ Generate UUID (id field)
    ├─ Set authorId, authorUsername
    ├─ Set timestamps
    └─ Return saved document
    ↓
Create TinyURL mapping
    ├─ Generate short code
    ├─ Insert into PostgreSQL
    ├─ Map short_code → snippet_id
    └─ Return mapping
    ↓
Response back to Frontend
    ↓
Redux Store (SNIPPET_CREATE_SUCCESS)
    ↓
EditorPage Component (display success)
    ↓
Redirect to home page
```

#### 2. Join Existing Session Flow

```
User opens share link (/join/ABC123)
    ↓
EditorPage component detects /join route
    ↓
Resolve tiny code (ABC123)
    ├─ Query PostgreSQL TinyURLs table
    └─ Get snippet_id
    ↓
Fetch snippet from MongoDB
    ├─ Query by id = snippet_id
    ├─ Return: title, code, language, tags, metadata
    └─ Increment viewCount
    ↓
Load data into FormData
    ├─ Read-only for joinee
    └─ Display in UI
    ↓
WebSocket join
    ├─ Send join message to backend
    └─ Backend adds to active session
    ↓
Receive presence update
    ├─ Get activeUsers list
    ├─ Extract owner metadata
    └─ Apply to joinee's form
```

#### 3. Save & Persist Flow

```
Owner clicks Save
    ↓
Validation check
    ├─ Title not empty?
    ├─ Code not empty?
    └─ Proceed if valid
    ↓
Update MongoDB CodeSnippet
    ├─ Query by id
    ├─ Update fields (code, title, metadata)
    ├─ Update updatedAt timestamp
    └─ Return saved document
    ↓
Create or verify TinyURL
    ├─ If new snippet, create mapping
    ├─ If existing, verify mapping exists
    └─ Return short code
    ↓
Update Redux store
    ├─ Set snippet data
    └─ Mark as saved
    ↓
Update browser localStorage
    └─ Store snippet reference
```

---

## Indexing Strategy

### MongoDB Indexes

| Index | Fields | Type | Purpose | Selectivity |
|-------|--------|------|---------|------------|
| 1 | id | Unique | Primary key lookup | Very high |
| 2 | authorId, createdAt | Compound | Find user's snippets | High |
| 3 | isPublic, createdAt | Compound | Discover public snippets | High |
| 4 | language, isPublic | Compound | Filter by language | Medium |
| 5 | tags | Array | Tag-based search | Medium |
| 6 | title, description, code | Text | Full-text search | Medium |
| 7 | isPublic, language, tags | Compound | Multi-filter discovery | Medium |

### PostgreSQL Indexes

| Index | Table | Column(s) | Type | Purpose |
|-------|-------|-----------|------|---------|
| PRIMARY | tiny_urls | id | BTREE | Primary key |
| UNIQUE | tiny_urls | short_code | BTREE | Fast lookup |
| idx_snippet_id | tiny_urls | snippet_id | BTREE | FK reference |
| idx_created_by | tiny_urls | created_by | BTREE | User's mappings |
| idx_is_active | tiny_urls | is_active | BTREE | Filter active links |
| idx_created_at | tiny_urls | created_at | BTREE | Time-based queries |
| PRIMARY | users | id | BTREE | Primary key |
| UNIQUE | users | username | BTREE | Username lookup |
| UNIQUE | users | email | BTREE | Email lookup |

### Index Performance Tips

**MongoDB:**
- Text index: Useful for full-text search but slower than compound indexes
- Compound indexes: Best for multi-field queries (author + time)
- Array indexes: Efficient for tags searches

**PostgreSQL:**
- TinyURL lookups are extremely fast with short_code index
- Consider partial indexes on `is_active = TRUE` for active links query
- FK indexes on snippet_id ensure referential integrity

---

## Query Patterns

### MongoDB Query Patterns

#### Most Common (Optimized)

```javascript
// 1. Snippet lookup (used on every join)
db.codeSnippets.findOne({ id: snippetId }, 
  { _id: 0, code: 1, title: 1, language: 1, tags: 1, description: 1 });
// Index: id

// 2. Author's snippets list
db.codeSnippets.find({ authorId: userId }, { _id: 0 })
  .sort({ createdAt: -1 })
  .limit(10);
// Index: authorId, createdAt

// 3. Public discovery
db.codeSnippets.find({ isPublic: true }, { _id: 0 })
  .sort({ viewCount: -1 })
  .limit(20);
// Index: isPublic, createdAt
```

### PostgreSQL Query Patterns

#### Most Common (Optimized)

```sql
-- 1. Resolve tiny code (used on every join)
SELECT snippet_id FROM tiny_urls 
WHERE short_code = ? AND is_active = TRUE;
-- Index: short_code (UNIQUE)

-- 2. Track access
UPDATE tiny_urls 
SET access_count = access_count + 1, last_accessed_at = NOW()
WHERE short_code = ?;
-- Index: short_code

-- 3. User's shared links
SELECT short_code, snippet_id, created_at, access_count 
FROM tiny_urls
WHERE created_by = ? AND is_active = TRUE
ORDER BY created_at DESC;
-- Index: created_by, is_active
```

---

## Data Consistency & Transactions

### MongoDB Transactions

```javascript
// Multi-document transaction (when creating snippet and adding to user)
const session = db.getMongo().startSession();
session.startTransaction();

try {
  // 1. Create snippet
  const snippetId = db.codeSnippets.insertOne({
    id: UUID(),
    title: "...",
    code: "...",
    authorId: userId,
    // ... other fields
  }, { session });

  // 2. Update user's snippet count
  db.users.updateOne(
    { id: userId },
    { $inc: { total_snippets: 1 } },
    { session }
  );

  session.commitTransaction();
} catch (error) {
  session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### PostgreSQL Transactions

```sql
START TRANSACTION;

-- 1. Create TinyURL mapping
INSERT INTO tiny_urls (short_code, snippet_id, created_by)
VALUES (?, ?, ?);

-- 2. Update user stats (if users table exists)
UPDATE users 
SET total_snippets = total_snippets + 1 
WHERE id = ?;

COMMIT;
-- Or ROLLBACK on error
```

### Eventual Consistency Handling

**Non-critical data (MongoDB):**
- `viewCount` increments are eventually consistent
- `collaborators[]` array is updated asynchronously
- Small inconsistencies (1-2 views difference) are acceptable

**Critical data (PostgreSQL):**
- TinyURL mappings are transactionally consistent
- Foreign key constraints ensure data integrity
- Unique constraints prevent duplicate short codes

