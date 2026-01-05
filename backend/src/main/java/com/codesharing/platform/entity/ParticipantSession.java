package com.codesharing.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ParticipantSession Entity
 * Tracks individual participant information in a session
 * Captures join/leave times, IP addresses, and browser information
 */
@Entity
@Table(name = "participant_sessions",
       indexes = {
           @Index(name = "idx_participant_session_history", columnList = "session_history_id"),
           @Index(name = "idx_participant_user_id", columnList = "user_id"),
           @Index(name = "idx_participant_joined_at", columnList = "joined_at")
       }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantSession {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_history_id", nullable = false)
    private SessionHistory sessionHistory;
    
    // Participant Information
    @Column(name = "user_id")
    private String userId;
    
    @Column(name = "username", nullable = false)
    private String username;
    
    @Column(name = "is_owner", nullable = false)
    private Boolean isOwner;
    
    @Column(name = "is_anonymous", nullable = false)
    private Boolean isAnonymous;
    
    // Timing
    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;
    
    @Column(name = "left_at")
    private LocalDateTime leftAt;
    
    @Column(name = "duration_seconds")
    private Long durationSeconds;
    
    // Network Information
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    
    // Browser Information
    @Column(name = "browser_name")
    private String browserName;
    
    @Column(name = "browser_version")
    private String browserVersion;
    
    @Column(name = "os_name")
    private String osName;
    
    @Column(name = "os_version")
    private String osVersion;
    
    // Timestamps
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.joinedAt == null) {
            this.joinedAt = LocalDateTime.now();
        }
        if (this.isOwner == null) {
            this.isOwner = false;
        }
        if (this.isAnonymous == null) {
            this.isAnonymous = false;
        }
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
        
        // Calculate duration if left_at is set
        if (this.leftAt != null) {
            this.durationSeconds = java.time.temporal.ChronoUnit.SECONDS.between(this.joinedAt, this.leftAt);
        }
    }
}
