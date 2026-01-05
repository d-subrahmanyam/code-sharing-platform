package com.codesharing.platform.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT utility for generating and validating JWT tokens for admin authentication.
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret:admin-dashboard-secret-key-this-must-be-at-least-64-bytes-long-for-hs512-algorithm-compliance-please-change-in-production}")
    private String secret;

    @Value("${jwt.expiration:86400000}") // 24 hours by default
    private Long expiration;

    /**
     * Generate JWT token for admin user.
     */
    public String generateToken(String username, String roleName) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .setSubject(username)
                .claim("role", roleName)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * Get username from JWT token.
     */
    public String getUsernameFromToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Get role from JWT token.
     */
    public String getRoleFromToken(String token) {
        try {
            return (String) Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .get("role");
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Validate JWT token.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Long getExpirationInMillis() {
        return expiration;
    }
}
