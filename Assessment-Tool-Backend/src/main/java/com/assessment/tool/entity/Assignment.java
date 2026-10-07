package com.assessment.tool.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "assignments")
public class Assignment {

    @Id
    private String id;

    private String studentId;

    private String assessmentId;

    public Assignment() {
    }

    public Assignment(String id, String studentId, String assessmentId) {
        this.id = id;
        this.studentId = studentId;
        this.assessmentId = assessmentId;
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

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getAssessmentId() {
        return assessmentId;
    }

    public void setAssessmentId(String assessmentId) {
        this.assessmentId = assessmentId;
    }
}
