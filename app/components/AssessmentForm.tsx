"use client";

import { useState, useEffect } from "react";
import styles from "./AssessmentForm.module.css";
import axios from "axios";
import { API } from "@/app/config/api";

type Question = {
  type: "mcq" | "truefalse" | "short" | "essay";
  question: string;
  options: string[];
  correctAnswer: string;
  marks: number;
  rubricNotes?: string;
};

type Assessment = {
  id?: string;
  title: string;
  type: "Quiz" | "Test" | "Exam" | "Survey";
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  topic: string;
  instructions: string;
  timeLimit: number;
  dueDate: string;
  questions: Question[];
  educatorId?: string;
  createdBy?: string;
};

type Props = {
  onSubmit: (data: Assessment) => void;
  initialData?: Partial<Assessment>;
};

export default function AssessmentForm({ onSubmit, initialData }: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"Quiz" | "Test" | "Exam" | "Survey">("Quiz");
  const [defaultQuestionType, setDefaultQuestionType] = useState<Question["type"]>("mcq");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [instructions, setInstructions] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [dueDate, setDueDate] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  const todayStr = new Date().toISOString().split("T")[0];

  let user: { id?: string } = {};
  try {
    user =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user") || "{}")
        : {};
  } catch {
    user = {};
  }

  useEffect(() => {
    axios
      .get(`${API}/assessments`)
      .then((res) => {
        const categories = Array.from(
          new Set(
            (res.data || [])
              .map((a: any) => a.category)
              .filter(Boolean)
          )
        ) as string[];
        setExistingCategories(categories);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!initialData) return;

    const firstType = initialData.questions && initialData.questions.length > 0
      ? initialData.questions[0].type || "mcq"
      : "mcq";

    setDefaultQuestionType(firstType);

    const safeQuestions: Question[] = (initialData.questions || []).map(
      (q: Partial<Question> & { answer?: string }) => ({
        type: q.type || firstType,
        question: q.question || "",
        correctAnswer: q.correctAnswer || q.answer || "",
        options:
          q.type === "mcq"
            ? q.options || ["", "", "", ""]
            : q.type === "truefalse"
            ? ["True", "False"]
            : [],
        marks: q.marks && q.marks > 0 ? q.marks : 1,
        rubricNotes: q.rubricNotes || "",
      })
    );

    setTitle(initialData.title || "");
    setType(initialData.type || "Quiz");
    setCategory(initialData.category || "");
    setTopic(initialData.topic || "");
    setInstructions(initialData.instructions || "");
    setTimeLimit(initialData.timeLimit || 30);
    setDueDate(initialData.dueDate || "");
    setQuestions(safeQuestions);
  }, [initialData]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: defaultQuestionType,
        question: "",
        options:
          defaultQuestionType === "mcq"
            ? ["", "", "", ""]
            : defaultQuestionType === "truefalse"
            ? ["True", "False"]
            : [],
        correctAnswer: "",
        marks: 1,
        rubricNotes: "",
      },
    ]);
  };

  const updateQuestion = (
    index: number,
    field: keyof Question,
    value: string | number
  ) => {
    const updated = [...questions];

    if (field === "marks") {
      let num = Number(value);
      if (isNaN(num) || num < 0) num = 0;
      value = num;
    }

    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        {initialData ? "✏️ Edit Assessment Template" : "➕ Create Assessment Template"}
      </h3>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Assessment Title *</label>
          <input
            className={styles.input}
            placeholder="e.g. Mathematics Mid-Term Exam 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Assessment Type *</label>
          <select
            className={styles.input}
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="Quiz">Quiz</option>
            <option value="Test">Test</option>
            <option value="Exam">Exam</option>
            <option value="Survey">Survey</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Fixed Question Format for All Questions *</label>
          <select
            className={styles.input}
            value={defaultQuestionType}
            onChange={(e) => {
              const selectedType = e.target.value as Question["type"];
              setDefaultQuestionType(selectedType);
              setQuestions((prev) =>
                prev.map((q) => ({
                  ...q,
                  type: selectedType,
                  correctAnswer: "",
                  options:
                    selectedType === "mcq"
                      ? ["", "", "", ""]
                      : selectedType === "truefalse"
                      ? ["True", "False"]
                      : [],
                }))
              );
            }}
          >
            <option value="mcq">Multiple Choice (MCQ)</option>
            <option value="truefalse">True / False</option>
            <option value="short">Short Answer</option>
            <option value="essay">Long Answer / Essay</option>
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Subject / Category *</label>
          <input
            className={styles.input}
            list="category-options"
            placeholder="Select or enter category (e.g. Mathematics, Science)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <datalist id="category-options">
            {existingCategories.map((cat, idx) => (
              <option key={idx} value={cat} />
            ))}
            <option value="Mathematics" />
            <option value="Science" />
            <option value="Computer Science" />
            <option value="English" />
            <option value="General Knowledge" />
          </datalist>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Topic / Sub-area</label>
          <input
            className={styles.input}
            placeholder="e.g. Algebra & Calculus"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Time Limit (Minutes) *</label>
          <input
            className={styles.input}
            type="number"
            min="1"
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value) || 1)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Deadline / Due Date (Future Dates Only) *</label>
          <input
            className={styles.input}
            type="date"
            min={todayStr}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Instructions & Guidelines</label>
        <textarea
          className={styles.textarea}
          placeholder="Enter detailed guidelines for students..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>

      <hr className={styles.divider} />

      <h4>
        Question Formats & Scoring Weight ({questions.length}) — Fixed Format:{" "}
        <span style={{ color: "#ea580c", textTransform: "uppercase" }}>{defaultQuestionType}</span>
      </h4>

      {questions.map((q, i) => (
        <div key={i} className={styles.questionBox}>
          <div className={styles.questionHeader}>
            <span>
              Question #{i + 1} ({defaultQuestionType === "mcq" ? "MCQ" : defaultQuestionType === "truefalse" ? "True/False" : defaultQuestionType === "short" ? "Short Answer" : "Long Answer / Essay"})
            </span>
            <button
              className={styles.removeBtn}
              onClick={() => deleteQuestion(i)}
            >
              🗑️ Remove
            </button>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup} style={{ maxWidth: "240px" }}>
              <label className={styles.subLabel}>Marks / Score Weight</label>
              <input
                className={styles.input}
                type="number"
                min="1"
                value={q.marks}
                onChange={(e) => updateQuestion(i, "marks", e.target.value)}
              />
            </div>
          </div>

          <label className={styles.subLabel}>Question Statement *</label>
          <input
            className={styles.input}
            placeholder="Type question wording here..."
            value={q.question}
            onChange={(e) => updateQuestion(i, "question", e.target.value)}
          />

          {/* MCQ */}
          {q.type === "mcq" && (
            <div className={styles.optionsGrid}>
              <label className={styles.subLabel}>Options (Select Radio for Correct Option):</label>
              {q.options.map((opt, j) => (
                <div key={j} className={styles.optionRow}>
                  <input
                    type="radio"
                    name={`correct-${i}`}
                    checked={q.correctAnswer === opt && opt.length > 0}
                    onChange={() => updateQuestion(i, "correctAnswer", opt)}
                  />
                  <input
                    className={styles.optionInput}
                    placeholder={`Option ${j + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const updated = questions.map((item, idx) => {
                        if (idx === i) {
                          const opts = [...item.options];
                          opts[j] = e.target.value;
                          return { ...item, options: opts };
                        }
                        return item;
                      });
                      setQuestions(updated);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* TRUE/FALSE */}
          {q.type === "truefalse" && (
            <div className={styles.radioGroup}>
              <label className={styles.subLabel}>Select Correct Statement:</label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name={`tf-${i}`}
                  checked={q.correctAnswer === "True"}
                  onChange={() => updateQuestion(i, "correctAnswer", "True")}
                />
                True
              </label>

              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name={`tf-${i}`}
                  checked={q.correctAnswer === "False"}
                  onChange={() => updateQuestion(i, "correctAnswer", "False")}
                />
                False
              </label>
            </div>
          )}

          {/* SHORT ANSWER */}
          {q.type === "short" && (
            <div>
              <label className={styles.subLabel}>Expected Keywords / Correct Answer Benchmark *</label>
              <input
                className={styles.input}
                placeholder="Enter expected answer phrase"
                value={q.correctAnswer}
                onChange={(e) => updateQuestion(i, "correctAnswer", e.target.value)}
              />
            </div>
          )}

          {/* ESSAY */}
          {q.type === "essay" && (
            <div>
              <label className={styles.subLabel}>Grading Rubric Criteria / Reference Answer *</label>
              <textarea
                className={styles.textarea}
                placeholder="Describe key points, concepts, or rubric for grading this essay"
                value={q.correctAnswer}
                onChange={(e) => updateQuestion(i, "correctAnswer", e.target.value)}
              />
            </div>
          )}
        </div>
      ))}

      <button className={styles.addBtn} onClick={addQuestion}>
        + Add Question
      </button>

      <div className={styles.actionRow}>
        <button
          className={styles.saveBtn}
          onClick={() => {
            if (!title.trim()) return alert("Title is required");
            if (!category.trim()) return alert("Category / Subject is required");
            if (questions.length === 0) return alert("Please add at least one question");

            if (dueDate && new Date(dueDate) < new Date(todayStr)) {
              return alert("Deadline date must be today or a future date!");
            }

            onSubmit({
              ...initialData,
              title,
              type,
              difficulty: (initialData?.difficulty || "Medium") as any,
              category,
              topic,
              instructions,
              timeLimit,
              dueDate,
              questions,
              ...(initialData ? {} : { educatorId: user?.id, createdBy: user?.id }),
            } as Assessment);
          }}
        >
          💾 Save Assessment & Proceed to Assigning
        </button>
      </div>
    </div>
  );
}