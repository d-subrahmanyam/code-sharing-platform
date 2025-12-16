package com.codesharing.platform.controller;

import com.codesharing.platform.dto.SnippetDTO;
import com.codesharing.platform.service.SnippetService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class SnippetController {
    private final SnippetService snippetService;

    public SnippetController(SnippetService snippetService) {
        this.snippetService = snippetService;
    }

    @QueryMapping
    public SnippetDTO snippet(@Argument String id) {
        return snippetService.getSnippetById(id);
    }

    @QueryMapping
    public List<SnippetDTO> snippets(@Argument Integer limit,
                                     @Argument Integer offset) {
        int lim = limit != null ? limit : 20;
        int off = offset != null ? offset : 0;
        return snippetService.getAllSnippets(lim, off);
    }

    @QueryMapping
    public List<SnippetDTO> searchSnippets(@Argument String query,
                                          @Argument Integer limit) {
        int lim = limit != null ? limit : 10;
        return snippetService.searchSnippets(query, lim);
    }

    @QueryMapping
    public List<SnippetDTO> snippetsByLanguage(@Argument String language,
                                              @Argument Integer limit) {
        int lim = limit != null ? limit : 10;
        return snippetService.getSnippetsByLanguage(language, lim);
    }

    @MutationMapping
    public SnippetDTO createSnippet(@Argument String title,
                                    @Argument String description,
                                    @Argument String code,
                                    @Argument String language,
                                    @Argument List<String> tags,
                                    @Argument Boolean isPublic) {
        // TODO: Get actual userId from security context
        String userId = "user-1"; // Temporary placeholder
        List<String> tagList = tags != null ? tags : new java.util.ArrayList<>();
        boolean isPublicFlag = isPublic != null ? isPublic : true;
        return snippetService.createSnippet(userId, title, description, code, language, tagList, isPublicFlag);
    }

    @MutationMapping
    public SnippetDTO updateSnippet(@Argument String id,
                                    @Argument String title,
                                    @Argument String description,
                                    @Argument String code,
                                    @Argument String language,
                                    @Argument List<String> tags,
                                    @Argument Boolean isPublic) {
        List<String> tagList = tags != null ? tags : new java.util.ArrayList<>();
        boolean isPublicFlag = isPublic != null ? isPublic : true;
        return snippetService.updateSnippet(id, title, description, code, language, tagList, isPublicFlag);
    }

    @MutationMapping
    public boolean deleteSnippet(@Argument String id) {
        return snippetService.deleteSnippet(id);
    }

    @MutationMapping
    public int incrementSnippetViews(@Argument String snippetId) {
        return (int) snippetService.incrementViews(snippetId);
    }
}
