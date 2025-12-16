# Docker Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      HOST MACHINE (Windows/Mac/Linux)            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   DOCKER NETWORK                            │ │
│  │        (code-sharing-network - bridge network)              │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐   │ │
│  │  │         Docker Container: Frontend (Nginx)          │   │ │
│  │  │  ┌─────────────────────────────────────────────────┐ │   │ │
│  │  │  │  Node:20-Alpine (Build)                         │ │   │ │
│  │  │  │  │                                               │ │   │ │
│  │  │  │  └─ npm install                                  │ │   │ │
│  │  │  │  └─ npm run build                                │ │   │ │
│  │  │  │  └─ dist/ (built files)                          │ │   │ │
│  │  │  └─────────────────────────────────────────────────┘ │   │ │
│  │  │  ┌─────────────────────────────────────────────────┐ │   │ │
│  │  │  │  Nginx:Alpine (Runtime)                         │ │   │ │
│  │  │  │  │                                               │ │   │ │
│  │  │  │  ├─ Static Files (React App)                     │ │   │ │
│  │  │  │  ├─ API Proxy → http://backend:8080/api         │ │   │ │
│  │  │  │  ├─ WebSocket Proxy → ws://backend:8080         │ │   │ │
│  │  │  │  └─ SPA Routing (/)                              │ │   │ │
│  │  │  └─────────────────────────────────────────────────┘ │   │ │
│  │  │                                                        │   │ │
│  │  │  Port: 80 → Host Port: 80                             │   │ │
│  │  └──────────────────────────────────────────────────────┘   │ │
│  │                          ↕                                    │ │
│  │  ┌──────────────────────────────────────────────────────┐   │ │
│  │  │      Docker Container: Backend (Spring Boot)        │   │ │
│  │  │  ┌─────────────────────────────────────────────────┐ │   │ │
│  │  │  │  Maven:3.9-Eclipse-Temurin-21 (Build)          │ │   │ │
│  │  │  │  │                                               │ │   │ │
│  │  │  │  ├─ mvn clean package                            │ │   │ │
│  │  │  │  └─ target/code-sharing-platform-1.0.0.jar      │ │   │ │
│  │  │  └─────────────────────────────────────────────────┘ │   │ │
│  │  │  ┌─────────────────────────────────────────────────┐ │   │ │
│  │  │  │  Eclipse-Temurin-21-JRE (Runtime)              │ │   │ │
│  │  │  │  │                                               │ │   │ │
│  │  │  │  ├─ Spring Boot 3.2.1                            │ │   │ │
│  │  │  │  ├─ GraphQL API                                  │ │   │ │
│  │  │  │  ├─ WebSocket Handler                            │ │   │ │
│  │  │  │  ├─ Connects to: postgres:5432                   │ │   │ │
│  │  │  │  └─ Connects to: mongodb:27017                   │ │   │ │
│  │  │  └─────────────────────────────────────────────────┘ │   │ │
│  │  │                                                        │   │ │
│  │  │  Port: 8080 → Host Port: 8080                         │   │ │
│  │  └──────────────────────────────────────────────────────┘   │ │
│  │                          ↕                                    │ │
│  │  ┌──────────────────────────────────────────────────────┐   │ │
│  │  │    Docker Container: PostgreSQL 16                  │   │ │
│  │  │  ┌─────────────────────────────────────────────────┐ │   │ │
│  │  │  │  postgres:16-alpine                             │ │   │ │
│  │  │  │  │                                               │ │   │ │
│  │  │  │  ├─ Database: code_sharing_platform              │ │   │ │
│  │  │  │  ├─ User: postgres                               │ │   │ │
│  │  │  │  ├─ Tables:                                       │ │   │ │
│  │  │  │  │  ├─ users                                      │ │   │ │
│  │  │  │  │  └─ tiny_urls                                  │ │   │ │
│  │  │  │  └─ Volume: postgres_data                         │ │   │ │
│  │  │  └─────────────────────────────────────────────────┘ │   │ │
│  │  │                                                        │   │ │
│  │  │  Port: 5432 → Host Port: 5432                         │   │ │
│  │  └──────────────────────────────────────────────────────┘   │ │
│  │                          ↕                                    │ │
│  │  ┌──────────────────────────────────────────────────────┐   │ │
│  │  │       Docker Container: MongoDB 7                   │   │ │
│  │  │  ┌─────────────────────────────────────────────────┐ │   │ │
│  │  │  │  mongo:7-alpine                                 │ │   │ │
│  │  │  │  │                                               │ │   │ │
│  │  │  │  ├─ Database: code_sharing_platform              │ │   │ │
│  │  │  │  ├─ Collections:                                 │ │   │ │
│  │  │  │  │  └─ code_snippets                             │ │   │ │
│  │  │  │  └─ Volume: mongo_data                           │ │   │ │
│  │  │  └─────────────────────────────────────────────────┘ │   │ │
│  │  │                                                        │   │ │
│  │  │  Port: 27017 → Host Port: 27017                       │   │ │
│  │  └──────────────────────────────────────────────────────┘   │ │
│  │                                                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Docker Volumes (Data Persistence)              │ │
│  │                                                               │ │
│  │  ├─ postgres_data          (PostgreSQL data files)           │ │
│  │  ├─ mongo_data             (MongoDB database files)          │ │
│  │  └─ mongo_config           (MongoDB configuration)           │ │
│  │                                                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
USER BROWSER
    │
    ├─────────────────────────────────┐
    │                                 │
    ▼                                 ▼
http://localhost                 (Static Assets)
    │                                 │
    ▼                                 ▼
Nginx (Frontend)                  CSS/JS/Images
    │                                 │
    │ (SPA Routing)                   │
    ├─ /api/* ──────────────────────┐ │
    │                                 │ │
    │ /ws ──────────────────────────┐ │ │
    │                                 │ │ │
    ▼                                 ▼ ▼
Spring Boot Backend (API Server)
    │
    ├─ GraphQL Queries/Mutations
    ├─ REST Endpoints
    └─ WebSocket Real-time Updates
    │
    ├─────────────────────────────────┬─────────────────────────┐
    │                                 │                         │
    ▼                                 ▼                         ▼
PostgreSQL                      MongoDB              WebSocket Clients
    │                               │                         │
    ├─ User Data              ├─ Code Snippets      ├─ Live Editors
    ├─ Authentication         └─ Comments      └─ Notifications
    └─ Tiny URLs
```

## Container Communication

```
Frontend ←→ Backend
(http://frontend:80)  (http://backend:8080)
    │                    │
    ├─ GraphQL API       ├─ Database Drivers
    ├─ REST API          │
    └─ WebSocket         ├─ PostgreSQL JDBC
                         │  (jdbc:postgresql://postgres:5432)
                         │
                         └─ MongoDB Driver
                            (mongodb://mongodb:27017)
```

## Build Process Flow

```
Frontend Build:
┌─────────────────┐
│ Node 20 Alpine  │
│ (Builder Stage) │
└────────┬────────┘
         │
         ├─ npm install
         ├─ npm run build
         └─ dist/ output
                 │
                 ▼
         ┌──────────────┐
         │ Nginx Alpine │
         │ (Runtime)    │
         └──────────────┘

Backend Build:
┌─────────────────────────────┐
│ Maven 3.9                   │
│ Eclipse Temurin 21 (Builder)│
└────────┬────────────────────┘
         │
         ├─ mvn clean install
         ├─ mvn package
         └─ app.jar output
                 │
                 ▼
         ┌────────────────────┐
         │ Temurin 21-JRE     │
         │ Alpine (Runtime)   │
         └────────────────────┘
```

## Service Dependencies

```
Frontend
    │
    └─ Depends on: Backend
           │
           ├─ Depends on: PostgreSQL
           │       │
           │       └─ Health: pg_isready
           │
           └─ Depends on: MongoDB
                   │
                   └─ Health: mongosh ping
```

## Port Mapping

```
Host Machine            Docker Network
─────────────           ──────────────

localhost:80      ───→  frontend:80       (Nginx)
localhost:8080    ───→  backend:8080      (Spring Boot)
localhost:5432    ───→  postgres:5432     (PostgreSQL)
localhost:27017   ───→  mongodb:27017     (MongoDB)
```

## Storage Architecture

```
Named Volumes (Docker Managed):
│
├─ postgres_data
│   │
│   └─ /var/lib/postgresql/data/
│       └─ [database files, indexes, logs]
│
├─ mongo_data
│   │
│   └─ /data/db/
│       └─ [collection files, indexes]
│
└─ mongo_config
    │
    └─ /data/configdb/
        └─ [replica set configuration]

Access: docker volume inspect [volume-name]
```

## Network Architecture

```
Docker Network: code-sharing-network (bridge)
│
├─ frontend (service name: frontend)
│   │
│   └─ DNS: frontend (resolvable within network)
│
├─ backend (service name: backend)
│   │
│   └─ DNS: backend (resolvable within network)
│
├─ postgres (service name: postgres)
│   │
│   └─ DNS: postgres (resolvable within network)
│
└─ mongodb (service name: mongodb)
    │
    └─ DNS: mongodb (resolvable within network)

Advantages:
- Automatic DNS resolution by container name
- Network isolation from host
- Service discovery built-in
- No IP address management needed
```

## Resource Configuration (Production)

```
Service      CPU Limit  CPU Reserve  Memory Limit  Memory Reserve
───────      ─────────  ──────────   ────────────  ──────────────
Frontend     1 CPU      0.5 CPU      512 MB        256 MB
Backend      2 CPU      1 CPU        1 GB          512 MB
PostgreSQL   1 CPU      0.5 CPU      512 MB        256 MB
MongoDB      2 CPU      1 CPU        1 GB          512 MB
```

## Logging Architecture

```
Development:
┌─────────────┐
│ Containers  │
└──────┬──────┘
       │
       └─→ Docker Daemon Logs
           │
           └─→ docker-compose logs
               docker-compose logs -f

Production:
┌─────────────┐
│ Containers  │
└──────┬──────┘
       │
       └─→ JSON File Driver
           │
           ├─ Max Size: 10MB per file
           ├─ Max Files: 3
           │
           └─→ Central Log Collection
               (ELK Stack, Splunk, etc.)
```

## Health Check System

```
PostgreSQL:
├─ Check: pg_isready -U postgres
├─ Interval: 10s
├─ Timeout: 5s
└─ Retries: 5

MongoDB:
├─ Check: mongosh ping
├─ Interval: 10s
├─ Timeout: 5s
└─ Retries: 5

Backend:
├─ Check: curl /api/actuator/health
├─ Interval: 30s
├─ Start Period: 40s
└─ Retries: 3

Frontend:
├─ Check: curl http://localhost/
├─ Interval: 30s
├─ Start Period: 10s
└─ Retries: 3
```

---

This architecture ensures:
- **Isolation**: Services run in isolated containers
- **Networking**: Services communicate via Docker network
- **Persistence**: Data survives container restarts
- **Scalability**: Easy to add more instances
- **Monitoring**: Health checks ensure reliability
