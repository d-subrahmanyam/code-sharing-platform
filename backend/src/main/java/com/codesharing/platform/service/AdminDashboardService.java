package com.codesharing.platform.service;

import com.codesharing.platform.dto.SessionDetailsDTO;
import com.codesharing.platform.dto.SessionListDTO;
import com.codesharing.platform.entity.ParticipantSession;
import com.codesharing.platform.entity.SecurityEvent;
import com.codesharing.platform.entity.SessionHistory;
import com.codesharing.platform.repository.ParticipantSessionRepository;
import com.codesharing.platform.repository.SecurityEventRepository;
import com.codesharing.platform.repository.SessionHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for Admin Dashboard
 * Handles session tracking, analytics, and detailed session information
 */
@Service
@RequiredArgsConstructor
public class AdminDashboardService {
    
    private final SessionHistoryRepository sessionHistoryRepository;
    private final ParticipantSessionRepository participantSessionRepository;
    private final SecurityEventRepository securityEventRepository;
    
    /**
     * Get all sessions with pagination and sorting
     */
    @Transactional(readOnly = true)
    public Page<SessionListDTO> getAllSessions(Pageable pageable) {
        Page<SessionHistory> sessions = sessionHistoryRepository.findAllByOrderByCreatedAtDesc(pageable);
        return sessions.map(this::toSessionListDTO);
    }
    
    /**
     * Search sessions by keyword
     */
    @Transactional(readOnly = true)
    public Page<SessionListDTO> searchSessions(String query, Pageable pageable) {
        Page<SessionHistory> sessions = sessionHistoryRepository.searchSessions(query, pageable);
        return sessions.map(this::toSessionListDTO);
    }
    
    /**
     * Get session by snippet ID
     * Returns Optional for safe handling when session doesn't exist yet
     */
    @Transactional(readOnly = true)
    public Optional<SessionHistory> getSessionBySnippetId(String snippetId) {
        return sessionHistoryRepository.findBySnippetId(snippetId);
    }
    
    /**
     * Get detailed session information for drill-down
     */
    @Transactional(readOnly = true)
    public SessionDetailsDTO getSessionDetails(String snippetId) {
        SessionHistory session = sessionHistoryRepository.findBySnippetId(snippetId)
            .orElseThrow(() -> new RuntimeException("Session not found: " + snippetId));
        
        return toSessionDetailsDTO(session);
    }
    
    /**
     * Create a new session history entry
     * Called when a new collaboration session starts
     * Also creates a ParticipantSession record for the owner
     */
    @Transactional
    public SessionHistory createSession(String snippetId, String ownerId, String ownerUsername, 
                                       String ownerEmail, Boolean isAnonymous, 
                                       String snippetTitle, String snippetLanguage) {
        SessionHistory session = SessionHistory.builder()
            .snippetId(snippetId)
            .ownerId(ownerId)
            .ownerUsername(ownerUsername)
            .ownerEmail(ownerEmail)
            .isOwnerAnonymous(isAnonymous)
            .snippetTitle(snippetTitle)
            .snippetLanguage(snippetLanguage)
            .participantCount(1)
            .securityEventCount(0)
            .sessionStatus("ACTIVE")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        
        SessionHistory savedSession = sessionHistoryRepository.save(session);
        
        // Create ParticipantSession record for the owner
        ParticipantSession ownerParticipant = ParticipantSession.builder()
            .sessionHistory(savedSession)
            .userId(ownerId)
            .username(ownerUsername)
            .isOwner(true)
            .isAnonymous(isAnonymous)
            .ipAddress("127.0.0.1") // Owner's IP not available at creation time
            .userAgent("browser") // Will be updated when owner actually joins
            .browserName("unknown")
            .browserVersion("unknown")
            .osName("unknown")
            .osVersion("unknown")
            .joinedAt(LocalDateTime.now())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        
        participantSessionRepository.save(ownerParticipant);
        
        return savedSession;
    }
    
    /**
     * Track participant in session
     * Checks if participant already exists and updates, or creates new participant if first time joining
     */
    @Transactional
    public ParticipantSession addParticipant(SessionHistory session, String userId, String username,
                                             Boolean isOwner, Boolean isAnonymous,
                                             String ipAddress, String userAgent,
                                             String browserName, String browserVersion,
                                             String osName, String osVersion) {
        // Check if participant already exists in this session
        Optional<ParticipantSession> existingParticipant = participantSessionRepository.findBySessionHistoryAndUserId(session, userId);
        
        if (existingParticipant.isPresent()) {
            // Participant is re-joining - update their record with device info
            ParticipantSession participant = existingParticipant.get();
            participant.setJoinedAt(LocalDateTime.now());
            participant.setLeftAt(null); // Clear left time since they're joining again
            // Update device info if provided
            if (ipAddress != null) participant.setIpAddress(ipAddress);
            if (userAgent != null) participant.setUserAgent(userAgent);
            if (browserName != null) participant.setBrowserName(browserName);
            if (browserVersion != null) participant.setBrowserVersion(browserVersion);
            if (osName != null) participant.setOsName(osName);
            if (osVersion != null) participant.setOsVersion(osVersion);
            participant.setUpdatedAt(LocalDateTime.now());
            return participantSessionRepository.save(participant);
        } else {
            // New participant - create record and increment count
            ParticipantSession participant = ParticipantSession.builder()
                .sessionHistory(session)
                .userId(userId)
                .username(username)
                .isOwner(isOwner)
                .isAnonymous(isAnonymous)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .browserName(browserName)
                .browserVersion(browserVersion)
                .osName(osName)
                .osVersion(osVersion)
                .joinedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
            
            // Only increment participant count for NEW participants
            session.setParticipantCount(session.getParticipantCount() + 1);
            sessionHistoryRepository.save(session);
            
            return participantSessionRepository.save(participant);
        }
    }
    
    /**
     * Mark participant as left
     */
    @Transactional
    public void markParticipantLeft(SessionHistory session, String userId) {
        ParticipantSession participant = participantSessionRepository.findBySessionHistory(session)
            .stream()
            .filter(p -> p.getUserId().equals(userId))
            .findFirst()
            .orElse(null);
        
        if (participant != null) {
            participant.setLeftAt(LocalDateTime.now());
            participant.setDurationSeconds(
                ChronoUnit.SECONDS.between(participant.getJoinedAt(), LocalDateTime.now())
            );
            participantSessionRepository.save(participant);
        }
    }
    
    /**
     * End session (mark as completed)
     */
    @Transactional
    public void endSession(SessionHistory session) {
        session.setEndedAt(LocalDateTime.now());
        session.setSessionStatus("COMPLETED");
        session.setDurationSeconds(
            ChronoUnit.SECONDS.between(session.getCreatedAt(), LocalDateTime.now())
        );
        sessionHistoryRepository.save(session);
    }
    
    /**
     * Add security event count for session
     */
    @Transactional
    public void recordSecurityEvent(SessionHistory session) {
        session.setSecurityEventCount((session.getSecurityEventCount() != null ? session.getSecurityEventCount() : 0) + 1);
        sessionHistoryRepository.save(session);
    }
    
    /**
     * Convert SessionHistory to DTO
     */
    private SessionListDTO toSessionListDTO(SessionHistory session) {
        return SessionListDTO.builder()
            .id(session.getId())
            .snippetId(session.getSnippetId())
            .ownerUsername(session.getOwnerUsername())
            .ownerEmail(session.getOwnerEmail() != null ? session.getOwnerEmail() : "NA")
            .isOwnerAnonymous(session.getIsOwnerAnonymous())
            .createdAt(session.getCreatedAt())
            .endedAt(session.getEndedAt())
            .durationSeconds(session.getDurationSeconds())
            .snippetTitle(session.getSnippetTitle())
            .snippetLanguage(session.getSnippetLanguage())
            .participantCount(session.getParticipantCount())
            .securityEventCount(session.getSecurityEventCount())
            .sessionStatus(session.getSessionStatus())
            .build();
    }
    
    /**
     * Convert SessionHistory with related data to detailed DTO
     */
    private SessionDetailsDTO toSessionDetailsDTO(SessionHistory session) {
        // Get all participants
        List<ParticipantSession> participants = participantSessionRepository.findBySessionHistory(session);
        
        // Get security events
        List<SecurityEvent> securityEvents = securityEventRepository.findBySnippetId(Long.parseLong(session.getSnippetId()));
        
        // Build participant DTOs
        List<SessionDetailsDTO.ParticipantDTO> participantDTOs = participants.stream()
            .map(p -> SessionDetailsDTO.ParticipantDTO.builder()
                .userId(p.getUserId())
                .username(p.getUsername())
                .isOwner(p.getIsOwner())
                .isAnonymous(p.getIsAnonymous())
                .joinedAt(p.getJoinedAt())
                .leftAt(p.getLeftAt())
                .durationSeconds(p.getDurationSeconds())
                .ipAddress(p.getIpAddress())
                .browser(formatBrowserInfo(p.getBrowserName(), p.getBrowserVersion()))
                .os(formatOsInfo(p.getOsName(), p.getOsVersion()))
                .build())
            .collect(Collectors.toList());
        
        // Build security event DTOs
        List<SessionDetailsDTO.SecurityEventDTO> securityEventDTOs = securityEvents.stream()
            .map(e -> SessionDetailsDTO.SecurityEventDTO.builder()
                .id(e.getId())
                .eventType(e.getEventType())
                .username(e.getUserUsername())
                .timestamp(e.getCreatedAt())
                .isPrevented(e.getIsPrevented())
                .description(e.getDescription())
                .build())
            .collect(Collectors.toList());
        
        // Build owner DTO
        ParticipantSession ownerParticipant = participantSessionRepository.findBySessionHistoryAndIsOwner(session, true)
            .orElse(null);
        
        SessionDetailsDTO.OwnerDTO ownerDTO = SessionDetailsDTO.OwnerDTO.builder()
            .id(session.getOwnerId())
            .username(session.getOwnerUsername())
            .email(session.getOwnerEmail() != null ? session.getOwnerEmail() : "NA")
            .isAnonymous(session.getIsOwnerAnonymous())
            .build();
        
        // Build URLs
        SessionDetailsDTO.SessionURLsDTO urlsDTO = SessionDetailsDTO.SessionURLsDTO.builder()
            .ownerSessionUrl("/start/" + session.getSnippetId())
            .joineeSessionUrl("/join/" + session.getSnippetId())
            .build();
        
        // Parse tags
        List<String> tags = session.getSnippetTags() != null 
            ? List.of(session.getSnippetTags().split(",")) 
            : List.of();
        
        return SessionDetailsDTO.builder()
            .id(session.getId())
            .snippetId(session.getSnippetId())
            .snippetTitle(session.getSnippetTitle())
            .snippetDescription(session.getSnippetDescription())
            .snippetLanguage(session.getSnippetLanguage())
            .snippetTags(tags)
            .owner(ownerDTO)
            .createdAt(session.getCreatedAt())
            .endedAt(session.getEndedAt())
            .durationSeconds(session.getDurationSeconds())
            .sessionStatus(session.getSessionStatus())
            .participants(participantDTOs)
            .securityEvents(securityEventDTOs)
            .urls(urlsDTO)
            .build();
    }
    
    /**
     * Format browser information
     */
    private String formatBrowserInfo(String name, String version) {
        if (name == null) {
            return "Unknown";
        }
        return version != null ? name + " " + version : name;
    }
    
    /**
     * Format OS information
     */
    private String formatOsInfo(String name, String version) {
        if (name == null) {
            return "Unknown";
        }
        return version != null ? name + " " + version : name;
    }
}
