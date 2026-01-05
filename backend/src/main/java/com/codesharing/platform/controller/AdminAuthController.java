package com.codesharing.platform.controller;

import com.codesharing.platform.dto.LoginRequestDTO;
import com.codesharing.platform.dto.LoginResponseDTO;
import com.codesharing.platform.entity.AdminUser;
import com.codesharing.platform.security.AdminUserService;
import com.codesharing.platform.security.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for admin dashboard authentication.
 * Handles login requests and JWT token generation.
 * Different from GraphQL AuthController which handles user registration.
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AdminAuthController {

    private final AdminUserService adminUserService;
    private final JwtUtil jwtUtil;

    public AdminAuthController(AdminUserService adminUserService, JwtUtil jwtUtil) {
        this.adminUserService = adminUserService;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Login endpoint: authenticate admin user and return JWT token.
     * 
     * POST /api/auth/login
     * 
     * Request:
     * {
     *   "username": "admin",
     *   "password": "pa55ward"
     * }
     * 
     * Response (200):
     * {
     *   "token": "eyJhbGciOiJIUzUxMiJ9...",
     *   "username": "admin",
     *   "fullName": "System Administrator",
     *   "roleName": "ADMIN",
     *   "expiresIn": 86400000
     * }
     * 
     * Response (401):
     * {
     *   "error": "Invalid username or password"
     * }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest) {
        if (loginRequest == null || loginRequest.getUsername() == null || loginRequest.getPassword() == null) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Username and password are required"));
        }

        AdminUser user = adminUserService.authenticate(loginRequest.getUsername(), loginRequest.getPassword());

        if (user == null) {
            log.warn("Login failed for username: {}", loginRequest.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid username or password"));
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().getRoleType().name());
        Long expiresIn = jwtUtil.getExpirationInMillis();

        LoginResponseDTO response = LoginResponseDTO.builder()
                .token(token)
                .username(user.getUsername())
                .fullName(user.getFullName())
                .roleName(user.getRole().getRoleType().name())
                .expiresIn(expiresIn)
                .build();

        log.info("Login successful for username: {}", user.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * Simple error response DTO.
     */
    public static class ErrorResponse {
        public String error;

        public ErrorResponse(String error) {
            this.error = error;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }
    }
}
