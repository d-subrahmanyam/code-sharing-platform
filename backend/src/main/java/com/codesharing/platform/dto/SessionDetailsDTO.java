package com.codesharing.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for session details view in admin dashboard drill-down
 * Contains complete information about a session with all participants and events
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionDetailsDTO {
    
    private Long id;
    private String snippetId;
    private String snippetTitle;
    private String snippetDescription;
    private String snippetLanguage;
    private List<String> snippetTags;
    
    private OwnerDTO owner;
    
    private LocalDateTime createdAt;
    private LocalDateTime endedAt;
    private Long durationSeconds;
    private String sessionStatus;
    
    private List<ParticipantDTO> participants;
    private List<SecurityEventDTO> securityEvents;
    
    private SessionURLsDTO urls;
    
    /**
     * Owner information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OwnerDTO {
        private String id;
        private String username;
        private String email;
        private Boolean isAnonymous;
    }
    
    /**
     * Participant information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantDTO {
        private String userId;
        private String username;
        private Boolean isOwner;
        private Boolean isAnonymous;
        private LocalDateTime joinedAt;
        private LocalDateTime leftAt;
        private Long durationSeconds;
        
        // Network info
        private String ipAddress;
        private String browser;
        private String os;
    }
    
    /**
     * Security event information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SecurityEventDTO {
        private Long id;
        private String eventType;
        private String username;
        private LocalDateTime timestamp;
        private Boolean isPrevented;
        private String description;
    }
    
    /**
     * Session URLs for access
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionURLsDTO {
        private String ownerSessionUrl;
        private String joineeSessionUrl;
    }
}
