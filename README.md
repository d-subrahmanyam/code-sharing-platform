# Code Sharing Platform

A real-time collaborative code-sharing platform similar to codefile.io, enabling users to share, edit, and collaborate on code snippets with syntax highlighting and threaded discussions.

## Features

- **Real-time Collaboration**: Multiple users can edit code snippets simultaneously with WebSocket support
- **Syntax Highlighting**: Support for multiple programming languages using Prism.js
- **User Authentication**: JWT-based authentication for registered users with anonymous mode support
- **Code Sharing**: Generate unique URLs for easy sharing of code snippets
- **Discussions**: Comment on code snippets with threaded discussion support
- **Tagging & Search**: Robust search functionality with tags and programming language filters
- **Notifications**: Real-time notifications for comments and collaboration changes
- **Responsive Design**: Fully responsive UI for desktop and mobile devices

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux with Saga middleware
- **HTTP Client**: Axios
- **Real-time Communication**: WebSocket
- **Syntax Highlighting**: Prism.js
- **Component Library**: Storybook
- **Testing**: Vitest, React Testing Library

### Backend
- **Framework**: Spring Boot 3.x with Spring WebFlux
- **Build Tool**: Maven
- **Databases**: 
  - PostgreSQL (User authentication, profile data, tiny URLs)
  - MongoDB (Code snippets, user data)
- **API**: GraphQL
- **Authentication**: Spring Security with JWT
- **WebSocket**: Spring WebSocket
- **Virtual Threads**: Project Loom (Java 21+)
- **Logging**: Logback with structured logging
- **Testing**: JUnit 5, Testcontainers

## Project Structure

```
code-sharing-platform/
├── frontend/                 # React + Vite frontend application
│   ├── src/
│   │   ├── components/      # React components with Storybook
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store, actions, reducers, sagas
│   │   ├── api/            # Axios API client
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript types and interfaces
│   │   ├── utils/          # Utility functions
│   │   └── App.tsx         # Main App component
│   ├── public/             # Static assets
│   ├── storybook/          # Storybook configuration
│   ├── vite.config.ts      # Vite configuration
│   ├── tsconfig.json       # TypeScript configuration
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── package.json        # Frontend dependencies
│
├── backend/                # Spring Boot backend application
│   ├── src/
│   │   ├── main/java/com/codesharing/
│   │   │   ├── config/     # Configuration classes
│   │   │   ├── controller/ # GraphQL and REST controllers
│   │   │   ├── service/    # Business logic services
│   │   │   ├── repository/ # Data access layer
│   │   │   ├── entity/     # JPA entities
│   │   │   ├── dto/        # Data transfer objects
│   │   │   ├── security/   # JWT and security config
│   │   │   ├── websocket/  # WebSocket handlers
│   │   │   ├── util/       # Utility classes
│   │   │   └── CodeSharingPlatformApplication.java
│   │   └── test/java/      # Test classes
│   ├── pom.xml             # Maven configuration
│   └── application.yml     # Spring Boot configuration
│
├── docs/                   # Documentation
│   ├── API.md             # API documentation
│   ├── ARCHITECTURE.md    # Architecture documentation
│   ├── SETUP.md           # Setup instructions
│   └── CONTRIBUTING.md    # Contributing guidelines
│
├── .github/               # GitHub configuration
│   └── copilot-instructions.md
│
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Getting Started

### Prerequisites
- Node.js 18+ (for frontend)
- Java 21+ (for backend)
- Maven 3.8+
- MongoDB
- PostgreSQL
- Git

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd code-sharing-platform
```

2. Setup Backend:
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

3. Setup Frontend:
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173` (frontend) and backend API at `http://localhost:8080`

## Development

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

### Building for Production

**Backend:**
```bash
cd backend
mvn clean package
```

**Frontend:**
```bash
cd frontend
npm run build
```

## API Documentation

See [docs/API.md](docs/API.md) for detailed API documentation.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## Contributing

Please read [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create an issue in the GitHub repository.
