package com.codesharing.platform.service;

import com.codesharing.platform.dto.CommentDTO;
import com.codesharing.platform.entity.Comment;
import com.codesharing.platform.entity.User;
import com.codesharing.platform.repository.UserRepository;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class CommentService {
    private final MongoTemplate mongoTemplate;
    private final UserRepository userRepository;

    public CommentService(MongoTemplate mongoTemplate, UserRepository userRepository) {
        this.mongoTemplate = mongoTemplate;
        this.userRepository = userRepository;
    }

    public CommentDTO addComment(String snippetId, String authorId, String content) {
        Comment comment = Comment.builder()
                .id(UUID.randomUUID().toString())
                .snippetId(snippetId)
                .authorId(authorId)
                .content(content)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        mongoTemplate.save(comment);
        return convertToDTO(comment);
    }

    public List<CommentDTO> getCommentsBySnippetId(String snippetId) {
        Query query = new Query(Criteria.where("snippetId").is(snippetId));
        List<Comment> comments = mongoTemplate.find(query, Comment.class);
        return comments.stream().map(this::convertToDTO).toList();
    }

    public boolean deleteComment(String id) {
        Comment comment = mongoTemplate.findById(id, Comment.class);
        if (comment != null) {
            mongoTemplate.remove(comment);
            return true;
        }
        return false;
    }

    private CommentDTO convertToDTO(Comment comment) {
        Optional<User> user = userRepository.findById(comment.getAuthorId());
        String authorUsername = user.map(User::getUsername).orElse("Anonymous");
        
        CommentDTO dto = new CommentDTO();
        dto.setId(comment.getId());
        dto.setSnippetId(comment.getSnippetId());
        dto.setAuthorId(comment.getAuthorId());
        dto.setAuthorUsername(authorUsername);
        dto.setContent(comment.getContent());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());
        
        return dto;
    }
}
