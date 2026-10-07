package com.assessment.tool.controller;

import com.assessment.tool.entity.ActivityLog;
import com.assessment.tool.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity_logs")
public class ActivityLogController {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @GetMapping
    public List<ActivityLog> getAllActivityLogs() {
        return activityLogRepository.findAll();
    }
}
