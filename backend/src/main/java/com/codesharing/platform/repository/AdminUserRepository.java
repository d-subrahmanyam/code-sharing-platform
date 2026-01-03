package com.codesharing.platform.repository;

import com.codesharing.platform.entity.AdminUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for AdminUser entity.
 * Provides database access methods for admin user management.
 */
@Repository
public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {

    /**
     * Find admin user by username.
     */
    Optional<AdminUser> findByUsername(String username);

    /**
     * Find admin user by email.
     */
    Optional<AdminUser> findByEmail(String email);

    /**
     * Check if username exists.
     */
    boolean existsByUsername(String username);

    /**
     * Check if email exists.
     */
    boolean existsByEmail(String email);

    /**
     * Find all active admin users.
     */
    java.util.List<AdminUser> findAllByIsActiveTrue();
}
