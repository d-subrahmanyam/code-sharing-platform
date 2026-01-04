package com.codesharing.platform.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing security events (copy/paste attempts)
 * Tracks unauthorized access attempts with timestamps and prevention status
 */
@Entity
@Table(name = "security_events",
       indexes = {
           @Index(name = "idx_snippet_id", columnList = "snippet_id"),
           @Index(name = "idx_event_type", columnList = "event_type"),
           @Index(name = "idx_created_at", columnList = "created_at"),
           @Index(name = "idx_user_id", columnList = "user_id")
       }
)
public class SecurityEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "snippet_id", nullable = false)
    private Long snippetId;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_username")
    private String userUsername;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "is_prevented", nullable = false)
    private Boolean isPrevented = true;

    @Column(name = "owner_notified", nullable = false)
    private Boolean ownerNotified = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Constructors
    public SecurityEvent() {
    }

    public SecurityEvent(Long snippetId, Long sessionId, Long userId, String userUsername, String eventType) {
        this.snippetId = snippetId;
        this.sessionId = sessionId;
        this.userId = userId;
        this.userUsername = userUsername;
        this.eventType = eventType;
        this.isPrevented = true;
        this.ownerNotified = false;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSnippetId() {
        return snippetId;
    }

    public void setSnippetId(Long snippetId) {
        this.snippetId = snippetId;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserUsername() {
        return userUsername;
    }

    public void setUserUsername(String userUsername) {
        this.userUsername = userUsername;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsPrevented() {
        return isPrevented;
    }

    public void setIsPrevented(Boolean isPrevented) {
        this.isPrevented = isPrevented;
    }

    public Boolean getOwnerNotified() {
        return ownerNotified;
    }

    public void setOwnerNotified(Boolean ownerNotified) {
        this.ownerNotified = ownerNotified;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    /**
     * Security event types
     */
    public enum SecurityEventType {
        COPY_ATTEMPT("Copy attempt blocked"),
        PASTE_ATTEMPT("Paste attempt blocked"),
        CONTEXT_MENU_ATTEMPT("Context menu access blocked"),
        KEYBOARD_SHORTCUT_ATTEMPT("Keyboard shortcut attempt blocked");

        private final String description;

        SecurityEventType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
