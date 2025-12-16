package com.codesharing.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * TinyUrl Entity
 * Maps long snippet URLs to short URLs for easy sharing
 */
@Entity
@Table(name = "tiny_urls")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TinyUrl {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(unique = true, nullable = false)
    private String shortCode;
    
    @Column(nullable = false)
    private String snippetId;
    
    @Column(nullable = false)
    private String userId;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime expiresAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
