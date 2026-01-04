package com.codesharing.platform.service;

import com.codesharing.platform.dto.AuthPayload;
import com.codesharing.platform.dto.UserDTO;
import com.codesharing.platform.entity.User;
import com.codesharing.platform.entity.AdminUser;
import com.codesharing.platform.repository.UserRepository;
import com.codesharing.platform.repository.AdminUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, AdminUserRepository adminUserRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthPayload login(String email, String password) {
        // First, try to authenticate as a regular user
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            
            if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                return new AuthPayload(null, null, false, "Invalid password");
            }

            String token = generateToken(user.getId());
            UserDTO userDTO = new UserDTO(user.getId(), user.getUsername(), user.getEmail(), user.getRole().getValue());
            
            return new AuthPayload(token, userDTO, true, "Login successful");
        }
        
        // If not found in regular users, try admin users
        Optional<AdminUser> adminUserOptional = adminUserRepository.findByEmail(email);
        
        if (adminUserOptional.isPresent()) {
            AdminUser adminUser = adminUserOptional.get();
            
            if (!passwordEncoder.matches(password, adminUser.getPasswordHash())) {
                return new AuthPayload(null, null, false, "Invalid password");
            }

            String token = generateToken(adminUser.getId().toString());
            // AdminUser gets ADMIN role from their role entity
            String roleValue = adminUser.getRole() != null ? adminUser.getRole().getRoleType().name() : "ADMIN";
            UserDTO userDTO = new UserDTO(adminUser.getId().toString(), adminUser.getUsername(), adminUser.getEmail(), roleValue);
            
            return new AuthPayload(token, userDTO, true, "Login successful");
        }
        
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

        String token = generateToken(user.getId());
        UserDTO userDTO = new UserDTO(user.getId(), user.getUsername(), user.getEmail(), user.getRole().getValue());
        
        return new AuthPayload(token, userDTO, true, "Registration successful");
    }

    public Optional<User> getUserById(String userId) {
        return userRepository.findById(userId);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    private String generateToken(String userId) {
        // Simple token generation - in production use JWT
        return "token_" + userId + "_" + System.currentTimeMillis();
    }
}
