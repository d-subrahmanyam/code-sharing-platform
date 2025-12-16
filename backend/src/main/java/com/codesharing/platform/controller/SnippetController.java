package com.codesharing.platform.controller;

import com.codesharing.platform.dto.SnippetDTO;
import com.codesharing.platform.service.SnippetService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

/**
 * REST Controller for Tiny URL / Snippet Sharing Endpoints
 * Handles REST API requests for snippet sharing and lookup functionality
 */
@RestController
@RequestMapping("/api/snippets")
class SnippetSharingController {
    private final SnippetService snippetService;

    public SnippetSharingController(SnippetService snippetService) {
        this.snippetService = snippetService;
    }

    /**
     * Lookup snippet by tiny code
     * Resolves a short code to the actual snippet ID
     *
     * @param tinyCode The 6-character tiny code (e.g., "ABC123")
     * @return ResponseEntity with snippetId or 404 if not found
     */
    @GetMapping("/lookup/{tinyCode}")
    public ResponseEntity<Map<String, String>> lookupByTinyCode(@PathVariable String tinyCode) {
        String snippetId = snippetService.getSnippetIdByTinyCode(tinyCode);

        if (snippetId == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, String> response = new HashMap<>();
        response.put("snippetId", snippetId);
        response.put("id", snippetId);

        return ResponseEntity.ok(response);
    }

    /**
     * Create a tiny code for a snippet and return the mapping
     *
     * @param snippetId The snippet ID to create a tiny code for
     * @param userId The user ID creating the share
     * @return ResponseEntity with the tiny code and snippet ID
     */
    @GetMapping("/{snippetId}/share")
    public ResponseEntity<Map<String, String>> createShare(
            @PathVariable String snippetId,
            String userId) {

        String tinyCode = snippetService.createOrGetTinyCode(snippetId, userId != null ? userId : "anonymous");

        if (tinyCode == null) {
            return ResponseEntity.badRequest().build();
        }

        Map<String, String> response = new HashMap<>();
        response.put("snippetId", snippetId);
        response.put("tinyCode", tinyCode);

        return ResponseEntity.ok(response);
    }
}
