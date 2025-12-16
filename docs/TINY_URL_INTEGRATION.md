# Tiny URL Feature - Integration Guide

## Quick Start

### For Users

1. **Create a Snippet** - Use the editor to create a new code snippet
2. **Share It** - Click the "Share" button to generate a tiny code
3. **Send the Link** - Copy the short URL and share with others
4. **Others Access It** - Recipients can click the link to instantly view the snippet

### For Developers

The tiny URL feature is now fully integrated into your Code Sharing Platform. Here's what was added:

## What's New

### Frontend Changes

#### New Route
- `/join/:tinyCode` - Navigate to this route to automatically load a snippet by its tiny code

#### Updated EditorPage Component
- Automatically detects and resolves tiny codes to snippet IDs
- Shows loading/error states during resolution
- Caches resolved mappings in session storage

#### New Utilities
- `lookupSnippetByTinyCode(tinyCode)` - Query backend for snippet ID
- `getTinyCodeMapping(tinyCode)` - Retrieve cached mapping
- `storeTinyCodeMapping(tinyCode, snippetId)` - Cache mapping locally

### Backend Changes

#### New REST Endpoints
```
GET /api/snippets/lookup/{tinyCode}
- Resolves a tiny code to the actual snippet ID
- Returns 404 if not found or expired

GET /api/snippets/{snippetId}/share
- Creates a tiny code for a snippet
- Returns existing code if already created
```

#### New Service Methods
- `getSnippetIdByTinyCode(tinyCode)` - Look up snippet by code
- `createOrGetTinyCode(snippetId, userId)` - Create or retrieve tiny code
- `generateUniqueTinyCode()` - Generate unique 6-char code
- `generateRandomTinyCode()` - Generate random code

## How to Use It

### Backend API

#### Create a Tiny Code

```bash
# Request
GET http://localhost:8080/api/snippets/abc123def456/share?userId=user-456

# Response
{
  "snippetId": "abc123def456",
  "tinyCode": "ABC123"
}
```

#### Look Up by Tiny Code

```bash
# Request
GET http://localhost:8080/api/snippets/lookup/ABC123

# Response
{
  "snippetId": "abc123def456",
  "id": "abc123def456"
}

# 404 Response (if not found)
```

### Frontend Usage

#### In React Components

```typescript
import { lookupSnippetByTinyCode, createSnippetShare, copyToClipboard } from '@/utils/tinyUrl'

// Create a share
const share = createSnippetShare(snippetId)
const success = await copyToClipboard(share.shareableURL)

// Resolve a tiny code (automatic in EditorPage)
const snippetId = await lookupSnippetByTinyCode('ABC123')
```

#### Direct URL Navigation

```
http://localhost:3000/join/ABC123
```

This will automatically load the snippet in the editor.

## Implementation Details

### Tiny Code Format
- 6 characters
- Alphanumeric (A-Z, 0-9)
- Unique (generated until no conflict)
- Example: `ABC123`, `XYZ789`

### Session Storage Cache
- Caches tiny code → snippet ID mappings
- Cleared when browser tab closes
- Reduces API calls within a session

### Error Handling
- Invalid codes: Shows "Snippet not found"
- Expired links: Returns 404
- Network errors: Logged and displayed
- User can navigate back to home

## Testing the Feature

### Manual Test 1: Create and Share

1. Start the app: `docker-compose up`
2. Create a new snippet
3. Save the snippet
4. Copy the tiny URL from the share button
5. Open the URL in a new tab
6. Verify the snippet loads correctly

### Manual Test 2: Direct API Call

```bash
# Terminal 1: Start backend
cd backend
mvn spring-boot:run

# Terminal 2: Test the API
curl "http://localhost:8080/api/snippets/test-id/share?userId=user-123"
curl "http://localhost:8080/api/snippets/lookup/ABC123"
```

### Manual Test 3: URL Navigation

1. Navigate to: `http://localhost:3000/join/ABC123`
2. Check browser console for logs
3. Verify snippet loads or error is shown

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                         │
├─────────────────────────────────────────────────────────┤
│  http://localhost:3000/join/ABC123                     │
│         ↓                                               │
│  EditorPage Component (detects tinyCode param)         │
│         ↓                                               │
│  lookupSnippetByTinyCode('ABC123')                    │
│         ↓                                               │
│  Check Session Storage for cache                       │
│         ↓                                               │
│  If not cached: API Call                              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              Backend Server (Port 8080)                 │
├─────────────────────────────────────────────────────────┤
│  GET /api/snippets/lookup/ABC123                       │
│         ↓                                               │
│  SnippetSharingController.lookupByTinyCode()           │
│         ↓                                               │
│  SnippetService.getSnippetIdByTinyCode()               │
│         ↓                                               │
│  TinyUrlRepository.findByShortCode()                   │
│         ↓                                               │
│  PostgreSQL/MySQL Database                            │
│  tiny_urls table                                       │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### tiny_urls Table

```sql
CREATE TABLE tiny_urls (
  id VARCHAR(36) PRIMARY KEY,
  short_code VARCHAR(6) UNIQUE NOT NULL,
  snippet_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

## Troubleshooting

### Issue: Tiny code not resolving

**Solution:**
1. Check backend logs for errors
2. Verify the tiny code is correct format
3. Check database has the mapping
4. Clear session storage cache

### Issue: Cannot access snippet via tiny URL

**Solution:**
1. Ensure backend is running on port 8080
2. Check VITE_API_BASE_URL environment variable
3. Verify snippet exists in database
4. Check browser console for error messages

### Issue: Cached mapping causing issues

**Solution:**
```javascript
// In browser console
sessionStorage.removeItem('tinyCodeMappings')
window.location.reload()
```

## Next Steps

### Optional Enhancements

1. **Add Share Button UI**
   - Add "Share" button to snippet details page
   - Show tiny code and copy button

2. **Track Share Analytics**
   - Count access per tiny code
   - Display popular snippets

3. **Manage Shares**
   - List all shares created by user
   - Revoke/delete shares
   - Set expiration dates

4. **Custom Codes**
   - Allow users to set custom codes
   - Validate against conflicts

### Integration Points

- **Snippet Detail View**: Add share button
- **Navbar**: Add share option to snippet menu
- **User Dashboard**: List user's active shares
- **Analytics**: Track tiny code usage

## Documentation Files

- **[TINY_URL_FEATURE.md](./TINY_URL_FEATURE.md)** - Complete feature documentation
- **[DEVELOPER_FEATURES.md](./DEVELOPER_FEATURES.md)** - All developer features
- **[docs/API.md](./docs/API.md)** - API reference (update with new endpoints)

## Support

For issues or questions:
1. Check the [TINY_URL_FEATURE.md](./TINY_URL_FEATURE.md) documentation
2. Review browser console logs
3. Check backend logs in Docker: `docker logs backend`
4. Test API endpoints directly with curl
