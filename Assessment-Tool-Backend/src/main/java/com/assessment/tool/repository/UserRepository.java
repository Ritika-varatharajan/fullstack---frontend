package com.assessment.tool.repository;

import com.assessment.tool.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    List<User> findByEmailIgnoreCase(String email);
    List<User> findByRole(String role);
}
