package com.codesharing.platform.entity;

/**
 * User Role Enum
 * Defines the roles available in the system
 */
public enum UserRole {
    USER("USER"),
    ADMIN("ADMIN");

    private final String value;

    UserRole(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    /**
     * Get UserRole from string value
     */
    public static UserRole fromValue(String value) {
        for (UserRole role : UserRole.values()) {
            if (role.value.equals(value)) {
                return role;
            }
        }
        return USER;
    }
}
