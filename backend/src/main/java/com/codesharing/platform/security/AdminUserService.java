package com.codesharing.platform.security;

import com.codesharing.platform.dto.AdminUserDTO;
import com.codesharing.platform.entity.AdminRole;
import com.codesharing.platform.entity.AdminUser;
import com.codesharing.platform.repository.AdminRoleRepository;
import com.codesharing.platform.repository.AdminUserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing admin users and authentication.
 * Handles user registration, authentication, and role assignment.
 */
@Slf4j
@Service
@Transactional
public class AdminUserService {

    private final AdminUserRepository userRepository;
    private final AdminRoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AdminUserService(AdminUserRepository userRepository, AdminRoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    /**
     * Authenticate user by username and password.
     * Returns the user if credentials are valid, null otherwise.
     */
    public AdminUser authenticate(String username, String password) {
        Optional<AdminUser> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isEmpty()) {
            log.warn("Authentication failed: user '{}' not found", username);
            return null;
        }

        AdminUser user = userOpt.get();

        if (!user.getIsActive()) {
            log.warn("Authentication failed: user '{}' is inactive", username);
            return null;
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            log.warn("Authentication failed: invalid password for user '{}'", username);
            return null;
        }

        // Update last login time
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("User '{}' authenticated successfully", username);
        return user;
    }

    /**
     * Create a new admin user.
     */
    public AdminUser createUser(String username, String password, String fullName, String email, String roleName) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username '" + username + "' already exists");
        }

        if (email != null && userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email '" + email + "' already exists");
        }

        Optional<AdminRole> roleOpt = roleRepository.findByRoleType(AdminRole.RoleType.valueOf(roleName.toUpperCase()));
        if (roleOpt.isEmpty()) {
            throw new IllegalArgumentException("Role '" + roleName + "' not found");
        }

        String passwordHash = passwordEncoder.encode(password);

        AdminUser user = AdminUser.builder()
                .username(username)
                .passwordHash(passwordHash)
                .fullName(fullName)
                .email(email)
                .role(roleOpt.get())
                .isActive(true)
                .build();

        user = userRepository.save(user);
        log.info("Admin user '{}' created with role '{}'", username, roleName);
        return user;
    }

    /**
     * Get user by username.
     */
    public Optional<AdminUser> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * Get all active admin users.
     */
    public List<AdminUserDTO> getAllActiveUsers() {
        return userRepository.findAllByIsActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Update user role.
     */
    public AdminUser updateUserRole(Long userId, String roleName) {
        Optional<AdminUser> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User with ID " + userId + " not found");
        }

        Optional<AdminRole> roleOpt = roleRepository.findByRoleType(AdminRole.RoleType.valueOf(roleName.toUpperCase()));
        if (roleOpt.isEmpty()) {
            throw new IllegalArgumentException("Role '" + roleName + "' not found");
        }

        AdminUser user = userOpt.get();
        user.setRole(roleOpt.get());
        user = userRepository.save(user);
        log.info("User '{}' role updated to '{}'", user.getUsername(), roleName);
        return user;
    }

    /**
     * Deactivate user account.
     */
    public AdminUser deactivateUser(Long userId) {
        Optional<AdminUser> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User with ID " + userId + " not found");
        }

        AdminUser user = userOpt.get();
        user.setIsActive(false);
        user = userRepository.save(user);
        log.info("User '{}' deactivated", user.getUsername());
        return user;
    }

    /**
     * Change user password.
     */
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        Optional<AdminUser> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User with ID " + userId + " not found");
        }

        AdminUser user = userOpt.get();

        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Old password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password changed for user '{}'", user.getUsername());
    }

    /**
     * Convert AdminUser entity to DTO.
     */
    public AdminUserDTO convertToDTO(AdminUser user) {
        return AdminUserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .roleName(user.getRole().getRoleType().name())
                .roleDescription(user.getRole().getRoleType().getDescription())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
