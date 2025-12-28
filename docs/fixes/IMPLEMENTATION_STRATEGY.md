# Implementation Strategy - Owner Creation & Joinee Session

## Overview
This document outlines the steps to implement:
1. Owner creates snippet and stores all details to database
2. Joinee joins and fetches owner/snippet details
3. Loading UI shows while data is being fetched
4. Redux store manages joinee session state

## Step-by-Step Implementation

### Step 1: Backend - Enhance GET /api/snippets/lookup/{tinyCode}
**Current:** Returns snippetId, ownerId, ownerUsername, tinyCode
**Needed:** Also return full snippet details (title, code, language, tags, description)

**Change in SnippetService.java:**
```java
public Map<String, Object> getOwnerDetailsByTinyCode(String tinyCode) {
    // Get tiny code mapping
    var tinyUrl = tinyUrlRepository.findByShortCode(tinyCode);
    
    if (tinyUrl.isPresent()) {
        var url = tinyUrl.get();
        
        // Get owner info
        String ownerUsername = null;
        var user = userRepository.findById(url.getUserId());
        if (user.isPresent()) {
            ownerUsername = user.get().getUsername();
        }
        
        // Get snippet details
        CodeSnippet snippet = mongoTemplate.findById(url.getSnippetId(), CodeSnippet.class);
        
        Map<String, Object> result = new HashMap<>();
        result.put("snippetId", url.getSnippetId());
        result.put("ownerId", url.getUserId());
        result.put("ownerUsername", ownerUsername != null ? ownerUsername : "Unknown");
        result.put("tinyCode", tinyCode);
        
        // Add snippet details
        if (snippet != null) {
            result.put("title", snippet.getTitle());
            result.put("description", snippet.getDescription());
            result.put("code", snippet.getCode());
            result.put("language", snippet.getLanguage());
            result.put("tags", snippet.getTags());
        }
        
        return result;
    }
    return null;
}
```

---

### Step 2: Frontend - Add Redux Actions for Joinee Session
**File:** `frontend/src/store/actionTypes.ts`

Add new action types:
```typescript
export const JOINEE_SESSION_LOAD_REQUEST = 'JOINEE_SESSION_LOAD_REQUEST'
export const JOINEE_SESSION_LOAD_SUCCESS = 'JOINEE_SESSION_LOAD_SUCCESS'
export const JOINEE_SESSION_LOAD_FAILURE = 'JOINEE_SESSION_LOAD_FAILURE'
export const JOINEE_SESSION_CLEAR = 'JOINEE_SESSION_CLEAR'
```

---

### Step 3: Frontend - Update Redux Store
**File:** `frontend/src/types/redux.ts`

Add to SnippetState:
```typescript
export interface JoineeSessionState {
  isLoading: boolean
  error: string | null
  ownerId: string | null
  ownerUsername: string | null
  title: string | null
  code: string | null
  language: string | null
  tags: string[]
  description: string | null
}

export interface SnippetState {
  items: CodeSnippet[]
  currentSnippet: CodeSnippet | null
  joineeSession: JoineeSessionState  // NEW
  loading: boolean
  error: string | null
}
```

---

### Step 4: Frontend - Update Snippet Reducer
**File:** `frontend/src/store/slices/snippetSlice.ts`

Add cases for joinee session actions:
```typescript
case JOINEE_SESSION_LOAD_REQUEST:
  return {
    ...state,
    joineeSession: {
      ...state.joineeSession,
      isLoading: true,
      error: null,
    },
  }

case JOINEE_SESSION_LOAD_SUCCESS:
  return {
    ...state,
    joineeSession: {
      isLoading: false,
      error: null,
      ownerId: action.payload.ownerId,
      ownerUsername: action.payload.ownerUsername,
      title: action.payload.title,
      code: action.payload.code,
      language: action.payload.language,
      tags: action.payload.tags || [],
      description: action.payload.description,
    },
  }

case JOINEE_SESSION_LOAD_FAILURE:
  return {
    ...state,
    joineeSession: {
      ...state.joineeSession,
      isLoading: false,
      error: action.payload,
    },
  }

case JOINEE_SESSION_CLEAR:
  return {
    ...state,
    joineeSession: {
      isLoading: false,
      error: null,
      ownerId: null,
      ownerUsername: null,
      title: null,
      code: null,
      language: null,
      tags: [],
      description: null,
    },
  }
```

---

### Step 5: Frontend - Create Joinee Session Saga
**File:** `frontend/src/store/sagas/snippetSaga.ts`

Add saga to fetch owner details:
```typescript
function* loadJoineeSessionSaga(action: any) {
  try {
    const tinyCode = action.payload.tinyCode
    
    // Call API to get owner and snippet details
    const response = yield call(
      fetch,
      `/api/snippets/lookup/${tinyCode}`,
      { method: 'GET' }
    )
    
    if (!response.ok) {
      throw new Error('Failed to load session details')
    }
    
    const data = yield call(() => response.json())
    
    yield put({
      type: JOINEE_SESSION_LOAD_SUCCESS,
      payload: data,
    })
  } catch (error: any) {
    yield put({
      type: JOINEE_SESSION_LOAD_FAILURE,
      payload: error.message || 'Failed to load session details',
    })
  }
}

// In watcher:
yield takeEvery(JOINEE_SESSION_LOAD_REQUEST, loadJoineeSessionSaga)
```

---

### Step 6: Frontend - Update EditorPage to Fetch on Joinee Join
**File:** `frontend/src/pages/EditorPage.tsx`

When detectingjoinee session:
```typescript
// When joinee joins
useEffect(() => {
  if (isJoineeSession && tinyCode && !isLoadingSnippet) {
    console.log('[EditorPage] Joinee loading session details...')
    dispatch({
      type: JOINEE_SESSION_LOAD_REQUEST,
      payload: { tinyCode },
    } as any)
  }
}, [isJoineeSession, tinyCode, dispatch, isLoadingSnippet])

// Watch for loaded joinee session data
useEffect(() => {
  const joineeSession = useSelector((state: any) => state.snippet?.joineeSession)
  
  if (joineeSession?.title && joineeSession.code) {
    setFormData({
      title: joineeSession.title,
      description: joineeSession.description || '',
      code: joineeSession.code,
      language: joineeSession.language || 'javascript',
      tags: joineeSession.tags || [],
      isPublic: true,
    })
    setSnippetOwnerId(joineeSession.ownerId)
    setSnippetOwnerUsername(joineeSession.ownerUsername)
  }
}, [joineeSession])
```

---

### Step 7: Frontend - Add Loading UI
**File:** `frontend/src/pages/EditorPage.tsx`

Show loading while joinee session data is loading:
```tsx
const joineeSession = useSelector((state: any) => state.snippet?.joineeSession)

{isJoineeSession && joineeSession?.isLoading && (
  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
    <div className="bg-gray-800 rounded-lg p-8 text-center">
      <div className="animate-spin inline-block mb-4">
        <FiRefreshCw size={40} className="text-blue-500" />
      </div>
      <p className="text-white text-lg font-semibold">Loading session details...</p>
      <p className="text-gray-400 mt-2">Waiting for owner details</p>
    </div>
  </div>
)}
```

---

### Step 8: Frontend - Handle Owner Creation Auto-Save
**File:** `frontend/src/pages/EditorPage.tsx`

Add debounced auto-save for new snippets:
```typescript
// Auto-save new snippet when owner provides key data
useEffect(() => {
  if (isOwnerSession && isNew && !isSaving) {
    // Only save if we have meaningful content
    if (formData.title && formData.code && formData.title.length > 3 && formData.code.length > 10) {
      const timeoutId = setTimeout(() => {
        console.log('[EditorPage] Auto-saving new snippet...')
        dispatch({
          type: SNIPPET_CREATE_REQUEST,
          payload: {
            ...formData,
            authorId: userId,
          },
        } as any)
      }, 2000) // Debounce for 2 seconds
      
      return () => clearTimeout(timeoutId)
    }
  }
}, [formData.title, formData.code, formData.language, formData.tags, isOwnerSession, isNew, userId, dispatch, isSaving])
```

---

## Summary of Files to Modify

### Backend
1. `SnippetService.java` - Enhance getOwnerDetailsByTinyCode() to return full snippet details
2. `SnippetController.java` - Change return type to include snippet data

### Frontend
1. `actionTypes.ts` - Add new action types
2. `types/redux.ts` - Add JoineeSessionState interface
3. `store/slices/snippetSlice.ts` - Add reducer cases
4. `store/sagas/snippetSaga.ts` - Add saga for loading joinee session
5. `pages/EditorPage.tsx` - Add auto-save and loading UI

---

## Testing Checklist

- [ ] Owner creates new snippet - auto-saves to database
- [ ] Owner gets snippet ID after auto-save  
- [ ] Joinee opens URL - loading spinner shows
- [ ] Loading spinner disappears when data loaded
- [ ] Joinee sees owner's title, code, language, tags
- [ ] Owner name displayed next to data
- [ ] If owner hasn't saved yet - graceful error handling
- [ ] WebSocket still works after joinee session loads
- [ ] Real-time updates sync after loading complete

