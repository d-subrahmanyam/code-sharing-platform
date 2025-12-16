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
