package com.assessment.tool.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "reports")
public class Report {

    @Id
    private String id;

    private String title;

    private Integer totalUsers;

    private Integer totalStudents;

    private Integer totalEducators;

    private Integer totalAdmins;

    private String generatedAt;

    public Report() {
    }

    public Report(String id, String title, Integer totalUsers, Integer totalStudents, Integer totalEducators, Integer totalAdmins, String generatedAt) {
        this.id = id;
        this.title = title;
        this.totalUsers = totalUsers;
        this.totalStudents = totalStudents;
        this.totalEducators = totalEducators;
        this.totalAdmins = totalAdmins;
        this.generatedAt = generatedAt;
    }

    @PrePersist
    public void ensureId() {
        if (this.id == null || this.id.trim().isEmpty()) {
            this.id = UUID.randomUUID().toString().substring(0, 11);
        }
        if (this.generatedAt == null) {
            this.generatedAt = java.time.Instant.now().toString();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Integer getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(Integer totalUsers) {
        this.totalUsers = totalUsers;
    }

    public Integer getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(Integer totalStudents) {
        this.totalStudents = totalStudents;
    }

    public Integer getTotalEducators() {
        return totalEducators;
    }

    public void setTotalEducators(Integer totalEducators) {
        this.totalEducators = totalEducators;
    }

    public Integer getTotalAdmins() {
        return totalAdmins;
    }

    public void setTotalAdmins(Integer totalAdmins) {
        this.totalAdmins = totalAdmins;
    }

    public String getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(String generatedAt) {
        this.generatedAt = generatedAt;
    }
}
