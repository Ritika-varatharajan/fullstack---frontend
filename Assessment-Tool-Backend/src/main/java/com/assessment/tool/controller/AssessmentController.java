package com.assessment.tool.controller;

import com.assessment.tool.entity.Assessment;
import com.assessment.tool.repository.AssessmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/assessments")
public class AssessmentController {

    @Autowired
    private AssessmentRepository assessmentRepository;

    @GetMapping
    public List<Assessment> getAllAssessments() {
        return assessmentRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Assessment> getAssessmentById(@PathVariable String id) {
        return assessmentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Assessment createAssessment(@RequestBody Assessment assessment) {
        if (assessment.getId() == null || assessment.getId().trim().isEmpty()) {
            assessment.setId(UUID.randomUUID().toString().substring(0, 11));
        }
        return assessmentRepository.save(assessment);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Assessment> updateAssessment(@PathVariable String id, @RequestBody Assessment assessmentDetails) {
        return assessmentRepository.findById(id).map(assessment -> {
            if (assessmentDetails.getTitle() != null) assessment.setTitle(assessmentDetails.getTitle());
            if (assessmentDetails.getCategory() != null) assessment.setCategory(assessmentDetails.getCategory());
            if (assessmentDetails.getInstructions() != null) assessment.setInstructions(assessmentDetails.getInstructions());
            if (assessmentDetails.getTimeLimit() != null) assessment.setTimeLimit(assessmentDetails.getTimeLimit());
            if (assessmentDetails.getTotalMarks() != null) assessment.setTotalMarks(assessmentDetails.getTotalMarks());
            if (assessmentDetails.getEducatorId() != null) assessment.setEducatorId(assessmentDetails.getEducatorId());
            if (assessmentDetails.getQuestionsJson() != null) assessment.setQuestionsJson(assessmentDetails.getQuestionsJson());
            Assessment updated = assessmentRepository.save(assessment);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssessment(@PathVariable String id) {
        if (assessmentRepository.existsById(id)) {
            assessmentRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
