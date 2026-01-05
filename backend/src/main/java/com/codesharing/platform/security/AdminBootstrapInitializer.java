package com.codesharing.platform.security;

import com.codesharing.platform.entity.AdminRole;
import com.codesharing.platform.repository.AdminRoleRepository;
import com.codesharing.platform.repository.AdminUserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Bootstrap initialization for admin dashboard roles and default user.
 * Creates default roles (ADMIN, OWNER) and the initial admin user if they don't exist.
 * Initial credentials: username=admin, password=pa55ward
 */
@Slf4j
@Component
public class AdminBootstrapInitializer implements CommandLineRunner {

    private final AdminRoleRepository roleRepository;
    private final AdminUserService adminUserService;

    public AdminBootstrapInitializer(AdminRoleRepository roleRepository, AdminUserService adminUserService) {
        this.roleRepository = roleRepository;
        this.adminUserService = adminUserService;
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("Initializing admin dashboard roles and default user...");

        // Initialize roles if they don't exist
        initializeRoles();

        // Initialize default admin user if it doesn't exist
        initializeDefaultAdmin();

        log.info("Admin dashboard initialization completed");
    }

    private void initializeRoles() {
        // Initialize ADMIN role
        if (roleRepository.findByRoleType(AdminRole.RoleType.ADMIN).isEmpty()) {
            AdminRole adminRole = AdminRole.builder()
                    .roleType(AdminRole.RoleType.ADMIN)
                    .description("Full access to admin dashboard, can manage users and view all sessions")
                    .build();
            roleRepository.save(adminRole);
            log.info("Created ADMIN role");
        }

        // Initialize OWNER role
        if (roleRepository.findByRoleType(AdminRole.RoleType.OWNER).isEmpty()) {
            AdminRole ownerRole = AdminRole.builder()
                    .roleType(AdminRole.RoleType.OWNER)
                    .description("View-only access to admin dashboard, can only view sessions")
                    .build();
            roleRepository.save(ownerRole);
            log.info("Created OWNER role");
        }
    }

    private void initializeDefaultAdmin() {
        // Check if admin user already exists
        if (adminUserService.getUserByUsername("admin").isPresent()) {
            log.info("Default admin user already exists");
            return;
        }

        try {
            adminUserService.createUser(
                    "admin",
                    "pa55ward",
                    "System Administrator",
                    "admin@codesharing.local",
                    "ADMIN"
            );
            log.info("Created default admin user with username 'admin'");
            log.warn("IMPORTANT: Change the default admin password in production!");
        } catch (IllegalArgumentException e) {
            log.warn("Failed to create default admin user: {}", e.getMessage());
        }
    }
}
