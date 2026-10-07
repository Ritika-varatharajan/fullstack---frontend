package com.assessment.tool.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import java.util.*;

@Entity
@Table(name = "roles_permissions")
public class RolePermission {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    private String id;

    private String role;

    @Column(name = "permissions", columnDefinition = "TEXT")
    private String permissionsJson;

    public RolePermission() {
    }

    public RolePermission(String id, String role, String permissionsJson) {
        this.id = id;
        this.role = role;
        this.permissionsJson = permissionsJson;
    }

    @PrePersist
    public void ensureId() {
        if (this.id == null || this.id.trim().isEmpty()) {
            this.id = UUID.randomUUID().toString().substring(0, 11);
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPermissionsJson() {
        return permissionsJson;
    }

    public void setPermissionsJson(String permissionsJson) {
        this.permissionsJson = permissionsJson;
    }

    public List<String> getPermissions() {
        if (permissionsJson == null || permissionsJson.trim().isEmpty()) {
            return Collections.emptyList();
        }
        try {
            return MAPPER.readValue(permissionsJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public void setPermissions(Object permissions) {
        if (permissions == null) {
            this.permissionsJson = "[]";
            return;
        }
        if (permissions instanceof String str) {
            this.permissionsJson = str;
            return;
        }
        try {
            this.permissionsJson = MAPPER.writeValueAsString(permissions);
        } catch (JsonProcessingException e) {
            this.permissionsJson = "[]";
        }
    }
}
