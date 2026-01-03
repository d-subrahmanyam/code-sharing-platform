package com.codesharing.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * SessionHistory Entity
 * Tracks all code sharing sessions with detailed information
 * Used for admin dashboard and analytics
 */
@Entity
@Table(name = "session_history",
       indexes = {
           @Index(name = "idx_session_snippet_id", columnList = "snippet_id"),
           @Index(name = "idx_session_owner_id", columnList = "owner_id"),
           @Index(name = "idx_session_created_at", columnList = "created_at"),
           @Index(name = "idx_session_status", columnList = "session_status")
       }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // Session Identifiers
    @Column(name = "snippet_id")
    private String snippetId;
    
    @Column(name = "collaboration_session_id")
    private String collaborationSessionId;
    
    // Owner Information
    @Column(name = "owner_id")
    private String ownerId;
    
    @Column(name = "owner_username", nullable = false)
    private String ownerUsername;
    
    @Column(name = "owner_email")
    private String ownerEmail;
    
    @Column(name = "is_owner_anonymous", nullable = false)
    private Boolean isOwnerAnonymous;
    
    @Column(name = "owner_ip_address")
    private String ownerIpAddress;
    
    @Column(name = "owner_user_agent", columnDefinition = "TEXT")
    private String ownerUserAgent;
    
    @Column(name = "owner_browser_name")
    private String ownerBrowserName;
    
    @Column(name = "owner_browser_version")
    private String ownerBrowserVersion;
    
    @Column(name = "owner_os_name")
    private String ownerOsName;
    
    @Column(name = "owner_os_version")
    private String ownerOsVersion;
    
    // Session Timing
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "ended_at")
    private LocalDateTime endedAt;
    
    @Column(name = "duration_seconds")
    private Long durationSeconds;
    
    // Code Metadata (captured at session creation)
    @Column(name = "snippet_title")
    private String snippetTitle;
    
    @Column(name = "snippet_description", columnDefinition = "TEXT")
    private String snippetDescription;
    
    @Column(name = "snippet_language")
    private String snippetLanguage;
    
    @Column(name = "snippet_tags")
    private String snippetTags; // CSV or JSON
    
    // Participants
    @Column(name = "participant_count", nullable = false)
    private Integer participantCount = 1;
    
    // Security Events
    @Column(name = "security_event_count")
    private Integer securityEventCount = 0;
    
    // Session Status
    @Column(name = "session_status", nullable = false)
    private String sessionStatus; // ACTIVE, COMPLETED, ABANDONED
    
    // Timestamps
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.sessionStatus = "ACTIVE";
        if (this.participantCount == null) {
            this.participantCount = 1;
        }
        if (this.securityEventCount == null) {
            this.securityEventCount = 0;
        }
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
