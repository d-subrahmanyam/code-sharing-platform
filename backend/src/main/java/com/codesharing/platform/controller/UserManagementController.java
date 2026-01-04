package com.codesharing.platform.controller;

import com.codesharing.platform.dto.*;
import com.codesharing.platform.security.AdminUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for user management endpoints.
 * Provides endpoints for creating, listing, and managing admin users.
 * Requires ADMIN role for all operations except authentication.
 */
@Slf4j
@RestController
@RequestMapping("/admin/users")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class UserManagementController {

    private final AdminUserService adminUserService;

    public UserManagementController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    /**
     * Create a new admin user.
     * Requires ADMIN role.
     * POST /api/admin/users
     */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody CreateAdminUserDTO createUserDTO, HttpServletRequest request) {
        String role = (String) request.getAttribute("role");

        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Only ADMIN users can create new users"));
        }

        try {
            adminUserService.createUser(
                    createUserDTO.getUsername(),
                    createUserDTO.getPassword(),
                    createUserDTO.getFullName(),
                    createUserDTO.getEmail(),
                    createUserDTO.getRoleName()
            );

            Map<String, String> response = new HashMap<>();
            response.put("message", "User created successfully");
            response.put("username", createUserDTO.getUsername());

            log.info("New user created: {}", createUserDTO.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            log.warn("Failed to create user: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Get all active admin users.
     * Requires ADMIN role.
     * GET /api/admin/users
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers(HttpServletRequest request) {
        String role = (String) request.getAttribute("role");

        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Only ADMIN users can view user list"));
        }

        List<AdminUserDTO> users = adminUserService.getAllActiveUsers();
        return ResponseEntity.ok(users);
    }

    /**
     * Update user role.
     * Requires ADMIN role.
     * PUT /api/admin/users/:userId/role
     */
    @PutMapping("/{userId}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long userId, @RequestBody Map<String, String> body, HttpServletRequest request) {
        String role = (String) request.getAttribute("role");

        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Only ADMIN users can update user roles"));
        }

        String roleName = body.get("roleName");
        if (roleName == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("roleName is required"));
        }

        try {
            adminUserService.updateUserRole(userId, roleName);
            Map<String, String> response = new HashMap<>();
            response.put("message", "User role updated successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Deactivate user account.
     * Requires ADMIN role.
     * DELETE /api/admin/users/:userId
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deactivateUser(@PathVariable Long userId, HttpServletRequest request) {
        String role = (String) request.getAttribute("role");

        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Only ADMIN users can deactivate accounts"));
        }

        try {
            adminUserService.deactivateUser(userId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "User account deactivated successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
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
