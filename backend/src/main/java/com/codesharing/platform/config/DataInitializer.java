package com.codesharing.platform.config;

import com.codesharing.platform.entity.User;
import com.codesharing.platform.entity.UserRole;
import com.codesharing.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Database Initialization Component
 * Initializes default admin user on application startup if it doesn't exist
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) throws Exception {
        initializeDefaultAdminUser();
        initializeDefaultDemoUser();
    }
    
    /**
     * Initialize default admin user
     * Credentials: admin@example.com / admin123
     */
    private void initializeDefaultAdminUser() {
        try {
            String adminEmail = "admin@example.com";
            
            // Check if admin user already exists
            if (userRepository.findByEmail(adminEmail).isPresent()) {
                log.info("Admin user already exists");
                return;
            }
            
            User adminUser = User.builder()
                    .username("admin")
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(UserRole.ADMIN)
                    .avatar(null)
                    .bio("System Administrator")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .isActive(true)
                    .build();
            
            userRepository.save(adminUser);
            log.info("✅ Default admin user created successfully");
            log.info("📧 Admin Email: {}", adminEmail);
            log.info("🔑 Admin Password: admin123");
            log.info("⚠️  Please change the admin password in production!");
        } catch (Exception e) {
            log.error("Error initializing admin user", e);
        }
    }
    
    /**
     * Initialize default demo user
     * Credentials: demo@example.com / demo123
     */
    private void initializeDefaultDemoUser() {
        try {
            String demoEmail = "demo@example.com";
            
            // Check if demo user already exists
            if (userRepository.findByEmail(demoEmail).isPresent()) {
                log.info("Demo user already exists");
                return;
            }
            
            User demoUser = User.builder()
                    .username("demo")
                    .email(demoEmail)
                    .passwordHash(passwordEncoder.encode("demo123"))
                    .role(UserRole.USER)
                    .avatar(null)
                    .bio("Demo User Account")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .isActive(true)
                    .build();
            
            userRepository.save(demoUser);
            log.info("✅ Default demo user created successfully");
            log.info("📧 Demo Email: {}", demoEmail);
            log.info("🔑 Demo Password: demo123");
        } catch (Exception e) {
            log.error("Error initializing demo user", e);
        }
    }
}
