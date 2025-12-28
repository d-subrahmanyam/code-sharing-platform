# Implementation Analysis - Owner Creation & Joinee Join Features

## Current Issues Analysis

### Issue 1: Owner Creates Snippet - Data Not Stored to Database
**Current Flow:**
1. Owner creates snippet with title, description, language, tags, code
2. Snippet stored only in component state (formData)
3. Snippet NOT persisted to MongoDB until Save button is clicked
4. When joinee joins via shared URL before owner saves, no data is available

**What Needs to Fix:**
- When owner provides title, description, language, tags, and code snippet, data should be stored to database immediately
- Create API endpoint that stores this metadata and returns snippet ID
- Update frontend to call this endpoint when owner enters the data
- Return newly created snippet ID to owner

---

### Issue 2: Joinee Joins Session - No Owner/Snippet Details Provided
**Current Flow:**
1. Joinee joins with `/join/new-snippet-XXXX` URL
2. Frontend resolves tiny code to snippet ID
3. Frontend fetches snippet from MongoDB using GraphQL
4. If owner hasn't saved yet, no data exists in database

**What Needs to Fix:**
- When joinee joins, fetch owner details (userId, username) via API
- Send complete snippet details (title, code, language, tags, description)
- Include owner's current metadata in the response
- Make this data available to joinee immediately

---

### Issue 3: No Loading UI for Joinee Session
**Current Flow:**
1. Joinee joins session
2. UI loads but shows empty/placeholder data until owner details arrive
3. No visual indication that data is loading
4. User might think something is broken

**What Needs to Fix:**
- Show loading spinner/skeleton until snippet details are fetched
- Display "Waiting for owner details..." message
- Show only when joinee is joining (not owner creating)
- Hide when data is received from API
- Store loaded details in Redux store

---

## Implementation Plan

### Phase 1: Owner Creation Flow
**Files to Modify:**
1. `frontend/src/pages/EditorPage.tsx` - Add auto-save for new snippets
2. `frontend/src/store/sagas/snippetSaga.ts` - Handle auto-save saga
3. `backend/.../SnippetController.java` - Accept create mutation
4. `backend/.../SnippetService.java` - Store to MongoDB

**Implementation:**
- When owner enters title, description, language, tags, code - auto-save to database
- Only save if there's meaningful data (title + code at minimum)
- Return snippet ID from backend
- Update form state with returned ID
- Don't wait for user to click Save button

---

### Phase 2: Joinee Join Flow  
**Files to Modify:**
1. `frontend/src/pages/EditorPage.tsx` - Fetch owner details on join
2. `frontend/src/store/sagas/snippetSaga.ts` - New saga for loading owner details
3. `frontend/src/store/slices/snippetSlice.ts` - Store joinee session details
4. `frontend/src/store/actionTypes.ts` - New action types
5. `backend/.../SnippetController.java` - New endpoint for owner details
6. `backend/.../SnippetService.java` - Query owner and snippet data

**API Endpoint Needed:**
```
GET /api/snippets/owner/{tinyCode}
Response: {
  snippetId: string
  ownerId: string
  ownerUsername: string
  title: string
  description: string
  code: string
  language: string
  tags: string[]
}
```

---

### Phase 3: Loading UI for Joinee
**Components to Add:**
1. Loading spinner in EditorPage when isJoineeSession && isLoading
2. Redux store state for joinee session loading
3. Show loading only when:
   - User joined via /join route
   - Details not yet fetched
   - No data in form fields

---

## Key Behaviors

### Owner Creates Snippet
```
1. Owner navigates to /start/new-snippet-ABC
2. Owner enters title, description, language, tags, code
3. As owner types, data is auto-saved to MongoDB
4. Owner gets back snippet ID
5. Owner can still click Save to finalize
6. Share URL with joinee immediately
```

### Joinee Joins Snippet
```
1. Joinee opens /join/new-snippet-ABC in browser
2. EditorPage detects joinee route
3. Show loading spinner: "Loading snippet details..."
4. Fetch owner details from backend:
   - Owner name
   - Snippet title, code, language, tags, description
5. Populate form fields when data arrives
6. Hide loading spinner
7. Store in Redux for persistence
8. Connect WebSocket for real-time sync
```

---

## Redux Store Changes

### New State for Joinee Session
```typescript
{
  snippet: {
    items: [],
    currentSnippet: null,
    joineeSession: {
      isLoading: boolean
      error: string | null
      ownerId: string | null
      ownerUsername: string | null
      title: string | null
      code: string | null
      language: string | null
      tags: string[]
      description: string | null
    },
    loading: boolean
    error: string | null
  }
}
```

### New Action Types
```typescript
export const JOINEE_SESSION_LOAD_REQUEST = 'JOINEE_SESSION_LOAD_REQUEST'
export const JOINEE_SESSION_LOAD_SUCCESS = 'JOINEE_SESSION_LOAD_SUCCESS'
export const JOINEE_SESSION_LOAD_FAILURE = 'JOINEE_SESSION_LOAD_FAILURE'
export const JOINEE_SESSION_CLEAR = 'JOINEE_SESSION_CLEAR'
```

---

## Testing Strategy

### Owner Creation Flow
- [ ] Owner enters title, code, language, tags
- [ ] Auto-save triggers
- [ ] Can verify in MongoDB that data is saved
- [ ] Snippet ID is returned and displayed
- [ ] Save button still works for manual save

### Joinee Join Flow
- [ ] Joinee opens shared URL
- [ ] Loading spinner appears
- [ ] Owner details fetched from API
- [ ] Form populates with owner's data
- [ ] Loading spinner disappears
- [ ] WebSocket connects for real-time updates
- [ ] Owner changes reflected in joinee's UI

### Loading UI
- [ ] Shows only when joinee joining
- [ ] Shows only when data not yet loaded
- [ ] Disappears when data arrives
- [ ] Works with slow network (can manually delay API)

