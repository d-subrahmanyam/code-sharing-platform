package com.codesharing.platform.service;

import com.codesharing.platform.dto.AuthPayload;
import com.codesharing.platform.dto.UserDTO;
import com.codesharing.platform.entity.User;
import com.codesharing.platform.entity.AdminUser;
import com.codesharing.platform.repository.UserRepository;
import com.codesharing.platform.repository.AdminUserRepository;
import com.codesharing.platform.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class AuthService {
    private final UserRepository userRepository;
    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, AdminUserRepository adminUserRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthPayload login(String email, String password) {
        log.info("Login attempt for email: {}", email);
        
        // First, try to authenticate as a regular user
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isPresent()) {
            log.info("User found in users table: {}", email);
            User user = userOptional.get();
            
            if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                log.warn("Invalid password for user: {}", email);
                return new AuthPayload(null, null, false, "Invalid password");
            }

            String token = jwtUtil.generateToken(user.getUsername(), user.getRole().getValue());
            UserDTO userDTO = new UserDTO(user.getId(), user.getUsername(), user.getEmail(), user.getRole().getValue());
            log.info("User login successful: {} with role: {}", email, user.getRole().getValue());
            
            return new AuthPayload(token, userDTO, true, "Login successful");
        }
        
        log.info("User not found in users table, checking admin users table...");
        // If not found in regular users, try admin users
        Optional<AdminUser> adminUserOptional = adminUserRepository.findByEmail(email);
        
        if (adminUserOptional.isPresent()) {
            log.info("Admin user found: {}", email);
            AdminUser adminUser = adminUserOptional.get();
            
            if (!passwordEncoder.matches(password, adminUser.getPasswordHash())) {
                log.warn("Invalid password for admin user: {}", email);
                return new AuthPayload(null, null, false, "Invalid password");
            }

            // AdminUser gets ADMIN role from their role entity
            String roleValue = adminUser.getRole() != null ? adminUser.getRole().getRoleType().name() : "ADMIN";
            String token = jwtUtil.generateToken(adminUser.getUsername(), roleValue);
            UserDTO userDTO = new UserDTO(adminUser.getId().toString(), adminUser.getUsername(), adminUser.getEmail(), roleValue);
            log.info("Admin user login successful: {} with role: {}", email, roleValue);
            
            return new AuthPayload(token, userDTO, true, "Login successful");
        }
        
        log.warn("Login failed: User not found for email: {}", email);
        return new AuthPayload(null, null, false, "User not found");
    }

    public AuthPayload register(String username, String email, String password) {
        // Check if user already exists
        if (userRepository.findByEmail(email).isPresent()) {
            return new AuthPayload(null, null, false, "Email already registered");
        }

        if (userRepository.findByUsername(username).isPresent()) {
            return new AuthPayload(null, null, false, "Username already taken");
        }

        // Create new user
        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .isActive(true)
                .build();

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().getValue());
        UserDTO userDTO = new UserDTO(user.getId(), user.getUsername(), user.getEmail(), user.getRole().getValue());
        
        return new AuthPayload(token, userDTO, true, "Registration successful");
    }

    public Optional<User> getUserById(String userId) {
        return userRepository.findById(userId);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
