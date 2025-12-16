# Code Sharing Platform - Copilot Instructions

## Project Overview
Building a real-time collaborative code-sharing platform with React frontend and Spring Boot backend.

## Key Technologies
- Frontend: React, TypeScript, Vite, Tailwind CSS, Redux-Saga, Axios
- Backend: Spring Boot, Java 21, Maven, PostgreSQL, MongoDB, GraphQL, JWT, WebSocket

## Development Guidelines

### Code Style
- Use TypeScript strict mode
- Follow ESLint and Prettier configurations
- Java code should follow Google Java Style Guide
- Meaningful commit messages with clear descriptions

### Testing
- Write unit tests for all new features
- Aim for 80%+ code coverage
- Use Vitest for frontend, JUnit 5 for backend
- Create integration tests for critical paths

### Documentation
- Write clear comments for complex logic
- Document all public APIs
- Update README.md for feature additions
- Create Storybook stories for React components

### Security
- Validate all user inputs
- Use HTTPS for all communications
- Implement rate limiting
- Follow OWASP guidelines
- Secure JWT token handling

### Performance
- Optimize database queries
- Implement caching strategies
- Use React.memo and useMemo appropriately
- Monitor and optimize bundle sizes

## Workspace Structure
- Project root: `c:\Users\subbu\Code\my-poc\code-sharing-platform`
- Frontend: `frontend/` directory
- Backend: `backend/` directory
- Documentation: `docs/` directory

## Git Workflow
- Create feature branches from main
- Use meaningful commit messages
- Submit pull requests for review
- Merge after approval

## Next Steps
1. Initialize Git repository
2. Set up backend Maven project
3. Set up frontend Vite project
4. Create configuration files
5. Implement core features
