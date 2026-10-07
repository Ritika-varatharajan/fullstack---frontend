package com.assessment.tool.controller;

import com.assessment.tool.entity.Result;
import com.assessment.tool.repository.ResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/results")
public class ResultController {

    @Autowired
    private ResultRepository resultRepository;

    @GetMapping
    public List<Result> getAllResults() {
        return resultRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Result> getResultById(@PathVariable String id) {
        return resultRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Result createResult(@RequestBody Result result) {
        if (result.getId() == null || result.getId().trim().isEmpty()) {
            result.setId(UUID.randomUUID().toString().substring(0, 11));
        }
        if (result.getSubmittedAt() == null || result.getSubmittedAt().trim().isEmpty()) {
            result.setSubmittedAt(java.time.Instant.now().toString());
        }
        return resultRepository.save(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Result> updateResult(@PathVariable String id, @RequestBody Result updatedResult) {
        return resultRepository.findById(id).map(existing -> {
            if (updatedResult.getScore() != null) existing.setScore(updatedResult.getScore());
            if (updatedResult.getTotalMarks() != null) existing.setTotalMarks(updatedResult.getTotalMarks());
            if (updatedResult.getPercentage() != null) existing.setPercentage(updatedResult.getPercentage());
            if (updatedResult.getFeedback() != null) existing.setFeedback(updatedResult.getFeedback());
            if (updatedResult.getNeedsEvaluation() != null) existing.setNeedsEvaluation(updatedResult.getNeedsEvaluation());
            if (updatedResult.getStatus() != null) existing.setStatus(updatedResult.getStatus());
            if (updatedResult.getQuestionBreakdownJson() != null) existing.setQuestionBreakdownJson(updatedResult.getQuestionBreakdownJson());
            if (updatedResult.getCompleted() != null) existing.setCompleted(updatedResult.getCompleted());

            Result saved = resultRepository.save(existing);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResult(@PathVariable String id) {
        if (resultRepository.existsById(id)) {
            resultRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
