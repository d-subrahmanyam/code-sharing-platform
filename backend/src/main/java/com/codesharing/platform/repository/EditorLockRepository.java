package com.codesharing.platform.repository;

import com.codesharing.platform.entity.EditorLock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

/**
 * Repository for EditorLock entity
 */
@Repository
public interface EditorLockRepository extends JpaRepository<EditorLock, Long> {
    
    /**
     * Find lock by snippet and session
     */
    Optional<EditorLock> findBySnippetIdAndSessionId(Long snippetId, Long sessionId);
    
    /**
     * Find lock by snippet ID
     */
    Optional<EditorLock> findBySnippetId(Long snippetId);
    
    /**
     * Find locks by session ID
     */
    List<EditorLock> findBySessionId(Long sessionId);
    
    /**
     * Find locks by owner ID
     */
    List<EditorLock> findByOwnerId(Long ownerId);
    
    /**
     * Check if editor is locked
     */
    boolean existsBySnippetIdAndIsLockedTrue(Long snippetId);
}
