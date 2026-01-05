package com.codesharing.platform.service;

import com.codesharing.platform.entity.SecurityEvent;
import com.codesharing.platform.repository.SecurityEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for tracking security events (copy/paste attempts)
 */
@Service
public class SecurityEventService {
    
    @Autowired
    private SecurityEventRepository securityEventRepository;
    
    /**
     * Record a security event
     */
    @Transactional
    public SecurityEvent recordEvent(Long snippetId, Long sessionId, Long userId, 
                                     String userUsername, String eventType) {
        SecurityEvent event = new SecurityEvent(snippetId, sessionId, userId, userUsername, eventType);
        event.setDescription(SecurityEvent.SecurityEventType.valueOf(eventType).getDescription());
        event.setIsPrevented(true);
        
        return securityEventRepository.save(event);
    }
    
    /**
     * Record a security event with custom description
     */
    @Transactional
    public SecurityEvent recordEvent(Long snippetId, Long sessionId, Long userId, 
                                     String userUsername, String eventType, 
                                     String description) {
        SecurityEvent event = new SecurityEvent(snippetId, sessionId, userId, userUsername, eventType);
        event.setDescription(description);
        event.setIsPrevented(true);
        return securityEventRepository.save(event);
    }
    
    /**
     * Mark event as notified to owner
     */
    @Transactional
    public SecurityEvent notifyOwner(Long eventId) {
        SecurityEvent event = securityEventRepository.findById(eventId).orElse(null);
        if (event != null) {
            event.setOwnerNotified(true);
            event.setUpdatedAt(LocalDateTime.now());
            return securityEventRepository.save(event);
        }
        return null;
    }
    
    /**
     * Get all unnotified events for a snippet
     */
    public List<SecurityEvent> getUnnotifiedEvents(Long snippetId) {
        return securityEventRepository.findUnnotifiedEventsBySnippetId(snippetId);
    }
    
    /**
     * Get all events for a snippet
     */
    public List<SecurityEvent> getEventsBySnippetId(Long snippetId) {
        return securityEventRepository.findBySnippetId(snippetId);
    }
}
