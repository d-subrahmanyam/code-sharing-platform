package com.codesharing.platform.dto;

import java.time.LocalDateTime;
import java.util.List;

public class SnippetDTO {
    private String id;
    private String title;
    private String description;
    private String code;
    private String language;
    private String authorId;
    private String authorUsername;
    private List<String> tags;
    private Integer views;
    private Boolean isPublic;
    private String shareUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SnippetDTO() {}

    public SnippetDTO(String id, String title, String description, String code, 
                      String language, String authorId, String authorUsername,
                      List<String> tags, Integer views, Boolean isPublic,
                      String shareUrl, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.code = code;
        this.language = language;
        this.authorId = authorId;
        this.authorUsername = authorUsername;
        this.tags = tags;
        this.views = views;
        this.isPublic = isPublic;
        this.shareUrl = shareUrl;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }

    public String getAuthorUsername() { return authorUsername; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public Integer getViews() { return views; }
    public void setViews(Integer views) { this.views = views; }

    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }

    public String getShareUrl() { return shareUrl; }
    public void setShareUrl(String shareUrl) { this.shareUrl = shareUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
