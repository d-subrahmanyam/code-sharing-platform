# Architecture Documentation

## System Overview

The Code Sharing Platform follows a modern microservices-inspired architecture with clear separation between frontend and backend.

```
┌─────────────────────────────────────┐
│        Frontend (React)              │
│  - Components                        │
│  - Redux Store (State Management)    │
│  - Redux-Saga (Side Effects)         │
│  - Axios Client                      │
└────────────┬────────────────────────┘
             │ GraphQL / REST
             ↓
┌─────────────────────────────────────┐
│     Backend (Spring Boot)            │
│  - GraphQL API                       │
│  - REST Endpoints                    │
│  - WebSocket Handler                 │
│  - JWT Authentication                │
└────────────┬────────────────────────┘
             │
    ┌────────┴────────┐
    ↓                 ↓
┌──────────┐    ┌──────────┐
│PostgreSQL│    │ MongoDB  │
│(Auth)    │    │(Snippets)│
└──────────┘    └──────────┘
```

## Frontend Architecture

### Component Structure
```
src/
├── components/           # Reusable UI components
├── pages/               # Page-level components
├── store/               # Redux store
│   ├── slices/         # Reducers
│   ├── sagas/          # Side effects
│   └── actionTypes.ts  # Action constants
├── api/                # API client
├── hooks/              # Custom React hooks
├── types/              # TypeScript interfaces
└── utils/              # Helper functions
```

### State Management (Redux)

**Store Structure:**
```typescript
{
  auth: {
    isAuthenticated: boolean
    user: User | null
    token: string | null
    loading: boolean
    error: string | null
  },
  snippet: {
    items: CodeSnippet[]
    currentSnippet: CodeSnippet | null
    loading: boolean
    error: string | null
  },
  comment: {
    items: Comment[]
    loading: boolean
    error: string | null
  },
  ui: {
    notifications: Notification[]
    sidebarOpen: boolean
    theme: 'light' | 'dark'
  }
}
```

### Data Flow
1. User interaction → React Component
2. Component dispatches Redux action
3. Redux-Saga intercepts action and handles side effects
4. Saga calls API using Axios client
5. Response updates Redux store
6. Component re-renders with new state

## Backend Architecture

### Package Structure
```
src/main/java/com/codesharing/platform/
├── config/           # Configuration classes
├── controller/       # GraphQL resolvers
├── service/          # Business logic
├── repository/       # Data access
├── entity/           # JPA entities
├── dto/              # Data transfer objects
├── security/         # JWT & Security
├── websocket/        # WebSocket handlers
└── util/             # Utilities
```

### Layer Architecture

#### 1. Controller Layer (GraphQL)
- Exposes GraphQL queries and mutations
- Validates input
- Handles authorization

#### 2. Service Layer
- Contains business logic
- Orchestrates repositories and external services
- Handles transactions

#### 3. Repository Layer
- Data access using Spring Data JPA
- MongoDB queries for snippets
- PostgreSQL queries for user data

#### 4. Entity Layer
- JPA entities for PostgreSQL
- MongoDB documents
- Relationships and constraints

### Database Design

#### PostgreSQL (Relational - User & Auth)
```sql
users (
  id UUID PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  avatar VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  is_active BOOLEAN
)

tiny_urls (
  id UUID PRIMARY KEY,
  short_code VARCHAR(50) UNIQUE,
  snippet_id VARCHAR(255),
  user_id VARCHAR(255) FK users.id,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
)
```

#### MongoDB (NoSQL - Code Snippets)
```json
{
  "_id": "ObjectId",
  "title": "String",
  "description": "String",
  "code": "String",
  "language": "String",
  "authorId": "String",
  "tags": ["String"],
  "shareUrl": "String",
  "isPublic": Boolean,
  "createdAt": "Date",
  "updatedAt": "Date",
  "views": Number,
  "collaborators": ["String"]
}
```

### Real-time Features

#### WebSocket Flow
1. Client connects to WebSocket endpoint with JWT token
2. Server validates token and establishes connection
3. Client subscribes to specific snippet updates
4. When code changes, server broadcasts to all connected users
5. Clients update local state and re-render

#### Message Format
```json
{
  "action": "UPDATE_CODE|CURSOR|SELECTION|USER_JOINED|USER_LEFT",
  "snippetId": "string",
  "data": {}
}
```

## Security Considerations

1. **Authentication**: JWT tokens with 24-hour expiration
2. **Authorization**: Role-based access control (RBAC)
3. **Input Validation**: Server-side validation on all inputs
4. **CORS**: Configured for frontend origin only
5. **Rate Limiting**: 100 requests per minute per IP
6. **SQL Injection Protection**: Parameterized queries
7. **XSS Prevention**: Input sanitization
8. **HTTPS**: All communications encrypted

## Scalability Features

1. **Virtual Threads**: Spring Boot virtual threads for concurrent requests
2. **Connection Pooling**: Hikari CP for database connections
3. **Caching**: Redis can be added for frequently accessed snippets
4. **Horizontal Scaling**: Stateless backend for load balancing
5. **Async Processing**: Spring WebFlux for reactive operations

## Deployment Architecture

```
┌──────────────────────────────┐
│    Load Balancer (Nginx)     │
└──────────────┬───────────────┘
               │
    ┌──────────┴──────────┐
    ↓                     ↓
┌─────────────┐     ┌─────────────┐
│ Backend 1   │     │ Backend 2   │
│ (Spring)    │     │ (Spring)    │
└─────────────┘     └─────────────┘
    │                     │
    └──────────┬──────────┘
               ↓
        ┌──────────────┐
        │ PostgreSQL   │
        │ (Primary)    │
        └──────────────┘
        
    ┌──────────────────────┐
    │   MongoDB Cluster    │
    │  (Replica Set)       │
    └──────────────────────┘
```

## Performance Optimization

1. **Database Indexing**: Indexes on frequently queried fields
2. **Query Optimization**: Efficient JPA queries and projections
3. **Frontend Code Splitting**: Lazy loading of components
4. **Caching Strategy**: Browser cache for static assets
5. **Compression**: Gzip compression for API responses
6. **CDN**: Static assets served via CDN

## Monitoring & Logging

1. **Logging Framework**: Logback with structured logging
2. **Metrics**: Spring Actuator metrics
3. **Tracing**: Request/response logging
4. **Health Checks**: Database and service health endpoints
5. **Error Tracking**: Centralized error logging
