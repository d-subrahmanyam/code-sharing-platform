package com.codesharing.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AdminRole entity representing different roles for admin dashboard access.
 * Supports ADMIN (full access) and OWNER (view-only access) roles.
 */
@Entity
@Table(name = "admin_roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    @Enumerated(EnumType.STRING)
    private RoleType roleType;

    @Column(nullable = false)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private java.time.LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
    }

    /**
     * Enum for role types.
     * ADMIN: Full access to admin dashboard, can manage users and view all sessions
     * OWNER: View-only access to admin dashboard, can only view sessions
     */
    public enum RoleType {
        ADMIN("Full access to admin dashboard and user management"),
        OWNER("View-only access to admin dashboard");

        private final String description;

        RoleType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
