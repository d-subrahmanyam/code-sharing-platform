package com.codesharing.platform.service;

import com.codesharing.platform.dto.SnippetDTO;
import com.codesharing.platform.entity.CodeSnippet;
import com.codesharing.platform.entity.User;
import com.codesharing.platform.repository.TinyUrlRepository;
import com.codesharing.platform.repository.UserRepository;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SnippetService {
    private final MongoTemplate mongoTemplate;
    private final UserRepository userRepository;
    private final TinyUrlRepository tinyUrlRepository;

    public SnippetService(MongoTemplate mongoTemplate, UserRepository userRepository, 
                         TinyUrlRepository tinyUrlRepository) {
        this.mongoTemplate = mongoTemplate;
        this.userRepository = userRepository;
        this.tinyUrlRepository = tinyUrlRepository;
    }

    public SnippetDTO createSnippet(String authorId, String title, String description,
                                    String code, String language, List<String> tags, boolean isPublic) {
        CodeSnippet snippet = CodeSnippet.builder()
                .id(UUID.randomUUID().toString())
                .title(title)
                .description(description)
                .code(code)
                .language(language)
                .authorId(authorId)
                .tags(tags != null ? tags : new ArrayList<>())
                .isPublic(isPublic)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .views(0)
                .build();

        mongoTemplate.save(snippet);
        return convertToDTO(snippet);
    }

    public SnippetDTO getSnippetById(String id) {
        CodeSnippet snippet = mongoTemplate.findById(id, CodeSnippet.class);
        if (snippet != null) {
            return convertToDTO(snippet);
        }
        return null;
    }

    public List<SnippetDTO> getAllSnippets(int limit, int offset) {
        Query query = new Query().skip(offset).limit(limit);
        List<CodeSnippet> snippets = mongoTemplate.find(query, CodeSnippet.class);
        return snippets.stream().map(this::convertToDTO).toList();
    }

    public List<SnippetDTO> searchSnippets(String query, int limit) {
        Criteria criteria = new Criteria().orOperator(
                Criteria.where("title").regex(query, "i"),
                Criteria.where("description").regex(query, "i"),
                Criteria.where("code").regex(query, "i")
        );
        
        Query mongoQuery = new Query(criteria).limit(limit);
        List<CodeSnippet> snippets = mongoTemplate.find(mongoQuery, CodeSnippet.class);
        return snippets.stream().map(this::convertToDTO).toList();
    }

    public List<SnippetDTO> getSnippetsByLanguage(String language, int limit) {
        Query query = new Query(Criteria.where("language").is(language)).limit(limit);
        List<CodeSnippet> snippets = mongoTemplate.find(query, CodeSnippet.class);
        return snippets.stream().map(this::convertToDTO).toList();
    }

    public SnippetDTO updateSnippet(String id, String title, String description,
                                    String code, String language, List<String> tags, boolean isPublic) {
        CodeSnippet snippet = mongoTemplate.findById(id, CodeSnippet.class);
        
        if (snippet != null) {
            snippet.setTitle(title);
            snippet.setDescription(description);
            snippet.setCode(code);
            snippet.setLanguage(language);
            snippet.setTags(tags != null ? tags : new ArrayList<>());
            snippet.setPublic(isPublic);
            snippet.setUpdatedAt(LocalDateTime.now());
            
            mongoTemplate.save(snippet);
            return convertToDTO(snippet);
        }
        return null;
    }

    public boolean deleteSnippet(String id) {
        CodeSnippet snippet = mongoTemplate.findById(id, CodeSnippet.class);
        if (snippet != null) {
            mongoTemplate.remove(snippet);
            return true;
        }
        return false;
    }

    public long incrementViews(String snippetId) {
        CodeSnippet snippet = mongoTemplate.findById(snippetId, CodeSnippet.class);
        if (snippet != null) {
            snippet.setViews(snippet.getViews() + 1);
            mongoTemplate.save(snippet);
            return snippet.getViews();
        }
        return 0;
    }

    /**
     * Get snippet ID by tiny code
     * Resolves a short code to the actual snippet ID
     *
     * @param tinyCode The 6-character tiny code
     * @return The snippet ID or null if not found
     */
    public String getSnippetIdByTinyCode(String tinyCode) {
        try {
            var tinyUrl = tinyUrlRepository.findByShortCode(tinyCode);
            
            if (tinyUrl.isPresent()) {
                var url = tinyUrl.get();
                // Check if the URL has expired
                if (url.getExpiresAt() != null && url.getExpiresAt().isBefore(LocalDateTime.now())) {
                    return null; // Expired
                }
                return url.getSnippetId();
            }
        } catch (Exception e) {
            // Log error if needed
        }
        return null;
    }

    /**
     * Get owner details by tiny code
     * Returns owner user ID and username
     *
     * @param tinyCode The 6-character tiny code
     * @return Map with snippetId, ownerId, and ownerUsername, or null if not found
     */
    public Map<String, String> getOwnerDetailsByTinyCode(String tinyCode) {
        try {
            var tinyUrl = tinyUrlRepository.findByShortCode(tinyCode);
            
            if (tinyUrl.isPresent()) {
                var url = tinyUrl.get();
                // Check if the URL has expired
                if (url.getExpiresAt() != null && url.getExpiresAt().isBefore(LocalDateTime.now())) {
                    return null; // Expired
                }
                
                // Get the owner's username from User repository
                String ownerUsername = null;
                var user = userRepository.findById(url.getUserId());
                if (user.isPresent()) {
                    ownerUsername = user.get().getUsername();
                }
                
                Map<String, String> result = new HashMap<>();
                result.put("snippetId", url.getSnippetId());
                result.put("ownerId", url.getUserId());
                result.put("ownerUsername", ownerUsername != null ? ownerUsername : "Unknown");
                result.put("tinyCode", tinyCode);
                
                return result;
            }
        } catch (Exception e) {
            // Log error if needed
        }
        return null;
    }

    /**
     * Create or get a tiny code for a snippet
     * Generates a new tiny code if one doesn't exist, or returns the existing one
     *
     * @param snippetId The snippet ID
     * @param userId The user ID
     * @return The tiny code or null if snippet doesn't exist
     */
    public String createOrGetTinyCode(String snippetId, String userId) {
        try {
            // Check if snippet exists
            CodeSnippet snippet = mongoTemplate.findById(snippetId, CodeSnippet.class);
            if (snippet == null) {
                return null;
            }

            // Check if a tiny code already exists for this snippet
            var existing = tinyUrlRepository.findBySnippetId(snippetId);
            if (existing.isPresent()) {
                var url = existing.get();
                // Check if expired
                if (url.getExpiresAt() == null || url.getExpiresAt().isAfter(LocalDateTime.now())) {
                    return url.getShortCode();
                }
            }

            // Generate a new tiny code
            String tinyCode = generateUniqueTinyCode();

            var tinyUrl = new com.codesharing.platform.entity.TinyUrl();
            tinyUrl.setId(UUID.randomUUID().toString());
            tinyUrl.setShortCode(tinyCode);
            tinyUrl.setSnippetId(snippetId);
            tinyUrl.setUserId(userId);
            tinyUrl.setCreatedAt(LocalDateTime.now());
            // No expiration by default, or set 30 days expiration
            // tinyUrl.setExpiresAt(LocalDateTime.now().plusDays(30));

            tinyUrlRepository.save(tinyUrl);
            return tinyCode;
        } catch (Exception e) {
            // Log error if needed
        }
        return null;
    }

    /**
     * Generate a unique tiny code
     * Ensures the code doesn't already exist in the database
     *
     * @return A unique 6-character alphanumeric code
     */
    private String generateUniqueTinyCode() {
        String code;
        do {
            code = generateRandomTinyCode();
        } while (tinyUrlRepository.findByShortCode(code).isPresent());

        return code;
    }

    /**
     * Generate a random 6-character alphanumeric code
     * Similar to the frontend implementation
     *
     * @return A 6-character code
     */
    private String generateRandomTinyCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder code = new StringBuilder();
        Random random = new Random();

        for (int i = 0; i < 6; i++) {
            code.append(chars.charAt(random.nextInt(chars.length())));
        }

        return code.toString();
    }

    private SnippetDTO convertToDTO(CodeSnippet snippet) {
        Optional<User> user = userRepository.findById(snippet.getAuthorId());
        String authorUsername = user.map(User::getUsername).orElse("Anonymous");
        
        SnippetDTO dto = new SnippetDTO();
        dto.setId(snippet.getId());
        dto.setTitle(snippet.getTitle());
        dto.setDescription(snippet.getDescription());
        dto.setCode(snippet.getCode());
        dto.setLanguage(snippet.getLanguage());
        dto.setAuthorId(snippet.getAuthorId());
        dto.setAuthorUsername(authorUsername);
        dto.setTags(snippet.getTags());
        dto.setViews(Math.toIntExact(snippet.getViews()));
        dto.setIsPublic(snippet.isPublic());
        dto.setShareUrl(snippet.getShareUrl());
        dto.setCreatedAt(snippet.getCreatedAt());
        dto.setUpdatedAt(snippet.getUpdatedAt());
        
        return dto;
    }
}
