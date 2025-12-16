package com.codesharing.platform.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Comment Entity
 * Represents a comment on a code snippet stored in MongoDB
 */
@Document(collection = "comments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    
    @Id
    private String id;
    
    private String snippetId;
    
    private String authorId;
    
    private String content;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
