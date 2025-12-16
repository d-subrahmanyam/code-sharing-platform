# 🚀 Code Sharing Platform - HTTPS + WebSocket Ready

## ⚡ Quick Start (5 minutes)

```bash
# Navigate to project
cd c:\Users\subbu\Code\my-poc\code-sharing-platform

# Start all services
docker compose up -d

# Wait 30 seconds for startup
# Then open in browser
# → https://localhost

# Accept the self-signed certificate warning and start coding!
```

## 🌐 Access Points

| Service | URL | Port | Status |
|---------|-----|------|--------|
| **Frontend** | https://localhost | 443 | ✅ Secure |
| **Backend API** | http://localhost:8080/api | 8080 | ✅ Ready |
| **WebSocket** | wss://localhost/api/ws | 443 | ✅ Secure |
| **PostgreSQL** | localhost:5432 | 5432 | ✅ Running |
| **MongoDB** | localhost:27017 | 27017 | ✅ Running |

## ✨ Features

✅ **HTTPS Encryption** - Secure browser connection  
✅ **WebSocket Secure (WSS)** - Real-time updates  
✅ **Typing Indicators** - See who's typing  
✅ **User Presence** - Active user tracking  
✅ **Auto-Save** - Code syncs in real-time  
✅ **URL Sharing** - Short share links  
✅ **Multi-User** - Collaborate in real-time  

## 🧪 Test It

### Browser Test
1. Open **https://localhost**
2. Accept certificate warning (⚠️ Expected for self-signed)
3. Enter your username
4. Start typing code
5. ✅ Should see typing indicators and auto-save

### Multi-User Test
1. Open https://localhost in **incognito window**
2. Enter different username
3. Both windows show users
4. Type in one window
5. ✅ Other window updates in real-time

### WebSocket Test (DevTools)
1. Open DevTools (F12)
2. Go to **Network** tab
3. Filter by **WS**
4. Reload page
5. ✅ Should see `wss://localhost/api/ws`

## 📊 System Status

```bash
# Check all containers
docker compose ps

# View logs
docker compose logs -f frontend
docker compose logs -f backend

# Restart if needed
docker compose restart
```

## 🔧 Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Rebuild after code changes
docker compose build --no-cache
docker compose up -d

# Full clean (remove volumes)
docker compose down -v

# View all logs
docker compose logs

# View specific service
docker compose logs backend
docker compose logs frontend
```

## 🐛 Troubleshooting

### "Browser shows not secure"
✅ **Expected** - Self-signed certificate  
→ Click "Advanced" → "Proceed to localhost"

### WebSocket not connecting
1. ✅ Verify HTTPS (not HTTP)
2. Check DevTools Console for errors
3. Verify backend is running: `docker compose logs backend`
4. Check Network → WS shows `wss://`

### Certificate warning
✅ **Normal** for self-signed cert  
→ Safe to proceed (not exposed to internet)

### Ports already in use
```bash
# Stop other containers using ports
docker ps | grep 443
docker ps | grep 8080
docker stop <container-id>

# Then restart
docker compose up -d
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `certs/cert.pem` | HTTPS certificate |
| `certs/key.pem` | HTTPS private key |
| `docker-compose.yml` | Container setup |
| `frontend/nginx.conf` | HTTPS + WebSocket proxy |
| `backend/src/main/resources/application.yml` | Backend config |

## 📚 Documentation

**Detailed Setup**: [HTTPS_WEBSOCKET_SETUP.md](HTTPS_WEBSOCKET_SETUP.md)  
**Testing Guide**: [WEBSOCKET_COMPLETE_GUIDE.md](WEBSOCKET_COMPLETE_GUIDE.md)  
**Problem & Solution**: [HTTPS_WEBSOCKET_FIX_SUMMARY.md](HTTPS_WEBSOCKET_FIX_SUMMARY.md)  
**Complete Overview**: [HTTPS_WEBSOCKET_COMPLETE.md](HTTPS_WEBSOCKET_COMPLETE.md)  

## 🔐 Security

✅ **HTTPS**: Encrypts browser traffic  
✅ **WSS**: Secure WebSocket protocol  
✅ **TLS 1.2+**: Modern encryption  
✅ **Self-Signed**: Valid for localhost  

## 🎯 Architecture

```
Your Computer
    ↓
HTTPS (Port 443)
    ↓
Frontend (Nginx + React)
    ├→ API → Backend (Port 8080)
    └→ WebSocket → Backend (Port 8080)
    ↓
Docker Network (Internal)
    ↓
Databases
    ├→ PostgreSQL (Port 5432)
    └→ MongoDB (Port 27017)
```

## ✅ Verification

```bash
# All should be "healthy"
docker ps

# All should respond
curl -k https://localhost/index.html
curl http://localhost:8080/api/graphql

# HTTPS should redirect HTTP
curl -i http://localhost
# → 301 Moved Permanently
```

## 📞 Next Steps

1. **Test**: Open https://localhost
2. **Collaborate**: Invite another user (open in incognito)
3. **Share**: Copy short URL and share
4. **Monitor**: Watch DevTools Network tab
5. **Celebrate**: Real-time collaboration works! 🎉

## 🎓 What's New

| Feature | Status | How |
|---------|--------|-----|
| HTTPS | ✅ | Nginx on port 443 |
| WebSocket | ✅ | WSS from browser |
| Typing Indicator | ✅ | Real-time sync |
| User Presence | ✅ | WebSocket broadcast |
| Auto-Save | ✅ | Debounced updates |
| URL Sharing | ✅ | Tiny URL generation |
| Multi-User | ✅ | Real-time collab |

## 💡 Tips

- **Development**: Use https://localhost (same as production)
- **Testing**: Open multiple incognito windows
- **Debugging**: Check DevTools Console and Network
- **Performance**: Monitor WebSocket traffic in Network tab
- **Logs**: Use `docker compose logs -f` to watch events

## ⚙️ Configuration

### Change Certificate
```bash
# Generate new cert (replace cert.pem and key.pem)
openssl req -x509 -newkey rsa:2048 -nodes \
  -out certs/cert.pem -keyout certs/key.pem \
  -days 365 -subj "/CN=localhost"

# Rebuild
docker compose build --no-cache
docker compose up -d
```

### Change Port
Edit `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "443:443"  # Change first number for different port
```

### Change Hostname
Edit `frontend/nginx.conf`:
```nginx
server_name yourdomain.com;  # Change server name
```

## 📈 Performance Notes

- HTTPS overhead: **Only between browser and Nginx**
- Backend communication: **Unencrypted (internal network)**
- WebSocket: **Full encryption (WSS)**
- Result: **Secure and fast** ✅

## 🎉 Summary

Your **code-sharing platform is ready to go!**

✅ HTTPS working  
✅ WebSocket secure  
✅ All features operational  
✅ Database ready  
✅ Real-time collaboration enabled  

**Access: https://localhost**

---

Last Updated: December 16, 2025  
Status: ✅ Production Ready  
Commit: e0bb13f
