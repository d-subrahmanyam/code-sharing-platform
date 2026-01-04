package com.codesharing.platform.repository;

import com.codesharing.platform.entity.AdminRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for AdminRole entity.
 * Provides database access methods for role management.
 */
@Repository
public interface AdminRoleRepository extends JpaRepository<AdminRole, Long> {

    /**
     * Find role by role type.
     */
    Optional<AdminRole> findByRoleType(AdminRole.RoleType roleType);
}
