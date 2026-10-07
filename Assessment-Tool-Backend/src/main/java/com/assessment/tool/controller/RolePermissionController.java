package com.assessment.tool.controller;

import com.assessment.tool.entity.RolePermission;
import com.assessment.tool.repository.RolePermissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles_permissions")
public class RolePermissionController {

    @Autowired
    private RolePermissionRepository rolePermissionRepository;

    @GetMapping
    public List<RolePermission> getAllRolePermissions() {
        return rolePermissionRepository.findAll();
    }
}
