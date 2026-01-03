package com.codesharing.platform.controller;

import com.codesharing.platform.entity.EditorLock;
import com.codesharing.platform.entity.SecurityEvent;
import com.codesharing.platform.service.EditorLockService;
import com.codesharing.platform.service.SecurityEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API Controller for Editor Lock and Security Events
 */
@RestController
@RequestMapping("/editor")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class EditorLockController {
    
    @Autowired
    private EditorLockService editorLockService;
    
    @Autowired
    private SecurityEventService securityEventService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    /**
     * Lock the editor
     * POST /api/editor/lock
     */
    @PostMapping("/lock")
    public ResponseEntity<?> lockEditor(@RequestBody Map<String, String> request) {
        try {
            Long snippetId = Long.parseLong(request.get("snippetId"));
            Long sessionId = Long.parseLong(request.get("sessionId"));
            String reason = request.getOrDefault("reason", "Owner locked the editor");
            Long userId = Long.parseLong(request.get("userId"));
            
            // Verify user is owner
            if (!editorLockService.isOwner(snippetId, userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Only owner can lock editor"));
            }
            
            EditorLock lock = editorLockService.lockEditor(snippetId, sessionId, reason);
            return ResponseEntity.ok(lock);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid ID format"));
        }
    }
    
    /**
     * Unlock the editor
     * POST /api/editor/unlock
     */
    @PostMapping("/unlock")
    public ResponseEntity<?> unlockEditor(@RequestBody Map<String, String> request) {
        try {
            Long snippetId = Long.parseLong(request.get("snippetId"));
            Long sessionId = Long.parseLong(request.get("sessionId"));
            Long userId = Long.parseLong(request.get("userId"));
            
            // Verify user is owner
            if (!editorLockService.isOwner(snippetId, userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Only owner can unlock editor"));
            }
            
            EditorLock lock = editorLockService.unlockEditor(snippetId, sessionId);
            return ResponseEntity.ok(lock);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid ID format"));
        }
    }
    
    /**
     * Get lock status
     * GET /api/editor/lock-status?snippetId=xxx&sessionId=yyy
     */
    @GetMapping("/lock-status")
    public ResponseEntity<?> getLockStatus(@RequestParam String snippetId, 
                                          @RequestParam String sessionId) {
        try {
            Long snippetIdLong = Long.parseLong(snippetId);
            Long sessionIdLong = Long.parseLong(sessionId);
            var lockStatus = editorLockService.getLockStatus(snippetIdLong, sessionIdLong);
            
            if (lockStatus.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("isLocked", lockStatus.get().getIsLocked());
                response.put("lockedAt", lockStatus.get().getLockedAt());
                response.put("reason", lockStatus.get().getLockReason());
                return ResponseEntity.ok(response);
            }
            
            return ResponseEntity.ok(Map.of("isLocked", false));
        } catch (NumberFormatException e) {
            // Return default response for invalid IDs (e.g., 'unknown')
            return ResponseEntity.ok(Map.of("isLocked", false));
        }
    }
    
    /**
     * Record copy/paste attempt
     * POST /api/editor/record-event
     */
    @PostMapping("/record-event")
    public ResponseEntity<?> recordSecurityEvent(@RequestBody Map<String, String> request) {
        String snippetId = request.get("snippetId");
        String sessionId = request.get("sessionId");
        String userId = request.get("userId");
        String username = request.get("username");
        String eventType = request.get("eventType");
        
        // Validate event type
        try {
            SecurityEvent.SecurityEventType.valueOf(eventType);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid event type"));
        }
        
        SecurityEvent event = null;
        
        // Try to convert IDs and record to database if valid
        // This handles both new snippets (invalid IDs) and existing snippets
        try {
            Long snippetIdLong = Long.parseLong(snippetId);
            Long sessionIdLong = Long.parseLong(sessionId);
            Long userIdLong = Long.parseLong(userId);
            
            // Only record to DB if all IDs are valid numbers
            event = securityEventService.recordEvent(snippetIdLong, sessionIdLong, userIdLong, username, eventType);
            System.out.println("[EditorLock] Security event recorded to database: " + eventType + " from " + username);
        } catch (NumberFormatException e) {
            // IDs are not valid numbers (e.g., 'new', 'new-snippet-...', 'unknown')
            // This happens when snippet is still being created
            System.out.println("[EditorLock] Security event not recorded to DB (invalid IDs): snippetId=" + snippetId + 
                              ", sessionId=" + sessionId + ", userId=" + userId);
            // We'll still broadcast the notification even if we can't record to DB
        }
        
        // Always broadcast security event to owner via WebSocket (regardless of whether we recorded to DB)
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "SECURITY_EVENT");
            notification.put("eventType", eventType);
            notification.put("username", username);
            notification.put("snippetId", snippetId); // Use original ID even if not numeric
            notification.put("timestamp", System.currentTimeMillis());
            notification.put("message", username + " attempted " + eventType.replace("_", " ").toLowerCase());
            
            // Send to snippet-specific topic so only owner of that snippet receives it
            messagingTemplate.convertAndSend(
                "/topic/snippet/" + snippetId + "/security-events",
                notification
            );
            
            System.out.println("[EditorLock] Security event broadcast: " + eventType + " from " + username + " for snippet " + snippetId);
        } catch (Exception e) {
            System.err.println("[EditorLock] Failed to broadcast security event: " + e.getMessage());
            // Don't fail the request if broadcast fails
        }
        
        // Return success with or without the database record
        // If we have an event from DB, return it; otherwise return a simple acknowledgment
        if (event != null) {
            return ResponseEntity.ok(event);
        } else {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Security event notification sent to owner");
            response.put("eventType", eventType);
            response.put("username", username);
            response.put("notRecordedToDb", true); // Indicate this wasn't persisted to DB
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * Get unnotified security events for owner
     * GET /api/editor/unnotified-events?snippetId=xxx
     */
    @GetMapping("/unnotified-events")
    public ResponseEntity<?> getUnnotifiedEvents(@RequestParam String snippetId) {
        try {
            Long snippetIdLong = Long.parseLong(snippetId);
            List<SecurityEvent> events = securityEventService.getUnnotifiedEvents(snippetIdLong);
            return ResponseEntity.ok(events);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid snippet ID"));
        }
    }
    
    /**
     * Mark event as notified
     * POST /api/editor/notify-event
     */
    @PostMapping("/notify-event")
    public ResponseEntity<?> notifyEvent(@RequestBody Map<String, String> request) {
        String eventId = request.get("eventId");
        try {
            Long eventIdLong = Long.parseLong(eventId);
            SecurityEvent event = securityEventService.notifyOwner(eventIdLong);
            
            if (event != null) {
                return ResponseEntity.ok(event);
            }
            
            return ResponseEntity.notFound().build();
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid event ID"));
        }
    }
    
    /**
     * Get all security events for a snippet
     * GET /api/editor/events?snippetId=xxx
     */
    @GetMapping("/events")
    public ResponseEntity<?> getEvents(@RequestParam String snippetId) {
        try {
            Long snippetIdLong = Long.parseLong(snippetId);
            List<SecurityEvent> events = securityEventService.getEventsBySnippetId(snippetIdLong);
            return ResponseEntity.ok(events);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid snippet ID"));
        }
    }
}
