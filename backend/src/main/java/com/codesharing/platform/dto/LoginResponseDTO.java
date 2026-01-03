package com.codesharing.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for login response.
 * Contains JWT token and user information after successful authentication.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponseDTO {

    private String token;
    private String username;
    private String fullName;
    private String roleName;
    private Long expiresIn; // Token expiration time in milliseconds
}
