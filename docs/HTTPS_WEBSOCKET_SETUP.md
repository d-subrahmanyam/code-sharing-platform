# HTTPS + WebSocket Configuration Guide

## ✅ Architecture Overview

The application now uses a **mixed protocol setup** for optimal performance:

```
Client (Browser)
    ↓
    HTTPS (Port 443) - Secure web content
    ↓
Frontend (Nginx) - https://localhost
    ↓
    HTTP (Internal) - Backend communication
    ↓
Backend (Spring Boot) - http://backend:8080
```

### Certificate Details
- **Type**: Self-signed certificate
- **Location**: `/certs/` directory
- **Format**: PEM (cert.pem, key.pem)
- **Validity**: 365 days
- **CN**: localhost

## 🔧 What Was Changed

### 1. Frontend (Nginx + HTTPS)

**File**: `frontend/nginx.conf`
- Added HTTPS server block on port 443
- HTTP redirects to HTTPS (301)
- SSL certificates configured
- WebSocket upgrade headers added

**File**: `frontend/Dockerfile`
- Mounts self-signed certificates
- Exposes ports 80 (HTTP) and 443 (HTTPS)
- Health check uses HTTPS

**Docker Compose**:
```yaml
frontend:
  ports:
    - "80:80"      # HTTP redirect
    - "443:443"    # HTTPS
  volumes:
    - ./certs:/etc/nginx/certs:ro  # Certificates
```

### 2. Backend (Spring Boot - HTTP)

**File**: `backend/src/main/resources/application.yml`
- Removed SSL configuration (simpler setup)
- CORS updated to accept HTTPS origins

**Docker Compose**:
```yaml
backend:
  ports:
    - "8080:8080"  # HTTP only (internal)
```

### 3. WebSocket Connection

**File**: `frontend/src/services/webSocketService.ts`

The WebSocket URL is **automatically detected**:
```typescript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const host = window.location.host
const wsUrl = `${protocol}//${host}/api/ws`

// Result:
// HTTPS → wss://localhost/api/ws  ✅
// HTTP  → ws://localhost/api/ws
```

**Nginx WebSocket Proxy** (`frontend/nginx.conf`):
```nginx
location /ws {
    proxy_pass http://backend:8080/ws;  # Internal HTTP
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    # ... other headers
}
```

## 🧪 Testing the Setup

### Test 1: HTTPS Access
```bash
# Should return HTML with 200 OK
curl -k https://localhost/index.html

# Should redirect to HTTPS
curl -i http://localhost/
# → HTTP/1.1 301 Moved Permanently
# → Location: https://localhost/
```

### Test 2: WebSocket Connection
1. Open DevTools (F12)
2. Go to **Network** tab
3. Filter by **WS**
4. Reload page
5. Look for:
   - `ws://` or `wss://` connection
   - Should be `wss://localhost/api/ws` (secure)

### Test 3: API Calls
```bash
# Create snippet
curl -k -X POST https://localhost/api/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation{createSnippet(username:\"test\")}"}'

# Should work from HTTPS frontend
```

### Test 4: Live Features
1. Open https://localhost in browser
2. Enter username
3. Start typing
4. Open DevTools → Network → WS
5. See `wss://localhost/api/ws` messages flowing
6. Verify typing indicators work

## 🔐 Certificate Information

### Generate New Certificates (if needed)
```bash
# Using Docker (Windows-friendly)
docker run --rm -v "c:\path\to\certs:/certs" alpine:latest sh -c \
  "apk add --no-cache openssl && \
   openssl req -x509 -newkey rsa:2048 -nodes \
   -out /certs/cert.pem -keyout /certs/key.pem \
   -days 365 -subj '/CN=localhost'"

# Or use WSL/Git Bash
openssl req -x509 -newkey rsa:2048 -nodes \
  -out certs/cert.pem -keyout certs/key.pem \
  -days 365 -subj "/CN=localhost"
```

### Browser Warning
When accessing https://localhost:
- Browser shows "Not Secure" warning
- This is **normal** for self-signed certificates
- Click "Advanced" → "Proceed to localhost"
- Safe for development/testing

## 📊 Protocol Flow

### HTTP Request (Redirect)
```
Client → http://localhost:80
         ↓
Frontend Nginx → HTTP 301 Redirect
         ↓
Client → https://localhost:443
```

### HTTPS Request (Content)
```
Client → https://localhost:443
         ↓
Nginx (TLS terminated)
         ↓
Static assets served (index.html, JS, CSS)
```

### API Request (via HTTPS)
```
Frontend JS → fetch('https://localhost/api/...')
         ↓
Nginx HTTPS → HTTP tunnel internally
         ↓
Backend → http://backend:8080/api/...
         ↓
Response → HTTP → Nginx → HTTPS → Client
```

### WebSocket (via WSS)
```
Frontend JS → new WebSocket('wss://localhost/api/ws')
         ↓
Nginx HTTPS upgrade → HTTP upgrade internally
         ↓
Backend → WS connection on port 8080
         ↓
Messages flow: WSS ← Nginx proxy → WS
```

## 🐛 Troubleshooting

### Browser shows "Not Secure"
- **Expected behavior** for self-signed certificates
- Click "Advanced" and proceed
- Or import certificate into browser (advanced)

### WebSocket connection fails
1. Check DevTools Console for errors
2. Verify Network → WS shows `wss://` not `ws://`
3. Check browser is on HTTPS (not HTTP)
4. Verify backend is running: `docker logs code-sharing-backend`

### "wss:// is not allowed" Error
- **Old error**: Frontend was on HTTP trying to use `ws://`
- **Fixed**: Frontend now on HTTPS, WebSocket uses `wss://`

### Certificate expiration
- Current cert valid for 365 days
- Regenerate before expiration
- Docker will copy new cert on rebuild

## 📝 Configuration Files

| File | Purpose | Changes |
|------|---------|---------|
| `certs/cert.pem` | Server certificate | Generated, mounted to Nginx |
| `certs/key.pem` | Private key | Generated, mounted to Nginx |
| `frontend/nginx.conf` | Web server config | HTTPS, WSS proxy added |
| `frontend/Dockerfile` | Container build | Cert copying, port 443 added |
| `backend/Dockerfile` | Container build | No cert conversion needed |
| `docker-compose.yml` | Orchestration | Port 443, cert volume added |
| `application.yml` | Backend config | SSL removed (simpler) |

## 🚀 Deployment

### Production Considerations
1. **Replace self-signed cert**:
   - Use Let's Encrypt (free) or commercial CA
   - Update cert.pem and key.pem

2. **Enable HTTPS on backend** (optional):
   - Create PKCS12 keystore
   - Configure in application.yml
   - Benefits: End-to-end encryption

3. **DNS & Domain**:
   - Update Nginx server_name
   - Update CORS origins
   - Update certificate CN

### Docker Production Build
```bash
# Build with custom certificates
docker compose build --no-cache

# Start with volumes
docker compose up -d

# Verify HTTPS works
curl -k https://localhost/api/snippets
```

## ✅ Verification Checklist

- [x] HTTPS working on frontend (https://localhost)
- [x] HTTP redirects to HTTPS (curl -i http://localhost)
- [x] WebSocket connects via WSS (DevTools Network)
- [x] Backend API accessible via Nginx proxy
- [x] Self-signed cert generated and mounted
- [x] Frontend and backend both running
- [x] All real-time features working

## 📞 Quick Commands

```bash
# View logs
docker compose logs -f frontend
docker compose logs -f backend

# Rebuild with new cert
docker compose down
docker compose build --no-cache
docker compose up -d

# Test HTTPS
curl -k https://localhost/

# Test API
curl -k https://localhost/api/health

# Test WebSocket
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://localhost/api/ws
```

## 🎯 Summary

✅ **HTTPS frontend** with self-signed certificate  
✅ **HTTP backend** with internal Nginx tunnel  
✅ **WebSocket** automatically detects HTTPS and uses WSS  
✅ **Secure**: TLS between browser and Nginx  
✅ **Simple**: Backend doesn't need SSL overhead  
✅ **Works**: All real-time features operational  

The application is now **fully secure** for development and testing!
