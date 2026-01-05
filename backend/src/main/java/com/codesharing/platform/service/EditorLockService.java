package com.codesharing.platform.service;

import com.codesharing.platform.entity.EditorLock;
import com.codesharing.platform.repository.EditorLockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for managing editor lock states
 */
@Service
public class EditorLockService {
    
    @Autowired
    private EditorLockRepository editorLockRepository;
    
    /**
     * Get or create lock for a snippet/session
     */
    public EditorLock getOrCreateLock(Long snippetId, Long sessionId, Long ownerId) {
        Optional<EditorLock> existing = editorLockRepository.findBySnippetIdAndSessionId(snippetId, sessionId);
        
        if (existing.isPresent()) {
            return existing.get();
        }
        
        EditorLock newLock = new EditorLock(snippetId, sessionId, ownerId);
        return editorLockRepository.save(newLock);
    }
    
    /**
     * Lock the editor
     */
    @Transactional
    public EditorLock lockEditor(Long snippetId, Long sessionId, String reason) {
        Optional<EditorLock> lockOpt = editorLockRepository.findBySnippetIdAndSessionId(snippetId, sessionId);
        
        EditorLock lock = lockOpt.orElse(new EditorLock());
        lock.setSnippetId(snippetId);
        lock.setSessionId(sessionId);
        lock.setIsLocked(true);
        lock.setLockReason(reason);
        lock.setLockedAt(LocalDateTime.now());
        
        return editorLockRepository.save(lock);
    }
    
    /**
     * Unlock the editor
     */
    @Transactional
    public EditorLock unlockEditor(Long snippetId, Long sessionId) {
        Optional<EditorLock> lockOpt = editorLockRepository.findBySnippetIdAndSessionId(snippetId, sessionId);
        
        EditorLock lock = lockOpt.orElse(new EditorLock());
        lock.setSnippetId(snippetId);
        lock.setSessionId(sessionId);
        lock.setIsLocked(false);
        lock.setUnlockedAt(LocalDateTime.now());
        
        return editorLockRepository.save(lock);
    }
    
    /**
     * Check if editor is locked
     */
    public boolean isEditorLocked(Long snippetId, Long sessionId) {
        Optional<EditorLock> lockOpt = editorLockRepository.findBySnippetIdAndSessionId(snippetId, sessionId);
        return lockOpt.isPresent() && lockOpt.get().getIsLocked();
    }
    
    /**
     * Get lock status
     */
    public Optional<EditorLock> getLockStatus(Long snippetId, Long sessionId) {
        return editorLockRepository.findBySnippetIdAndSessionId(snippetId, sessionId);
    }
    
    /**
     * Check if user is owner
     */
    public boolean isOwner(Long snippetId, Long userId) {
        Optional<EditorLock> lockOpt = editorLockRepository.findBySnippetId(snippetId);
        return lockOpt.isPresent() && lockOpt.get().getOwnerId().equals(userId);
    }
}
