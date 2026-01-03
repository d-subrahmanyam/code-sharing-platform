# Admin Dashboard - Design & Implementation Plan

## Overview

The Admin Dashboard provides comprehensive monitoring and insights into all code sharing sessions created in the platform. It offers session management, analytics, and detailed drill-down capabilities.

## Feature Requirements

### 1. Session List View (`/admin`)

#### Display Information
- **Session ID** - Unique identifier
- **Owner Name** - Username or "Anonymous" 
- **Owner Email** - Email if registered, "NA" if anonymous
- **Creation Date & Time** - When session was created
- **Session Duration** - How long the session lasted (calculated from end time)
- **Participant Count** - Number of active participants in the session
- **Code Language** - Primary language of the snippet
- **Snippet Title** - Title provided by owner

#### Features
- **Sorting**: By creation date (latest first by default), duration, owner
- **Pagination**: 25 sessions per page
- **Search**: Filter by owner name, session ID, snippet title
- **Drill-down Link**: Click row to view detailed session information

### 2. Session Drill-Down Page (`/admin/:sessionId`)

#### Session Metadata
- Session ID & creation timestamp
- Owner details (name, email, registration status)
- List of all participants with join/leave timestamps
- Session duration & status (active/completed)

#### Code Information
- Snippet title, description
- Programming language
- Tags
- Number of code revisions/changes

#### Security Events
- Table of all security events in the session
- Columns: Event Type, User, Timestamp, Prevented Status
- Event Types: COPY_ATTEMPT, PASTE_ATTEMPT, CUT_ATTEMPT, CONTEXT_MENU_ATTEMPT
- Total count of security events

#### URLs & Access
- **Owner Session URL** - Clickable link to open in new tab
  - Format: `/start/{snippetId}` or `/start/{tinyCode}`
- **Joinee Session URL** - Clickable link to open in new tab
  - Format: `/join/{snippetId}` or `/join/{tinyCode}`

#### Network & Device Information
- **Owner**
  - IP Address
  - Browser (User Agent parsed: Browser Type, Version, OS)
- **Joinee(s)**
  - IP Address per participant
  - Browser (User Agent parsed)

## Database Schema Changes

### New Entity: SessionHistory

```java
@Entity
@Table(name = "session_history",
       indexes = {
           @Index(name = "idx_snippet_id", columnList = "snippet_id"),
           @Index(name = "idx_owner_id", columnList = "owner_id"),
           @Index(name = "idx_created_at", columnList = "created_at"),
           @Index(name = "idx_session_status", columnList = "session_status")
       }
)
public class SessionHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // Session Identifiers
    @Column(name = "snippet_id")
    private String snippetId;
    
    @Column(name = "session_id_from_collaboration")
    private String collaborationSessionId;
    
    // Owner Information
    @Column(name = "owner_id")
    private String ownerId;
    
    @Column(name = "owner_username")
    private String ownerUsername;
    
    @Column(name = "owner_email")
    private String ownerEmail;
    
    @Column(name = "is_owner_anonymous")
    private Boolean isOwnerAnonymous;
    
    // Session Timing
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "ended_at")
    private LocalDateTime endedAt;
    
    @Column(name = "duration_seconds")
    private Long durationSeconds;
    
    // Code Metadata (captured at session creation)
    @Column(name = "snippet_title")
    private String snippetTitle;
    
    @Column(name = "snippet_language")
    private String snippetLanguage;
    
    @Column(columnDefinition = "TEXT")
    private String snippetTags;
    
    // Participants
    @Column(name = "participant_count")
    private Integer participantCount;
    
    @Column(columnDefinition = "TEXT")
    private String participantsList; // JSON: [{userId, username, joinedAt, leftAt, ipAddress, userAgent}]
    
    // Security Events
    @Column(name = "security_event_count")
    private Integer securityEventCount;
    
    @Column(name = "security_events_json", columnDefinition = "TEXT")
    private String securityEventsJson; // JSON array of security events
    
    // Session Status
    @Column(name = "session_status") // ACTIVE, COMPLETED, ABANDONED
    private String sessionStatus;
    
    // Timestamps
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

### New Entity: ParticipantSession

```java
@Entity
@Table(name = "participant_sessions",
       indexes = {
           @Index(name = "idx_session_history_id", columnList = "session_history_id"),
           @Index(name = "idx_user_id", columnList = "user_id"),
           @Index(name = "idx_joined_at", columnList = "joined_at")
       }
)
public class ParticipantSession {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "session_history_id", nullable = false)
    private SessionHistory sessionHistory;
    
    @Column(name = "user_id")
    private String userId;
    
    @Column(name = "username")
    private String username;
    
    @Column(name = "is_owner")
    private Boolean isOwner;
    
    @Column(name = "is_anonymous")
    private Boolean isAnonymous;
    
    @Column(name = "joined_at")
    private LocalDateTime joinedAt;
    
    @Column(name = "left_at")
    private LocalDateTime leftAt;
    
    @Column(name = "duration_seconds")
    private Long durationSeconds;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    
    @Column(name = "browser_name")
    private String browserName;
    
    @Column(name = "browser_version")
    private String browserVersion;
    
    @Column(name = "os_name")
    private String osName;
    
    @Column(name = "os_version")
    private String osVersion;
}
```

## Backend Implementation

### API Endpoints

#### 1. Get All Sessions (Paginated)
```
GET /api/admin/sessions
Query Parameters:
  - page (default: 1)
  - pageSize (default: 25)
  - sortBy (createdAt, duration, ownerName - default: createdAt)
  - sortOrder (ASC, DESC - default: DESC)
  - search (filter by owner name, session ID, snippet title)

Response:
{
  "content": [
    {
      "id": "session-123",
      "snippetId": "snippet-456",
      "ownerUsername": "john_doe",
      "ownerEmail": "john@example.com",
      "isOwnerAnonymous": false,
      "createdAt": "2026-01-02T10:30:00Z",
      "endedAt": "2026-01-02T11:15:00Z",
      "durationSeconds": 2700,
      "snippetTitle": "My Code Snippet",
      "snippetLanguage": "javascript",
      "participantCount": 2,
      "securityEventCount": 3,
      "sessionStatus": "COMPLETED"
    }
  ],
  "totalElements": 150,
  "totalPages": 6,
  "currentPage": 1
}
```

#### 2. Get Session Details
```
GET /api/admin/sessions/:sessionId

Response:
{
  "id": "session-123",
  "snippetId": "snippet-456",
  "snippetTitle": "My Code Snippet",
  "snippetDescription": "A helpful snippet",
  "snippetLanguage": "javascript",
  "snippetTags": ["react", "hooks"],
  
  "owner": {
    "id": "user-123",
    "username": "john_doe",
    "email": "john@example.com",
    "isAnonymous": false
  },
  
  "createdAt": "2026-01-02T10:30:00Z",
  "endedAt": "2026-01-02T11:15:00Z",
  "durationSeconds": 2700,
  "sessionStatus": "COMPLETED",
  
  "participants": [
    {
      "userId": "user-123",
      "username": "john_doe",
      "isOwner": true,
      "joinedAt": "2026-01-02T10:30:00Z",
      "leftAt": "2026-01-02T11:15:00Z",
      "ipAddress": "192.168.1.1",
      "browser": "Chrome 120.0",
      "os": "Windows 10"
    },
    {
      "userId": "user-456",
      "username": "jane_smith",
      "isOwner": false,
      "joinedAt": "2026-01-02T10:35:00Z",
      "leftAt": "2026-01-02T11:10:00Z",
      "ipAddress": "192.168.1.2",
      "browser": "Firefox 121.0",
      "os": "macOS 13"
    }
  ],
  
  "securityEvents": [
    {
      "id": "event-1",
      "eventType": "COPY_ATTEMPT",
      "username": "jane_smith",
      "timestamp": "2026-01-02T10:45:00Z",
      "isPrevented": true
    }
  ],
  
  "urls": {
    "ownerSessionUrl": "/start/new-snippet-ABC123",
    "joineeSessionUrl": "/join/new-snippet-ABC123"
  }
}
```

### Service Classes

#### SessionHistoryService
- `createSessionFromCollaboration()` - Capture session data
- `endSession()` - Mark session as completed
- `getAllSessions()` - Fetch with pagination & filtering
- `getSessionDetails()` - Get full details for drill-down
- `trackParticipant()` - Record participant join/leave
- `addSecurityEvent()` - Log security events

### Controller
```
AdminController
  GET /api/admin/sessions - List all sessions
  GET /api/admin/sessions/:sessionId - Get session details
```

## Frontend Implementation

### Components

#### 1. AdminDashboard Component (`/admin`)
- Session list table with columns:
  - Owner, Email, Creation Date, Duration, Participants, Language, Title
  - Action button to drill-down
- Pagination controls
- Sort & filter options
- Responsive design

#### 2. SessionDetails Component (`/admin/:sessionId`)
- Session information cards
- Participants list
- Security events table
- URLs with copy-to-clipboard buttons
- Network info display

### Routes
```
/admin - AdminDashboard
/admin/:sessionId - SessionDetails
```

### State Management
- Use Redux or Context for session data
- Cache session list with proper invalidation
- Load details on demand

## Data Collection Strategy

### When to Capture Session Data

1. **Session Creation**
   - Owner creates new session
   - Capture: Owner info, creation time, code metadata

2. **User Joins/Leaves**
   - Track via CollaborationController
   - Capture: User info, IP address, User Agent, join/leave time

3. **Session Ends**
   - Last participant leaves or timeout
   - Calculate: Duration, finalize status
   - Aggregate security events

4. **Security Events**
   - Already tracked in SecurityEvent table
   - Reference in SessionHistory

## Browser Information Extraction

Use library to parse User-Agent string:
```java
// Example: ua-parser-java or similar
UserAgentParser parser = new UserAgentParser();
UserAgent ua = parser.parse(userAgentString);
// Extract: browser name/version, OS name/version
```

## Implementation Timeline

### Phase 1: Database & Backend API (Sprint 1)
- [ ] Create SessionHistory & ParticipantSession entities
- [ ] Create repositories
- [ ] Create SessionHistoryService
- [ ] Create AdminController endpoints
- [ ] Integrate with CollaborationController for data capture

### Phase 2: Frontend Dashboard (Sprint 2)
- [ ] Create AdminDashboard component
- [ ] Implement session list table
- [ ] Add pagination & filtering
- [ ] Create SessionDetails component
- [ ] Add routing

### Phase 3: Documentation & Polish (Sprint 3)
- [ ] API documentation
- [ ] Frontend component documentation
- [ ] Testing & bug fixes
- [ ] Performance optimization

## Security Considerations

- **Authentication Required**: Only authenticated admins can access /admin
- **Role-Based Access**: Check for ADMIN role
- **Data Privacy**: Don't expose sensitive user data
- **IP Masking**: Optional - mask last octet of IP
- **Audit Logging**: Log all admin dashboard access

## Future Enhancements

- Real-time dashboard with WebSocket updates
- Export session data (CSV, PDF)
- Analytics charts & graphs
- Session replay/audit trail
- Advanced filtering & search
- Performance metrics
- User behavior analytics
