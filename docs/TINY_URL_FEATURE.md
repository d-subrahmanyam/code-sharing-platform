# Tiny URL / Shortened URL Feature

This document explains how the tiny URL feature works and how users can leverage it to share code snippets easily.

## Overview

The tiny URL feature allows users to create short, shareable links for their code snippets. Instead of sharing long URLs with lengthy snippet IDs, users can share 6-character codes that automatically load the correct snippet when clicked.

## How It Works

### Frontend Flow

1. User navigates to a shortened URL: `http://localhost:3000/join/ABC123`
2. The `EditorPage` component detects the `tinyCode` route parameter
3. The app calls the backend API: `GET /api/snippets/lookup/ABC123`
4. Backend returns the corresponding `snippetId`
5. The app caches the mapping in session storage
6. The snippet is loaded into the editor using the resolved `snippetId`

### Backend Flow

1. User creates a share for a snippet
2. Backend generates a unique 6-character code (e.g., "ABC123")
3. A `TinyUrl` entry is created in the database mapping:
   - `shortCode` → `ABC123`
   - `snippetId` → `actual-snippet-id`
   - `userId` → The user who created the share
4. The share is returned to the frontend

## Usage

### Creating a Tiny Code for a Snippet

**Frontend (JavaScript/TypeScript):**
```typescript
import { createSnippetShare, copyToClipboard, generateQRCodeURL } from './utils/tinyUrl'

// Create a share
const share = createSnippetShare(snippetId, expirationMinutes)

// The share object contains:
// {
//   snippetId: "snippet-id",
//   tinyCode: "ABC123",
//   shareableURL: "http://localhost:3000/join/ABC123",
//   createdAt: Date,
//   expiresAt: Date (optional)
// }

// Copy to clipboard
await copyToClipboard(share.shareableURL)

// Generate QR code
const qrCodeURL = generateQRCodeURL(share.shareableURL)
```

**Backend (REST API):**
```bash
# Create a tiny code for a snippet
GET /api/snippets/{snippetId}/share?userId=user-123

# Response:
{
  "snippetId": "actual-snippet-id",
  "tinyCode": "ABC123"
}
```

### Looking Up a Snippet by Tiny Code

**Frontend (Automatic - handled by EditorPage):**
```typescript
import { lookupSnippetByTinyCode, getTinyCodeMapping, storeTinyCodeMapping } from './utils/tinyUrl'

// Check cache first
const cached = getTinyCodeMapping('ABC123')

// Or query backend
const snippetId = await lookupSnippetByTinyCode('ABC123')

// Store for future use
storeTinyCodeMapping('ABC123', snippetId)
```

**Backend (REST API):**
```bash
# Look up snippet by tiny code
GET /api/snippets/lookup/ABC123

# Response (200 OK):
{
  "snippetId": "actual-snippet-id",
  "id": "actual-snippet-id"
}

# Response (404 Not Found) if code doesn't exist or is expired
```

## URL Routes

### Frontend Routes

| Route | Description |
|-------|-------------|
| `/editor/:snippetId` | Load snippet directly by ID |
| `/join/:tinyCode` | Load snippet by tiny code |
| `/editor/new` | Create a new snippet |

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/snippets/lookup/:tinyCode` | Resolve tiny code to snippet ID |
| `GET` | `/api/snippets/:snippetId/share` | Create/get tiny code for a snippet |

## Data Model

### TinyUrl Entity (Backend)

```java
@Entity
@Table(name = "tiny_urls")
public class TinyUrl {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(unique = true, nullable = false)
    private String shortCode;          // e.g., "ABC123"
    
    @Column(nullable = false)
    private String snippetId;          // The actual snippet ID
    
    @Column(nullable = false)
    private String userId;             // User who created the share
    
    private LocalDateTime createdAt;   // When the share was created
    
    private LocalDateTime expiresAt;   // Optional expiration date
}
```

### SnippetShare Object (Frontend)

```typescript
interface SnippetShare {
  snippetId: string                    // The actual snippet ID
  tinyCode: string                     // 6-character code (e.g., "ABC123")
  shareableURL: string                 // Full URL (e.g., "http://localhost:3000/join/ABC123")
  createdAt: Date                      // When the share was created
  expiresAt?: Date                     // Optional expiration date
}
```

## Implementation Details

### Tiny Code Generation

The tiny code is generated using the following algorithm:

**Frontend:**
```typescript
export function generateTinyCode(): string {
  const timestamp = Date.now() % 1000000  // Last 6 digits of timestamp
  const random = Math.floor(Math.random() * 1000000)
  const combined = (timestamp * 1000000 + random).toString()
  
  let code = (BigInt(combined) % BigInt(Math.pow(36, 6)))
    .toString(36)
    .padStart(6, '0')
    .substring(0, 6)
    .toUpperCase()
  
  return code  // e.g., "ABC123"
}
```

**Backend:**
```java
private String generateRandomTinyCode() {
  String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  StringBuilder code = new StringBuilder()
  Random random = new Random()

  for (int i = 0; i < 6; i++) {
    code.append(chars.charAt(random.nextInt(chars.length())))
  }

  return code.toString()  // e.g., "ABC123"
}
```

### Cache Strategy

To minimize database queries, the frontend caches resolved mappings in session storage:

```typescript
// Store in session storage
function storeTinyCodeMapping(tinyCode: string, snippetId: string) {
  const mappings = JSON.parse(sessionStorage.getItem('tinyCodeMappings') || '{}')
  mappings[tinyCode] = snippetId
  sessionStorage.setItem('tinyCodeMappings', JSON.stringify(mappings))
}

// Retrieve from cache
function getTinyCodeMapping(tinyCode: string): string | null {
  const mappings = JSON.parse(sessionStorage.getItem('tinyCodeMappings') || '{}')
  return mappings[tinyCode] || null
}
```

**Note:** Session storage is cleared when the browser tab closes, so the mapping is temporary per session.

## Error Handling

### Frontend Error Scenarios

1. **Invalid Tiny Code Format**
   - Code doesn't match 6-character alphanumeric pattern
   - User is shown error and redirected to home

2. **Tiny Code Not Found**
   - Backend returns 404
   - User is shown "Snippet not found" error
   - User can navigate back to home

3. **Expired Tiny Code**
   - Backend checks expiration and returns 404 if expired
   - User is shown expired link message

4. **Network Error**
   - Network request fails
   - User is shown network error and can retry

### Backend Error Scenarios

1. **Invalid Snippet ID**
   - Returns 400 Bad Request when creating share for non-existent snippet

2. **Database Error**
   - Returns 500 Internal Server Error
   - Error is logged for debugging

## Logging

The feature integrates with the logger utility for debugging:

```typescript
logger.debug('Resolving tiny code', { tinyCode })
logger.info('Tiny code resolved from cache', { tinyCode, snippetId })
logger.success('Tiny code resolved successfully', { tinyCode, snippetId })
logger.warn('Tiny code resolution failed', { tinyCode, error })
logger.error('Error resolving tiny code', error, { tinyCode })
```

## Browser Console Debugging

You can debug tiny code mappings in the browser console:

```javascript
// View all tiny code mappings
JSON.parse(sessionStorage.getItem('tinyCodeMappings'))

// Clear mappings
sessionStorage.removeItem('tinyCodeMappings')

// View all session storage
sessionStorage
```

## Future Enhancements

1. **Expiration Management**
   - Allow users to set custom expiration times for shares
   - Backend job to clean up expired shares

2. **Share Analytics**
   - Track how many times a tiny code is accessed
   - Show analytics dashboard to snippet owner

3. **Custom Codes**
   - Allow users to set custom short codes (e.g., "mysnippet")
   - Validate custom codes don't conflict with existing ones

4. **Share Permissions**
   - Allow temporary read-only access to private snippets
   - Generate one-time access links

5. **QR Code Display**
   - Show QR code in snippet details
   - Allow users to print QR codes for presentations

## Testing

### Manual Testing

1. Create a snippet
2. Copy the tiny code URL
3. Open the URL in a new tab
4. Verify the snippet loads correctly

### API Testing

```bash
# Test tiny code lookup
curl -X GET "http://localhost:8080/api/snippets/lookup/ABC123"

# Test create share
curl -X GET "http://localhost:8080/api/snippets/actual-snippet-id/share?userId=user-123"
```

## Troubleshooting

### Snippet Not Loading from Tiny URL

1. Check browser console for errors
2. Verify the tiny code is correct
3. Check backend logs for lookup errors
4. Verify the snippet exists in the database

### Cache Issues

1. Clear session storage: `sessionStorage.clear()`
2. Close and reopen the browser tab
3. Check if the tiny code is still valid

## Related Documentation

- [DEVELOPER_FEATURES.md](./DEVELOPER_FEATURES.md) - All developer features
- [docs/API.md](./docs/API.md) - API documentation
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Architecture overview
