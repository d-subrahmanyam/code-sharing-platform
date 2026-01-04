package com.codesharing.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for session list view in admin dashboard
 * Contains summary information about a session
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionListDTO {
    
    private Long id;
    private String snippetId;
    private String ownerUsername;
    private String ownerEmail;
    private Boolean isOwnerAnonymous;
    private LocalDateTime createdAt;
    private LocalDateTime endedAt;
    private Long durationSeconds;
    private String snippetTitle;
    private String snippetLanguage;
    private Integer participantCount;
    private Integer securityEventCount;
    private String sessionStatus;
}
