package com.codesharing.platform.dto;

import com.codesharing.platform.entity.AdminRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for admin user responses.
 * Contains user information without exposing password hash.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserDTO {

    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String roleName;
    private String roleDescription;
    private Boolean isActive;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
    private java.time.LocalDateTime lastLoginAt;
}
