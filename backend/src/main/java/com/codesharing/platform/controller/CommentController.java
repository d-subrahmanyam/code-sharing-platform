package com.codesharing.platform.controller;

import com.codesharing.platform.dto.CommentDTO;
import com.codesharing.platform.service.CommentService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class CommentController {
    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @QueryMapping
    public List<CommentDTO> comments(@Argument String snippetId) {
        return commentService.getCommentsBySnippetId(snippetId);
    }

    @MutationMapping
    public CommentDTO addComment(@Argument String snippetId,
                                 @Argument String content) {
        // TODO: Get actual userId from security context
        String userId = "user-1"; // Temporary placeholder
        return commentService.addComment(snippetId, userId, content);
    }

    @MutationMapping
    public boolean deleteComment(@Argument String id) {
        return commentService.deleteComment(id);
    }
}
