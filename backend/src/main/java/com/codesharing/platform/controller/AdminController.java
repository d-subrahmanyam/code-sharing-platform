package com.codesharing.platform.controller;

import com.codesharing.platform.dto.SessionDetailsDTO;
import com.codesharing.platform.dto.SessionListDTO;
import com.codesharing.platform.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Admin Controller
 * Provides API endpoints for admin dashboard
 * All endpoints require authentication and ADMIN or OWNER role
 */
@Slf4j
@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class AdminController {
    
    private final AdminDashboardService adminDashboardService;
    
    /**
     * Get all sessions with pagination
     * GET /api/admin/sessions
     * 
     * Query Parameters:
     * - page: 0-based page number (default: 0)
     * - size: number of records per page (default: 25)
     * - sort: field to sort by (default: createdAt,desc)
     * - search: optional search query
     * 
     * Requires: ADMIN or OWNER role
     */
    @GetMapping("/sessions")
    public ResponseEntity<?> getAllSessions(
        @RequestParam(required = false) String search,
        @PageableDefault(size = 25, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
        HttpServletRequest request
    ) {
        String role = (String) request.getAttribute("role");
        String username = (String) request.getAttribute("username");
        
        if (role == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Authentication required"));
        }
        
        try {
            Page<SessionListDTO> sessions;
            
            if (search != null && !search.isBlank()) {
                log.info("[AdminController] User '{}' searching sessions with query: {}", username, search);
                sessions = adminDashboardService.searchSessions(search, pageable);
            } else {
                log.info("[AdminController] User '{}' fetching all sessions, page: {}", username, pageable.getPageNumber());
                sessions = adminDashboardService.getAllSessions(pageable);
            }
            
            return ResponseEntity.ok(sessions);
        } catch (Exception e) {
            log.error("[AdminController] Error fetching sessions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to fetch sessions: " + e.getMessage()));
        }
    }
    
    /**
     * Get detailed session information for drill-down
     * GET /api/admin/sessions/:snippetId
     * 
     * Requires: ADMIN or OWNER role
     */
    @GetMapping("/sessions/{snippetId}")
    public ResponseEntity<?> getSessionDetails(
        @PathVariable String snippetId,
        HttpServletRequest request
    ) {
        String role = (String) request.getAttribute("role");
        String username = (String) request.getAttribute("username");
        
        if (role == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Authentication required"));
        }
        
        try {
            log.info("[AdminController] User '{}' fetching session details for snippetId: {}", username, snippetId);
            
            SessionDetailsDTO sessionDetails = adminDashboardService.getSessionDetails(snippetId);
            return ResponseEntity.ok(sessionDetails);
        } catch (RuntimeException e) {
            log.warn("[AdminController] Session not found: {}", snippetId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Session not found"));
        } catch (Exception e) {
            log.error("[AdminController] Error fetching session details", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to fetch session details: " + e.getMessage()));
        }
    }
    
    /**
     * Health check for admin API
     * GET /api/admin/health
     * Public endpoint - no authentication required
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(new HealthResponse("Admin API is healthy"));
    }

    /**
     * Error response DTO.
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

    /**
     * Health check response DTO.
     */
    public static class HealthResponse {
        public String message;

        public HealthResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
