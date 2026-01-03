package com.codesharing.platform.service;

import com.codesharing.platform.dto.AuthPayload;
import com.codesharing.platform.dto.UserDTO;
import com.codesharing.platform.entity.User;
import com.codesharing.platform.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthPayload login(String email, String password) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isEmpty()) {
            return new AuthPayload(null, null, false, "User not found");
        }

        User user = userOptional.get();
        
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            return new AuthPayload(null, null, false, "Invalid password");
        }

        String token = generateToken(user.getId());
        UserDTO userDTO = new UserDTO(user.getId(), user.getUsername(), user.getEmail(), user.getRole().getValue());
        
        return new AuthPayload(token, userDTO, true, "Login successful");
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
