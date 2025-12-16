# Docker Development Setup

This guide explains how to use Docker and Docker Compose to run the Code Sharing Platform.

## Prerequisites

- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)
- Git

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd code-sharing-platform
```

### 2. Build and Start Services
```bash
# Build images and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 3. Access the Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8080/api
- **GraphQL Playground**: http://localhost:8080/api/graphiql
- **PostgreSQL**: localhost:5432
- **MongoDB**: localhost:27017

### 4. Stop Services
```bash
# Stop all containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Docker Compose Services

### postgres
- **Image**: postgres:16-alpine
- **Port**: 5432
- **Database**: code_sharing_platform
- **Username**: postgres
- **Password**: postgres
- **Volume**: postgres_data

### mongodb
- **Image**: mongo:7-alpine
- **Port**: 27017
- **Database**: code_sharing_platform
- **Username**: root
- **Password**: password
- **Volume**: mongo_data

### backend
- **Build**: Multi-stage build with Maven
- **Port**: 8080
- **Framework**: Spring Boot
- **JDK**: 21

### frontend
- **Build**: Multi-stage build with Node and Nginx
- **Port**: 80
- **Framework**: React + Vite
- **Server**: Nginx

## Common Docker Commands

### View Running Containers
```bash
docker-compose ps
```

### Execute Commands in Container
```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell (nginx)
docker-compose exec frontend sh

# PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d code_sharing_platform

# MongoDB CLI
docker-compose exec mongodb mongosh
```

### View Container Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend

# Follow logs
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100
```

### Rebuild Images
```bash
# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Rebuild all services
docker-compose build

# Rebuild and start
docker-compose up -d --build
```

### Remove Everything
```bash
# Stop and remove containers
docker-compose down

# Stop, remove containers, and volumes
docker-compose down -v

# Remove images too
docker-compose down -v --rmi all
```

## Development Workflow

### Hot Reload (Development)

For development with hot reload, you can mount local volumes:

```yaml
# Modify docker-compose.yml
services:
  backend:
    volumes:
      - ./backend/src:/app/src
      - ./backend/pom.xml:/app/pom.xml
```

Then run:
```bash
docker-compose up -d
```

The backend will detect changes and reload.

### Debugging

#### Backend Debugging
```yaml
# Add to docker-compose.yml backend service
environment:
  JAVA_TOOL_OPTIONS: -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005

ports:
  - "5005:5005"
```

Then connect your IDE debugger to localhost:5005

#### View Database
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d code_sharing_platform

# Connect to MongoDB
docker-compose exec mongodb mongosh
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs backend

# Rebuild from scratch
docker-compose down -v --rmi all
docker-compose up -d --build
```

### Port Already in Use
```bash
# Find process using port
lsof -i :8080
lsof -i :80
lsof -i :5432
lsof -i :27017

# Stop the process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Database Connection Issues
```bash
# Check database is running
docker-compose ps

# Check logs
docker-compose logs postgres
docker-compose logs mongodb

# Test connection
docker-compose exec postgres pg_isready
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### Out of Memory
```bash
# Increase Docker Desktop resources:
# Mac: Preferences > Resources > Memory
# Windows: Settings > Resources > Memory
# Linux: Not applicable (uses system memory)
```

## Production Deployment

For production, consider:

1. **Use environment variables**:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

2. **Health Checks**: Already configured in docker-compose.yml

3. **Resource Limits**:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '1'
          memory: 512M
```

4. **Logging**:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

5. **Restart Policy**:
```yaml
restart_policy:
  condition: on-failure
  delay: 5s
  max_attempts: 3
  window: 120s
```

## Docker Networking

Services communicate through the `code-sharing-network` bridge network:

- Frontend → Backend: http://backend:8080
- Backend → PostgreSQL: jdbc:postgresql://postgres:5432
- Backend → MongoDB: mongodb://root:password@mongodb:27017

## Performance Tips

1. **Multi-stage Builds**: Reduces image size
2. **Alpine Images**: Smaller base images
3. **Layer Caching**: Order Dockerfile commands by frequency of change
4. **Volume Mounts**: Use bind mounts for development, named volumes for databases
5. **Health Checks**: Ensure services are ready before starting dependents

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/reference/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)
