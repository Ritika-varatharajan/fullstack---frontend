"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import styles from "./test.module.css";
import { API } from "@/app/config/api";

type Question = {
  question: string;
  type: "mcq" | "truefalse" | "short" | "essay";
  options?: string[];
  correctAnswer: string;
  marks?: number;
};

type Assessment = {
  id: string;
  title: string;
  category?: string;
  instructions?: string;
  timeLimit: number;
  dueDate?: string;
  educatorId?: string;
  questions: Question[];
};

type Result = {
  assessmentId: string;
  studentId: string;
};

export default function TestPage() {
  const { id } = useParams();
  const router = useRouter();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const isSubmittingRef = useRef(false);
  
  // Results summary state
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [scorePercentage, setScorePercentage] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [questionBreakdown, setQuestionBreakdown] = useState<
    { question: string; type?: string; userAnswer: string; correctAnswer: string; isCorrect: boolean; marks: number; isManual?: boolean }[]
  >([]);

  let student: { id?: string; fullName?: string; name?: string } = {};
  try {
    student =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user") || "{}")
        : {};
  } catch {
    student = {};
  }

  const fetchAssessment = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/assessments/${id}`);
      const todayStr = new Date().toISOString().split("T")[0];

      if (res.data.dueDate && res.data.dueDate < todayStr) {
        alert(`🚫 Deadline Passed!\n\nThe deadline for "${res.data.title}" passed on ${res.data.dueDate}. You can no longer attend this test.`);
        router.push("/student");
        return;
      }

      const fixedQuestions: Question[] = (res.data.questions || []).map(
        (q: Partial<Question> & { answer?: string }) => ({
          ...q,
          question: q.question || "Question Text",
          type: q.type || "mcq",
          correctAnswer: q.correctAnswer || q.answer || "",
          options:
            q.type === "mcq"
              ? q.options || []
              : q.type === "truefalse"
              ? ["True", "False"]
              : [],
          marks: q.marks && q.marks > 0 ? q.marks : 1,
        })
      );

      setAssessment({ ...res.data, questions: fixedQuestions });
    } catch (err) {
      console.error(err);
      alert("Failed to load assessment");
    }
  }, [id, router]);

  const checkIfAlreadySubmitted = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/results`);

      const already = res.data.find(
        (r: Result) =>
          String(r.assessmentId) === String(id) &&
          (String(r.studentId) === String(student?.id) || true)
      );

      // If already submitted and result present, allow previewing or return
    } catch (err) {
      console.error(err);
    }
  }, [id, student?.id]);

  const handleChange = (qIndex: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qIndex]: value,
    }));
  };

  // ✅ AUTOMATIC GRADINGS & INSTANT DETAILED MOTIVATING FEEDBACK
  const handleSubmit = useCallback(
    async (auto = false) => {
      if (!assessment || submitted || isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      setSubmitted(true);

      let totalEarned = 0;
      let totalPossible = 0;
      let hasManualQuestions = false;
      const breakdown: { question: string; type?: string; userAnswer: string; correctAnswer: string; isCorrect: boolean; marks: number; maxMarks: number; isManual?: boolean }[] = [];

      assessment.questions.forEach((q, index) => {
        const qMarks = q.marks || 1;
        totalPossible += qMarks;

        const userAns = String(answers[index] || "").trim();
        const correctAns = String(q.correctAnswer || "").trim();
        const qType = (q.type || "mcq").toLowerCase();

        const isAutoGraded = qType === "mcq" || qType === "truefalse";

        if (!isAutoGraded) {
          hasManualQuestions = true;
        }

        // Auto-grading comparison for MCQ & True/False ONLY
        const isCorrect = isAutoGraded
          ? userAns.toLowerCase() === correctAns.toLowerCase() && userAns.length > 0
          : false;

        const earnedMarks = isCorrect ? qMarks : 0;
        if (isCorrect) {
          totalEarned += qMarks;
        }

        breakdown.push({
          question: q.question,
          type: qType,
          userAnswer: userAns || "(Not Answered)",
          correctAnswer: correctAns,
          isCorrect,
          marks: earnedMarks,
          maxMarks: qMarks,
          isManual: !isAutoGraded,
        });
      });

      const percentage = totalPossible ? Math.round((totalEarned / totalPossible) * 100) : 0;

      // 🌟 WARM & MOTIVATING FEEDBACK GENERATOR
      let feedback = "";
      if (hasManualQuestions) {
        feedback = "⏳ Test Submitted. MCQ & True/False auto-graded. Short/Essay questions are under review by your Educator.";
      } else if (percentage >= 85) {
        feedback = "🌟 Outstanding Performance! Exceptional mastery of concepts. Keep shining and reaching higher!";
      } else if (percentage >= 70) {
        feedback = "👏 Great Work! You demonstrated a solid grasp of the subject. A quick review will make you top of the class!";
      } else if (percentage >= 50) {
        feedback = "💪 Good Effort! You passed and are making steady progress! Focus on your weak points to unlock your full potential.";
      } else if (percentage >= 30) {
        feedback = "🌱 Keep Going! Every mistake is a stepping stone to learning. Review the answer breakdown below — you have the potential to succeed!";
      } else {
        feedback = "✨ Don't give up! Every master was once a beginner. Mistakes are proof that you are trying. Review the correct answers below and try again — you CAN do this!";
      }

      setScore(totalEarned);
      setMaxScore(totalPossible);
      setScorePercentage(percentage);
      setFeedbackText(feedback);
      setQuestionBreakdown(breakdown);

      try {
        await axios.post(`${API}/results`, {
          assessmentId: String(id),
          studentId: String(student?.id),
          userId: String(student?.id),
          educatorId: assessment.educatorId,
          score: totalEarned,
          totalMarks: totalPossible,
          percentage: percentage,
          feedback: feedback,
          completed: true,
          needsEvaluation: hasManualQuestions,
          status: hasManualQuestions ? "pending_review" : "graded",
          questionBreakdown: breakdown,
          submittedAt: new Date().toISOString(),
        });

        setShowResultModal(true);
      } catch (err) {
        console.error(err);
        setShowResultModal(true);
      }
    },
    [assessment, submitted, answers, id, student?.id]
  );

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  useEffect(() => {
    fetchAssessment();
    checkIfAlreadySubmitted();
  }, [fetchAssessment, checkIfAlreadySubmitted]);

  useEffect(() => {
    if (assessment?.timeLimit) {
      const time = assessment.timeLimit * 60;
      setTimeLeft(time);
    }
  }, [assessment]);

  useEffect(() => {
    if (!assessment || submitted || isSubmittingRef.current) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isSubmittingRef.current) {
            isSubmittingRef.current = true;
            alert("⏳ Time limit reached! Your test answers are being automatically submitted now.");
            handleSubmit(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [assessment, submitted, handleSubmit]);

  if (!assessment) return <div className={styles.loading}>Loading assessment questions...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.headerBar}>
        <div>
          <span className={styles.categoryBadge}>{assessment.category || "General"}</span>
          <h1 className={styles.title}>{assessment.title}</h1>
        </div>
        <div className={styles.timerCard}>
          <span className={styles.timerLabel}>Time Remaining</span>
          <span className={styles.timerValue}>⏳ {formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className={styles.instructionsBox}>
        <p><strong>Instructions:</strong> {assessment.instructions || "Answer all questions and click Submit Test when finished."}</p>
        {assessment.dueDate && <p className={styles.dueDateText}>🗓️ Deadline: {assessment.dueDate}</p>}
      </div>

      <div className={styles.questionsList}>
        {assessment.questions.map((q, index) => (
          <div key={index} className={styles.questionCard}>
            <div className={styles.qHeader}>
              <span className={styles.qNum}>Question {index + 1}</span>
              <span className={styles.qMarks}>{q.marks || 1} mark{(q.marks || 1) === 1 ? "" : "s"}</span>
            </div>

            <p className={styles.questionText}>{q.question}</p>

            {/* MCQ */}
            {q.type === "mcq" && (
              <div className={styles.optionsList}>
                {q.options?.map((opt, i) => (
                  <label key={i} className={`${styles.optionItem} ${answers[index] === opt ? styles.selectedOption : ""}`}>
                    <input
                      type="radio"
                      name={`q-${index}`}
                      checked={answers[index] === opt}
                      onChange={() => handleChange(index, opt)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {/* TRUE/FALSE */}
            {q.type === "truefalse" && (
              <div className={styles.optionsList}>
                {["True", "False"].map((opt) => (
                  <label key={opt} className={`${styles.optionItem} ${answers[index] === opt ? styles.selectedOption : ""}`}>
                    <input
                      type="radio"
                      name={`q-${index}`}
                      checked={answers[index] === opt}
                      onChange={() => handleChange(index, opt)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {/* SHORT ANSWER */}
            {q.type === "short" && (
              <input
                className={styles.input}
                placeholder="Type your answer here..."
                value={answers[index] || ""}
                onChange={(e) => handleChange(index, e.target.value)}
              />
            )}

            {/* ESSAY */}
            {q.type === "essay" && (
              <textarea
                className={styles.textarea}
                placeholder="Write your detailed answer here..."
                value={answers[index] || ""}
                onChange={(e) => handleChange(index, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <div className={styles.submitRow}>
          <button className={styles.submitBtn} onClick={() => handleSubmit(false)}>
            Submit
          </button>
        </div>
      )}

      {/* RESULT POPUP MODAL */}
      {showResultModal && (() => {
        const isManualEvaluation = questionBreakdown.some(
          (q) => q.isManual || q.type === "short" || q.type === "essay" || q.type === "long"
        );

        return (
          <div className={styles.modalOverlay}>
            <div className={styles.modalBox}>
              {isManualEvaluation ? (
                /* MANUAL EVALUATION: SIMPLE VERIFIED TICK MODAL */
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", textAlign: "center", padding: "1rem" }}>
                  <div style={{ fontSize: "3.5rem" }}>✅</div>
                  <h2 style={{ margin: 0, color: "#0f172a", fontSize: "1.45rem", fontWeight: 800 }}>
                    Your assessment is submitted for grading
                  </h2>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "0.92rem" }}>
                    Your responses have been recorded and forwarded to your Educator for review and scoring.
                  </p>
                  <button
                    className={styles.finishBtn}
                    onClick={() => router.push("/student")}
                    style={{ marginTop: "0.75rem" }}
                  >
                    Return to Dashboard
                  </button>
                </div>
              ) : (
                /* AUTO-GRADED: PERFECT CLEAN SCORE AND MOTIVATIONAL FEEDBACK DISPLAY */
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div style={{ textAlign: "center", borderBottom: "2px solid #f1f5f9", paddingBottom: "1rem" }}>
                    <div style={{ fontSize: "2.8rem", marginBottom: "0.25rem" }}>🎉</div>
                    <h2 style={{ margin: 0, color: "#0f172a", fontSize: "1.5rem", fontWeight: 800 }}>
                      Assessment Completed!
                    </h2>
                    <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.9rem" }}>
                      Here is your official test score summary and performance feedback.
                    </p>
                  </div>

                  {/* PERFECT SCORE HERO CARD */}
                  <div className={styles.perfectScoreCard}>
                    <div className={styles.scoreMetricBlock}>
                      <span className={styles.scoreMetricLabel}>Score Achieved</span>
                      <h3 className={styles.scoreMetricVal}>
                        {score} <span style={{ fontSize: "1.1rem", color: "#64748b", fontWeight: 600 }}>/ {maxScore}</span>
                      </h3>
                    </div>

                    <div className={styles.scoreMetricDivider} />

                    <div className={styles.scoreMetricBlock}>
                      <span className={styles.scoreMetricLabel}>Percentage Accuracy</span>
                      <h3 className={styles.scoreMetricValPct}>
                        {scorePercentage}%
                      </h3>
                    </div>
                  </div>

                  {/* MOTIVATIONAL FEEDBACK BOX */}
                  <div className={styles.perfectFeedbackBox}>
                    <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      💬 Performance Feedback:
                    </div>
                    <p style={{ margin: 0, fontSize: "0.98rem", color: "#1e293b", lineHeight: 1.5, fontStyle: "italic", fontWeight: 600 }}>
                      "{feedbackText}"
                    </p>
                  </div>

                  <button
                    className={styles.finishBtn}
                    onClick={() => router.push("/student")}
                    style={{ width: "100%", padding: "0.9rem", borderRadius: "12px", fontSize: "1rem" }}
                  >
                    Return to Dashboard →
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}