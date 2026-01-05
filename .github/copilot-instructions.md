# Code Sharing Platform - Copilot Instructions

## Architecture Overview

**Monorepo structure**: Backend (Spring Boot + Java 21) and Frontend (React + Vite) in single repo with docker-compose orchestration.

**Critical data flows**:
1. Frontend sends requests via Axios to REST APIs (`/api/*`) and GraphQL mutations
2. WebSocket (via SockJS/Stomp) handles real-time collaboration on code snippets
3. JWT authentication flows through Spring Security; token stored in localStorage
4. PostgreSQL: User auth, sessions, tiny URLs; MongoDB: Code snippets, user data

**Why this split**: PostgreSQL for relational auth data, MongoDB for flexible snippet/comment documents.

## Key Development Workflows

### Local Development
```bash
# From root: code-sharing-platform/
docker-compose up -d --build  # Starts postgres, mongodb, backend, frontend

# Frontend dev server (hot-reload):
cd frontend && npm run dev  # Runs on http://localhost:5173

# Backend: Docker runs with volume mount for src/ changes (auto-compile)
```

### Database Debugging
- PostgreSQL: `psql -h localhost -U postgres code_sharing_platform` (pwd: postgres)
- MongoDB: `mongosh --authenticationDatabase admin -u root -p password localhost/code_sharing_platform`

### Critical Issue Pattern
Recent fixes show this common issue: Frontend validates IDs too strictly (blocks requests with "new" IDs for newly created snippets). **Solution**: Frontend sends requests, backend handles gracefully. See `CODE_CHANGES_DETAILED.md` for pattern on how backend/frontend negotiate incomplete data states.

## Project-Specific Conventions

### Frontend (React + Redux-Saga)
- **State management**: Redux slices in `frontend/src/store/slices/` (uiSlice, snippetSlice, etc.)
- **API calls**: Use Redux-Saga middleware (`frontend/src/store/sagas/`) for async operations, not direct in components
- **Hooks pattern**: Custom hooks wrap saga dispatches (`frontend/src/hooks/useEditorLock.ts`, etc.) - always use these, don't call API directly
- **Error handling**: Dispatch `SHOW_NOTIFICATION` action for UI errors; check `frontend/src/store/actionTypes.ts` for all action names
- **Typescript strict**: All files use strict mode; no `any` types except unavoidable cases

### Backend (Spring Boot + Java 21)
- **Config classes**: `backend/src/main/java/com/codesharing/platform/config/` - includes SecurityConfig (JWT), WebSocketConfig, DataInitializer
- **WebSocket endpoints**: Classes in `websocket/` folder handle real-time updates; uses Spring's `@SendTo` for broadcasting
- **Database layer**: JPA for PostgreSQL (`repository/`), MongoDB documents in `entity/` and Spring Data repositories
- **Service layer**: Business logic in `service/` - always inject services, avoid direct repository access in controllers
- **DTOs vs Entities**: Use DTOs for API responses (in `dto/`); entities are only for persistence
- **Virtual Threads**: Project Loom (Java 21) - backend uses virtual threads; no thread pool tuning needed

## Critical Code Patterns

### Adding a New Endpoint
1. Create DTO in `backend/.../dto/` (request/response models)
2. Add method to `repository/` if new DB query needed
3. Implement in `service/` class with business logic
4. Expose via `@RestController` or WebSocket handler in `websocket/`
5. Frontend: Add Redux action/saga in `store/sagas/` and dispatch from hook

### Frontend-Backend ID State Mismatch
When creating resources (snippets, sessions), **IDs may not be known until backend persistence**:
- Frontend: Use placeholder IDs ("new", "temp_123") initially
- Backend: Validate IDs gracefully; return actual ID in response
- Frontend hook: Update store with real ID after response succeeds

### Testing
- **Frontend**: Vitest in `frontend/src/test/` - test sagas, reducers, selectors
- **Backend**: JUnit 5 in `backend/src/test/` - use Testcontainers for DB tests
- Test Database: No separate DB - Testcontainers spins up temp postgres/mongodb

## Security & Authentication

**JWT flow**: 
1. Login endpoint issues JWT (stored in localStorage)
2. All requests include `Authorization: Bearer <token>` (Axios interceptor handles this)
3. Spring Security validates; throws 401 if invalid
4. Admin role checks in `AdminController.java` - use `@PreAuthorize` annotation

**Input validation**: Every controller validates inputs; Spring validates @Valid DTOs automatically.

## Debugging Tips

- **Docker container logs**: `docker logs code-sharing-backend` (container name from docker-compose)
- **WebSocket issues**: Check `WebSocketConfig.java` endpoint paths; frontend connects to `/ws`
- **ID generation**: See `DataInitializer.java` for initial data seeding
- **Admin dashboard**: Credentials auto-created as admin@example.com / admin123 (see DataInitializer)

## Helpful Documentation Files

- `docs/API.md` - REST/GraphQL endpoints
- `ADMIN_QUICK_REFERENCE.md` - Admin credentials & demo data
- `CODE_CHANGES_DETAILED.md` - Example of fixing ID validation issues
- `DOCUMENTATION_INDEX.md` - Full docs organization
