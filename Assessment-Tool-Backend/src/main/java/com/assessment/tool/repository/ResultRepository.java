package com.assessment.tool.repository;

import com.assessment.tool.entity.Result;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResultRepository extends JpaRepository<Result, String> {
    List<Result> findByStudentId(String studentId);
    List<Result> findByUserId(String userId);
    List<Result> findByAssessmentId(String assessmentId);
}
