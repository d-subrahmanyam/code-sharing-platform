# Code Sharing Platform - Developer Features

## New Features Added

### 1. License

- Added MIT License to the project (`LICENSE` file)
- Allows open-source usage and contribution

### 2. Docker Management Scripts

Located in `/scripts` directory:

#### Bash Script (`restart-docker.sh`)
```bash
chmod +x scripts/restart-docker.sh
./scripts/restart-docker.sh
```

#### PowerShell Script (`restart-docker.ps1`)
```powershell
.\scripts\restart-docker.ps1
```

**Features:**
- Color-coded console output with timestamps
- Detailed logging to `docker-restart.log`
- Health checks for frontend and backend services
- Graceful container shutdown and restart
- Service initialization wait time

### 3. Developer-Friendly Console Logging

**Location:** `frontend/src/utils/logger.ts`

**Usage:**
```typescript
import { logger } from './utils/logger'

logger.debug('Debug message', { data: 'value' })
logger.info('Information message')
logger.warn('Warning message')
logger.error('Error message', error, { context: 'data' })
logger.success('Success message')
```

**Features:**
- Color-coded log levels with emoji indicators
- Timestamp on every log entry
- Log history management (last 500 entries)
- Export logs as JSON
- Filter logs by level or message pattern
- Performance timing utilities
- API request/response logging
- Browser console integration

**Accessing Logs in Browser:**
```javascript
// In browser console
window.__logger.getHistory()           // Get all logs
window.__logger.exportLogs()           // Export as JSON
window.__logger.filterByLevel('ERROR') // Filter by level
window.__logger.clearHistory()         // Clear logs
```

### 4. Tiny URL Generation for Snippets

**Location:** `frontend/src/utils/tinyUrl.ts`

**Usage:**
```typescript
import {
  generateTinyCode,
  generateShareableURL,
  createSnippetShare,
  copyToClipboard,
  generateQRCodeURL,
} from './utils/tinyUrl'

// Generate a unique tiny code
const tinyCode = generateTinyCode() // e.g., "ABC123"

// Create shareable URL
const shareURL = generateShareableURL(tinyCode)

// Create complete share object
const share = createSnippetShare(snippetId, expirationMinutes)

// Copy to clipboard
await copyToClipboard(shareURL)

// Generate QR code
const qrURL = generateQRCodeURL(shareURL)
```

**Features:**
- 6-character alphanumeric codes (e.g., "ABC123")
- Unique generation using timestamp + random
- Shareable URLs
- QR code generation (via qr-server.com)
- Clipboard copy functionality
- Optional URL expiration

### 5. User Join Notifications

**Location:** `frontend/src/components/UserJoinBubble.tsx`

**Usage:**
```typescript
import { UserJoinBubble, UserJoinNotifications } from './components/UserJoinBubble'

// Single notification
<UserJoinBubble
  notification={{ id: '1', username: 'John', timestamp: new Date() }}
  onDismiss={() => console.log('dismissed')}
  autoDismissMs={5000}
/>

// Multiple notifications
<UserJoinNotifications
  notifications={notifications}
  onDismiss={(id) => handleDismiss(id)}
/>
```

**Features:**
- Toast-like notifications
- Auto-dismiss after configurable time (default 5s)
- Slide-in animation
- Manual dismiss button
- Shows user icon and join message
- Stacked layout for multiple users

### 6. Comprehensive Error Handling

**Location:** `frontend/src/utils/apiErrorHandler.ts`

**Usage:**
```typescript
import {
  fetchWithErrorHandling,
  retryWithBackoff,
  errorBoundary,
  ApiError,
  ErrorType,
} from './utils/apiErrorHandler'

// Safe fetch with automatic error handling
const { data, error } = await fetchWithErrorHandling<UserData>(
  '/api/users',
  { timeout: 30000 }
)

if (error) {
  console.error(`Error: ${error.message}`)
}

// Retry with exponential backoff
const result = await retryWithBackoff(
  () => fetchData(),
  3,     // max retries
  1000   // initial delay in ms
)

// Use error boundary
errorBoundary.capture(error)
const lastError = errorBoundary.getLastError()
```

**Error Types Handled:**
- `NETWORK_ERROR` - Connection failures
- `TIMEOUT_ERROR` - Request timeouts
- `UNAUTHORIZED` - 401 Unauthorized
- `FORBIDDEN` - 403 Forbidden
- `NOT_FOUND` - 404 Not Found
- `VALIDATION_ERROR` - 400+ status codes
- `SERVER_ERROR` - 500+ status codes
- `UNKNOWN_ERROR` - Unknown errors

**Features:**
- Automatic retry with exponential backoff
- User-friendly error messages
- GraphQL error handling
- Timeout handling (default 30s)
- Response validation
- Error boundary for capturing errors
- Full error context preservation

### 7. API Client Enhancements

**Location:** `frontend/src/api/client.ts`

**Features:**
- Automatic request/response logging
- JWT token injection
- Error logging with full context
- 30-second request timeout
- Unauthorized error handling with auto-redirect
- GraphQL query function

### 8. Global Animations and Styles

**Location:** `frontend/src/styles/global.css`

**Available Animations:**
- `animate-slide-in` - Notification entrance
- `animate-slide-out` - Notification exit
- `animate-fade-in` - Fade entrance
- `animate-pulse` - Pulsing effect
- Custom scrollbar styling
- Selection color customization

## Usage Examples

### Creating and Sharing a Snippet

```typescript
import { createSnippetShare, copyToClipboard } from './utils/tinyUrl'

const handleCreateSnippet = async () => {
  const snippet = await saveSnippet(snippetData)
  const share = createSnippetShare(snippet.id)
  
  logger.success(`Snippet created: ${share.tinyCode}`)
  
  await copyToClipboard(share.shareableURL)
  logger.info('Share URL copied to clipboard', {
    url: share.shareableURL,
  })
}
```

### Handling Errors

```typescript
import { errorBoundary, ApiError } from './utils/apiErrorHandler'

const loadData = async () => {
  const { data, error } = await fetchWithErrorHandling('/api/data')
  
  if (error) {
    errorBoundary.capture(error)
    showErrorToast(error.message)
    logger.error('Failed to load data', new Error(error.message))
  }
  
  return data
}
```

### Logging User Actions

```typescript
import { logger } from './utils/logger'

const handleCodeChange = (code: string) => {
  logger.debug('Code updated', {
    length: code.length,
    timestamp: new Date().toISOString(),
  })
  
  setCode(code)
}

const handleUserJoin = (username: string) => {
  logger.success(`User joined: ${username}`)
  showJoinNotification(username)
}
```

## Browser Console Debugging

The logger is exposed globally for debugging:

```javascript
// View all logs
__logger.getHistory()

// Export logs for sharing
copy(__logger.exportLogs())

// Filter by error level
__logger.filterByLevel('ERROR')

// Search logs
__logger.filterByMessage('API')

// Clear history
__logger.clearHistory()

// Real-time performance timing
__logger.time('operation')
// ... do something ...
__logger.timeEnd('operation')
```

## Environment Variables

Add to `.env` for configuration:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_LOG_LEVEL=debug
VITE_APP_NAME=Code Sharing Platform
```

## Future Enhancements

- WebSocket integration for real-time collaboration
- Database persistence for snippet shares
- User activity tracking
- Advanced analytics
- Session management with reconnection logic
- Offline mode support

## Contributing

When adding new features, ensure:
1. Use the `logger` utility for debugging
2. Implement proper error handling with `apiErrorHandler`
3. Add timestamps to user actions
4. Test in both development and production environments
5. Update this documentation

## Support

For issues or questions about these features, refer to:
- `/scripts/README.md` - Docker scripts documentation
- `frontend/src/utils/` - Source code documentation
- GitHub Issues - Community support
