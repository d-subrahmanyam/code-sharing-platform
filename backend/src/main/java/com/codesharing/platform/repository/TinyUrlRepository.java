package com.codesharing.platform.repository;

import com.codesharing.platform.entity.TinyUrl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * TinyUrl Repository
 * Provides data access methods for TinyUrl entity
 */
@Repository
public interface TinyUrlRepository extends JpaRepository<TinyUrl, String> {
    
    /**
     * Find TinyUrl by short code
     */
    Optional<TinyUrl> findByShortCode(String shortCode);
    
    /**
     * Find TinyUrl by snippet ID
     */
    Optional<TinyUrl> findBySnippetId(String snippetId);
}
