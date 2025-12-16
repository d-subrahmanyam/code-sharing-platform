# Code Sharing Platform - Development Prompts

This document contains various prompts and instructions for developing the Code Sharing Platform.

## Feature Development Prompts

### 1. Authentication Feature
**Prompt:** Implement JWT-based authentication with login and registration features.

**Requirements:**
- User registration with email and password
- User login with email/password or OAuth
- JWT token generation and validation
- Automatic token refresh
- Logout functionality
- Protected routes

### 2. Code Snippet Management
**Prompt:** Build code snippet creation, editing, sharing, and deletion features.

**Requirements:**
- Create code snippets with syntax highlighting
- Edit code with real-time validation
- Delete snippets (with confirmation)
- Share snippets via unique URLs
- View snippet metadata (author, created date, views)
- Track snippet views

### 3. Real-time Collaboration
**Prompt:** Implement real-time collaborative editing using WebSockets.

**Requirements:**
- Multiple users can edit the same snippet
- Real-time cursor position sharing
- Conflict resolution for simultaneous edits
- User presence indicators
- Change notifications

### 4. Comments and Discussions
**Prompt:** Add comment functionality with threaded discussions.

**Requirements:**
- Comments on code snippets
- Reply to comments (threaded)
- Comment editing and deletion
- Comment likes/reactions
- Mention other users (@username)

### 5. Search and Filtering
**Prompt:** Implement search and filtering functionality.

**Requirements:**
- Full-text search on code content
- Filter by language, tags, author
- Sort by date, views, likes
- Pagination of results
- Search suggestions/autocomplete

### 6. User Profiles
**Prompt:** Create user profile functionality.

**Requirements:**
- User profile page
- Edit profile information
- View user's snippets
- Follow/unfollow users
- User activity feed

## Testing Prompts

### Unit Test Template
**Prompt:** Write unit tests for the [Component/Service] class.

**Template:**
```typescript
describe('[Component/Service Name]', () => {
  it('should [expected behavior]', () => {
    // Arrange
    
    // Act
    
    // Assert
  })
})
```

### Integration Test Template
**Prompt:** Write integration tests for the [Feature] workflow.

**Template:**
```java
@SpringBootTest
class [Feature]IntegrationTest {
  
  @Test
  void should[ExpectedBehavior]() {
    // Setup
    
    // Execute
    
    // Verify
  }
}
```

## Documentation Prompts

### API Documentation
**Prompt:** Add GraphQL API documentation for the [Endpoint].

**Template:**
```markdown
## [Endpoint Name]

**Description:** Brief description

**Query/Mutation:**
\`\`\`graphql
[Query/Mutation definition]
\`\`\`

**Variables:**
- `field`: Description

**Response:**
\`\`\`json
{
  // Response structure
}
\`\`\`

**Errors:**
- Error 1
- Error 2
```

## Bug Fix Prompts

### Debug Prompt Template
**Prompt:** Debug the issue where [symptom] occurs when [trigger].

**Steps:**
1. Reproduce the issue
2. Check browser/server logs
3. Add debug statements
4. Analyze the flow
5. Identify root cause
6. Implement fix
7. Write test to prevent regression

## Performance Optimization Prompts

### Frontend Optimization
**Prompt:** Optimize the [Component/Feature] for better performance.

**Consider:**
- React.memo for expensive components
- useMemo for expensive calculations
- useCallback for event handlers
- Code splitting and lazy loading
- Bundle size analysis

### Backend Optimization
**Prompt:** Optimize the [Service/Query] for better performance.

**Consider:**
- Database query optimization
- Connection pooling
- Caching strategies
- Async/reactive processing
- Index optimization

## Code Review Prompts

**Prompt:** Review the PR for [Feature] and provide feedback on:
- Code quality and style
- Test coverage
- Performance implications
- Security concerns
- Documentation completeness
- Breaking changes

## Refactoring Prompts

**Prompt:** Refactor [Component/Class] to improve [code quality/maintainability/performance].

**Steps:**
1. Identify issues with current implementation
2. Plan refactoring approach
3. Write tests for current behavior
4. Implement refactoring
5. Verify tests still pass
6. Update documentation

## Architecture Prompts

**Prompt:** Design the architecture for [New Feature].

**Consider:**
- Frontend state management
- API endpoints
- Database schema
- WebSocket messages
- Error handling
- Security considerations
- Scalability

---

## Custom Prompts

You can also create custom prompts for:
- Feature specifications
- Bug reports
- Performance issues
- Security concerns
- Design improvements
- Documentation updates

Use the templates above as guidelines for creating effective prompts.
