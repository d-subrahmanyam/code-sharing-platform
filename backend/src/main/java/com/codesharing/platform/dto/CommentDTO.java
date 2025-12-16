package com.codesharing.platform.dto;

import java.time.LocalDateTime;

public class CommentDTO {
    private String id;
    private String snippetId;
    private String authorId;
    private String authorUsername;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CommentDTO() {}

    public CommentDTO(String id, String snippetId, String authorId, String authorUsername,
                      String content, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.snippetId = snippetId;
        this.authorId = authorId;
        this.authorUsername = authorUsername;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSnippetId() { return snippetId; }
    public void setSnippetId(String snippetId) { this.snippetId = snippetId; }

    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }

    public String getAuthorUsername() { return authorUsername; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
