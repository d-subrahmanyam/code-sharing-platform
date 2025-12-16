package com.codesharing.platform.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

/**
 * CodeSnippet Entity
 * Represents a code snippet stored in MongoDB
 * 
 * This entity contains the actual code content and collaboration data
 */
@Document(collection = "code_snippets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeSnippet {
    
    @Id
    private String id;
    
    private String title;
    
    private String description;
    
    private String code;
    
    private String language;
    
    private String authorId;
    
    private List<String> tags;
    
    private String shareUrl;
    
    private boolean isPublic;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private long views;
    
    private List<String> collaborators;
}
