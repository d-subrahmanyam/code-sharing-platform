package com.codesharing.platform.repository;

import com.codesharing.platform.entity.SessionHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for SessionHistory entity
 * Provides database access and custom queries for session tracking
 */
@Repository
public interface SessionHistoryRepository extends JpaRepository<SessionHistory, Long> {
    
    /**
     * Find session by snippet ID
     */
    Optional<SessionHistory> findBySnippetId(String snippetId);
    
    /**
     * Find sessions by owner ID
     */
    List<SessionHistory> findByOwnerId(String ownerId);
    
    /**
     * Find all sessions paginated, sorted by creation date (latest first)
     */
    Page<SessionHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    /**
     * Find sessions by owner username
     */
    Page<SessionHistory> findByOwnerUsernameContainingIgnoreCaseOrderByCreatedAtDesc(
        String ownerUsername, Pageable pageable);
    
    /**
     * Find sessions by snippet title
     */
    Page<SessionHistory> findBySnippetTitleContainingIgnoreCaseOrderByCreatedAtDesc(
        String snippetTitle, Pageable pageable);
    
    /**
     * Search sessions by multiple criteria
     */
    @Query("SELECT s FROM SessionHistory s WHERE " +
           "LOWER(s.ownerUsername) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.snippetTitle) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "s.snippetId LIKE CONCAT('%', :search, '%') " +
           "ORDER BY s.createdAt DESC")
    Page<SessionHistory> searchSessions(@Param("search") String search, Pageable pageable);
    
    /**
     * Find completed sessions
     */
    Page<SessionHistory> findBySessionStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    
    /**
     * Find sessions created within date range
     */
    List<SessionHistory> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Count sessions by status
     */
    long countBySessionStatus(String status);
    
    /**
     * Get sessions with most security events
     */
    @Query("SELECT s FROM SessionHistory s ORDER BY s.securityEventCount DESC LIMIT :limit")
    List<SessionHistory> findMostSecurityIssues(@Param("limit") int limit);
}
