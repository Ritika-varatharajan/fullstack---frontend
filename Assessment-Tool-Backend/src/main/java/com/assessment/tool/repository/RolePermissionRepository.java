package com.assessment.tool.repository;

import com.assessment.tool.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, String> {
    Optional<RolePermission> findByRole(String role);
}
