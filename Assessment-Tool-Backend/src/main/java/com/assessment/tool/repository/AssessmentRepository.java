package com.assessment.tool.repository;

import com.assessment.tool.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, String> {
    List<Assessment> findByEducatorId(String educatorId);
}
