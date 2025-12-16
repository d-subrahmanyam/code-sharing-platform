# API Documentation

## Overview
This document provides comprehensive documentation for the Code Sharing Platform API, including GraphQL endpoints, WebSocket connections, and REST endpoints.

## Authentication

### JWT Token
All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Token Endpoints

#### Login
```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user {
      id
      username
      email
    }
  }
}
```

#### Register
```graphql
mutation Register($username: String!, $email: String!, $password: String!) {
  register(username: $username, email: $email, password: $password) {
    token
    user {
      id
      username
      email
    }
  }
}
```

## Code Snippets

### Fetch All Snippets
```graphql
query GetSnippets($limit: Int, $offset: Int) {
  snippets(limit: $limit, offset: $offset) {
    id
    title
    description
    language
    author {
      id
      username
    }
    tags
    views
    createdAt
  }
}
```

### Fetch Single Snippet
```graphql
query GetSnippet($id: String!) {
  snippet(id: $id) {
    id
    title
    description
    code
    language
    author {
      id
      username
    }
    tags
    comments {
      id
      content
      author {
        username
      }
    }
    createdAt
    updatedAt
  }
}
```

### Create Snippet
```graphql
mutation CreateSnippet($title: String!, $description: String, $code: String!, $language: String!, $tags: [String!]) {
  createSnippet(title: $title, description: $description, code: $code, language: $language, tags: $tags) {
    id
    title
    url
  }
}
```

### Update Snippet
```graphql
mutation UpdateSnippet($id: String!, $title: String, $description: String, $code: String, $tags: [String!]) {
  updateSnippet(id: $id, title: $title, description: $description, code: $code, tags: $tags) {
    id
    title
    updatedAt
  }
}
```

### Delete Snippet
```graphql
mutation DeleteSnippet($id: String!) {
  deleteSnippet(id: $id)
}
```

## Comments

### Fetch Comments
```graphql
query GetComments($snippetId: String!) {
  comments(snippetId: $snippetId) {
    id
    content
    author {
      id
      username
    }
    createdAt
    replies {
      id
      content
      author {
        username
      }
    }
  }
}
```

### Create Comment
```graphql
mutation CreateComment($snippetId: String!, $content: String!, $parentId: String) {
  createComment(snippetId: $snippetId, content: $content, parentId: $parentId) {
    id
    content
    author {
      username
    }
    createdAt
  }
}
```

## WebSocket

### Real-time Collaboration
Connect to `/ws` endpoint for real-time code updates:

```javascript
const ws = new WebSocket('ws://localhost:8080/ws?token=<jwt_token>');

// Subscribe to snippet updates
ws.send(JSON.stringify({
  action: 'SUBSCRIBE',
  snippetId: '123'
}));

// Send code update
ws.send(JSON.stringify({
  action: 'UPDATE_CODE',
  snippetId: '123',
  code: '...',
  userId: 'user-id'
}));

// Listen for updates
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle message
};
```

## Error Handling

All errors follow this format:
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Error message details",
  "path": "/api/endpoint"
}
```

## Rate Limiting

- Rate limit: 100 requests per minute per IP
- Rate limit headers:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time in Unix timestamp
