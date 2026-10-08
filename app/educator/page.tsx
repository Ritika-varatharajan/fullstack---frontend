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
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  // Notes State
  const [notes, setNotes] = useState<any[]>([]);
  const [noteAssignments, setNoteAssignments] = useState<any[]>([]);
  const [activeNoteSubTab, setActiveNoteSubTab] = useState<"create" | "assign-notes" | "list">("create");
  const [newNote, setNewNote] = useState({
    title: "",
    category: "",
    topic: "",
    description: "",
    content: "",
    fileUrl: "",
    fileName: "",
  });
  const [assignNoteData, setAssignNoteData] = useState({
    noteId: "",
    studentIds: [] as string[],
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("File size exceeds 15MB limit. Please choose a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setNewNote((prev) => ({
        ...prev,
        fileUrl: dataUrl,
        fileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

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
      const [a, r, u, asg, n, nasg] = await Promise.all([
        axios.get(`${API}/assessments`),
        axios.get(`${API}/results`),
        axios.get(`${API}/users`),
        axios.get(`${API}/assignments`),
        axios.get(`${API}/notes`).catch(() => ({ data: [] })),
        axios.get(`${API}/note-assignments`).catch(() => ({ data: [] })),
      ]);

      const loadedAssessments = a.data || [];
      const loadedResults = r.data || [];
      const loadedUsers = u.data || [];
      const loadedAssignments = asg.data || [];
      const loadedNotes = n.data || [];
      const loadedNoteAssignments = nasg.data || [];

      setAssessments(loadedAssessments);
      setResults(loadedResults);
      setAssignments(loadedAssignments);
      setNotes(loadedNotes);
      setNoteAssignments(loadedNoteAssignments);

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
      if (!editAssessment) {
        // Check if an assessment with the exact same title & category created by this educator already exists
        const existingDuplicate = assessments.find(
          (a) =>
            (String(a.educatorId) === String(educator.id) || String(a.createdBy) === String(educator.id)) &&
            String(a.title || "").trim().toLowerCase() === String(formData.title || "").trim().toLowerCase() &&
            String(a.category || "").trim().toLowerCase() === String(formData.category || "").trim().toLowerCase()
        );

        if (existingDuplicate) {
          alert("This assessment is already created");
          setAssignData({
            assessmentId: String(existingDuplicate.id),
            studentIds: [],
          });
          setActiveTab("assign");
          return;
        }
      }

      if (editAssessment) {
        await axios.put(`${API}/assessments/${editAssessment.id}`, {
          ...formData,
          educatorId: educator.id,
        });
        alert("Assessment template updated successfully! Redirecting to Assignments section ✅");
        setShowModal(false);
        setEditAssessment(null);
        await fetchData();
        setAssignData({
          assessmentId: String(editAssessment.id),
          studentIds: [],
        });
        setActiveTab("assign");
      } else {
        const res = await axios.post(`${API}/assessments`, {
          ...formData,
          educatorId: educator.id,
          createdBy: educator.id,
        });
        const createdId = res.data?.id;
        alert("Assessment created successfully! Redirecting to Assignments section to assign to students. ✅");

        await fetchData();
        setAssignData({
          assessmentId: String(createdId || ""),
          studentIds: [],
        });
        setActiveTab("assign");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving assessment");
    }
  };

  // ✅ NOTES HANDLERS
  const handleCreateNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.category.trim()) {
      alert("Please enter a note title and category/subject.");
      return;
    }

    try {
      // Check duplicate note created by this educator
      const existingDuplicate = notes.find(
        (n) =>
          (String(n.educatorId) === String(educator.id) || String(n.createdBy) === String(educator.id)) &&
          String(n.title || "").trim().toLowerCase() === String(newNote.title || "").trim().toLowerCase() &&
          String(n.category || "").trim().toLowerCase() === String(newNote.category || "").trim().toLowerCase()
      );

      if (existingDuplicate) {
        alert("This note is already created");
        setAssignNoteData({
          noteId: String(existingDuplicate.id),
          studentIds: [],
        });
        setActiveNoteSubTab("assign-notes");
        return;
      }

      const res = await axios.post(`${API}/notes`, {
        ...newNote,
        educatorId: educator.id,
        educatorName: educator.fullName || educator.name || educator.email || "Educator",
        createdBy: educator.id,
      });

      alert("Study note created successfully! Redirecting to Assign Notes section ✅");
      const createdNoteId = res.data?.id;

      await fetchData();

      setAssignNoteData({
        noteId: String(createdNoteId || ""),
        studentIds: [],
      });
      setActiveNoteSubTab("assign-notes");
      setNewNote({ title: "", category: "", topic: "", description: "", content: "", fileUrl: "", fileName: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to create note");
    }
  };

  const handleAssignNoteToStudents = async () => {
    if (!assignNoteData.noteId || assignNoteData.studentIds.length === 0) {
      alert("Please select a study note and at least one student.");
      return;
    }

    try {
      const existing = await axios.get(`${API}/note-assignments`).catch(() => ({ data: [] }));
      const existingAssignments = existing.data || [];

      const alreadyAssignedIds = assignNoteData.studentIds.filter((studentId) =>
        existingAssignments.some(
          (na: any) =>
            String(na.studentId) === String(studentId) &&
            String(na.noteId) === String(assignNoteData.noteId)
        )
      );

      if (alreadyAssignedIds.length > 0) {
        const selectedNoteObj = notes.find((n) => String(n.id) === String(assignNoteData.noteId));
        const duplicateStudents = students.filter((s) => alreadyAssignedIds.includes(String(s.id)));
        const namesList = duplicateStudents.map((s) => `• ${s.fullName || s.email}`).join("\n");
        alert(
          `⚠️ Duplicate Note Assignment Warning!\n\nThe note "${selectedNoteObj?.title || "Selected Note"}" is ALREADY assigned to:\n\n${namesList}\n\nYou cannot assign the same note to the same student multiple times.`
        );
        return;
      }

      await Promise.all(
        assignNoteData.studentIds.map((studentId) =>
          axios.post(`${API}/note-assignments`, {
            noteId: assignNoteData.noteId,
            studentId: studentId,
          })
        )
      );

      alert(`🚀 Successfully assigned study note to ${assignNoteData.studentIds.length} student(s)!`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to assign study note.");
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this study note? All student assignments for this note will be removed.")) return;
    try {
      await axios.delete(`${API}/notes/${id}`);
      alert("Study note deleted successfully ✅");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete note.");
    }
  };

  const deleteNoteAssignment = async (assignmentId: string) => {
    if (!confirm("Unassign student from this note?")) return;
    try {
      await axios.delete(`${API}/note-assignments/${assignmentId}`);
      alert("Student unassigned from note ✅");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to unassign student.");
    }
  };

  const myNotes = notes.filter(
    (n) =>
      String(n.educatorId) === String(educator.id) ||
      String(n.createdBy) === String(educator.id)
  );

  const myNotesAssignments = noteAssignments.filter((na) =>
    myNotes.some((n) => String(n.id) === String(na.noteId))
  );

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

            {/* PROFILE PILL & DROPDOWN MENU */}
            <div className={styles.profileWrapper}>
              <div
                className={styles.profilePill}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                title="Account Menu"
              >
                <div className={styles.pillAvatar}>
                  {(educator?.fullName || educator?.name || "E").charAt(0).toUpperCase()}
                </div>
                <span className={styles.pillText}>
                  {(() => {
                    const raw = educator?.fullName || educator?.name || "Educator";
                    return raw.toLowerCase().startsWith("prof.") ? raw : `Prof. ${raw}`;
                  })()}
                </span>
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{
                    marginLeft: "2px",
                    transition: "transform 0.2s",
                    transform: showProfileDropdown ? "rotate(180deg)" : "none",
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {showProfileDropdown && (
                <>
                  <div
                    className={styles.profileDropdownOverlay}
                    onClick={() => setShowProfileDropdown(false)}
                  />
                  <div className={styles.profileDropdownMenu}>
                    <div className={styles.dropdownHeader}>
                      <div className={styles.dropdownAvatar}>
                        {(educator?.fullName || educator?.name || "E").charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.dropdownUserInfo}>
                        <span className={styles.dropdownName}>
                          {educator?.fullName || educator?.name || "Educator"}
                        </span>
                        <span className={styles.dropdownEmail}>
                          {educator?.email || "educator@portal.com"}
                        </span>
                        <span className={styles.dropdownRoleBadge}>
                          {educator?.role || "Educator"}
                        </span>
                      </div>
                    </div>

                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        setShowProfileDropdown(false);
                        setShowProfileModal(true);
                      }}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </button>

                    <button
                      className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                      onClick={() => {
                        setShowProfileDropdown(false);
                        handleLogout();
                      }}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </>
              )}
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
                              studentIds: [],
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
                            studentIds: [],
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

        {/* 🚀 9. STUDY NOTES & MATERIALS MANAGEMENT TAB */}
        {activeTab === "notes" && (
          <div className={styles.sectionContainer}>
            <div className={styles.heroBanner} style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)" }}>
              <div className={styles.bannerText}>
                <h2>📚 Study Notes & Learning Materials Hub</h2>
                <p>Create, upload, and assign subject notes and reference study guides directly to students.</p>
              </div>
            </div>

            {/* SUB TAB NAVIGATION */}
            <div className={styles.subTabNav} style={{ display: "flex", gap: "1rem", borderBottom: "2px solid #e2e8f0", paddingBottom: "0.5rem" }}>
              <button
                className={activeNoteSubTab === "create" ? styles.primaryBtn : styles.secondaryBtn}
                onClick={() => setActiveNoteSubTab("create")}
              >
                📝 Create & Upload Note
              </button>
              <button
                className={activeNoteSubTab === "assign-notes" ? styles.primaryBtn : styles.secondaryBtn}
                onClick={() => setActiveNoteSubTab("assign-notes")}
              >
                🎯 Assign Note to Students ({myNotesAssignments.length} Assignments)
              </button>
              <button
                className={activeNoteSubTab === "list" ? styles.primaryBtn : styles.secondaryBtn}
                onClick={() => setActiveNoteSubTab("list")}
              >
                📚 View All Notes ({myNotes.length})
              </button>
            </div>

            {/* SUB TAB 1: CREATE NOTE FORM */}
            {activeNoteSubTab === "create" && (
              <div className={styles.formCard} style={{ background: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                <h3 style={{ margin: "0 0 1.25rem 0", color: "#0f172a" }}>📝 Create & Upload New Study Note</h3>
                <form onSubmit={handleCreateNoteSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className={styles.formGroup}>
                      <label style={{ fontWeight: 700, color: "#334155" }}>Note Title *</label>
                      <input
                        type="text"
                        required
                        className={styles.formInput}
                        placeholder="e.g. Chapter 4: Data Structures & Algorithms"
                        value={newNote.title}
                        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                        style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label style={{ fontWeight: 700, color: "#334155" }}>Subject / Category *</label>
                      <input
                        type="text"
                        required
                        className={styles.formInput}
                        placeholder="e.g. Computer Science, Mathematics, Physics"
                        value={newNote.category}
                        onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                        style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className={styles.formGroup}>
                      <label style={{ fontWeight: 700, color: "#334155" }}>Topic / Module</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="e.g. Binary Trees & Graph Traversal"
                        value={newNote.topic}
                        onChange={(e) => setNewNote({ ...newNote, topic: e.target.value })}
                        style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label style={{ fontWeight: 700, color: "#334155" }}>
                        📁 Upload Document / File (Opens File Manager)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.zip"
                        onChange={handleFileUpload}
                        className={styles.formInput}
                        style={{ width: "100%", padding: "0.5rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc" }}
                      />
                      {newNote.fileName && (
                        <div style={{ marginTop: "0.35rem", fontSize: "0.85rem", color: "#0284c7", fontWeight: 700 }}>
                          ✅ Attached File: {newNote.fileName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label style={{ fontWeight: 700, color: "#334155" }}>Short Overview / Description</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Brief overview of what students will learn from this note"
                      value={newNote.description}
                      onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
                      style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label style={{ fontWeight: 700, color: "#334155" }}>Detailed Study Material / Note Content</label>
                    <textarea
                      rows={6}
                      className={styles.formTextArea}
                      placeholder="Write complete note instructions, detailed formulas, definitions, code snippets, or key takeaway points here..."
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      style={{ width: "100%", padding: "0.75rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div className={styles.formActionRow} style={{ marginTop: "0.5rem" }}>
                    <button type="submit" className={styles.primaryBtn} style={{ background: "#0284c7", borderColor: "#0284c7" }}>
                      💾 Save Note & Proceed to Assigning Students →
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SUB TAB 2: ASSIGN NOTES TO STUDENTS */}
            {activeNoteSubTab === "assign-notes" && (
              <div className={styles.formCard} style={{ background: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                <h3 style={{ margin: "0 0 1.25rem 0", color: "#0f172a" }}>🎯 Assign Study Note to Students</h3>

                {myNotes.length === 0 ? (
                  <div className={styles.emptyCard} style={{ textAlign: "center", padding: "2rem" }}>
                    <p>No study notes created yet. Please create a note first!</p>
                    <button className={styles.primaryBtn} onClick={() => setActiveNoteSubTab("create")}>
                      + Create Note Now
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className={styles.formGroup}>
                      <label style={{ fontWeight: 700, color: "#334155" }}>Select Study Note to Assign *</label>
                      <select
                        className={styles.formSelect}
                        value={assignNoteData.noteId}
                        onChange={(e) => setAssignNoteData({ ...assignNoteData, noteId: e.target.value, studentIds: [] })}
                        style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem" }}
                      >
                        <option value="">-- Select a Study Note --</option>
                        {myNotes.map((n) => (
                          <option key={n.id} value={n.id}>
                            [{n.category || "General"}] {n.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {assignNoteData.noteId && (() => {
                      const selectedNote = myNotes.find((n) => String(n.id) === String(assignNoteData.noteId));
                      const noteAssignedStudents = noteAssignments.filter((na) => String(na.noteId) === String(assignNoteData.noteId));
                      const assignedStudentIds = noteAssignedStudents.map((na) => String(na.studentId));

                      return (
                        <>
                          <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                            <h4 style={{ margin: "0 0 0.35rem 0", color: "#0369a1" }}>Selected Note: {selectedNote?.title}</h4>
                            <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
                              Subject: <strong>{selectedNote?.category || "General"}</strong> | Topic: <strong>{selectedNote?.topic || "N/A"}</strong> | Currently Assigned: <strong>{assignedStudentIds.length} Student(s)</strong>
                            </p>
                          </div>

                          <div className={styles.formGroup}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                              <label style={{ fontWeight: 700, color: "#334155" }}>Select Recipient Students:</label>
                              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 700, color: "#0284c7" }}>
                                <input
                                  type="checkbox"
                                  checked={
                                    students.length > 0 &&
                                    assignNoteData.studentIds.length === students.filter((s) => !assignedStudentIds.includes(String(s.id))).length
                                  }
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const unassigned = students
                                        .filter((s) => !assignedStudentIds.includes(String(s.id)))
                                        .map((s) => String(s.id));
                                      setAssignNoteData({ ...assignNoteData, studentIds: unassigned });
                                    } else {
                                      setAssignNoteData({ ...assignNoteData, studentIds: [] });
                                    }
                                  }}
                                />
                                <span>Select All Unassigned Students ({students.filter((s) => !assignedStudentIds.includes(String(s.id))).length})</span>
                              </label>
                            </div>

                            <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.75rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.5rem" }}>
                              {students.map((s) => {
                                const sId = String(s.id);
                                const isAssigned = assignedStudentIds.includes(sId);
                                const isSelected = assignNoteData.studentIds.includes(sId);

                                return (
                                  <label
                                    key={sId}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.6rem",
                                      padding: "0.5rem",
                                      borderRadius: "6px",
                                      background: isAssigned ? "#f1f5f9" : isSelected ? "#e0f2fe" : "#ffffff",
                                      border: isAssigned ? "1px solid #cbd5e1" : isSelected ? "1px solid #0284c7" : "1px solid #e2e8f0",
                                      cursor: isAssigned ? "not-allowed" : "pointer",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      disabled={isAssigned}
                                      checked={isAssigned || isSelected}
                                      onChange={(e) => {
                                        if (isAssigned) return;
                                        if (e.target.checked) {
                                          setAssignNoteData({ ...assignNoteData, studentIds: [...assignNoteData.studentIds, sId] });
                                        } else {
                                          setAssignNoteData({ ...assignNoteData, studentIds: assignNoteData.studentIds.filter((id) => id !== sId) });
                                        }
                                      }}
                                    />
                                    <span style={{ fontSize: "0.88rem", color: isAssigned ? "#64748b" : "#0f172a" }}>
                                      {s.fullName || s.email} {isAssigned && "✅ (Assigned)"}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          <button
                            className={styles.primaryBtn}
                            onClick={handleAssignNoteToStudents}
                            style={{ background: "#0284c7", borderColor: "#0284c7", alignSelf: "flex-start" }}
                          >
                            🚀 Assign Study Note ({assignNoteData.studentIds.length} Selected)
                          </button>

                          {/* CURRENT ASSIGNMENTS TABLE */}
                          {noteAssignedStudents.length > 0 && (
                            <div style={{ marginTop: "1rem" }}>
                              <h4 style={{ margin: "0 0 0.5rem 0", color: "#0f172a" }}>Assigned Students List</h4>
                              <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                  <thead>
                                    <tr>
                                      <th>Student Name</th>
                                      <th>Email</th>
                                      <th>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {noteAssignedStudents.map((na) => {
                                      const st = students.find((s) => String(s.id) === String(na.studentId));
                                      return (
                                        <tr key={na.id}>
                                          <td>{st?.fullName || "Student"}</td>
                                          <td>{st?.email || "-"}</td>
                                          <td>
                                            <button className={styles.deleteBtn} onClick={() => deleteNoteAssignment(na.id)}>
                                              Unassign ✕
                                            </button>
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
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* SUB TAB 3: LIST ALL STUDY NOTES */}
            {activeNoteSubTab === "list" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
                {myNotes.length === 0 ? (
                  <div className={styles.emptyCard} style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem" }}>
                    <p>No study notes uploaded yet.</p>
                  </div>
                ) : (
                  myNotes.map((n) => {
                    const count = noteAssignments.filter((na) => String(na.noteId) === String(n.id)).length;
                    return (
                      <div
                        key={n.id}
                        style={{
                          background: "#ffffff",
                          borderRadius: "16px",
                          padding: "1.5rem",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: "1rem",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                            <span className={styles.statusActive} style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}>
                              📚 {n.category || "General"}
                            </span>
                            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "Recent"}</span>
                          </div>
                          <h3 style={{ margin: "0 0 0.35rem 0", color: "#0f172a", fontSize: "1.15rem" }}>{n.title}</h3>
                          {n.topic && <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#0284c7", fontWeight: 600 }}>Topic: {n.topic}</p>}
                          <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.88rem", color: "#64748b", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {n.description || n.content || "No overview provided."}
                          </p>
                          <div style={{ fontSize: "0.82rem", color: "#475569" }}>
                            👥 Assigned to <strong>{count} Student(s)</strong>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className={styles.secondaryBtn}
                            onClick={() => {
                              setAssignNoteData({ noteId: String(n.id), studentIds: [] });
                              setActiveNoteSubTab("assign-notes");
                            }}
                            style={{ flex: 1 }}
                          >
                            🎯 Assign
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => deleteNote(n.id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
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

        {/* MY PROFILE MODAL */}
        {showProfileModal && (
          <div className={styles.modalBackdrop} onClick={() => setShowProfileModal(false)}>
            <div className={styles.profileModalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.profileModalHeader}>
                <h2>My Educator Profile</h2>
                <button className={styles.closeBtn} onClick={() => setShowProfileModal(false)}>✕</button>
              </div>
              <div className={styles.profileModalBody}>
                <div className={styles.profileHero}>
                  <div className={styles.profileHeroAvatar}>
                    {(educator?.fullName || educator?.name || "E").charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.profileHeroInfo}>
                    <h3>{educator?.fullName || educator?.name || "Educator"}</h3>
                    <p>{educator?.email || "educator@portal.com"}</p>
                    <span className={styles.dropdownRoleBadge}>
                      Verified Educator
                    </span>
                  </div>
                </div>
                <div className={styles.profileDetailsGrid}>
                  <div className={styles.profileDetailItem}>
                    <label>Full Name</label>
                    <span>{educator?.fullName || educator?.name || "N/A"}</span>
                  </div>
                  <div className={styles.profileDetailItem}>
                    <label>Email Address</label>
                    <span>{educator?.email || "N/A"}</span>
                  </div>
                  <div className={styles.profileDetailItem}>
                    <label>User Role</label>
                    <span style={{ textTransform: "capitalize" }}>{educator?.role || "Educator"}</span>
                  </div>
                  <div className={styles.profileDetailItem}>
                    <label>Account Status</label>
                    <span style={{ color: "#16a34a" }}>Active ✅</span>
                  </div>
                  <div className={styles.profileDetailItem}>
                    <label>User ID</label>
                    <span>#{educator?.id || "EDU-101"}</span>
                  </div>
                  <div className={styles.profileDetailItem}>
                    <label>Portal Access</label>
                    <span>Assessment Portal</span>
                  </div>
                </div>
              </div>
              <div className={styles.profileModalFooter}>
                <button className={styles.primaryCloseBtn} onClick={() => setShowProfileModal(false)}>
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}