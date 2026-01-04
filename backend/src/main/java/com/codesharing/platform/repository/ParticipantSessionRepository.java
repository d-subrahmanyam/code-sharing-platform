package com.codesharing.platform.repository;

import com.codesharing.platform.entity.ParticipantSession;
import com.codesharing.platform.entity.SessionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ParticipantSession entity
 * Provides database access for participant tracking
 */
@Repository
public interface ParticipantSessionRepository extends JpaRepository<ParticipantSession, Long> {
    
    /**
     * Find all participants in a session
     */
    List<ParticipantSession> findBySessionHistory(SessionHistory sessionHistory);
    
    /**
     * Find owner participant in a session
     */
    Optional<ParticipantSession> findBySessionHistoryAndIsOwner(SessionHistory sessionHistory, Boolean isOwner);
    
    /**
     * Find all participants by user ID
     */
    List<ParticipantSession> findByUserId(String userId);
    
    /**
     * Check if user is owner of a session
     */
    boolean existsBySessionHistoryAndUserIdAndIsOwner(SessionHistory sessionHistory, String userId, Boolean isOwner);
    
    /**
     * Get list of all joinee participants (non-owner)
     */
    @Query("SELECT p FROM ParticipantSession p WHERE p.sessionHistory = :sessionHistory AND p.isOwner = false")
    List<ParticipantSession> findJoineesInSession(@Param("sessionHistory") SessionHistory sessionHistory);
}
