# Backend Dockerfile - Multi-stage build
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom.xml and download dependencies
COPY backend/pom.xml .
RUN mvn dependency:resolve

# Copy source code
COPY backend/src ./src

# Build the application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install netcat for health checks
RUN apk add --no-cache curl netcat-openbsd

# Copy JAR from builder
COPY --from=builder /app/target/code-sharing-platform-*.jar app.jar

# Expose port
EXPOSE 8080

# Health check - simplified check to just verify port is listening
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD nc -z 127.0.0.1 8080 || exit 1

# Run the application
CMD ["java", "-XX:+UseStringDeduplication", "-XX:+UseCompressedOops", "-jar", "app.jar"]
