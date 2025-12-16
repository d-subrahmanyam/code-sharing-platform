# Docker Quick Reference

A quick reference guide for Docker and Docker Compose commands for the Code Sharing Platform.

## Quick Start

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Using Helper Scripts

### Linux/Mac
```bash
chmod +x docker-helper.sh
./docker-helper.sh up
./docker-helper.sh logs
./docker-helper.sh down
```

### Windows
```cmd
docker-helper.bat up
docker-helper.bat logs
docker-helper.bat down
```

## Common Docker Compose Commands

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start all services in background |
| `docker-compose down` | Stop all services |
| `docker-compose ps` | List running containers |
| `docker-compose logs` | View logs from all services |
| `docker-compose logs -f backend` | Follow backend logs |
| `docker-compose build` | Build all images |
| `docker-compose build backend` | Build backend image |
| `docker-compose restart` | Restart all services |
| `docker-compose restart backend` | Restart backend service |
| `docker-compose pull` | Pull latest base images |

## Service Management

### Start Services
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### View Status
```bash
docker-compose ps
docker-compose logs
docker-compose logs --tail=50 backend
```

### Restart Services
```bash
docker-compose restart              # All services
docker-compose restart backend       # Backend only
docker-compose restart frontend      # Frontend only
```

### Stop Services
```bash
docker-compose stop                  # Stop containers (keep them)
docker-compose down                  # Stop and remove containers
docker-compose down -v               # Stop, remove, and delete volumes
```

## Database Access

### PostgreSQL
```bash
# Via docker-compose
docker-compose exec postgres psql -U postgres -d code_sharing_platform

# SQL Commands
\dt                    # List tables
\d table_name         # Describe table
SELECT * FROM users;  # Query example
\q                    # Quit
```

### MongoDB
```bash
# Via docker-compose
docker-compose exec mongodb mongosh

# MongoDB Commands
show databases         # List databases
use code_sharing_platform
db.code_snippets.find()  # Query example
db.code_snippets.count() # Count documents
```

## Debugging

### View Service Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
docker-compose logs mongodb

# Follow in real-time
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100

# With timestamps
docker-compose logs --timestamps
```

### Interactive Shell
```bash
# Backend (Java container)
docker-compose exec backend sh

# Frontend (Nginx container)
docker-compose exec frontend sh

# PostgreSQL
docker-compose exec postgres sh

# MongoDB
docker-compose exec mongodb sh
```

### Health Checks
```bash
# Check container health
docker-compose ps

# Test connectivity
docker-compose exec backend curl http://localhost:8080/api/actuator/health
```

## Building and Rebuilding

### Build Images
```bash
# Build all
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build without cache
docker-compose build --no-cache
```

### Rebuild from Scratch
```bash
# Clean up and rebuild
docker-compose down -v --rmi all
docker-compose up -d --build
```

## Network and Port Management

### Port Mappings
| Service | External Port | Internal Port | Purpose |
|---------|---|---|---|
| Frontend | 80 | 80 | HTTP |
| Backend | 8080 | 8080 | API Server |
| PostgreSQL | 5432 | 5432 | Database |
| MongoDB | 27017 | 27017 | NoSQL Database |

### Test Port Availability
```bash
# Check if port is in use
netstat -tulpn | grep :8080     # Linux
lsof -i :8080                   # Mac
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess  # Windows

# Change port in docker-compose.yml if needed
```

## Volume Management

### View Volumes
```bash
docker volume ls
docker volume inspect code-sharing-platform_postgres_data
```

### Clean Up Volumes
```bash
# Remove unused volumes
docker volume prune

# Remove specific volume
docker volume rm code-sharing-platform_postgres_data
```

## Resource Monitoring

### Resource Usage
```bash
docker-compose stats
docker stats
```

### Disk Usage
```bash
docker system df
docker system prune -a
```

## Troubleshooting

### Restart Everything
```bash
docker-compose restart
```

### Full Reset
```bash
docker-compose down -v --rmi all
docker-compose up -d --build
```

### Check Configuration
```bash
docker-compose config
docker-compose config | grep image
```

### View Service Environment
```bash
docker-compose exec backend env
```

### Test Service Connectivity
```bash
# From backend to PostgreSQL
docker-compose exec backend nc -zv postgres 5432

# From backend to MongoDB
docker-compose exec backend nc -zv mongodb 27017

# From frontend to backend
docker-compose exec frontend curl -I http://backend:8080/api
```

## Production Commands

### Deploy with Environment Variables
```bash
cp .env.example .env
# Edit .env with production values
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Update Services
```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

### Backup Databases

#### PostgreSQL
```bash
docker-compose exec postgres pg_dump -U postgres code_sharing_platform > backup.sql
```

#### MongoDB
```bash
docker-compose exec mongodb mongodump --out=/tmp/dump
docker cp code-sharing-mongodb:/tmp/dump ./backup
```

### View Logs for Debugging
```bash
docker-compose logs --tail=200 backend
docker-compose logs --timestamps | grep error
```

## Performance Tips

1. **Use named volumes** for persistent data
2. **Set resource limits** in production
3. **Use health checks** to prevent container restarts
4. **Configure proper logging drivers** to prevent disk space issues
5. **Use image layers efficiently** to reduce image sizes

## Getting Help

```bash
# Docker Compose help
docker-compose --help
docker-compose [command] --help

# View Docker version
docker --version
docker-compose --version
```

## Common Issues

### "Port already in use"
```bash
# Find process using port
lsof -i :8080

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### "Database connection failed"
```bash
# Check database is running
docker-compose ps

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready
```

### "Out of memory"
```bash
# Check resource limits
docker stats

# Free up space
docker system prune -a
docker volume prune

# Increase Docker Desktop memory allocation
```

### "Image not found"
```bash
# Rebuild images
docker-compose build

# Pull base images
docker-compose pull
```

For more detailed information, see [docs/DOCKER.md](DOCKER.md)
