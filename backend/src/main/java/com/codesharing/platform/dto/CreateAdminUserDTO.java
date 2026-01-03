package com.codesharing.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating or updating admin users.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAdminUserDTO {

    private String username;
    private String password;
    private String fullName;
    private String email;
    private String roleName; // "ADMIN" or "OWNER"
}
