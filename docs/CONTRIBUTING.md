# Contributing Guidelines

## Code of Conduct

This project adheres to the Contributor Covenant Code of Conduct. By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Write tests for new functionality
5. Submit a pull request

## Development Standards

### Code Style

#### TypeScript/React
- Use TypeScript strict mode
- Follow ESLint configuration
- Format code with Prettier
- Use meaningful variable names
- Add JSDoc comments for functions

#### Java
- Follow Google Java Style Guide
- Use meaningful variable names
- Add JavaDoc comments for public methods
- Keep methods focused and small
- Use dependency injection

### Git Workflow

#### Commit Messages
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/changes
- `chore`: Build/tooling changes

**Example:**
```
feat(editor): add real-time syntax highlighting

Implement Prism.js integration for syntax highlighting
in the code editor with support for multiple languages.

Closes #123
```

### Branching Strategy

```
main (production)
  ├── develop (staging)
  │   ├── feature/user-authentication
  │   ├── feature/real-time-collab
  │   ├── bugfix/editor-sync
  │   └── ...
```

## Testing Requirements

### Frontend
- Unit tests for components (Vitest)
- Integration tests for features (React Testing Library)
- Minimum 80% code coverage

```bash
npm run test:coverage
```

### Backend
- Unit tests for services
- Integration tests with Testcontainers
- Database tests

```bash
mvn test
```

## Pull Request Process

1. **Update Dependencies**: Run `npm install` or `mvn clean install`
2. **Write Tests**: All new code must have tests
3. **Run Linting**: `npm run lint` or `mvn checkstyle:check`
4. **Update Documentation**: Update relevant docs
5. **Create PR**: Link to related issues
6. **Address Feedback**: Respond to review comments

### PR Checklist
- [ ] Code follows style guidelines
- [ ] Tests written and passing
- [ ] No breaking changes
- [ ] Documentation updated
- [ ] Commit messages follow guidelines
- [ ] No merge conflicts

## Documentation

### Code Comments
```typescript
/**
 * Fetches code snippets from the server
 * @param limit - Maximum number of snippets to return
 * @param offset - Number of snippets to skip
 * @returns Promise resolving to array of code snippets
 */
function fetchSnippets(limit: number, offset: number): Promise<CodeSnippet[]> {
  // implementation
}
```

### README Updates
Update relevant sections when:
- Adding new features
- Changing setup process
- Modifying architecture
- Updating dependencies

## Feature Development

### Feature Request Process

1. Check if feature already exists in discussions/issues
2. Create a detailed feature request issue
3. Wait for feedback from maintainers
4. Create a design document (if complex)
5. Implement the feature
6. Submit PR with reference to the issue

### Design Considerations

When implementing new features, consider:
- **Performance**: Will this impact load times or responsiveness?
- **Scalability**: Can this scale with user growth?
- **Security**: Are there security implications?
- **Accessibility**: Is this accessible to all users?
- **Mobile**: Does this work on mobile devices?
- **Testing**: How will this be tested?

## Bug Reporting

### Bug Report Template
```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Do this
2. Then this
3. Finally this

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
If applicable, add screenshots

## Environment
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 120]
- Node Version: [e.g., 20.10.0]
- Java Version: [e.g., 21]

## Additional Context
Any additional context
```

## Performance Guidelines

### Frontend
- Keep bundle size under 500KB
- Lazy load components when possible
- Use React.memo for expensive components
- Optimize database queries
- Debounce rapid events

### Backend
- Use indexed queries
- Implement pagination
- Use connection pooling
- Monitor query performance
- Implement caching where appropriate

## Security Guidelines

1. **Input Validation**: Validate all user inputs
2. **SQL Injection**: Use parameterized queries
3. **XSS Prevention**: Sanitize user input
4. **CSRF Protection**: Implement CSRF tokens
5. **Authentication**: Use JWT with secure storage
6. **Rate Limiting**: Prevent abuse
7. **HTTPS**: Use HTTPS in production
8. **Dependencies**: Keep dependencies updated

## Release Process

1. Update version in package.json and pom.xml
2. Update CHANGELOG.md
3. Create release branch
4. Run full test suite
5. Build production artifacts
6. Create GitHub release
7. Tag release
8. Merge back to main

## Questions or Need Help?

- Check existing documentation
- Review similar implementations
- Ask in discussion forums
- Create an issue with the question tag

Thank you for contributing! 🎉
