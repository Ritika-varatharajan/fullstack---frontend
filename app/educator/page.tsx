"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import styles from "./educator.module.css";
import AssessmentForm from "../components/AssessmentForm";
import EducatorSidebar from "../components/EducatorSidebar";
import { NotificationsView } from "../components/NotificationsView";
import { API } from "@/app/config/api";

type NotificationItem = {
  id: string;
  type: "completion" | "overdue" | "assignment" | "evaluation";
  title: string;
  message: string;
  time: string;
};

export default function EducatorDashboard() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Student filter inside Assignment panel
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Edit Template Modal
  const [showModal, setShowModal] = useState(false);
  const [editAssessment, setEditAssessment] = useState<any>(null);

  // Post-Creation Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Selected Assessment for Detailed Results Tab
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");

  // Student Answer Sheet Modal
  const [showAnswerSheetModal, setShowAnswerSheetModal] = useState(false);
  const [selectedStudentResult, setSelectedStudentResult] = useState<any>(null);

  // Manual Evaluation State
  const [evalScores, setEvalScores] = useState<Record<number, number>>({});
  const [evalFeedback, setEvalFeedback] = useState<string>("");

  // Notifications State
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);

  const [assignData, setAssignData] = useState({
    assessmentId: "",
    studentIds: [] as string[],
  });

  const router = useRouter();

  // 🌟 MOTIVATIONAL FEEDBACK GENERATOR
  const generateMotivationalFeedback = (pct: number) => {
    if (pct >= 90) {
      return "🌟 Outstanding Performance! Exceptional mastery of concepts. Keep shining and reaching higher!";
    } else if (pct >= 75) {
      return "👏 Great Work! You demonstrated a solid grasp of the subject. A quick review will make you top of the class!";
    } else if (pct >= 50) {
      return "💪 Good Effort! You passed and are making steady progress! Focus on your weak points to unlock your full potential.";
    } else if (pct >= 30) {
      return "🌱 Keep Going! Every mistake is a stepping stone to learning. Review the answer breakdown — you have the potential to succeed!";
    } else {
      return "✨ Don't give up! Every master was once a beginner. Mistakes are proof that you are trying. Review the correct answers and try again — you CAN do this!";
    }
  };

  const openAnswerSheetModal = (st: any, ass: any, rItem: any) => {
    let breakdown = rItem.questionBreakdown || [];
    if (!breakdown || breakdown.length === 0) {
      const qList = ass?.questions || [];
      breakdown = qList.map((q: any, idx: number) => {
        const qType = (q.type || "mcq").toLowerCase();
        const isAuto = qType === "mcq" || qType === "truefalse";
        const userAns = rItem.answers ? String(rItem.answers[idx] || "") : "";
        const correctAns = String(q.correctAnswer || "");
        const isCorrect = isAuto && userAns.toLowerCase() === correctAns.toLowerCase();
        const maxM = q.marks || 1;
        return {
          question: q.questionText || q.question || `Question ${idx + 1}`,
          type: qType,
          userAnswer: userAns || "(No Response Provided)",
          correctAnswer: correctAns,
          isCorrect: isCorrect,
          marks: isAuto ? (isCorrect ? maxM : 0) : 0,
          maxMarks: maxM,
          isManual: !isAuto,
        };
      });
    }

    const initialScores: Record<number, number> = {};
    breakdown.forEach((item: any, idx: number) => {
      initialScores[idx] = Number(item.marks || 0);
    });

    const totalPossible = breakdown.reduce((sum: number, b: any) => sum + Number(b.maxMarks || 1), 0);
    const totalEarned = breakdown.reduce((sum: number, b: any) => sum + Number(b.marks || 0), 0);
    const initialPct = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

    setSelectedStudentResult({
      student: st,
      assessment: ass,
      result: rItem,
      breakdown: breakdown,
    });

    setEvalScores(initialScores);

    if (rItem.feedback && !rItem.feedback.includes("under review") && !rItem.needsEvaluation) {
      setEvalFeedback(rItem.feedback);
    } else {
      setEvalFeedback(generateMotivationalFeedback(initialPct));
    }

    setShowAnswerSheetModal(true);
  };

  const handleScoreChange = (qIndex: number, newScoreVal: string, maxMarks: number) => {
    const numVal = Math.max(0, Math.min(maxMarks, Number(newScoreVal) || 0));

    setEvalScores((prev) => {
      const updated = { ...prev, [qIndex]: numVal };

      const breakdown = selectedStudentResult?.breakdown || [];
      const totalPoss = breakdown.reduce((s: number, b: any) => s + Number(b.maxMarks || 1), 0);
      let totalEarned = 0;
      breakdown.forEach((b: any, idx: number) => {
        const isManual = b.isManual || b.type === "short" || b.type === "essay" || b.type === "long";
        totalEarned += isManual ? (idx === qIndex ? numVal : Number(updated[idx] || 0)) : Number(b.marks || 0);
      });

      const newPct = totalPoss > 0 ? Math.round((totalEarned / totalPoss) * 100) : 0;
      setEvalFeedback(generateMotivationalFeedback(newPct));

      return updated;
    });
  };

  const saveEvaluation = async () => {
    if (!selectedStudentResult || !selectedStudentResult.result) return;

    try {
      const breakdown = selectedStudentResult.breakdown || [];
      const totalPossible = breakdown.reduce((sum: number, b: any) => sum + Number(b.maxMarks || 1), 0);
      let totalEarned = 0;

      const updatedBreakdown = breakdown.map((q: any, idx: number) => {
        const isManual = q.isManual || q.type === "short" || q.type === "essay" || q.type === "long";
        const marksAwarded = isManual ? (evalScores[idx] !== undefined ? Number(evalScores[idx]) : Number(q.marks || 0)) : Number(q.marks || 0);
        totalEarned += marksAwarded;

        return {
          ...q,
          marks: marksAwarded,
          isCorrect: marksAwarded > 0,
        };
      });

      const finalPct = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

      await axios.put(`${API}/results/${selectedStudentResult.result.id}`, {
        score: totalEarned,
        totalMarks: totalPossible,
        percentage: finalPct,
        feedback: evalFeedback,
        questionBreakdown: updatedBreakdown,
        needsEvaluation: false,
        status: "graded",
      });

      alert("Evaluation & Motivational Feedback successfully saved and published! ✅");
      setShowAnswerSheetModal(false);
      setSelectedStudentResult(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to save evaluation. Please try again.");
    }
  };

  let educator: any = {};
  try {
    educator =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user") || "{}")
        : {};
  } catch {
    educator = {};
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [a, r, u, asg] = await Promise.all([
        axios.get(`${API}/assessments`),
        axios.get(`${API}/results`),
        axios.get(`${API}/users`),
        axios.get(`${API}/assignments`),
      ]);

      const loadedAssessments = a.data || [];
      const loadedResults = r.data || [];
      const loadedUsers = u.data || [];
      const loadedAssignments = asg.data || [];

      setAssessments(loadedAssessments);
      setResults(loadedResults);
      setAssignments(loadedAssignments);

      // Filter student users (exclude current logged-in educator)
      const studentUsers = loadedUsers.filter(
        (user: any) =>
          user.role?.toLowerCase() === "student" &&
          String(user.id) !== String(educator.id) &&
          String(user.email || "").toLowerCase() !== String(educator.email || "").toLowerCase()
      );
      setStudents(studentUsers);

      const myAss = loadedAssessments.filter(
        (item: any) =>
          String(item.educatorId) === String(educator.id) ||
          String(item.createdBy) === String(educator.id) ||
          (item.educatorEmail && String(item.educatorEmail).toLowerCase() === String(educator.email || "").toLowerCase())
      );

      if (myAss.length > 0) {
        if (!selectedAssessmentId) setSelectedAssessmentId(String(myAss[0].id));
        if (!assignData.assessmentId) setAssignData((prev) => ({ ...prev, assessmentId: String(myAss[0].id) }));
      }
      generateNotifications(loadedAssessments, loadedResults, loadedUsers, loadedAssignments);
    } catch (err: any) {
      console.error(err);
    }
  };

  const generateNotifications = (
    assList: any[],
    resList: any[],
    userList: any[],
    asgList: any[]
  ) => {
    const list: NotificationItem[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    const isMyAssessment = (a: any) =>
      String(a.educatorId) === String(educator.id) ||
      String(a.createdBy) === String(educator.id) ||
      (a.educatorEmail && String(a.educatorEmail).toLowerCase() === String(educator.email || "").toLowerCase());

    // 1. Completion & Manual Evaluation Notifications (ONLY for assessments created by this Educator)
    resList.forEach((r: any, idx: number) => {
      const ass = assList.find((a) => String(a.id) === String(r.assessmentId));
      const st = userList.find((u) => String(u.id) === String(r.userId || r.studentId));
      if (ass && isMyAssessment(ass) && st) {
        if (r.needsEvaluation || r.status === "pending_review") {
          list.push({
            id: `eval-${r.id || idx}`,
            type: "evaluation",
            title: "📝 Manual Evaluation Required",
            message: `${st.fullName || st.email} submitted "${ass.title}" with short/essay answers awaiting your manual evaluation.`,
            time: r.submittedAt ? new Date(r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
          });
        } else {
          list.push({
            id: `comp-${r.id || idx}`,
            type: "completion",
            title: "🎉 Test Completed by Student",
            message: `${st.fullName || st.email} completed "${ass.title}" with score ${r.score}/${r.totalMarks || 100}.`,
            time: r.submittedAt ? new Date(r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
          });
        }
      }
    });

    // 2. Overdue Notifications (ONLY for assessments created by this Educator)
    assList.forEach((ass: any, idx: number) => {
      if (isMyAssessment(ass) && ass.dueDate && ass.dueDate < todayStr) {
        const assAsg = asgList.filter((a) => String(a.assessmentId) === String(ass.id));
        const completedCount = resList.filter((r) => String(r.assessmentId) === String(ass.id)).length;
        const pending = assAsg.length - completedCount;
        if (pending > 0) {
          list.push({
            id: `overdue-${ass.id || idx}`,
            type: "overdue",
            title: "⚠️ Assessment Deadline Passed",
            message: `Deadline passed for "${ass.title}". ${pending} assigned student(s) pending.`,
            time: `Due: ${ass.dueDate}`,
          });
        }
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

  // ✅ TEMPLATE DELETION (For Assessment Templates ONLY)
  const deleteAssessmentTemplate = async (id: string) => {
    if (!confirm("Delete this assessment template? All questions and assignments for this template will be removed.")) return;
    try {
      await axios.delete(`${API}/assessments/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete assessment template");
    }
  };

  // ✅ UNASSIGN STUDENT FROM AN ASSIGNMENT
  const unassignStudent = async (assignmentId: string) => {
    if (!confirm("Unassign this student from the assessment?")) return;
    try {
      await axios.delete(`${API}/assignments/${assignmentId}`);
      alert("Student unassigned successfully ✅");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to unassign student");
    }
  };

  const assignAssessment = async () => {
    if (!assignData.assessmentId || assignData.studentIds.length === 0) {
      alert("Please select an assessment template and at least one student");
      return;
    }

    try {
      const existing = await axios.get(`${API}/assignments`);
      const existingAssignments = existing.data || [];

      // Check for duplicate assignments
      const alreadyAssignedIds = assignData.studentIds.filter((studentId) =>
        existingAssignments.some(
          (a: any) =>
            String(a.studentId) === String(studentId) &&
            String(a.assessmentId) === String(assignData.assessmentId)
        )
      );

      if (alreadyAssignedIds.length > 0) {
        const selectedTemplate = myAssessments.find(
          (a) => String(a.id) === String(assignData.assessmentId)
        );
        const duplicateStudents = students.filter((s) =>
          alreadyAssignedIds.includes(String(s.id))
        );
        const namesList = duplicateStudents
          .map((s) => `• ${s.fullName || s.email} (${s.email})`)
          .join("\n");

        alert(
          `⚠️ Duplicate Assignment Warning!\n\nThe assessment "${selectedTemplate?.title || "Selected Assessment"}" is ALREADY assigned to:\n\n${namesList}\n\nYou cannot assign the same assessment to the same student multiple times.`
        );
        return;
      }

      await Promise.all(
        assignData.studentIds.map((studentId) =>
          axios.post(`${API}/assignments`, {
            assessmentId: assignData.assessmentId,
            studentId,
          })
        )
      );

      alert(`🚀 Successfully assigned assessment to ${assignData.studentIds.length} student(s)!`);
      setShowAssignModal(false);
      fetchData();
      setActiveTab("assign");
    } catch (err) {
      console.error(err);
      alert("Failed to assign assessment");
    }
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      // Filter out students who are ALREADY assigned to this assessment
      const unassignedStudentIds = students
        .filter(
          (s) =>
            !assignments.some(
              (a: any) =>
                String(a.assessmentId) === String(assignData.assessmentId) &&
                String(a.studentId) === String(s.id)
            )
        )
        .map((s) => String(s.id));

      if (unassignedStudentIds.length === 0) {
        alert("⚠️ All students are already assigned to this assessment!");
        return;
      }

      setAssignData((prev) => ({ ...prev, studentIds: unassignedStudentIds }));
    } else {
      setAssignData((prev) => ({ ...prev, studentIds: [] }));
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    const sId = String(studentId);
    const isAlreadyAssigned = assignments.some(
      (a: any) =>
        String(a.assessmentId) === String(assignData.assessmentId) &&
        String(a.studentId) === sId
    );

    if (isAlreadyAssigned) {
      const st = students.find((s) => String(s.id) === sId);
      const selectedTemplate = myAssessments.find(
        (a) => String(a.id) === String(assignData.assessmentId)
      );
      alert(
        `⚠️ Already Assigned!\n\n"${st?.fullName || st?.email}" is ALREADY assigned to "${selectedTemplate?.title || "this assessment"}".\n\nYou cannot assign the same assessment to the same student again.`
      );
      return;
    }

    setAssignData((prev) => {
      const exists = prev.studentIds.includes(sId);
      if (exists) {
        return { ...prev, studentIds: prev.studentIds.filter((id) => id !== sId) };
      } else {
        return { ...prev, studentIds: [...prev.studentIds, sId] };
      }
    });
  };

  const handleAssessmentFormSubmit = async (formData: any) => {
    try {
      let createdOrUpdatedId = editAssessment?.id;

      if (editAssessment) {
        await axios.put(`${API}/assessments/${editAssessment.id}`, {
          ...formData,
          educatorId: educator.id,
        });
        alert("Assessment template updated successfully ✅");
        setShowModal(false);
        setEditAssessment(null);
        fetchData();
      } else {
        const res = await axios.post(`${API}/assessments`, {
          ...formData,
          educatorId: educator.id,
          createdBy: educator.id,
        });
        createdOrUpdatedId = res.data?.id || (assessments.length + 1).toString();
        alert("Assessment created successfully! Select students to assign ✅");

        setAssignData({
          assessmentId: String(createdOrUpdatedId),
          studentIds: students.map((s) => String(s.id)),
        });
        setShowAssignModal(true);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert("Error saving assessment");
    }
  };

  // ✅ FILTERED DATA BY SEARCH QUERY (ONLY ASSESSMENTS CREATED BY LOGGED-IN EDUCATOR)
  const myAssessments = assessments.filter((a) => {
    const isOwner =
      String(a.educatorId) === String(educator.id) ||
      String(a.createdBy) === String(educator.id) ||
      (a.educatorEmail && String(a.educatorEmail).toLowerCase() === String(educator.email || "").toLowerCase());

    const matchesSearch =
      !searchQuery.trim() ||
      a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category?.toLowerCase().includes(searchQuery.toLowerCase());

    return isOwner && matchesSearch;
  });

  const myResults = results.filter((r) =>
    myAssessments.some((a) => String(a.id) === String(r.assessmentId))
  );

  const myAssignments = assignments.filter((asg) =>
    myAssessments.some((a) => String(a.id) === String(asg.assessmentId))
  );

  const completedAssignments = myAssignments.filter((asg) =>
    myResults.some(
      (r) =>
        String(r.assessmentId) === String(asg.assessmentId) &&
        (String(r.userId) === String(asg.studentId) || String(r.studentId) === String(asg.studentId))
    )
  );

  const completedCount = completedAssignments.length;
  const totalAssigned = myAssignments.length;

  const completionRate = totalAssigned
    ? ((completedCount / totalAssigned) * 100).toFixed(1)
    : 0;

  const evaluatedResults = myResults.filter(
    (r) => !r.needsEvaluation && r.status !== "pending_review"
  );

  const avgScore = evaluatedResults.length
    ? (
        evaluatedResults.reduce((acc, r) => {
          const tMarks = Number(r.totalMarks) > 0 ? Number(r.totalMarks) : 100;
          const pct = r.percentage !== undefined && r.percentage !== null ? Number(r.percentage) : (Number(r.score) / tMarks) * 100;
          return acc + pct;
        }, 0) / evaluatedResults.length
      ).toFixed(1)
    : 0;

  const currentSelectedAss = myAssessments.find(
    (a) => String(a.id) === String(selectedAssessmentId)
  ) || myAssessments[0];

  const currentAssResults = myResults.filter(
    (r) => String(r.assessmentId) === String(currentSelectedAss?.id)
  );

  const currentAssAssignments = myAssignments.filter(
    (asg) => String(asg.assessmentId) === String(currentSelectedAss?.id)
  );

  const currentAssTotalMarks =
    currentSelectedAss?.questions?.reduce(
      (sum: number, q: any) => sum + (q.marks || 1),
      0
    ) || 100;

  const currentAssEvaluatedResults = currentAssResults.filter(
    (r) => !r.needsEvaluation && r.status !== "pending_review"
  );

  const currentAssAttendedCount = currentAssResults.length;
  const totalTargetStudents = currentAssAssignments.length > 0 ? currentAssAssignments.length : students.length;
  const currentAssPendingCount = Math.max(0, totalTargetStudents - currentAssAttendedCount);

  const currentAssAvgMark = currentAssEvaluatedResults.length
    ? (
        currentAssEvaluatedResults.reduce((sum, r) => sum + Number(r.score || 0), 0) /
        currentAssEvaluatedResults.length
      ).toFixed(1)
    : 0;

  const currentAssAvgPct = currentAssEvaluatedResults.length
    ? (
        currentAssEvaluatedResults.reduce((sum, r) => {
          const pct = r.percentage !== undefined && r.percentage !== null ? Number(r.percentage) : (Number(r.score) / currentAssTotalMarks) * 100;
          return sum + pct;
        }, 0) / currentAssEvaluatedResults.length
      ).toFixed(1)
    : 0;

  const currentAssTopMark = currentAssEvaluatedResults.length
    ? Math.max(...currentAssEvaluatedResults.map((r) => Number(r.score || 0)))
    : 0;

  const scoreDistribution = {
    excellent: 0,
    good: 0,
    average: 0,
    poor: 0,
  };

  evaluatedResults.forEach((r) => {
    const totalM = Number(r.totalMarks) > 0 ? Number(r.totalMarks) : 100;
    const pct = r.percentage !== undefined && r.percentage !== null ? Number(r.percentage) : (Number(r.score) / totalM) * 100;
    if (pct >= 80) scoreDistribution.excellent++;
    else if (pct >= 60) scoreDistribution.good++;
    else if (pct >= 40) scoreDistribution.average++;
    else scoreDistribution.poor++;
  });

  const categoryPerformance: Record<string, { totalScore: number; count: number }> = {};
  evaluatedResults.forEach((r) => {
    const ass = assessments.find((a) => String(a.id) === String(r.assessmentId));
    const cat = ass?.category || "General";
    const totalM = Number(r.totalMarks) > 0 ? Number(r.totalMarks) : 100;
    const pct = r.percentage !== undefined && r.percentage !== null ? Number(r.percentage) : (Number(r.score) / totalM) * 100;
    if (!categoryPerformance[cat]) categoryPerformance[cat] = { totalScore: 0, count: 0 };
    categoryPerformance[cat].totalScore += pct;
    categoryPerformance[cat].count++;
  });

  const studentScoresMap: Record<string, { student: any; totalPct: number; count: number }> = {};
  evaluatedResults.forEach((r) => {
    const stId = String(r.userId || r.studentId);
    const st = students.find((s) => String(s.id) === stId);
    if (st) {
      const totalM = Number(r.totalMarks) > 0 ? Number(r.totalMarks) : 100;
      const pct = r.percentage !== undefined && r.percentage !== null ? Number(r.percentage) : (Number(r.score) / totalM) * 100;
      if (!studentScoresMap[stId]) studentScoresMap[stId] = { student: st, totalPct: 0, count: 0 };
      studentScoresMap[stId].totalPct += pct;
      studentScoresMap[stId].count++;
    }
  });

  const studentLeaderboard = Object.values(studentScoresMap)
    .map((item) => ({
      student: item.student,
      avgPct: Math.round(item.totalPct / item.count),
    }))
    .sort((a, b) => b.avgPct - a.avgPct);

  const filteredMyAssessments = myAssessments.filter((a) => {
    const q = (searchQuery || "").toLowerCase().trim();
    if (!q) return true;
    return (
      (a.title || "").toLowerCase().includes(q) ||
      (a.category || "").toLowerCase().includes(q) ||
      (a.description || "").toLowerCase().includes(q)
    );
  });

  const filteredStudents = students.filter((s) => {
    const q = (studentSearchQuery || searchQuery || "").toLowerCase().trim();
    if (!q) return true;
    return (
      (s.fullName || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q)
    );
  });

  const selectedAssessmentForAssign = assessments.find(
    (a) => String(a.id) === String(assignData.assessmentId)
  );

  return (
    <div className={styles.layout}>
      {/* FIXED LEFT SIDEBAR */}
      <EducatorSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        educator={educator}
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
              Welcome back, {(() => {
                const raw = educator?.fullName || educator?.name || educator?.email || "Educator";
                return raw.toLowerCase().startsWith("prof.") ? raw : `Prof. ${raw}`;
              })()} 👋
            </h1>
            <p className={styles.welcomeSub}>
              Assessment Management, Class Delivery, Detailed Results & Visual Analytics Portal.
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
                placeholder="Search assessments, subjects..."
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
                {(educator?.fullName || "E").charAt(0).toUpperCase()}
              </div>
              <span className={styles.pillText}>
                {(() => {
                  const raw = educator?.fullName || educator?.name || "Educator";
                  return raw.toLowerCase().startsWith("prof.") ? raw : `Prof. ${raw}`;
                })()}
              </span>
            </div>
          </div>
        </header>

        {/* 1. DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <div className={styles.sectionContainer}>
            {/* HERO BANNER */}
            <div className={styles.heroBanner}>
              <div className={styles.bannerText}>
                <h2>Educator Assessment Delivery & Monitoring</h2>
                <p>Overview of {myAssessments.length} assessment template{myAssessments.length === 1 ? "" : "s"} across {students.length} students.</p>
              </div>
            </div>

            {/* VIBRANT METRICS GRID */}
            <div className={styles.metricsGrid}>
              <div className={styles.statCardEmerald}>
                <div className={styles.statIconEmerald}>📝</div>
                <div>
                  <span className={styles.statLabel}>Assessment Templates</span>
                  <h3 className={styles.statValue}>{myAssessments.length}</h3>
                </div>
              </div>

              <div className={styles.statCardIndigo}>
                <div className={styles.statIconIndigo}>✍️</div>
                <div>
                  <span className={styles.statLabel}>Student Attempts</span>
                  <h3 className={styles.statValue}>{myResults.length}</h3>
                </div>
              </div>

              <div className={styles.statCardAmber}>
                <div className={styles.statIconAmber}>📊</div>
                <div>
                  <span className={styles.statLabel}>Average Score</span>
                  <h3 className={styles.statValue}>{avgScore}%</h3>
                </div>
              </div>

              <div className={styles.statCardSky}>
                <div className={styles.statIconSky}>👥</div>
                <div>
                  <span className={styles.statLabel}>Total Students</span>
                  <h3 className={styles.statValue}>{students.length}</h3>
                </div>
              </div>

              <div className={styles.statCardRose}>
                <div className={styles.statIconRose}>📈</div>
                <div>
                  <span className={styles.statLabel}>Completion Rate</span>
                  <h3 className={styles.statValue}>{completionRate}%</h3>
                </div>
              </div>
            </div>

            {/* TEMPLATE OVERVIEW SECTION */}
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <h3>Assessment Templates ({myAssessments.length})</h3>
                <button className={styles.linkBtn} onClick={() => setActiveTab("assessments")}>
                  Manage All Templates →
                </button>
              </div>

              {filteredMyAssessments.length === 0 ? (
                <div className={styles.emptyCard}>
                  <p>{searchQuery ? `🔍 No matching assessment templates found for "${searchQuery}".` : "No assessment templates found. Create one using the sidebar menu."}</p>
                </div>
              ) : (
                <div className={styles.cardGrid}>
                  {filteredMyAssessments.slice(0, 4).map((a) => (
                    <div key={a.id} className={styles.templateCardModern}>
                      <div className={styles.cardHeader}>
                        <h4>{a.title}</h4>
                        <span className={styles.categoryBadge}>{a.category || "General"}</span>
                      </div>
                      <p className={styles.cardMeta}>Type: {a.type || "Quiz"} | Time: {a.timeLimit || 30} mins</p>
                      {a.dueDate && <p className={styles.dueDateText}>🗓️ Deadline: {a.dueDate}</p>}
                      <div className={styles.cardActions}>
                        <button
                          className={styles.editBtn}
                          onClick={() => {
                            setEditAssessment(a);
                            setShowModal(true);
                          }}
                        >
                          ✏️ Edit Template
                        </button>
                        <button
                          className={styles.assignQuickBtn}
                          onClick={() => {
                            setAssignData({
                              assessmentId: String(a.id),
                              studentIds: students.map((s) => String(s.id)),
                            });
                            setActiveTab("assign");
                          }}
                        >
                          🎯 Assign to Class
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => deleteAssessmentTemplate(a.id)}
                          title="Delete Template"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. MY ASSESSMENTS (TEMPLATES ONLY) VIEW */}
        {activeTab === "assessments" && (
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>My Assessment Templates ({myAssessments.length})</h2>
                <p className={styles.panelSub}>Create, edit, organize, and delete reusable assessment templates</p>
              </div>
              <button
                className={styles.primaryBtn}
                onClick={() => {
                  setEditAssessment(null);
                  setActiveTab("create");
                }}
              >
                + Create New Template
              </button>
            </div>

            {myAssessments.length === 0 ? (
              <div className={styles.emptyCard}>
                <p>No assessment templates created yet. Click "+ Create New Template".</p>
              </div>
            ) : (
              <div className={styles.cardGrid}>
                {myAssessments.map((a) => (
                  <div key={a.id} className={styles.templateCardModern}>
                    <div className={styles.cardHeader}>
                      <h4>{a.title}</h4>
                      <span className={styles.categoryBadge}>{a.category || "General"}</span>
                    </div>
                    <p className={styles.cardMeta}><strong>Type:</strong> {a.type || "Quiz"}</p>
                    <p className={styles.cardMeta}><strong>Topic:</strong> {a.topic || "General Topic"}</p>
                    <p className={styles.cardMeta}><strong>Time Limit:</strong> {a.timeLimit || 30} mins</p>
                    <p className={styles.cardMeta}><strong>Questions:</strong> {a.questions?.length || 0}</p>
                    {a.dueDate && <p className={styles.dueDateText}>🗓️ Deadline: {a.dueDate}</p>}
                    
                    {/* TEMPLATE ACTIONS (EDIT, ASSIGN, DELETE TEMPLATE) */}
                    <div className={styles.cardActions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => {
                          setEditAssessment(a);
                          setShowModal(true);
                        }}
                      >
                        ✏️ Edit Template
                      </button>
                      <button
                        className={styles.assignQuickBtn}
                        onClick={() => {
                          setAssignData({
                            assessmentId: String(a.id),
                            studentIds: students.map((s) => String(s.id)),
                          });
                          setActiveTab("assign");
                        }}
                      >
                        🎯 Assign to Class
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => deleteAssessmentTemplate(a.id)}
                        title="Delete Template"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. CREATE ASSESSMENT VIEW */}
        {activeTab === "create" && (
          <div className={styles.sectionContainer}>
            <h2>Create New Assessment Template</h2>
            <div className={styles.formContainer}>
              <AssessmentForm
                onSubmit={handleAssessmentFormSubmit}
                initialData={editAssessment}
              />
            </div>
          </div>
        )}

        {/* 4. ACTIVE DELIVERED ASSIGNMENTS MANAGER */}
        {activeTab === "assign" && (
          <div className={styles.sectionContainer}>
            <h2>🎯 Interactive Class Assignment Delivery Manager</h2>

            <div className={styles.assignManagerLayout}>
              {/* LEFT COLUMN: ASSESSMENT TEMPLATE SELECTOR */}
              <div className={styles.assignLeftPanel}>
                <h3>1. Select Assessment Template</h3>
                <p className={styles.panelSub}>Click an assessment template to assign to students</p>

                <div className={styles.templateList}>
                  {myAssessments.length === 0 ? (
                    <div className={styles.emptyCard}>
                      <p>No assessment templates created by you yet. Click "+ Create New Template" to create one!</p>
                    </div>
                  ) : (
                    myAssessments.map((a) => {
                      const isSelected = String(a.id) === String(assignData.assessmentId);
                      const totalM = a.questions?.reduce((s: number, q: any) => s + (q.marks || 1), 0) || 0;
                      return (
                        <div
                          key={a.id}
                          className={`${styles.templateCard} ${isSelected ? styles.selectedTemplateCard : ""}`}
                          onClick={() => setAssignData({ ...assignData, assessmentId: String(a.id) })}
                        >
                          <div className={styles.templateCardTop}>
                            <h4>{a.title}</h4>
                            <span className={styles.categoryBadge}>{a.category || "General"}</span>
                          </div>
                          <p className={styles.templateMeta}>
                            ⏱️ {a.timeLimit || 30} mins | 🎯 {totalM} Marks | ❓ {a.questions?.length || 0} Questions
                          </p>
                          {a.dueDate && <p className={styles.dueDateText}>🗓️ Due: {a.dueDate}</p>}
                          {isSelected && <span className={styles.selectedBadge}>Selected Template ✅</span>}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: INTERACTIVE STUDENT ROSTER */}
              <div className={styles.assignRightPanel}>
                <div className={styles.rosterHeader}>
                  <div>
                    <h3>2. Select Recipient Students</h3>
                    <p className={styles.panelSub}>Click student cards to toggle assignment selection</p>
                  </div>

                  <div className={styles.rosterControls}>
                    <button
                      className={styles.selectAllToggleBtn}
                      onClick={() => handleToggleSelectAll(assignData.studentIds.length < students.length)}
                    >
                      {assignData.studentIds.length === students.length ? "Clear Selection" : "⚡ Select All Students"}
                    </button>
                  </div>
                </div>

                {/* STUDENT SEARCH FILTER */}
                <div className={styles.studentSearchBox}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    className={styles.searchInput}
                    placeholder="Search students by name or email..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                  />
                </div>

                {/* INTERACTIVE STUDENT AVATAR GRID */}
                <div className={styles.studentAvatarGrid}>
                  {filteredStudents.length === 0 ? (
                    <p className={styles.emptyCard}>No students match search filter.</p>
                  ) : (
                    filteredStudents.map((s) => {
                      const isAssigned = assignData.studentIds.includes(String(s.id));
                      const initial = (s.fullName || s.email || "S").charAt(0).toUpperCase();

                      return (
                        <div
                          key={s.id}
                          className={`${styles.studentAvatarCard} ${isAssigned ? styles.assignedCard : ""}`}
                          onClick={() => toggleStudentSelection(String(s.id))}
                        >
                          <div className={styles.cardAvatarCircle}>{initial}</div>
                          <div className={styles.studentInfo}>
                            <h4>{s.fullName || "Student"}</h4>
                            <span>{s.email}</span>
                          </div>
                          <div className={styles.checkIcon}>
                            {isAssigned ? "✅" : "➕"}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* ASSIGNMENT CONFIRMATION SUMMARY BAR */}
                <div className={styles.assignSummaryBox}>
                  <div>
                    <h4>Assignment Summary:</h4>
                    <p>
                      Template: <strong>{selectedAssessmentForAssign?.title || "None Selected"}</strong>
                    </p>
                    <p>
                      Recipients: <strong>{assignData.studentIds.length} Student(s) Selected</strong>
                    </p>
                  </div>

                  <button
                    className={styles.launchAssignBtn}
                    onClick={assignAssessment}
                    disabled={!assignData.assessmentId || assignData.studentIds.length === 0}
                  >
                    🚀 Confirm & Send Assignment ({assignData.studentIds.length})
                  </button>
                </div>
              </div>
            </div>

            {/* DELIVERED ASSIGNMENTS MONITORING TABLE (UNASSIGN OPTION AVAILABLE HERE) */}
            <div className={styles.tableContainer} style={{ marginTop: "2rem" }}>
              <div className={styles.sectionHeader} style={{ padding: "1.25rem 1.5rem 0.5rem 1.5rem" }}>
                <h3>Active Delivered Assignments ({myAssignments.length})</h3>
                <span className={styles.panelSub}>Monitor active student assignments & manage unassignments</span>
              </div>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Assessment Title</th>
                    <th>Assigned Student</th>
                    <th>Deadline / Due Date</th>
                    <th>Completion Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center" }}>No active assignments delivered yet.</td>
                    </tr>
                  ) : (
                    myAssignments.map((asg) => {
                      const ass = assessments.find((a) => String(a.id) === String(asg.assessmentId));
                      const st = students.find((s) => String(s.id) === String(asg.studentId));
                      const isDone = results.some(
                        (r) => String(r.assessmentId) === String(asg.assessmentId) && String(r.userId || r.studentId) === String(asg.studentId)
                      );

                      return (
                        <tr key={asg.id}>
                          <td><strong>{ass?.title || `Assessment #${asg.assessmentId}`}</strong></td>
                          <td>{st?.fullName || st?.email || asg.studentId}</td>
                          <td>{ass?.dueDate ? <span>🗓️ {ass.dueDate}</span> : "No deadline"}</td>
                          <td>
                            <span className={isDone ? styles.statusActive : styles.statusPending}>
                              {isDone ? "Completed ✅" : "Pending ⏳"}
                            </span>
                          </td>
                          <td>
                            <button
                              className={styles.unassignBtn}
                              onClick={() => unassignStudent(asg.id)}
                            >
                              ❌ Unassign Student
                            </button>
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

        {/* 5. STUDENTS VIEW */}
        {activeTab === "students" && (
          <div className={styles.sectionContainer}>
            <h2>Registered Students & Class Roster ({students.length})</h2>
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>{s.fullName || "Student"}</td>
                      <td>{s.email}</td>
                      <td>{s.role}</td>
                      <td><span className={styles.statusActive}>Active Student</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. RESULTS VIEW */}
        {activeTab === "results" && (
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeader}>
              <h2>Assessment Results & Detailed Reports</h2>
            </div>

            {myAssessments.length === 0 ? (
              <div className={styles.emptyCard}>
                <p>No assessment templates created by you yet.</p>
              </div>
            ) : (
              <>
                <div className={styles.assessmentSelectorRow}>
                  <label className={styles.selectorLabel}>Select Assessment to View Detailed Report:</label>
                  <select
                    className={styles.assessmentDropdown}
                    value={selectedAssessmentId}
                    onChange={(e) => setSelectedAssessmentId(e.target.value)}
                  >
                    {myAssessments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({a.category || "General"})
                      </option>
                    ))}
                  </select>
                </div>

                {currentSelectedAss && (
                  <div className={styles.reportContainer}>
                    <div className={styles.reportHeaderCard}>
                      <div>
                        <h3>📊 Detailed Results: {currentSelectedAss.title}</h3>
                        <p className={styles.reportSub}>
                          Category: {currentSelectedAss.category || "General"} | Total Assigned Students: {currentAssAssignments.length || students.length}
                        </p>
                      </div>
                    </div>

                    <div className={styles.metricsGrid}>
                      <div className={styles.statCardEmerald}>
                        <div className={styles.statIconEmerald}>📊</div>
                        <div>
                          <span className={styles.statLabel}>Average Accuracy</span>
                          <h3 className={styles.statValue}>{currentAssAvgMark} / {currentAssTotalMarks} ({currentAssAvgPct}%)</h3>
                        </div>
                      </div>

                      <div className={styles.statCardRose}>
                        <div className={styles.statIconRose}>🏆</div>
                        <div>
                          <span className={styles.statLabel}>Top Score</span>
                          <h3 className={styles.statValue}>{currentAssTopMark} / {currentAssTotalMarks}</h3>
                        </div>
                      </div>

                      <div className={styles.statCardSky}>
                        <div className={styles.statIconSky}>✅</div>
                        <div>
                          <span className={styles.statLabel}>Attended Students</span>
                          <h3 className={styles.statValue}>{currentAssAttendedCount}</h3>
                        </div>
                      </div>

                      <div className={styles.statCardAmber}>
                        <div className={styles.statIconAmber}>⏳</div>
                        <div>
                          <span className={styles.statLabel}>Pending Students</span>
                          <h3 className={styles.statValue}>{currentAssPendingCount}</h3>
                        </div>
                      </div>
                    </div>

                    <div className={styles.tableContainer} style={{ marginTop: "1.5rem" }}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Status</th>
                            <th>Score Achieved</th>
                            <th>Percentage</th>
                            <th>Score Improvement vs Previous Test</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((st) => {
                            const resultItem = currentAssResults.find(
                              (r) => String(r.userId || r.studentId) === String(st.id)
                            );

                            const isAttended = Boolean(resultItem);
                            const isPendingEval = Boolean(resultItem && (resultItem.needsEvaluation || resultItem.status === "pending_review"));

                            let studentImprovementBadge = <span className={styles.badgeNeutral}>N/A</span>;
                            if (resultItem && !isPendingEval) {
                              const evaluatedStudentResults = results
                                .filter((r) => String(r.userId || r.studentId) === String(st.id) && !r.needsEvaluation && r.status !== "pending_review")
                                .sort((x, y) => new Date(x.submittedAt || 0).getTime() - new Date(y.submittedAt || 0).getTime());

                              const currIndex = evaluatedStudentResults.findIndex((r) => String(r.id) === String(resultItem.id));
                              if (currIndex > 0) {
                                const prevResult = evaluatedStudentResults[currIndex - 1];
                                const prevTotMarks = Number(prevResult.totalMarks) > 0 ? Number(prevResult.totalMarks) : 100;
                                const currPct = resultItem.percentage !== undefined && resultItem.percentage !== null ? Number(resultItem.percentage) : ((resultItem.score / currentAssTotalMarks) * 100);
                                const prevPct = prevResult.percentage !== undefined && prevResult.percentage !== null ? Number(prevResult.percentage) : ((prevResult.score / prevTotMarks) * 100);
                                const diff = Number((currPct - prevPct).toFixed(1));

                                if (diff > 0) {
                                  studentImprovementBadge = <span className={styles.badgeGreen}>🚀 +{diff}% Improvement</span>;
                                } else if (diff < 0) {
                                  studentImprovementBadge = <span className={styles.badgeRed}>📉 {diff}% Score Change</span>;
                                } else {
                                  studentImprovementBadge = <span className={styles.badgeNeutral}>🎯 Stable Score</span>;
                                }
                              } else {
                                studentImprovementBadge = <span className={styles.badgeBlue}>⭐ Initial Test</span>;
                              }
                            }

                             return (
                              <tr key={st.id}>
                                <td>{st.fullName || st.email}</td>
                                <td>
                                  {!isAttended ? (
                                    <span className={styles.statusPending}>Pending ⏳</span>
                                  ) : isPendingEval ? (
                                    <span className={styles.statusPendingEval}>Needs Evaluation 📝</span>
                                  ) : (
                                    <span className={styles.statusActive}>Graded ✅</span>
                                  )}
                                </td>
                                <td>{!isAttended ? "-" : isPendingEval ? <span style={{ color: "#d97706", fontWeight: 700 }}>Pending Evaluation</span> : `${resultItem.score} / ${currentAssTotalMarks}`}</td>
                                <td>{!isAttended ? "-" : isPendingEval ? <span style={{ color: "#d97706", fontWeight: 700 }}>Pending Evaluation</span> : <strong>{(resultItem.percentage !== undefined && resultItem.percentage !== null ? Number(resultItem.percentage) : (resultItem.score / currentAssTotalMarks) * 100).toFixed(1)}%</strong>}</td>
                                <td>{studentImprovementBadge}</td>
                                <td>
                                  {isAttended ? (
                                    <button
                                      className={isPendingEval ? styles.evalBtn : styles.reviewBtn}
                                      onClick={() => openAnswerSheetModal(st, currentSelectedAss, resultItem)}
                                    >
                                      {isPendingEval ? "📝 Evaluate Submission" : "📄 View Answer Sheet"}
                                    </button>
                                  ) : (
                                    <span className={styles.dimText}>Not Submitted</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 7. HIGH-IMPACT VISUAL ANALYTICS & STUDENT LEADERBOARD */}
        {activeTab === "analytics" && (
          <div className={styles.sectionContainer}>
            <h2>Class Performance Analytics & Visual Reports</h2>

            {/* CLASS OVERVIEW METRICS */}
            <div className={styles.metricsGrid}>
              <div className={styles.statCardEmerald}>
                <div className={styles.statIconEmerald}>📊</div>
                <div>
                  <span className={styles.statLabel}>Class Average Accuracy</span>
                  <h3 className={styles.statValue}>{avgScore}%</h3>
                </div>
              </div>

              <div className={styles.statCardIndigo}>
                <div className={styles.statIconIndigo}>✍️</div>
                <div>
                  <span className={styles.statLabel}>Total Tests Submitted</span>
                  <h3 className={styles.statValue}>{myResults.length}</h3>
                </div>
              </div>

              <div className={styles.statCardRose}>
                <div className={styles.statIconRose}>📈</div>
                <div>
                  <span className={styles.statLabel}>Assignment Completion Rate</span>
                  <h3 className={styles.statValue}>{completionRate}%</h3>
                </div>
              </div>
            </div>

            {/* TWO COLUMN ANALYTICS GRID */}
            <div className={styles.analyticsTwoCol}>
              {/* SCORE DISTRIBUTION BAR CHART */}
              <div className={styles.chartCard}>
                <h3>📊 Class Score Distribution Chart</h3>
                <p className={styles.chartSub}>Student counts grouped by performance score tiers</p>

                <div className={styles.barChartContainer}>
                  <div className={styles.barGroup}>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFillGreen}
                        style={{ height: `${Math.min(100, (scoreDistribution.excellent / (myResults.length || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className={styles.barVal}>{scoreDistribution.excellent}</span>
                    <span className={styles.barLabel}>Excellent (80-100%)</span>
                  </div>

                  <div className={styles.barGroup}>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFillBlue}
                        style={{ height: `${Math.min(100, (scoreDistribution.good / (myResults.length || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className={styles.barVal}>{scoreDistribution.good}</span>
                    <span className={styles.barLabel}>Good (60-79%)</span>
                  </div>

                  <div className={styles.barGroup}>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFillYellow}
                        style={{ height: `${Math.min(100, (scoreDistribution.average / (myResults.length || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className={styles.barVal}>{scoreDistribution.average}</span>
                    <span className={styles.barLabel}>Average (40-59%)</span>
                  </div>

                  <div className={styles.barGroup}>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFillRed}
                        style={{ height: `${Math.min(100, (scoreDistribution.poor / (myResults.length || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className={styles.barVal}>{scoreDistribution.poor}</span>
                    <span className={styles.barLabel}>Need Practice (&lt;40%)</span>
                  </div>
                </div>
              </div>

              {/* TOP PERFORMING STUDENTS LEADERBOARD */}
              <div className={styles.chartCard}>
                <h3>🏆 Top Performing Students Leaderboard</h3>
                <p className={styles.chartSub}>Highest average score achievers across all assessments</p>

                <div className={styles.leaderboardList}>
                  {studentLeaderboard.slice(0, 4).map((item, rank) => (
                    <div key={item.student.id} className={styles.leaderItem}>
                      <span className={styles.rankMedal}>
                        {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `#${rank + 1}`}
                      </span>
                      <div className={styles.leaderInfo}>
                        <h4 className={styles.leaderName}>{item.student.fullName || item.student.email}</h4>
                        <span className={styles.leaderEmail}>{item.student.email}</span>
                      </div>
                      <span className={styles.leaderScoreBadge}>{item.avgPct}% Avg Score</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CATEGORY ACCURACY COMPARISON PROGRESS BARS */}
            <div className={styles.chartCard}>
              <h3>📚 Subject / Category Accuracy Mastery</h3>
              <p className={styles.chartSub}>Average class accuracy percentage per academic domain</p>
              <div className={styles.categoryProgressList}>
                {Object.entries(categoryPerformance).map(([catName, data]) => {
                  const avgCatPct = Math.round(data.totalScore / (data.count || 1));
                  return (
                    <div key={catName} className={styles.catProgressItem}>
                      <div className={styles.catProgressHeader}>
                        <span><strong>{catName}</strong> ({data.count} Test Attempts)</span>
                        <strong>{avgCatPct}% Average Accuracy</strong>
                      </div>
                      <div className={styles.progressTrack}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${avgCatPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 8. INTERACTIVE NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <div className={styles.sectionContainer}>
            <NotificationsView
              notificationsList={notificationsList}
              onDismissNotification={dismissNotification}
              onClearAll={() => setNotificationsList([])}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          </div>
        )}

        {/* 📄 STUDENT ANSWER SHEET & MANUAL EVALUATION MODAL */}
        {showAnswerSheetModal && selectedStudentResult && (() => {
          const breakdown = selectedStudentResult.breakdown || [];
          const totalPossible = breakdown.reduce((sum: number, b: any) => sum + Number(b.maxMarks || 1), 0);
          let currentCalculatedScore = 0;
          breakdown.forEach((b: any, idx: number) => {
            const isManual = b.isManual || b.type === "short" || b.type === "essay" || b.type === "long";
            currentCalculatedScore += isManual ? Number(evalScores[idx] !== undefined ? evalScores[idx] : b.marks || 0) : Number(b.marks || 0);
          });
          const currentCalculatedPct = totalPossible > 0 ? Math.round((currentCalculatedScore / totalPossible) * 100) : 0;
          const isPendingEval = selectedStudentResult.result?.needsEvaluation || selectedStudentResult.result?.status === "pending_review";

          return (
            <div className={styles.modalOverlay}>
              <div className={styles.evalModalContent}>
                <div className={styles.modalHeader}>
                  <div>
                    <h3>{isPendingEval ? "📝 Manual Evaluation Portal" : "📄 Student Answer Sheet & Result Breakdown"}</h3>
                    <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.88rem" }}>
                      Assessment: <strong>{selectedStudentResult.assessment?.title}</strong> | Student: <strong>{selectedStudentResult.student?.fullName || selectedStudentResult.student?.email}</strong>
                    </p>
                  </div>
                  <button className={styles.closeBtn} onClick={() => setShowAnswerSheetModal(false)}>✕</button>
                </div>

                {/* SCORE METRICS HEADER CARD */}
                <div className={styles.evalHeaderCard}>
                  <div className={styles.evalHeaderItem}>
                    <span className={styles.evalHeaderLabel}>Total Score</span>
                    <span className={styles.evalHeaderValue}>{currentCalculatedScore} / {totalPossible} Marks</span>
                  </div>
                  <div className={styles.evalHeaderItem}>
                    <span className={styles.evalHeaderLabel}>Percentage</span>
                    <span className={styles.evalHeaderValue}>{currentCalculatedPct}%</span>
                  </div>
                  <div className={styles.evalHeaderItem}>
                    <span className={styles.evalHeaderLabel}>Evaluation Status</span>
                    <span className={styles.evalHeaderValue}>
                      {isPendingEval ? (
                        <span className={styles.statusPendingEval}>Needs Evaluation 📝</span>
                      ) : (
                        <span className={styles.statusActive}>Graded ✅</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* QUESTION BREAKDOWN & MANUAL GRADING INPUTS */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <h4 style={{ margin: 0, color: "#0f172a", fontSize: "1.05rem" }}>
                    Question Responses & Grading Breakdown ({breakdown.length} Questions)
                  </h4>

                  {breakdown.map((qItem: any, qIdx: number) => {
                    const qType = (qItem.type || "mcq").toLowerCase();
                    const isManual = qItem.isManual || qType === "short" || qType === "essay" || qType === "long";

                    return (
                      <div key={qIdx} className={styles.evalQuestionCard}>
                        <div className={styles.evalQuestionTitle}>
                          <span>
                            Q{qIdx + 1}. {qItem.question}
                          </span>
                          <span className={styles.evalTypeBadge}>
                            {isManual ? "✍️ Manual Evaluation" : "🤖 Auto-Graded"}
                          </span>
                        </div>

                        {!isManual ? (
                          /* MCQ / TrueFalse Auto-Graded Display */
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem" }}>
                            <div>
                              <strong>Student Answer:</strong>{" "}
                              <span style={{ color: qItem.isCorrect ? "#059669" : "#dc2626", fontWeight: 700 }}>
                                {qItem.userAnswer} {qItem.isCorrect ? " (Correct ✅)" : " (Incorrect ❌)"}
                              </span>
                            </div>
                            <div>
                              <strong>Correct Answer:</strong> {qItem.correctAnswer}
                            </div>
                            <div>
                              <strong>Score Awarded:</strong> {qItem.marks} / {qItem.maxMarks} Marks
                            </div>
                          </div>
                        ) : (
                          /* Short / Essay Manual Evaluation Block */
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <div>
                              <strong style={{ fontSize: "0.85rem", color: "#64748b" }}>STUDENT WRITTEN RESPONSE:</strong>
                              <div className={styles.studentTextResponse}>
                                {qItem.userAnswer || "(No response provided by student)"}
                              </div>
                            </div>

                            {qItem.correctAnswer && (
                              <div className={styles.expectedResponse}>
                                💡 <strong>Reference / Expected Rubric Answer:</strong> {qItem.correctAnswer}
                              </div>
                            )}

                            <div className={styles.scoreInputGroup}>
                              <label style={{ fontSize: "0.9rem", color: "#7c2d12" }}>
                                <strong>Award Score for Q{qIdx + 1}:</strong>
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={qItem.maxMarks}
                                step="0.5"
                                value={evalScores[qIdx] !== undefined ? evalScores[qIdx] : qItem.marks || 0}
                                onChange={(e) => handleScoreChange(qIdx, e.target.value, qItem.maxMarks)}
                                className={styles.evalScoreInput}
                              />
                              <span style={{ fontWeight: 700, color: "#9a3412" }}>/ {qItem.maxMarks} Max Marks</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* MOTIVATIONAL FEEDBACK SECTION */}
                <div className={styles.feedbackSection}>
                  <div className={styles.feedbackHeaderRow}>
                    <label style={{ fontWeight: 800, color: "#7c2d12", fontSize: "0.95rem" }}>
                      💬 Encouraging & Motivational Feedback for Student:
                    </label>
                    <button
                      className={styles.regenFeedbackBtn}
                      onClick={() => setEvalFeedback(generateMotivationalFeedback(currentCalculatedPct))}
                      title="Auto-generate motivational feedback based on total calculated score percentage"
                    >
                      ⚡ Auto-Generate Feedback
                    </button>
                  </div>

                  <textarea
                    className={styles.evalTextArea}
                    rows={3}
                    value={evalFeedback}
                    onChange={(e) => setEvalFeedback(e.target.value)}
                    placeholder="Provide personalized, motivating feedback for the student..."
                  />
                  <span style={{ fontSize: "0.78rem", color: "#9a3412" }}>
                    💡 Tip: The feedback above was automatically set based on the score ({currentCalculatedPct}%). You can freely edit or customize it!
                  </span>
                </div>

                {/* ACTION BUTTONS */}
                <div className={styles.modalActionRow}>
                  <button className={styles.secondaryBtn} onClick={() => setShowAnswerSheetModal(false)}>
                    Cancel
                  </button>
                  <button className={styles.primaryBtn} onClick={saveEvaluation}>
                    💾 Save & Publish Evaluation
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 🚀 POST-CREATION INSTANT ASSIGN PROMPT MODAL */}
        {showAssignModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>🎯 Assessment Created! Assign Students Now</h3>
                <button className={styles.closeBtn} onClick={() => setShowAssignModal(false)}>✕</button>
              </div>

              <p className={styles.assignPromptText}>
                Who would you like to assign this assessment to?
              </p>

              <div className={styles.formGroup}>
                <div className={styles.selectHeader}>
                  <label className={styles.selectAllBtn}>
                    <input
                      type="checkbox"
                      checked={
                        students.length > 0 &&
                        assignData.studentIds.length === students.length
                      }
                      onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    />
                    <span><strong>Select All Students ({students.length})</strong></span>
                  </label>
                </div>

                <div className={styles.studentSelectList}>
                  {students.map((s) => {
                    const isSelected = assignData.studentIds.includes(String(s.id));
                    return (
                      <label key={s.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignData({
                                ...assignData,
                                studentIds: [...assignData.studentIds, String(s.id)],
                              });
                            } else {
                              setAssignData({
                                ...assignData,
                                studentIds: assignData.studentIds.filter(
                                  (id) => id !== String(s.id)
                                ),
                              });
                            }
                          }}
                        />
                        <span>{s.fullName || s.email} ({s.email})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className={styles.modalActionRow}>
                <button className={styles.secondaryBtn} onClick={() => setShowAssignModal(false)}>
                  Assign Later
                </button>
                <button className={styles.primaryBtn} onClick={assignAssessment}>
                  Assign Now ({assignData.studentIds.length} Selected)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT ASSESSMENT MODAL */}
        {showModal && editAssessment && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>Edit Assessment Template</h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => {
                    setShowModal(false);
                    setEditAssessment(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <AssessmentForm
                onSubmit={handleAssessmentFormSubmit}
                initialData={editAssessment}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}