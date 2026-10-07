package com.assessment.tool.repository;

import com.assessment.tool.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, String> {
    List<Assignment> findByStudentId(String studentId);
    List<Assignment> findByAssessmentId(String assessmentId);
    boolean existsByStudentIdAndAssessmentId(String studentId, String assessmentId);
}
