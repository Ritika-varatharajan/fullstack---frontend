"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import styles from "./student.module.css";
import { API } from "@/app/config/api";
import StudentSidebar from "../components/StudentSidebar";
import { NotificationsView } from "../components/NotificationsView";

type NotificationItem = {
  id: string;
  type: "assignment" | "result" | "overdue" | "recommendation";
  title: string;
  message: string;
  time: string;
};

export default function StudentDashboard() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Notifications State
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);

  // Detailed Result & Answer Sheet Modal State
  const [showAnswerSheetModal, setShowAnswerSheetModal] = useState(false);
  const [selectedStudentResult, setSelectedStudentResult] = useState<any>(null);

  // Subject Performance Report Modal State
  const [showSubjectReportModal, setShowSubjectReportModal] = useState(false);
  const [selectedSubjectReport, setSelectedSubjectReport] = useState<any>(null);

  const router = useRouter();

  let student: any = {};
  try {
    student =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user") || "{}")
        : {};
  } catch {
    student = {};
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [a, asg, r, u] = await Promise.all([
        axios.get(`${API}/assessments`),
        axios.get(`${API}/assignments`),
        axios.get(`${API}/results`),
        axios.get(`${API}/users`),
      ]);

      const loadedAssessments = a.data || [];
      const loadedAssignments = asg.data || [];
      const loadedResults = r.data || [];
      const loadedUsers = u.data || [];

      setAssessments(loadedAssessments);
      setAssignments(loadedAssignments);
      setResults(loadedResults);
      setUsers(loadedUsers);

      generateNotifications(loadedAssessments, loadedAssignments, loadedResults, student);
    } catch (err) {
      console.error(err);
    }
  };

  const openSubjectReportModal = (subjectCat: string) => {
    // 1. Get all assessments for this subject
    const subjectAssessments = assessments.filter(
      (a) => (a.category && a.category.trim() ? a.category.trim() : "General") === subjectCat
    );
    const subjectAssIds = subjectAssessments.map((a) => String(a.id));

    // 2. Get all evaluated results for this student in this subject (filter out pending short/long answer evaluations)
    const subjectResults = myResults.filter(
      (r) =>
        subjectAssIds.includes(String(r.assessmentId)) &&
        !r.needsEvaluation &&
        r.status !== "pending_review"
    );

    // Sort chronologically (oldest attempt to newest)
    const sortedSubjectResults = [...subjectResults].sort(
      (x, y) => new Date(x.submittedAt || 0).getTime() - new Date(y.submittedAt || 0).getTime()
    );

    let primaryEducatorName = "Prof. Lead Educator";

    // Build test progression items with score improvement vs previous test in this subject
    const testItems = sortedSubjectResults.map((r, idx) => {
      const ass = assessments.find((a) => String(a.id) === String(r.assessmentId));
      const totalM = getAssessmentTotalMarks(ass, r);
      const pct = getResultPercentage(r, totalM);

      // Find educator name
      let educatorName = "Educator";
      if (ass) {
        const edUser = users.find(
          (u) =>
            String(u.id) === String(ass.educatorId || ass.createdBy) ||
            (ass.educatorEmail && String(u.email || "").toLowerCase() === String(ass.educatorEmail).toLowerCase())
        );
        const rawName = edUser?.fullName || edUser?.name || ass.educatorEmail || "Educator";
        educatorName = rawName.toLowerCase().startsWith("prof.") ? rawName : `Prof. ${rawName}`;
        if (primaryEducatorName === "Prof. Lead Educator") {
          primaryEducatorName = educatorName;
        }
      }

      let improvementBadge = "⭐ Initial Test";
      if (idx > 0) {
        const prevRes = sortedSubjectResults[idx - 1];
        const prevAss = assessments.find((a) => String(a.id) === String(prevRes.assessmentId));
        const prevTotalM = getAssessmentTotalMarks(prevAss, prevRes);
        const prevPct = getResultPercentage(prevRes, prevTotalM);
        const diff = Number((pct - prevPct).toFixed(1));

        if (diff > 0) {
          improvementBadge = `🚀 +${diff}% Improvement`;
        } else if (diff < 0) {
          improvementBadge = `📉 ${diff}% Score Change`;
        } else {
          improvementBadge = `🎯 Stable Score`;
        }
      }

      return {
        result: r,
        assessment: ass,
        educatorName,
        percentage: pct,
        scoreImprovement: improvementBadge,
        feedback: r.feedback || "Evaluated successfully.",
        submittedAt: r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "Completed",
      };
    });

    const firstPct = testItems.length > 0 ? testItems[0].percentage : 0;
    const latestPct = testItems.length > 0 ? testItems[testItems.length - 1].percentage : 0;
    const overallGrowth = Number((latestPct - firstPct).toFixed(1));

    const avgSubjectPct = testItems.length
      ? Math.round(testItems.reduce((acc, item) => acc + item.percentage, 0) / testItems.length)
      : 0;

    let overallRemarkText = "Keep practicing and working hard! Review educator feedback on each test to strengthen your foundation.";
    if (avgSubjectPct >= 85) {
      overallRemarkText = "Outstanding performance across all assessments! Excellent subject mastery and concept application. Keep up the high standard!";
    } else if (avgSubjectPct >= 70) {
      overallRemarkText = "Good progress across tests! Solid grasp of core principles. Keep practicing key concepts to reach top mastery!";
    } else if (avgSubjectPct >= 50) {
      overallRemarkText = "Steady effort shown. Focus on reviewing weaker topics and practice regularly to boost your scores further!";
    }

    setSelectedSubjectReport({
      subjectName: subjectCat,
      primaryEducatorName,
      overallAvg: avgSubjectPct,
      totalTests: testItems.length,
      overallGrowth: overallGrowth,
      overallRemark: overallRemarkText,
      testItems: testItems,
    });

    setShowSubjectReportModal(true);
  };

  const generateNotifications = (
    assList: any[],
    asgList: any[],
    resList: any[],
    studentUser: any
  ) => {
    const list: NotificationItem[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    const myAsg = asgList.filter(
      (asg) =>
        String(asg.studentId) === String(studentUser.id) ||
        String(asg.userId) === String(studentUser.id)
    );

    const myRes = resList.filter(
      (r) =>
        String(r.userId) === String(studentUser.id) ||
        String(r.studentId) === String(studentUser.id)
    );

    // 1. Pending & Overdue Assignments
    myAsg.forEach((asg: any, idx: number) => {
      const ass = assList.find((a) => String(a.id) === String(asg.assessmentId));
      const hasCompleted = myRes.some((r) => String(r.assessmentId) === String(asg.assessmentId));
      if (ass && !hasCompleted) {
        if (ass.dueDate && ass.dueDate < todayStr) {
          list.push({
            id: `overdue-${ass.id || idx}`,
            type: "overdue",
            title: "⚠️ Assessment Deadline Overdue",
            message: `The deadline for "${ass.title}" passed on ${ass.dueDate}. Test is now closed.`,
            time: `Due: ${ass.dueDate}`,
          });
        } else {
          list.push({
            id: `asg-${ass.id || idx}`,
            type: "assignment",
            title: "📝 New Assessment Assigned",
            message: `You have been assigned "${ass.title}" (${ass.category || "General"}). Due Date: ${ass.dueDate || "No deadline set"}.`,
            time: ass.dueDate ? `Due: ${ass.dueDate}` : "Pending",
          });
        }
      }
    });

    // 2. Graded Results
    myRes.forEach((r: any, idx: number) => {
      const ass = assList.find((a) => String(a.id) === String(r.assessmentId));
      if (ass) {
        list.push({
          id: `res-${r.id || idx}`,
          type: "result",
          title: "🎉 Test Result Available",
          message: `Your test "${ass.title}" has been graded! Score: ${r.score}.`,
          time: r.submittedAt ? new Date(r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
        });
      }
    });

    setNotificationsList(list);
  };

  const dismissNotification = (id: string) => {
    setNotificationsList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  // ✅ UNIFIED SCORING & MARKS CALCULATORS
  const getAssessmentTotalMarks = (assessment: any, result?: any) => {
    if (result && Number(result.totalMarks) > 0) {
      return Number(result.totalMarks);
    }
    if (assessment && Number(assessment.totalMarks) > 0) {
      return Number(assessment.totalMarks);
    }
    if (assessment?.questions && assessment.questions.length > 0) {
      const qSum = assessment.questions.reduce(
        (sum: number, q: any) => sum + Number(q.marks || 1),
        0
      );
      if (qSum > 0) return qSum;
    }
    if (result && Number(result.score) > 0) {
      return Number(result.score);
    }
    return 100;
  };

  const getResultPercentage = (result: any, totalMarks: number) => {
    if (result?.percentage !== undefined && result?.percentage !== null && !isNaN(Number(result.percentage))) {
      return Math.round(Number(result.percentage));
    }
    if (totalMarks > 0 && result?.score !== undefined && result?.score !== null) {
      return Math.round((Number(result.score) / totalMarks) * 100);
    }
    return 0;
  };

  // ✅ SAFE FILTER (ID FIX)
  const myAssignments = assignments.filter(
    (asg) =>
      String(asg.studentId) === String(student.id) ||
      String(asg.userId) === String(student.id)
  );

  const myAssessmentIds = myAssignments.map((a) => String(a.assessmentId));

  const myAssessments = assessments.filter((a) =>
    myAssessmentIds.includes(String(a.id))
  );

  const myResults = results.filter(
    (r) =>
      String(r.userId) === String(student.id) ||
      String(r.studentId) === String(student.id)
  );

  // Helper to get the most recent result for a specific assessment
  const getLatestResult = (assessmentId: string) => {
    const matching = myResults.filter(
      (r) => String(r.assessmentId) === String(assessmentId)
    );
    if (matching.length === 0) return null;
    return [...matching].sort(
      (a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
    )[0];
  };

  const completed = myAssessments.filter((a) =>
    myResults.some((r) => String(r.assessmentId) === String(a.id))
  );

  const pending = myAssessments.filter(
    (a) => !completed.some((c) => String(c.id) === String(a.id))
  );

  // SEARCH FILTERED LISTS
  const filteredPending = pending.filter(
    (a) =>
      a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompleted = completed.filter(
    (a) =>
      a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredResults = myResults.filter((r) => {
    const ass = assessments.find((a) => String(a.id) === String(r.assessmentId));
    return (
      ass?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ass?.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.score).includes(searchQuery)
    );
  });

  const avgScore = myResults.length
    ? (
        myResults.reduce((acc, r) => {
          const ass = assessments.find((a) => String(a.id) === String(r.assessmentId));
          const tMarks = getAssessmentTotalMarks(ass, r);
          return acc + getResultPercentage(r, tMarks);
        }, 0) / myResults.length
      ).toFixed(1)
    : 0;

  const topScore = myResults.length
    ? Math.max(
        ...myResults.map((r) => {
          const ass = assessments.find((a) => String(a.id) === String(r.assessmentId));
          const tMarks = getAssessmentTotalMarks(ass, r);
          return getResultPercentage(r, tMarks);
        })
      )
    : 0;

  // -------------------------------------------------------------
  // 🚀 SCORE IMPROVEMENT & PROGRESS TRACKER LOGIC
  // -------------------------------------------------------------
  const sortedResults = [...myResults].sort(
    (a, b) => new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime()
  );

  const latestResult = sortedResults[sortedResults.length - 1];
  const previousResult = sortedResults[sortedResults.length - 2];

  let latestPercentage = 0;
  let previousPercentage = 0;
  let scoreDiff = 0;
  let hasProgressData = false;

  if (latestResult) {
    const latestAss = assessments.find((a) => String(a.id) === String(latestResult.assessmentId));
    const latestTotalMarks = getAssessmentTotalMarks(latestAss, latestResult);
    latestPercentage = getResultPercentage(latestResult, latestTotalMarks);

    if (previousResult) {
      const prevAss = assessments.find((a) => String(a.id) === String(previousResult.assessmentId));
      const prevTotalMarks = getAssessmentTotalMarks(prevAss, previousResult);
      previousPercentage = getResultPercentage(previousResult, prevTotalMarks);
      scoreDiff = Number((latestPercentage - previousPercentage).toFixed(1));
      hasProgressData = true;
    }
  }

  // -------------------------------------------------------------
  // 📚 CATEGORY GROUPING & WEAK AREA DETECTOR
  // -------------------------------------------------------------
  const groupedAssessments: Record<string, any[]> = {};
  myAssessments.forEach((a) => {
    const cat = a.category && a.category.trim() ? a.category.trim() : "General";
    if (!groupedAssessments[cat]) groupedAssessments[cat] = [];
    groupedAssessments[cat].push(a);
  });

  // Calculate subject mastery breakdown
  const subjectMastery: Record<string, { scoreSum: number; count: number }> = {};
  myResults.forEach((r) => {
    const ass = assessments.find((a) => String(a.id) === String(r.assessmentId));
    const cat = ass?.category || "General";
    const totalM = getAssessmentTotalMarks(ass, r);
    const pct = getResultPercentage(r, totalM);
    if (!subjectMastery[cat]) subjectMastery[cat] = { scoreSum: 0, count: 0 };
    subjectMastery[cat].scoreSum += pct;
    subjectMastery[cat].count++;
  });

  const lowestSubject = Object.entries(subjectMastery).sort(
    (a, b) => (a[1].scoreSum / a[1].count) - (b[1].scoreSum / b[1].count)
  )[0];

  const handleOpenAnswerSheet = (result: any) => {
    const ass = assessments.find((a) => String(a.id) === String(result.assessmentId));
    setSelectedStudentResult({
      ...result,
      assessment: ass,
    });
    setShowAnswerSheetModal(true);
  };

  return (
    <div className={styles.layout}>
      {/* FIXED LEFT SIDEBAR */}
      <StudentSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        student={student}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* MAIN CONTENT AREA */}
      <main className={`${styles.mainContent} ${isSidebarCollapsed ? styles.collapsedMain : ""}`}>
        {/* TOP HEADER */}
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.welcomeTitle}>
              Welcome back, {student?.fullName || student?.name || student?.email || "Student"} 👋
            </h1>
            <p className={styles.welcomeSub}>
              Track learning progress, subject mastery, and score improvement trends.
            </p>
          </div>

          <div className={styles.headerRight}>
            {/* SEARCH INPUT */}
            <div className={styles.searchWrapper}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className={styles.searchInput}
                placeholder="Search tests, subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* NOTIFICATION BELL ICON */}
            <button
              className={styles.notifBellBtn}
              onClick={() => setActiveTab("notifications")}
              title="Notifications"
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notificationsList.length > 0 && (
                <span className={styles.notifBadgeCount}>{notificationsList.length}</span>
              )}
            </button>

            {/* PROFILE PILL */}
            <div className={styles.profilePill}>
              <div className={styles.pillAvatar}>
                {(student?.fullName || student?.name || "S").charAt(0).toUpperCase()}
              </div>
              <span className={styles.pillText}>
                {student?.fullName?.split(" ")[0] || "Student"}
              </span>
            </div>
          </div>
        </header>

        {/* 1. DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <div className={styles.sectionContainer}>
            {/* HERO BANNER CARD */}
            <div className={styles.heroBanner}>
              <div className={styles.bannerText}>
                <h2>Personalized Learning & Performance Portal</h2>
                <p>You have {pending.length} pending assessment{pending.length === 1 ? "" : "s"} waiting for evaluation.</p>
                {pending.length > 0 && (
                  <button
                    className={styles.bannerBtn}
                    onClick={() => setActiveTab("upcoming")}
                  >
                    View Pending Tests →
                  </button>
                )}
              </div>
            </div>

            {/* WEAK AREA DETECTOR ALERT BOX */}
            {lowestSubject && (
              <div className={styles.weakAreaAlertCard}>
                <div className={styles.weakAlertIcon}>💡</div>
                <div className={styles.weakAlertBody}>
                  <h4>Smart Learning Recommendation: Focus on {lowestSubject[0]}</h4>
                  <p>
                    Your average accuracy in <strong>{lowestSubject[0]}</strong> is{" "}
                    <strong>{Math.round(lowestSubject[1].scoreSum / lowestSubject[1].count)}%</strong>. Review key concepts and retake pending practice tests to boost your score!
                  </p>
                </div>
              </div>
            )}



            {/* METRICS GRID - MULTI-COLOR CARDS */}
            <div className={styles.metricsGrid}>
              <div className={styles.statCardIndigo}>
                <div className={styles.statIcon} style={{ background: "rgba(79, 70, 229, 0.1)", color: "#4f46e5" }}>
                  📋
                </div>
                <div>
                  <span className={styles.statLabel}>Total Assigned</span>
                  <h3 className={styles.statValue}>{myAssessments.length}</h3>
                </div>
              </div>

              <div className={styles.statCardEmerald}>
                <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                  ✅
                </div>
                <div>
                  <span className={styles.statLabel}>Completed</span>
                  <h3 className={styles.statValue}>{completed.length}</h3>
                </div>
              </div>

              <div className={styles.statCardAmber}>
                <div className={styles.statIcon} style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
                  ⏳
                </div>
                <div>
                  <span className={styles.statLabel}>Pending</span>
                  <h3 className={styles.statValue}>{pending.length}</h3>
                </div>
              </div>

              <div className={styles.statCardSky}>
                <div className={styles.statIcon} style={{ background: "rgba(2, 132, 199, 0.1)", color: "#0284c7" }}>
                  📊
                </div>
                <div>
                  <span className={styles.statLabel}>Average Accuracy</span>
                  <h3 className={styles.statValue}>{avgScore}%</h3>
                </div>
              </div>

              <div className={styles.statCardRose}>
                <div className={styles.statIcon} style={{ background: "rgba(225, 29, 72, 0.1)", color: "#e11d48" }}>
                  🏆
                </div>
                <div>
                  <span className={styles.statLabel}>Top Score</span>
                  <h3 className={styles.statValue}>{topScore}%</h3>
                </div>
              </div>
            </div>

            {/* RECENT ASSESSMENTS LIST */}
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <h3>Pending Assessments</h3>
                {pending.length > 0 && (
                  <button className={styles.linkBtn} onClick={() => setActiveTab("upcoming")}>
                    View All ({pending.length})
                  </button>
                )}
              </div>

              {filteredPending.length === 0 ? (
                <div className={styles.emptyCard}>
                  <p>{searchQuery ? `🔍 No matching pending assessments found for "${searchQuery}".` : "🎉 All caught up! No pending assessments at this time."}</p>
                </div>
              ) : (
                <div className={styles.cardGrid}>
                  {filteredPending.slice(0, 3).map((a) => {
                    const totalMarks = getAssessmentTotalMarks(a);
                    const todayStr = new Date().toISOString().split("T")[0];
                    const isExpired = Boolean(a.dueDate && a.dueDate < todayStr);

                    return (
                      <div key={a.id} className={styles.assessmentCard}>
                        <div className={styles.cardHeader}>
                          <h4>{a.title}</h4>
                          <span className={isExpired ? styles.dueDateBadge : styles.tagPending}>
                            {isExpired ? "Closed 🚫" : "Pending ⏳"}
                          </span>
                        </div>
                        <p className={styles.cardMeta}><strong>Category:</strong> {a.category || "General"}</p>
                        <p className={styles.cardMeta}><strong>Time:</strong> {a.timeLimit || 30} mins | <strong>Marks:</strong> {totalMarks}</p>
                        {a.dueDate && (
                          <p className={isExpired ? styles.dueDateBadge : styles.cardMeta} style={isExpired ? { color: "#dc2626", fontWeight: 700 } : {}}>
                            🗓️ Due Date: {a.dueDate} {isExpired ? "(Passed)" : ""}
                          </p>
                        )}
                        <button
                          className={styles.primaryBtn}
                          disabled={isExpired}
                          onClick={() => {
                            if (isExpired) {
                              alert("🚫 Deadline Passed! You can no longer attend this assessment.");
                              return;
                            }
                            router.push(`/student/test/${a.id}`);
                          }}
                          style={isExpired ? { background: "#94a3b8", cursor: "not-allowed", opacity: 0.7 } : {}}
                        >
                          {isExpired ? "Deadline Passed (Closed)" : "Start Assessment Now"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. MY ASSESSMENTS VIEW */}
        {activeTab === "assessments" && (
          <div className={styles.sectionContainer}>
            <h2>My Assigned Assessments by Category</h2>

            {Object.keys(groupedAssessments).length === 0 ? (
              <div className={styles.emptyCard}>
                <p>No assessments assigned yet.</p>
              </div>
            ) : (
              Object.entries(groupedAssessments).map(([categoryName, catAssessments]) => (
                <div key={categoryName} className={styles.categorySection}>
                  <div className={styles.categoryHeader}>
                    <h3>📚 Subject / Category: {categoryName} ({catAssessments.length} Tests)</h3>
                  </div>

                  <div className={styles.cardGrid}>
                    {catAssessments
                      .filter(
                        (a) =>
                          a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          categoryName.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((a) => {
                        const isCompleted = completed.some((c) => String(c.id) === String(a.id));
                        const result = getLatestResult(a.id);
                        const totalMarks = getAssessmentTotalMarks(a, result);
                        const percentage = result ? getResultPercentage(result, totalMarks) : 0;
                        const todayStr = new Date().toISOString().split("T")[0];
                        const isExpired = Boolean(a.dueDate && a.dueDate < todayStr);

                        return (
                          <div key={a.id} className={styles.assessmentCard}>
                            <div className={styles.cardHeader}>
                              <h4>{a.title}</h4>
                              <span className={isCompleted ? styles.tagCompleted : isExpired ? styles.dueDateBadge : styles.tagPending}>
                                {isCompleted ? "Completed ✅" : isExpired ? "Closed 🚫" : "Pending ⏳"}
                              </span>
                            </div>
                            <p className={styles.cardMeta}><strong>Time Limit:</strong> {a.timeLimit || 30} mins</p>
                            <p className={styles.cardMeta}><strong>Total Marks:</strong> {totalMarks}</p>
                            {a.dueDate && <p className={styles.dueDateBadge}>🗓️ Due: {a.dueDate} {isExpired ? "(Passed)" : ""}</p>}

                            {isCompleted && result && (
                              <p className={styles.cardMeta}>
                                <strong>Score:</strong> <span style={{ color: "#059669", fontWeight: 700 }}>{result.score} / {totalMarks} ({percentage}%)</span>
                              </p>
                            )}

                            {!isCompleted ? (
                              <button
                                className={styles.primaryBtn}
                                disabled={isExpired}
                                onClick={() => {
                                  if (isExpired) {
                                    alert("🚫 Deadline Passed! You can no longer attend this assessment.");
                                    return;
                                  }
                                  router.push(`/student/test/${a.id}`);
                                }}
                                style={isExpired ? { background: "#94a3b8", cursor: "not-allowed", opacity: 0.7 } : {}}
                              >
                                {isExpired ? "Deadline Passed (Closed)" : "Start Test"}
                              </button>
                            ) : (
                              <button
                                className={styles.secondaryBtn}
                                onClick={() => result && handleOpenAnswerSheet(result)}
                              >
                                View Answer Sheet 📋
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 3. UPCOMING ASSESSMENTS VIEW */}
        {activeTab === "upcoming" && (
          <div className={styles.sectionContainer}>
            <h2>Upcoming & Pending Assessments ({filteredPending.length})</h2>
            {filteredPending.length === 0 ? (
              <div className={styles.emptyCard}>
                <p>{searchQuery ? `🔍 No matching upcoming assessments found for "${searchQuery}".` : "You have no pending assessments!"}</p>
              </div>
            ) : (
              <div className={styles.cardGrid}>
                {filteredPending.map((a) => {
                  const totalMarks = getAssessmentTotalMarks(a);
                  const todayStr = new Date().toISOString().split("T")[0];
                  const isExpired = Boolean(a.dueDate && a.dueDate < todayStr);

                  return (
                    <div key={a.id} className={styles.assessmentCard}>
                      <h4>{a.title}</h4>
                      <p className={styles.cardMeta}><strong>Category:</strong> {a.category || "General"}</p>
                      <p className={styles.cardMeta}><strong>Time Limit:</strong> {a.timeLimit || 30} mins | <strong>Marks:</strong> {totalMarks}</p>
                      {a.dueDate && <p className={styles.dueDateBadge}>🗓️ Deadline: {a.dueDate} {isExpired ? "(Passed)" : ""}</p>}
                      <button
                        className={styles.primaryBtn}
                        disabled={isExpired}
                        onClick={() => {
                          if (isExpired) {
                            alert("🚫 Deadline Passed! You can no longer attend this assessment.");
                            return;
                          }
                          router.push(`/student/test/${a.id}`);
                        }}
                        style={isExpired ? { background: "#94a3b8", cursor: "not-allowed", opacity: 0.7 } : {}}
                      >
                        {isExpired ? "Deadline Passed (Closed)" : "Start Test"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. COMPLETED ASSESSMENTS VIEW */}
        {activeTab === "completed" && (
          <div className={styles.sectionContainer}>
            <h2>Completed Assessments ({filteredCompleted.length})</h2>
            {filteredCompleted.length === 0 ? (
              <div className={styles.emptyCard}>
                <p>No completed assessments found.</p>
              </div>
            ) : (
              <div className={styles.cardGrid}>
                {filteredCompleted.map((a) => {
                  const result = getLatestResult(a.id);
                  const totalMarks = getAssessmentTotalMarks(a, result);
                  const percentage = result ? getResultPercentage(result, totalMarks) : 0;
                  const isPending = result && (result.needsEvaluation || result.status === "pending_review");

                  return (
                    <div key={a.id} className={styles.assessmentCard}>
                      <div className={styles.cardHeader}>
                        <h4>{a.title}</h4>
                        <span className={isPending ? styles.tagPending : styles.tagCompleted}>
                          {isPending ? "Submitted for Grading ⏳" : "Completed ✅"}
                        </span>
                      </div>
                      <p className={styles.cardMeta}><strong>Category:</strong> {a.category || "General"}</p>
                      {result && (
                        <p className={styles.cardMeta}>
                          <strong>Score:</strong>{" "}
                          {isPending ? (
                            <span style={{ color: "#b45309", fontWeight: 700 }}>Submitted for Grading ⏳</span>
                          ) : (
                            <span style={{ color: "#059669", fontWeight: 700 }}>{result.score} / {totalMarks} ({percentage}%)</span>
                          )}
                        </p>
                      )}
                      <button
                        className={styles.secondaryBtn}
                        onClick={() => result && handleOpenAnswerSheet(result)}
                      >
                        View Detailed Breakdown 📋
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. RESULTS VIEW */}
        {activeTab === "results" && (
          <div className={styles.sectionContainer}>
            <h2>My Assessment Results</h2>
            {filteredResults.length === 0 ? (
              <div className={styles.emptyCard}>
                <p>No results recorded yet.</p>
              </div>
            ) : (
              <div className={styles.resultList}>
                {filteredResults.map((r) => {
                  const assessment = assessments.find(
                    (a) => String(a.id) === String(r.assessmentId)
                  );
                  const totalMarks = getAssessmentTotalMarks(assessment, r);
                  const percentage = getResultPercentage(r, totalMarks);
                  const isPending = r.needsEvaluation || r.status === "pending_review";

                  return (
                    <div key={r.id} className={styles.resultCard}>
                      <div className={styles.resultHeader}>
                        <h3>{assessment?.title || `Assessment #${r.assessmentId}`}</h3>
                        <span className={isPending ? styles.statusPendingEval : styles.feedbackBadge}>
                          {isPending ? "Submitted for Grading ⏳" : (r.feedback || `${percentage}% Score`)}
                        </span>
                      </div>
                      <div className={styles.resultGrid}>
                        <div>
                          <span className={styles.resLabel}>Category:</span>
                          <span className={styles.resVal}>{assessment?.category || "General"}</span>
                        </div>
                        <div>
                          <span className={styles.resLabel}>Score:</span>
                          <span className={styles.resVal}>
                            {isPending ? "Submitted for Grading ⏳" : `${r.score} / ${totalMarks}`}
                          </span>
                        </div>
                        <div>
                          <span className={styles.resLabel}>Percentage:</span>
                          <span className={styles.resVal}>
                            {isPending ? "Pending Evaluation ⏳" : `${percentage}%`}
                          </span>
                        </div>
                        <div>
                          <span className={styles.resLabel}>Action:</span>
                          <button
                            className={styles.linkBtn}
                            onClick={() => handleOpenAnswerSheet(r)}
                            style={{ cursor: "pointer" }}
                          >
                            View Answer Sheet 📋
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 6. PERFORMANCE VIEW */}
        {activeTab === "performance" && (
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Performance Analytics & Subject Mastery Reports</h2>
                <p className={styles.welcomeSub}>Subject-wise accuracy breakdown, test progression, and downloadable reports.</p>
              </div>
            </div>

            {/* TOP METRICS GRID */}
            <div className={styles.metricsGrid}>
              <div className={styles.statCardSky}>
                <div className={styles.statIcon} style={{ background: "rgba(2, 132, 199, 0.1)", color: "#0284c7" }}>
                  📊
                </div>
                <div>
                  <span className={styles.statLabel}>Average Accuracy</span>
                  <h3 className={styles.statValue}>{avgScore}%</h3>
                </div>
              </div>
              <div className={styles.statCardEmerald}>
                <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                  ✅
                </div>
                <div>
                  <span className={styles.statLabel}>Completed Tests</span>
                  <h3 className={styles.statValue}>{completed.length}</h3>
                </div>
              </div>
              <div className={styles.statCardRose}>
                <div className={styles.statIcon} style={{ background: "rgba(225, 29, 72, 0.1)", color: "#e11d48" }}>
                  🏆
                </div>
                <div>
                  <span className={styles.statLabel}>Highest Score</span>
                  <h3 className={styles.statValue}>{topScore}%</h3>
                </div>
              </div>
            </div>

            {/* SUBJECT-WISE PERFORMANCE & REPORT ACTIONS TABLE */}
            <div className={styles.tableContainer} style={{ marginTop: "1.5rem" }}>
              <div className={styles.sectionHeader} style={{ padding: "1.25rem 1.5rem 0.5rem 1.5rem" }}>
                <h3>Academic Domain & Subject Mastery Summary</h3>
                <span className={styles.welcomeSub}>View & download detailed subject reports with score improvement trends</span>
              </div>

              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Subject / Domain</th>
                    <th>Total Tests Completed</th>
                    <th>Subject Average Accuracy</th>
                    <th>Overall Subject Growth</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(subjectMastery).length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                        No completed tests yet to generate subject performance reports.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(subjectMastery).map(([catName, data]) => {
                      const subjectAcc = Math.round(data.scoreSum / (data.count || 1));

                      const catAssIds = assessments
                        .filter((a) => (a.category && a.category.trim() ? a.category.trim() : "General") === catName)
                        .map((a) => String(a.id));

                      const catResults = myResults
                        .filter((r) => catAssIds.includes(String(r.assessmentId)))
                        .sort((x, y) => new Date(x.submittedAt || 0).getTime() - new Date(y.submittedAt || 0).getTime());

                      let growthVal = 0;
                      if (catResults.length > 1) {
                        const firstRes = catResults[0];
                        const lastRes = catResults[catResults.length - 1];
                        const firstAss = assessments.find((a) => String(a.id) === String(firstRes.assessmentId));
                        const lastAss = assessments.find((a) => String(a.id) === String(lastRes.assessmentId));
                        const firstPct = getResultPercentage(firstRes, getAssessmentTotalMarks(firstAss, firstRes));
                        const lastPct = getResultPercentage(lastRes, getAssessmentTotalMarks(lastAss, lastRes));
                        growthVal = Number((lastPct - firstPct).toFixed(1));
                      }

                      return (
                        <tr key={catName}>
                          <td>
                            <strong>{catName}</strong>
                          </td>
                          <td>{data.count} Test Attempt(s)</td>
                          <td>
                            <strong>{subjectAcc}%</strong>
                          </td>
                          <td>
                            {catResults.length > 1 ? (
                              growthVal > 0 ? (
                                <span className={styles.badgeImprovement}>🚀 +{growthVal}% Growth</span>
                              ) : growthVal < 0 ? (
                                <span className={styles.badgeDecline}>📉 {growthVal}% Change</span>
                              ) : (
                                <span className={styles.badgeStable}>🎯 Stable</span>
                              )
                            ) : (
                              <span className={styles.badgeImprovement}>⭐ 1 Test Completed</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                className={styles.viewBtn}
                                onClick={() => openSubjectReportModal(catName)}
                                style={{
                                  background: "#ffedd5",
                                  color: "#c2410c",
                                  border: "1px solid #fed7aa",
                                  padding: "0.45rem 0.85rem",
                                  borderRadius: "8px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                👁️ View Report
                              </button>
                              <button
                                className={styles.printBtn}
                                onClick={() => {
                                  openSubjectReportModal(catName);
                                  setTimeout(() => window.print(), 300);
                                }}
                              >
                                📥 Download Report
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. NOTIFICATIONS VIEW */}
        {activeTab === "notifications" && (
          <NotificationsView
            notificationsList={notificationsList}
            onDismissNotification={dismissNotification}
            onClearAll={() => setNotificationsList([])}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* STUDENT ANSWER SHEET & RESULT BREAKDOWN MODAL */}
      {showAnswerSheetModal && selectedStudentResult && (() => {
        const totalMarks = getAssessmentTotalMarks(selectedStudentResult.assessment, selectedStudentResult);
        const percentage = getResultPercentage(selectedStudentResult, totalMarks);

        return (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <div>
                  <h2 className={styles.modalTitle}>
                    📋 Detailed Result & Answer Sheet
                  </h2>
                  <p className={styles.cardMeta}>
                    <strong>Assessment:</strong> {selectedStudentResult.assessment?.title || "Assessment"} |{" "}
                    <strong>Category:</strong> {selectedStudentResult.assessment?.category || "General"}
                  </p>
                </div>
                <button
                  className={styles.closeBtn}
                  onClick={() => {
                    setShowAnswerSheetModal(false);
                    setSelectedStudentResult(null);
                  }}
                >
                  ✖
                </button>
              </div>

              <div className={styles.resultGrid} style={{ marginBottom: "1.5rem" }}>
                <div>
                  <span className={styles.resLabel}>Score:</span>
                  <span className={styles.resVal}>{selectedStudentResult.score} / {totalMarks}</span>
                </div>
                <div>
                  <span className={styles.resLabel}>Percentage:</span>
                  <span className={styles.resVal}>{percentage}%</span>
                </div>
                <div>
                  <span className={styles.resLabel}>Status:</span>
                  <span className={styles.resVal}>Completed ✅</span>
                </div>
                <div>
                  <span className={styles.resLabel}>Date:</span>
                  <span className={styles.resVal}>{selectedStudentResult.submittedAt ? new Date(selectedStudentResult.submittedAt).toLocaleDateString() : "Submitted"}</span>
                </div>
              </div>

              <h3>Question Breakdown & Correct Answers</h3>
              {selectedStudentResult.assessment?.questions && selectedStudentResult.assessment.questions.length > 0 ? (
                selectedStudentResult.assessment.questions.map((q: any, qIdx: number) => {
                  const studentAnsIndex = selectedStudentResult.answers ? selectedStudentResult.answers[qIdx] : null;
                  const isCorrect = String(studentAnsIndex) === String(q.correctAnswer);

                  return (
                    <div key={q.id || qIdx} className={styles.questionCard}>
                      <h4 className={styles.questionTitle}>
                        Q{qIdx + 1}. {q.questionText || q.question || q.title || `Question ${qIdx + 1}`} ({q.marks || 1} mark)
                      </h4>
                      <div className={styles.optionsGrid}>
                        {q.options?.map((opt: string, optIdx: number) => {
                          const isSelected = String(studentAnsIndex) === String(optIdx);
                          const isCorrectOpt = String(q.correctAnswer) === String(optIdx) || String(q.correctAnswer) === String(opt);

                          let optClass = styles.optionItem;
                          if (isCorrectOpt) optClass += ` ${styles.correctOption}`;
                          else if (isSelected && !isCorrectOpt) optClass += ` ${styles.userWrongOption}`;

                          return (
                            <div key={optIdx} className={optClass}>
                              {String.fromCharCode(65 + optIdx)}. {opt}{" "}
                              {isCorrectOpt && " (Correct Answer ✅)"}
                              {isSelected && !isCorrectOpt && " (Your Answer ❌)"}
                              {isSelected && isCorrectOpt && " (Your Answer ✅)"}
                            </div>
                          );
                        })}
                      </div>
                      {q.explanation && (
                        <div className={styles.explanationBox}>
                          💡 <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className={styles.cardMeta}>Detailed question responses are unavailable for this submission.</p>
              )}
            </div>
          </div>
        );
      })()}

      {/* 📥 SUBJECT PERFORMANCE REPORT MODAL (WITH QUILL LOGO, NEAT TABLE, CRISP REMARKS & PDF DOWNLOAD) */}
      {showSubjectReportModal && selectedSubjectReport && (
        <div className={styles.modalOverlay}>
          <div className={styles.reportModalContent}>
            {/* HEADER WITH QUILL LOGO & ACTIONS */}
            <div className={styles.reportHeaderTop}>
              <div className={styles.reportLogo}>
                <img
                  src="/quill_logo.jpg"
                  alt="Quill Logo"
                  style={{ width: "42px", height: "42px", borderRadius: "10px", objectFit: "cover" }}
                />
                <div>
                  <h2 className={styles.reportBrandName}>Quill Assessment Portal</h2>
                  <p className={styles.reportSubTitle}>Official Academic Subject Performance & Growth Report</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <button className={styles.printBtn} onClick={() => window.print()}>
                  📥 Download PDF Report
                </button>
                <button
                  className={styles.closeBtn}
                  onClick={() => {
                    setShowSubjectReportModal(false);
                    setSelectedSubjectReport(null);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* STUDENT, SUBJECT & REPORT METADATA */}
            <div className={styles.reportMetaGrid}>
              <div className={styles.reportMetaItem}>
                <span className={styles.reportMetaLabel}>Student Name</span>
                <span className={styles.reportMetaVal}>{student?.fullName || student?.name || student?.email || "Student"}</span>
              </div>

              <div className={styles.reportMetaItem}>
                <span className={styles.reportMetaLabel}>Academic Subject / Domain</span>
                <span className={styles.reportMetaVal}>{selectedSubjectReport.subjectName}</span>
              </div>

              <div className={styles.reportMetaItem}>
                <span className={styles.reportMetaLabel}>Lead Educator</span>
                <span className={styles.reportMetaVal}>{selectedSubjectReport.primaryEducatorName}</span>
              </div>

              <div className={styles.reportMetaItem}>
                <span className={styles.reportMetaLabel}>Report Date</span>
                <span className={styles.reportMetaVal}>{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* SUBJECT OVERALL MASTERY METRICS GRID */}
            <div className={styles.reportStatsGrid}>
              <div className={styles.reportStatCard}>
                <div className={styles.reportStatIcon}>📊</div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>
                    Subject Average Accuracy
                  </span>
                  <h3 style={{ margin: "2px 0 0 0", color: "#0f172a", fontSize: "1.3rem" }}>
                    {selectedSubjectReport.overallAvg}%
                  </h3>
                </div>
              </div>

              <div className={styles.reportStatCard}>
                <div className={styles.reportStatIcon}>📝</div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>
                    Tests Attempted
                  </span>
                  <h3 style={{ margin: "2px 0 0 0", color: "#0f172a", fontSize: "1.3rem" }}>
                    {selectedSubjectReport.totalTests} Test(s)
                  </h3>
                </div>
              </div>

              <div className={styles.reportStatCard}>
                <div className={styles.reportStatIcon}>📈</div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>
                    Overall Net Growth
                  </span>
                  <h3 style={{ margin: "2px 0 0 0", color: "#0f172a", fontSize: "1.3rem" }}>
                    {selectedSubjectReport.overallGrowth > 0 ? `+${selectedSubjectReport.overallGrowth}%` : `${selectedSubjectReport.overallGrowth}%`}
                  </h3>
                </div>
              </div>
            </div>

            {/* NEAT TEST MARKS TABLE */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: "1.05rem" }}>
                📋 Academic Subject Test Results ({selectedSubjectReport.testItems.length} Tests)
              </h3>

              <table className={styles.neatReportTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Assessment Test Title</th>
                    <th>Date Attempted</th>
                    <th>Score Achieved</th>
                    <th>Percentage</th>
                    <th>Score Growth</th>
                    <th>Educator</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSubjectReport.testItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "1.5rem" }}>
                        No evaluated test attempts recorded for this subject yet.
                      </td>
                    </tr>
                  ) : (
                    selectedSubjectReport.testItems.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td><strong>#{idx + 1}</strong></td>
                        <td><strong>{item.assessment?.title || "Assessment"}</strong></td>
                        <td>{item.submittedAt}</td>
                        <td>{item.result?.score} / {getAssessmentTotalMarks(item.assessment, item.result)}</td>
                        <td><strong>{item.percentage}%</strong></td>
                        <td>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>
                            {item.scoreImprovement}
                          </span>
                        </td>
                        <td>{item.educatorName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* SHORT & CRISP EDUCATOR REMARKS SECTION AFTER TABLE */}
            <div className={styles.remarksSection}>
              <h4 className={styles.remarksHeader}>
                💬 Educator Remarks & Overall Subject Feedback
              </h4>

              {/* OVERALL SUBJECT REMARK */}
              <div className={styles.overallRemarkBox}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a", marginBottom: "0.25rem" }}>
                  🌟 Overall Subject Mastery Assessment:
                </div>
                <p style={{ margin: 0, fontSize: "0.92rem", color: "#334155", fontStyle: "italic", fontWeight: 600 }}>
                  "{selectedSubjectReport.overallRemark}"
                </p>
              </div>

              {selectedSubjectReport.testItems.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.5rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase" }}>
                    Test-by-Test Remarks:
                  </div>
                  {selectedSubjectReport.testItems.map((item: any, idx: number) => {
                    const rawText = (item.feedback || "").trim();
                    let shortText = rawText;
                    if (shortText.length > 130) {
                      const firstSentence = shortText.split(".")[0];
                      shortText = firstSentence.length > 10 ? `${firstSentence}.` : `${shortText.substring(0, 120)}...`;
                    }

                    return (
                      <div key={idx} className={styles.crispRemarkCard}>
                        <div className={styles.crispRemarkTitle}>
                          Test #{idx + 1}: {item.assessment?.title || "Assessment"} ({item.percentage}%)
                        </div>
                        <p className={styles.crispRemarkText}>
                          "{shortText}"
                        </p>
                        <span className={styles.crispRemarkEducator}>
                          — {item.educatorName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MODAL FOOTER ACTIONS */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.5rem" }}>
              <button
                className={styles.closeBtn}
                style={{ width: "auto", padding: "0.6rem 1.25rem", borderRadius: "10px" }}
                onClick={() => {
                  setShowSubjectReportModal(false);
                  setSelectedSubjectReport(null);
                }}
              >
                Close Report
              </button>
              <button className={styles.printBtn} onClick={() => window.print()}>
                📥 Download PDF Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}