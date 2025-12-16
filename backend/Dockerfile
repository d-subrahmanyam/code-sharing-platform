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

# Install curl and openssl for health checks and cert conversion
RUN apk add --no-cache curl openssl

# Copy self-signed certificates
COPY certs/ /app/certs/

# Create PKCS12 keystore from PEM certificates
RUN openssl pkcs12 -export -in /app/certs/cert.pem -inkey /app/certs/key.pem \
    -out /app/certs/keystore.p12 -name localhost -passout pass:changeit

# Copy JAR from builder
COPY --from=builder /app/target/code-sharing-platform-*.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/api/actuator/health || exit 1

# Run the application
CMD ["java", "-XX:+UseStringDeduplication", "-XX:+UseCompressedOops", "-jar", "app.jar"]
