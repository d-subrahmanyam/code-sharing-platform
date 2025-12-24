# Code Sharing Platform - API Specification

## Table of Contents
1. [REST API / GraphQL](#rest-api--graphql)
2. [WebSocket STOMP Messaging](#websocket-stomp-messaging)
3. [Message Formats](#message-formats)
4. [Error Handling](#error-handling)

---

## REST API / GraphQL

### GraphQL Endpoint
**URL:** `http://localhost:8080/graphql`  
**Type:** POST  
**Protocol:** HTTP/HTTPS  
**Format:** JSON  

### Core Queries

#### 1. Get Snippet by ID

```graphql
query GetSnippet($id: ID!) {
  snippet(id: $id) {
    id
    title
    description
    code
    language
    tags
    authorId
    authorUsername
    isPublic
    createdAt
    updatedAt
  }
}
```

**Variables:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "data": {
    "snippet": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Hello World Function",
      "description": "A simple greeting function",
      "code": "function hello() {\n  console.log('Hello, World!');\n}",
      "language": "javascript",
      "tags": ["javascript", "hello", "beginner"],
      "authorId": "persistent-user-id-123",
      "authorUsername": "John",
      "isPublic": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:35:00Z"
    }
  }
}
```

---

#### 2. Get Snippet by Tiny Code

```graphql
query GetSnippetByTinyCode($tinyCode: String!) {
  snippetByTinyCode(tinyCode: $tinyCode) {
    id
    title
    description
    code
    language
    tags
    authorId
    authorUsername
    createdAt
  }
}
```

**Variables:**
```json
{
  "tinyCode": "ABC123"
}
```

**Response:**
```json
{
  "data": {
    "snippetByTinyCode": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Hello World Function",
      "description": "A simple greeting function",
      "code": "function hello() { ... }",
      "language": "javascript",
      "tags": ["javascript", "hello"],
      "authorId": "persistent-user-id-123",
      "authorUsername": "John",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

#### 3. Search Snippets

```graphql
query SearchSnippets($query: String!, $limit: Int, $offset: Int) {
  searchSnippets(query: $query, limit: $limit, offset: $offset) {
    id
    title
    description
    language
    tags
    authorUsername
    createdAt
  }
}
```

**Variables:**
```json
{
  "query": "javascript",
  "limit": 10,
  "offset": 0
}
```

**Response:**
```json
{
  "data": {
    "searchSnippets": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Hello World Function",
        "description": "A simple greeting function",
        "language": "javascript",
        "tags": ["javascript", "hello"],
        "authorUsername": "John",
        "createdAt": "2024-01-15T10:30:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "title": "Promise Example",
        "description": "JavaScript Promises tutorial",
        "language": "javascript",
        "tags": ["javascript", "async"],
        "authorUsername": "Jane",
        "createdAt": "2024-01-15T11:00:00Z"
      }
    ]
  }
}
```

---

### Core Mutations

#### 1. Create Snippet

```graphql
mutation CreateSnippet($input: CreateSnippetInput!) {
  createSnippet(input: $input) {
    id
    title
    code
    tinyCode
    createdAt
  }
}

input CreateSnippetInput {
  title: String!
  description: String
  code: String!
  language: String!
  tags: [String]
  isPublic: Boolean
  authorId: String!
  authorUsername: String!
}
```

**Variables:**
```json
{
  "input": {
    "title": "Hello World Function",
    "description": "A simple greeting function",
    "code": "function hello() {\n  console.log('Hello, World!');\n}",
    "language": "javascript",
    "tags": ["javascript", "hello", "beginner"],
    "isPublic": true,
    "authorId": "persistent-user-id-123",
    "authorUsername": "John"
  }
}
```

**Response:**
```json
{
  "data": {
    "createSnippet": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Hello World Function",
      "code": "function hello() {\n  console.log('Hello, World!');\n}",
      "tinyCode": "ABC123",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

#### 2. Update Snippet

```graphql
mutation UpdateSnippet($id: ID!, $input: UpdateSnippetInput!) {
  updateSnippet(id: $id, input: $input) {
    id
    title
    description
    code
    language
    tags
    updatedAt
  }
}

input UpdateSnippetInput {
  title: String
  description: String
  code: String
  language: String
  tags: [String]
  isPublic: Boolean
}
```

**Variables:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "input": {
    "title": "Hello World - Updated",
    "code": "function hello() {\n  console.log('Hello, Updated World!');\n}"
  }
}
```

**Response:**
```json
{
  "data": {
    "updateSnippet": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Hello World - Updated",
      "description": "A simple greeting function",
      "code": "function hello() { ... }",
      "language": "javascript",
      "tags": ["javascript", "hello"],
      "updatedAt": "2024-01-15T10:35:00Z"
    }
  }
}
```

---

#### 3. Delete Snippet

```graphql
mutation DeleteSnippet($id: ID!) {
  deleteSnippet(id: $id)
}
```

**Variables:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "data": {
    "deleteSnippet": true
  }
}
```

---

## WebSocket STOMP Messaging

### Connection Details
**URL:** `ws://localhost/api/ws` (HTTP dev) or `wss://localhost/api/ws` (HTTPS prod)  
**Protocol:** STOMP over SockJS  
**Heartbeat:** 30 seconds  

### Connection Flow

```
CLIENT → CONNECT
CLIENT: accept-version:1.0,1.1,1.2
CLIENT: heart-beat:0,0

SERVER → CONNECTED
SERVER: version:1.1
SERVER: heart-beat:0,0
SERVER: session:connection-session-id

CLIENT → SUBSCRIBE
CLIENT: id:sub-1
CLIENT: destination:/topic/snippet/{snippetId}/presence

SERVER → MESSAGE
SERVER: destination:/topic/snippet/{snippetId}/presence
SERVER: message-id:msg-1
SERVER: content-type:application/json

{...payload...}
```

### STOMP Topics & Queues

#### 1. Presence Topic
**Destination:** `/topic/snippet/{snippetId}/presence`  
**Direction:** Backend → All Clients  
**Frequency:** On user join/leave/update  

**Message Format:**
```json
{
  "type": "presence_update",
  "userId": "session-user-id-456",
  "username": "Jane",
  "snippetId": "550e8400-e29b-41d4-a716-446655440000",
  "activeUsers": [
    {
      "userId": "persistent-user-id-123",
      "username": "John",
      "owner": true,
      "joinedAt": "2024-01-15T10:30:00Z"
    },
    {
      "userId": "session-user-id-456",
      "username": "Jane",
      "owner": false,
      "joinedAt": "2024-01-15T10:32:00Z"
    }
  ],
  "ownerTitle": "Hello World Function",
  "ownerDescription": "A simple greeting function",
  "ownerLanguage": "javascript",
  "ownerTags": ["javascript", "hello"],
  "timestamp": "2024-01-15T10:32:00Z"
}
```

**Receiving Logic:**
- Recipient extracts `activeUsers` and updates UI
- Identifies owner by checking `owner: true` flag
- Applies owner metadata if recipient is joinee

---

#### 2. Code Changes Topic
**Destination:** `/topic/snippet/{snippetId}/code`  
**Direction:** All Clients → Backend → All Clients  
**Frequency:** Per keystroke (debounced 500ms)  

**Message Send (Client):**
```
SEND
destination:/app/snippet/{snippetId}/code

{
  "userId": "persistent-user-id-123",
  "username": "John",
  "code": "function hello() {\n  console.log('Hello, World!');\n}",
  "language": "javascript",
  "timestamp": 1705315800000
}
```

**Message Receive:**
```
MESSAGE
destination:/topic/snippet/{snippetId}/code

{
  "userId": "session-user-id-456",
  "username": "Jane",
  "code": "function hello() {\n  console.log('Hello, World!');\n  hello();\n}",
  "language": "javascript",
  "timestamp": 1705315802000
}
```

**Receiving Logic:**
- Check if `userId !== currentUserId`
- If true, update editor with received code
- If false, ignore (it's our own message echoed back)

---

#### 3. Metadata Update Topic
**Destination:** `/topic/snippet/{snippetId}/metadata`  
**Direction:** Owner → Backend → All Clients  
**Frequency:** Per metadata change  

**Message Send (Client):**
```
SEND
destination:/app/snippet/{snippetId}/metadata

{
  "userId": "persistent-user-id-123",
  "username": "John",
  "title": "Hello World - Updated",
  "description": "A greeting function with updates",
  "language": "javascript",
  "tags": ["javascript", "hello", "updated"],
  "timestamp": 1705315804000
}
```

**Message Receive:**
```
MESSAGE
destination:/topic/snippet/{snippetId}/metadata

{
  "userId": "persistent-user-id-123",
  "username": "John",
  "title": "Hello World - Updated",
  "description": "A greeting function with updates",
  "language": "javascript",
  "tags": ["javascript", "hello", "updated"],
  "timestamp": 1705315804000
}
```

**Receiving Logic (for Joinee):**
- If `userId !== currentUserId` (update from owner):
  - Update formData.title, description, language, tags
  - Dispatch Redux actions to update store
  - Re-render UI
- If `userId === currentUserId`:
  - Ignore (it's echo from our own update)

---

#### 4. Typing Indicator Topic
**Destination (Send):** `/app/snippet/{snippetId}/typing`  
**Direction (Send):** Client → Backend  
**Frequency:** Per keystroke or pause (2-second timeout)  

**Message Send:**
```
SEND
destination:/app/snippet/{snippetId}/typing

{
  "userId": "persistent-user-id-123",
  "username": "John",
  "isTyping": true,
  "timestamp": 1705315806000
}
```

**Message Receive Topic:** `/topic/snippet/{snippetId}/typing-status`  
**Direction (Receive):** Backend → All Clients  

**Message Receive:**
```
MESSAGE
destination:/topic/snippet/{snippetId}/typing-status

{
  "snippetId": "550e8400-e29b-41d4-a716-446655440000",
  "typingUsers": [
    {
      "userId": "persistent-user-id-123",
      "username": "John"
    },
    {
      "userId": "session-user-id-456",
      "username": "Jane"
    }
  ],
  "timestamp": 1705315806000
}
```

**Receiving Logic:**
- For each user in `typingUsers`:
  - If `userId !== currentUserId`:
    - Show "username is typing..." indicator
    - Set 2-second timeout to clear indicator
  - If `userId === currentUserId`:
    - Don't show self typing (optional)
- If user not in list:
  - Clear their typing indicator

---

#### 5. User Join/Leave Topic (Internal)
**Destination (Join):** `/app/snippet/{snippetId}/join`  
**Destination (Leave):** `/app/snippet/{snippetId}/leave`  
**Direction:** Client → Backend only  
**Frequency:** Once per session  

**Join Message Send:**
```
SEND
destination:/app/snippet/{snippetId}/join

{
  "userId": "session-user-id-456",
  "username": "Jane",
  "timestamp": 1705315800000
}
```

**Leave Message Send:**
```
SEND
destination:/app/snippet/{snippetId}/leave

{
  "userId": "session-user-id-456",
  "username": "Jane",
  "timestamp": 1705315810000
}
```

**Result:** Backend broadcasts updated presence to all users via `/topic/snippet/{snippetId}/presence`

---

## Message Formats

### User Presence Object
```typescript
interface UserPresence {
  userId: string;           // persistent for owner, session for joinee
  username: string;
  owner: boolean;           // true if snippet author
  joinedAt: string;         // ISO timestamp
  lastActivity?: string;    // ISO timestamp
  avatar?: string;          // user avatar URL
}
```

### Code Change Message
```typescript
interface CodeChangeMessage {
  userId: string;
  username: string;
  code: string;
  language: string;
  timestamp: number;        // milliseconds since epoch
}
```

### Metadata Update Message
```typescript
interface MetadataUpdateMessage {
  userId: string;
  username: string;
  title?: string;
  description?: string;
  language?: string;
  tags?: string[];
  timestamp: number;
}
```

### Typing Indicator Message
```typescript
interface TypingIndicatorMessage {
  userId: string;
  username: string;
  isTyping: boolean;
  timestamp: number;
}
```

### Typing Status Message (from server)
```typescript
interface TypingStatusMessage {
  snippetId: string;
  typingUsers: Array<{
    userId: string;
    username: string;
  }>;
  timestamp: number;
}
```

### Presence Message (from server)
```typescript
interface PresenceMessage {
  type: "presence_update";
  userId: string;
  username: string;
  snippetId: string;
  activeUsers: UserPresence[];
  snippetTitle?: string;
  ownerTitle?: string;
  ownerDescription?: string;
  ownerLanguage?: string;
  ownerTags?: string[];
  timestamp: string;        // ISO format
}
```

---

## Error Handling

### GraphQL Errors

#### Invalid ID
```json
{
  "errors": [
    {
      "message": "Snippet not found",
      "extensions": {
        "code": "NOT_FOUND",
        "timestamp": "2024-01-15T10:35:00Z"
      }
    }
  ]
}
```

#### Validation Error
```json
{
  "errors": [
    {
      "message": "Title is required",
      "extensions": {
        "code": "VALIDATION_ERROR",
        "field": "title",
        "timestamp": "2024-01-15T10:35:00Z"
      }
    }
  ]
}
```

#### Authorization Error
```json
{
  "errors": [
    {
      "message": "Not authorized to update this snippet",
      "extensions": {
        "code": "UNAUTHORIZED",
        "timestamp": "2024-01-15T10:35:00Z"
      }
    }
  ]
}
```

### WebSocket Errors

#### Connection Failed
```
ERROR
message:Connection timeout
receipt-id:conn-failed
```

#### Invalid Destination
```
ERROR
message:Invalid destination: /topic/invalid
receipt-id:sub-failed
```

#### Authorization Error
```json
{
  "type": "error",
  "message": "Not authorized to join this snippet",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

### HTTP Status Codes
- `200 OK` - Successful request
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Not authorized to access resource
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

---

## Rate Limiting

### WebSocket Message Limits
- **Code Changes:** Max 1 message per 500ms (debounced)
- **Typing Indicators:** Max 1 message per keystroke, timeout after 2s inactivity
- **Metadata Updates:** Max 1 message per field change
- **Presence Updates:** Max 1 per 5 seconds per user

### GraphQL Query Limits
- **Search:** Max 50 results per query
- **Snippet Fetch:** No limit per snippet
- **Mutations:** Max 100 mutations per minute per user

### Connection Limits
- **Max WebSocket Connections:** 100 per snippet (recommended)
- **Max Concurrent Snippets:** 1000 concurrent active snippets
- **Connection Timeout:** 30 seconds inactivity

---

## Authentication & Session

### Session Management
- Session ID stored in `sessionStorage` (not persisted across browser close)
- Persistent User ID stored in `localStorage` (owner identification)
- WebSocket connections inherit HTTP session cookies
- No explicit login required - anonymous collaboration

### User ID Scheme
```
Owner/Creator: persistentUserId (UUID stored in localStorage)
Joinee/Visitor: sessionUserId (UUID generated per session)
```

### CORS Configuration
- **Allowed Origins:** `http://localhost:*`, `https://localhost:*`
- **Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers:** Content-Type, Authorization
- **Credentials:** Included

