const axios = require('axios');

const API = 'http://localhost:5000/api';

async function setupFreshAssessments() {
  try {
    console.log('--- 1. FETCHING EXISTING DATA ---');
    const [assRes, asgRes, resRes, usersRes] = await Promise.all([
      axios.get(`${API}/assessments`),
      axios.get(`${API}/assignments`),
      axios.get(`${API}/results`),
      axios.get(`${API}/users`),
    ]);

    const oldAssessments = assRes.data || [];
    const oldAssignments = asgRes.data || [];
    const oldResults = resRes.data || [];
    const allUsers = usersRes.data || [];

    console.log(`Found ${oldAssessments.length} assessments, ${oldAssignments.length} assignments, ${oldResults.length} results.`);

    console.log('\n--- 2. DELETING EXISTING ASSESSMENTS, ASSIGNMENTS & RESULTS ---');
    for (const item of oldAssignments) {
      await axios.delete(`${API}/assignments/${item.id}`).catch(() => {});
    }
    for (const item of oldResults) {
      await axios.delete(`${API}/results/${item.id}`).catch(() => {});
    }
    for (const item of oldAssessments) {
      await axios.delete(`${API}/assessments/${item.id}`).catch(() => {});
    }
    console.log('Cleanup completed cleanly.');

    // Educators
    const computerEducator = allUsers.find(u => u.email === 'john.educator@gmail.com') || {
      id: '16c2b321-6a',
      fullName: 'Prof. John Educator',
      email: 'john.educator@gmail.com'
    };

    const mathEducator = allUsers.find(u => u.email === 'harina0714@gmail.com') || {
      id: 'RWEMIP5y9Vw',
      fullName: 'Harina',
      email: 'harina0714@gmail.com'
    };

    // Students
    const students = allUsers.filter(u => u.role === 'Student');
    console.log(`\nFound ${students.length} students to assign tests.`);

    const activeFutureDeadline = '2026-10-31';

    console.log('\n--- 3. CREATING COMPUTER SCIENCE ASSESSMENTS (EDUCATOR: Prof. John Educator) ---');

    // CS Assessment 1: Auto-Graded (MCQ & True/False)
    const csAutoAss = {
      title: 'Computer Science MCQ Fundamentals 2026',
      type: 'Quiz',
      difficulty: 'Medium',
      category: 'Computer Science',
      topic: 'Data Structures & Algorithms',
      instructions: 'Answer all multiple-choice questions. This assessment is auto-graded.',
      timeLimit: 15,
      dueDate: activeFutureDeadline,
      educatorId: computerEducator.id,
      educatorEmail: computerEducator.email,
      createdBy: computerEducator.id,
      questions: [
        {
          type: 'mcq',
          question: 'Which data structure follows the Last In First Out (LIFO) principle?',
          options: ['Queue', 'Stack', 'Array', 'Linked List'],
          correctAnswer: 'Stack',
          marks: 5
        },
        {
          type: 'mcq',
          question: 'What is the worst-case time complexity of QuickSort algorithm?',
          options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(1)'],
          correctAnswer: 'O(n²)',
          marks: 5
        },
        {
          type: 'truefalse',
          question: 'RAM is a volatile memory that loses data when powered off.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          marks: 5
        }
      ]
    };

    // CS Assessment 2: Manual Educator Evaluation (Short Answer & Essay)
    const csManualAss = {
      title: 'Operating Systems Concepts & Process Architecture',
      type: 'Test',
      difficulty: 'Hard',
      category: 'Computer Science',
      topic: 'Operating Systems',
      instructions: 'Answer short & essay questions. Answers will be manually evaluated by Prof. John Educator.',
      timeLimit: 30,
      dueDate: activeFutureDeadline,
      educatorId: computerEducator.id,
      educatorEmail: computerEducator.email,
      createdBy: computerEducator.id,
      questions: [
        {
          type: 'short',
          question: 'Define deadlock in OS and list Coffman’s four necessary conditions.',
          options: [],
          correctAnswer: 'Deadlock occurs when processes wait indefinitely for resources held by each other. Conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.',
          marks: 10
        },
        {
          type: 'essay',
          question: 'Explain Virtual Memory management, Page Replacement algorithms (LRU & FIFO), and Thrashing.',
          options: [],
          correctAnswer: 'Rubric: Paging abstraction, page fault handling, LRU vs FIFO replacement mechanics, definition and mitigation of thrashing.',
          marks: 15
        }
      ]
    };

    const csAutoRes = await axios.post(`${API}/assessments`, csAutoAss);
    console.log('✅ Created CS Auto-Graded Assessment ID:', csAutoRes.data.id);

    const csManualRes = await axios.post(`${API}/assessments`, csManualAss);
    console.log('✅ Created CS Manual Evaluation Assessment ID:', csManualRes.data.id);

    console.log('\n--- 4. CREATING MATHEMATICS ASSESSMENTS (EDUCATOR: Harina) ---');

    // Math Assessment 1: Auto-Graded (MCQ & True/False)
    const mathAutoAss = {
      title: 'Linear Algebra & Matrix Fundamentals',
      type: 'Quiz',
      difficulty: 'Medium',
      category: 'Mathematics',
      topic: 'Linear Algebra',
      instructions: 'Solve the matrix problems. Questions are automatically graded.',
      timeLimit: 20,
      dueDate: activeFutureDeadline,
      educatorId: mathEducator.id,
      educatorEmail: mathEducator.email,
      createdBy: mathEducator.id,
      questions: [
        {
          type: 'mcq',
          question: 'What is the trace of a 3x3 Identity Matrix?',
          options: ['0', '1', '3', '9'],
          correctAnswer: '3',
          marks: 5
        },
        {
          type: 'truefalse',
          question: 'If a square matrix is invertible, its determinant is non-zero.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          marks: 5
        },
        {
          type: 'mcq',
          question: 'What is the product of all eigenvalues of a square matrix equal to?',
          options: ['Trace', 'Determinant', 'Rank', 'Dimension'],
          correctAnswer: 'Determinant',
          marks: 5
        }
      ]
    };

    // Math Assessment 2: Manual Educator Evaluation (Long Answer / Essay)
    const mathManualAss = {
      title: 'Calculus & Differential Equations Evaluation',
      type: 'Exam',
      difficulty: 'Hard',
      category: 'Mathematics',
      topic: 'Calculus & Proofs',
      instructions: 'Write step-by-step mathematical proofs. Submitted to Prof. Harina for manual evaluation.',
      timeLimit: 45,
      dueDate: activeFutureDeadline,
      educatorId: mathEducator.id,
      educatorEmail: mathEducator.email,
      createdBy: mathEducator.id,
      questions: [
        {
          type: 'short',
          question: 'State Taylor’s Theorem for expanding a smooth function f(x) around x = a.',
          options: [],
          correctAnswer: 'f(x) = sum_{n=0}^inf f^(n)(a)/n! (x-a)^n + R_n(x)',
          marks: 10
        },
        {
          type: 'essay',
          question: 'Derive the second-order linear homogeneous differential equation solution y″ + P y′ + Q y = 0 using characteristic roots.',
          options: [],
          correctAnswer: 'Rubric: Characteristic equation r^2 + P r + Q = 0. Show distinct real roots, repeated real root, and complex conjugate roots with general solution format.',
          marks: 15
        }
      ]
    };

    const mathAutoRes = await axios.post(`${API}/assessments`, mathAutoAss);
    console.log('✅ Created Math Auto-Graded Assessment ID:', mathAutoRes.data.id);

    const mathManualRes = await axios.post(`${API}/assessments`, mathManualAss);
    console.log('✅ Created Math Manual Evaluation Assessment ID:', mathManualRes.data.id);

    console.log('\n--- 5. ASSIGNING ASSESSMENTS TO ALL STUDENTS ---');
    const createdAssIds = [
      csAutoRes.data.id,
      csManualRes.data.id,
      mathAutoRes.data.id,
      mathManualRes.data.id
    ];

    let assignedCount = 0;
    for (const studentItem of students) {
      for (const assId of createdAssIds) {
        await axios.post(`${API}/assignments`, {
          studentId: studentItem.id,
          userId: studentItem.id,
          assessmentId: assId,
          status: 'assigned',
          assignedAt: new Date().toISOString()
        });
        assignedCount++;
      }
    }

    console.log(`\n🎉 SUCCESS! Created 4 assessments and assigned ${assignedCount} tasks across all students.`);
  } catch (err) {
    console.error('Error during setup:', err.response?.data || err.message);
  }
}

setupFreshAssessments();
