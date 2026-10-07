package com.assessment.tool.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import java.util.*;

@Entity
@Table(name = "assessments")
public class Assessment {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    private String id;

    private String title;

    private String category;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    private Integer timeLimit;

    private Integer totalMarks;

    private String type;

    private String topic;

    private String difficulty;

    private String dueDate;

    private String educatorId;

    @Column(name = "questions", columnDefinition = "LONGTEXT")
    private String questionsJson;

    public Assessment() {
    }

    public Assessment(String id, String title, String category, String instructions, Integer timeLimit, Integer totalMarks, String educatorId, String questionsJson) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.instructions = instructions;
        this.timeLimit = timeLimit;
        this.totalMarks = totalMarks;
        this.educatorId = educatorId;
        this.questionsJson = questionsJson;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public Integer getTimeLimit() {
        return timeLimit;
    }

    public void setTimeLimit(Integer timeLimit) {
        this.timeLimit = timeLimit;
    }

    public Integer getTotalMarks() {
        return totalMarks;
    }

    public void setTotalMarks(Integer totalMarks) {
        this.totalMarks = totalMarks;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public String getEducatorId() {
        return educatorId;
    }

    public void setEducatorId(String educatorId) {
        this.educatorId = educatorId;
    }

    public String getQuestionsJson() {
        return questionsJson;
    }

    public void setQuestionsJson(String questionsJson) {
        this.questionsJson = questionsJson;
    }

    // Dynamic Jackson getter & setter for 'questions' array
    public List<Object> getQuestions() {
        if (questionsJson == null || questionsJson.trim().isEmpty()) {
            return Collections.emptyList();
        }
        try {
            return MAPPER.readValue(questionsJson, new TypeReference<List<Object>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public void setQuestions(Object questions) {
        if (questions == null) {
            this.questionsJson = "[]";
            return;
        }
        if (questions instanceof String str) {
            this.questionsJson = str;
            return;
        }
        try {
            this.questionsJson = MAPPER.writeValueAsString(questions);
        } catch (JsonProcessingException e) {
            this.questionsJson = "[]";
        }
    }
}
