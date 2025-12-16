package com.codesharing.platform.dto;

public class AuthPayload {
    private String token;
    private UserDTO user;
    private Boolean success;
    private String message;

    public AuthPayload() {}

    public AuthPayload(String token, UserDTO user, Boolean success, String message) {
        this.token = token;
        this.user = user;
        this.success = success;
        this.message = message;
    }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public UserDTO getUser() { return user; }
    public void setUser(UserDTO user) { this.user = user; }

    public Boolean getSuccess() { return success; }
    public void setSuccess(Boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
