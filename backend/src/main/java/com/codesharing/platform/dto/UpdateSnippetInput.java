package com.codesharing.platform.dto;

import java.util.List;

public class UpdateSnippetInput {
    private String id;
    private String title;
    private String description;
    private String code;
    private String language;
    private List<String> tags;
    private Boolean isPublic;

    public UpdateSnippetInput() {}

    public UpdateSnippetInput(String id, String title, String description, String code,
                             String language, List<String> tags, Boolean isPublic) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.code = code;
        this.language = language;
        this.tags = tags;
        this.isPublic = isPublic;
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

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
}
