package com.assessment.tool.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import java.util.*;

@Entity
@Table(name = "results")
public class Result {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    private String id;

    private String userId;

    private String studentId;

    private String assessmentId;

    private String educatorId;

    private Double score;

    private Double totalMarks;

    private Double percentage;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    private Boolean needsEvaluation;

    private String status;

    private Boolean completed;

    private String submittedAt;

    @Column(name = "question_breakdown", columnDefinition = "LONGTEXT")
    private String questionBreakdownJson;

    public Result() {
    }

    public Result(String id, String userId, String studentId, String assessmentId, String educatorId, Double score, Boolean completed, String submittedAt) {
        this.id = id;
        this.userId = userId;
        this.studentId = studentId;
        this.assessmentId = assessmentId;
        this.educatorId = educatorId;
        this.score = score;
        this.completed = completed;
        this.submittedAt = submittedAt;
    }

    @PrePersist
    public void ensureId() {
        if (this.id == null || this.id.trim().isEmpty()) {
            this.id = UUID.randomUUID().toString().substring(0, 11);
        }
        if (this.submittedAt == null) {
            this.submittedAt = java.time.Instant.now().toString();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
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

    public String getEducatorId() {
        return educatorId;
    }

    public void setEducatorId(String educatorId) {
        this.educatorId = educatorId;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public Double getTotalMarks() {
        return totalMarks;
    }

    public void setTotalMarks(Double totalMarks) {
        this.totalMarks = totalMarks;
    }

    public Double getPercentage() {
        return percentage;
    }

    public void setPercentage(Double percentage) {
        this.percentage = percentage;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public Boolean getNeedsEvaluation() {
        return needsEvaluation;
    }

    public void setNeedsEvaluation(Boolean needsEvaluation) {
        this.needsEvaluation = needsEvaluation;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }

    public String getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(String submittedAt) {
        this.submittedAt = submittedAt;
    }

    public String getQuestionBreakdownJson() {
        return questionBreakdownJson;
    }

    public void setQuestionBreakdownJson(String questionBreakdownJson) {
        this.questionBreakdownJson = questionBreakdownJson;
    }

    public List<Object> getQuestionBreakdown() {
        if (questionBreakdownJson == null || questionBreakdownJson.trim().isEmpty()) {
            return Collections.emptyList();
        }
        try {
            return MAPPER.readValue(questionBreakdownJson, new TypeReference<List<Object>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public void setQuestionBreakdown(Object questionBreakdown) {
        if (questionBreakdown == null) {
            this.questionBreakdownJson = "[]";
            return;
        }
        if (questionBreakdown instanceof String str) {
            this.questionBreakdownJson = str;
            return;
        }
        try {
            this.questionBreakdownJson = MAPPER.writeValueAsString(questionBreakdown);
        } catch (JsonProcessingException e) {
            this.questionBreakdownJson = "[]";
        }
    }
}
