# Setup Instructions

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18 or higher ([Download](https://nodejs.org/))
- **Java JDK**: Version 21 ([Download](https://www.oracle.com/java/technologies/downloads/))
- **Maven**: Version 3.8 or higher ([Download](https://maven.apache.org/download.cgi))
- **PostgreSQL**: Version 14 or higher ([Download](https://www.postgresql.org/download/))
- **MongoDB**: Version 6 or higher ([Download](https://www.mongodb.com/try/download/community))
- **Git**: Latest version ([Download](https://git-scm.com/))

## Initial Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd code-sharing-platform
```

### 2. Database Setup

#### PostgreSQL Setup
```bash
# Create database
createdb code_sharing_platform

# Create user (optional)
createuser codesharing_user
ALTER USER codesharing_user WITH PASSWORD 'password';
ALTER USER codesharing_user CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE code_sharing_platform TO codesharing_user;
```

#### MongoDB Setup
```bash
# Start MongoDB (if using local installation)
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

### 3. Environment Configuration

Create `.env` files for both frontend and backend:

#### Backend Environment (backend/.env)
```properties
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/code_sharing_platform
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres

# MongoDB
SPRING_DATA_MONGODB_URI=mongodb://localhost:27017/code_sharing_platform

# JWT
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_EXPIRATION=86400000

# Server
SERVER_PORT=8080
SERVER_SERVLET_CONTEXT_PATH=/api
```

#### Frontend Environment (frontend/.env)
```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080
```

### 4. Backend Setup

```bash
cd backend

# Install dependencies
mvn clean install

# Run migrations (if applicable)
mvn flyway:migrate

# Start the server
mvn spring-boot:run
```

Backend will be available at: `http://localhost:8080`

### 5. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## Development Workflow

### Running Tests

**Backend:**
```bash
cd backend
mvn test
```

**Frontend:**
```bash
cd frontend
npm run test
```

### Code Quality

**Frontend Linting:**
```bash
cd frontend
npm run lint
```

**Type Checking:**
```bash
cd frontend
npm run type-check
```

### Building for Production

**Backend:**
```bash
cd backend
mvn clean package
java -jar target/code-sharing-platform-1.0.0.jar
```

**Frontend:**
```bash
cd frontend
npm run build
# Output will be in dist/ directory
```

## Storybook Development

View and develop components in isolation:

```bash
cd frontend
npm run storybook
```

Visit `http://localhost:6006` to see component stories.

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify credentials
psql -U postgres -d code_sharing_platform
```

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongostat --host localhost:27017

# Test connection
mongo --host localhost:27017
```

### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Find process using port 5173
lsof -i :5173

# Kill process
kill -9 <PID>
```

### Node Modules Issues
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Maven Issues
```bash
# Clear Maven cache
mvn clean

# Update dependencies
mvn dependency:resolve
```

## Docker Setup (Optional)

Build and run using Docker:

```bash
# Build images
docker-compose build

# Start services
docker-compose up

# Services will be available at:
# Frontend: http://localhost:5173
# Backend: http://localhost:8080
# PostgreSQL: localhost:5432
# MongoDB: localhost:27017
```

## IDE Setup

### VS Code
Install recommended extensions:
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- GraphQL

### IntelliJ IDEA
- Enable Spring Boot support
- Install GraphQL plugin
- Configure Maven
- Set JDK to Java 21

## Next Steps

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design details
2. Read [API.md](./API.md) for API documentation
3. Check [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
4. Start developing features in feature branches

## Support

For issues and questions:
1. Check the documentation files
2. Review existing GitHub issues
3. Create a new issue with detailed information
