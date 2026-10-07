package com.assessment.tool.controller;

import com.assessment.tool.entity.User;
import com.assessment.tool.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<User> getUsers(@RequestParam(required = false) String email) {
        if (email != null && !email.trim().isEmpty()) {
            return userRepository.findByEmailIgnoreCase(email.trim());
        }
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        if (user.getId() == null || user.getId().trim().isEmpty()) {
            user.setId(UUID.randomUUID().toString().substring(0, 11));
        }
        if (user.getStatus() == null || user.getStatus().trim().isEmpty()) {
            user.setStatus("active");
        }
        if (user.getCreatedAt() == null || user.getCreatedAt().trim().isEmpty()) {
            user.setCreatedAt(java.time.Instant.now().toString());
        }
        return userRepository.save(user);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable String id, @RequestBody User userDetails) {
        return userRepository.findById(id).map(user -> {
            if (userDetails.getFullName() != null) user.setFullName(userDetails.getFullName());
            if (userDetails.getEmail() != null) user.setEmail(userDetails.getEmail());
            if (userDetails.getPassword() != null) user.setPassword(userDetails.getPassword());
            if (userDetails.getRole() != null) user.setRole(userDetails.getRole());
            if (userDetails.getStatus() != null) user.setStatus(userDetails.getStatus());
            User updated = userRepository.save(user);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
