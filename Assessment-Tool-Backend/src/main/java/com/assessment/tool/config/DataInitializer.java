package com.assessment.tool.config;

import com.assessment.tool.entity.*;
import com.assessment.tool.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private ResultRepository resultRepository;

    @Autowired
    private RolePermissionRepository rolePermissionRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            System.out.println("🌱 Initializing MySQL Database with Default Seed Data...");

            // 1. Users
            User student1 = new User("3", "Student One", "student@test.com", "123456", "Student", "active", "2026-04-03T10:00:00Z");
            User admin1 = new User("PFnMC3zk1AY", "ritika", "riti@gmail.com", "1234", "Administrator", "active", "2026-04-10T14:53:42.404Z");
            User student2 = new User("bhp1jeMm6Y8", "student", "student101@gmail.com", "1234", "Student", "active", "2026-04-10T10:00:00Z");
            User educator1 = new User("0zjd0dKl2Tc", "sandy", "sandy@gmail.com", "1234", "Educator", "active", "2026-04-11T07:02:21.076Z");
            User student3 = new User("PdZgYWhCVmY", "Gobika", "Gobika@gmail.com", "0909", "Student", "active", "2026-04-11T08:34:00.236Z");
            User educator2 = new User("qLVDTvcolkM", "gobikaks", "gobikaks@gmail.com", "1234", "Educator", "active", "2026-04-11T08:36:57.242Z");
            User admin2 = new User("aBaPUSq4TuY", "alice", "alice@gmail.com", "1234", "Administrator", "active", "2026-04-11T08:47:35.114Z");
            User student4 = new User("u8FGRisUmeQ", "rithu", "rithu@gmail.com", "1234", "Student", "active", "2026-04-14T05:39:53.648Z");
            User educator3 = new User("RWEMIP5y9Vw", "Harina", "harina0714@gmail.com", "Harina0705", "Educator", "active", "2026-04-14T09:46:04.757Z");
            User student5 = new User("6nIIXMQMMZE", "ritika student", "hari@gmail.com", "hari0705", "Student", "active", "2026-04-14T09:48:00.288Z");

            userRepository.saveAll(List.of(student1, admin1, student2, educator1, student3, educator2, admin2, student4, educator3, student5));

            // 2. Role Permissions
            RolePermission adminRole = new RolePermission("1", "Administrator", "[\"manage_users\",\"view_reports\",\"manage_assessments\"]");
            RolePermission educatorRole = new RolePermission("2", "Educator", "[\"create_assessment\",\"edit_assessment\",\"view_results\"]");
            RolePermission studentRole = new RolePermission("3", "Student", "[\"take_assessment\",\"view_feedback\"]");
            rolePermissionRepository.saveAll(List.of(adminRole, educatorRole, studentRole));

            // 3. Activity Logs
            ActivityLog log1 = new ActivityLog("1", "PFnMC3zk1AY", "Created new user", "2026-04-05T10:00:00Z");
            activityLogRepository.save(log1);

            // 4. Assessments
            String q1 = "[{\"question\":\"2 + 2 = ?\",\"type\":\"mcq\",\"options\":[\"4\",\"5\",\"6\",\"7\"],\"correctAnswer\":\"4\",\"marks\":5}]";
            Assessment a1 = new Assessment("A1L18l_CYJ8", "Mathematics Basic", "Maths", "Answer all questions", 30, 5, "0zjd0dKl2Tc", q1);

            String q2 = "[{\"question\":\"What is DevOps?\",\"type\":\"mcq\",\"options\":[\"Development + Operations\",\"Only Development\",\"Only Testing\",\"None\"],\"correctAnswer\":\"Development + Operations\",\"marks\":10}]";
            Assessment a2 = new Assessment("imAIWIVdmYQ", "Web DevOps", "Programming", "Choose correct answer", 30, 10, "PFnMC3zk1AY", q2);

            String q3 = "[{\"question\":\"what is science\",\"type\":\"mcq\",\"options\":[\"hello\",\"hii\",\"vanalak\",\"vanakam\"],\"correctAnswer\":\"vanakam\",\"marks\":10}]";
            Assessment a3 = new Assessment("8I1zne0kuys", "Science Basic", "Bio", "Answer carefully", 30, 10, "0zjd0dKl2Tc", q3);

            String q4 = "[{\"question\":\"2+2+5\",\"type\":\"mcq\",\"options\":[\"1\",\"2\",\"8\",\"9\"],\"correctAnswer\":\"9\",\"marks\":1}]";
            Assessment a4 = new Assessment("MekuuglbgRM", "Algebra", "Maths", "Calculate result", 25, 1, "RWEMIP5y9Vw", q4);

            assessmentRepository.saveAll(List.of(a1, a2, a3, a4));

            // 5. Assignments
            Assignment asg1 = new Assignment("1", "3", "A1L18l_CYJ8");
            Assignment asg2 = new Assignment("2", "u8FGRisUmeQ", "imAIWIVdmYQ");
            Assignment asg3 = new Assignment("3", "6nIIXMQMMZE", "MekuuglbgRM");
            Assignment asg4 = new Assignment("4", "3", "8I1zne0kuys");
            Assignment asg5 = new Assignment("5", "bhp1jeMm6Y8", "8I1zne0kuys");
            Assignment asg6 = new Assignment("6", "u8FGRisUmeQ", "8I1zne0kuys");

            assignmentRepository.saveAll(List.of(asg1, asg2, asg3, asg4, asg5, asg6));

            // 6. Results
            Result r1 = new Result("1", "3", "3", "A1L18l_CYJ8", "0zjd0dKl2Tc", 5.0, true, "2026-04-06T11:00:00Z");
            Result r2 = new Result("2", "u8FGRisUmeQ", "u8FGRisUmeQ", "imAIWIVdmYQ", "PFnMC3zk1AY", 10.0, true, "2026-04-14T06:22:42.900Z");
            Result r3 = new Result("3", "6nIIXMQMMZE", "6nIIXMQMMZE", "MekuuglbgRM", "RWEMIP5y9Vw", 1.0, true, "2026-04-14T09:50:00.000Z");

            resultRepository.saveAll(List.of(r1, r2, r3));

            // 7. Reports
            Report rep1 = new Report("1", "User Statistics", 10, 5, 3, 2, "2026-04-10T08:00:00Z");
            reportRepository.save(rep1);

            System.out.println("✅ Seed Data successfully initialized into MySQL!");
        }
    }
}
