package com.codesharing.platform.controller;

import com.codesharing.platform.dto.AuthPayload;
import com.codesharing.platform.service.AuthService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @MutationMapping
    public AuthPayload login(@Argument String email, @Argument String password) {
        return authService.login(email, password);
    }

    @MutationMapping
    public AuthPayload register(@Argument String username, @Argument String email, @Argument String password) {
        return authService.register(username, email, password);
    }

    @QueryMapping
    public String hello() {
        return "Welcome to Code Sharing Platform!";
    }
}
