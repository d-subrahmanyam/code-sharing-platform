package com.codesharing.platform.repository;

import com.codesharing.platform.entity.SecurityEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for SecurityEvent entity
 */
@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {
    
    /**
     * Find all security events for a snippet
     */
    List<SecurityEvent> findBySnippetId(Long snippetId);
    
    /**
     * Find all security events for a session
     */
    List<SecurityEvent> findBySessionId(Long sessionId);
    
    /**
     * Find all events by user
     */
    List<SecurityEvent> findByUserId(Long userId);
    
    /**
     * Find unnotified events for owner
     */
    @Query("SELECT se FROM SecurityEvent se WHERE se.snippetId = :snippetId AND se.ownerNotified = false")
    List<SecurityEvent> findUnnotifiedEventsBySnippetId(@Param("snippetId") Long snippetId);
    
    /**
     * Find events in date range
     */
    List<SecurityEvent> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
}
