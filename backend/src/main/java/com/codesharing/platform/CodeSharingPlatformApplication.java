package com.codesharing.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the Code Sharing Platform application.
 * 
 * This Spring Boot application provides a real-time collaborative
 * code-sharing platform with features including:
 * - Real-time code collaboration via WebSocket
 * - JWT-based authentication
 * - GraphQL API for data queries and mutations
 * - Integration with PostgreSQL and MongoDB databases
 */
@SpringBootApplication
public class CodeSharingPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(CodeSharingPlatformApplication.class, args);
    }

}
