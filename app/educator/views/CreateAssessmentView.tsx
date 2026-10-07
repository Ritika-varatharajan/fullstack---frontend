"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  Layers,
  Clock,
  Award,
  PlusCircle,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Calendar,
  FileText,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import axios from "axios";
import { API } from "@/app/config/api";
import { Stepper, StepItem } from "@/app/components/ui/Stepper";
import { Button } from "@/app/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";

export type Question = {
  type: "mcq" | "truefalse" | "short" | "essay";
  question: string;
  options: string[];
  correctAnswer: string;
  marks: number;
  rubricNotes?: string;
};

export type AssessmentData = {
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

export interface CreateAssessmentViewProps {
  onSubmit: (formData: AssessmentData) => void;
  initialData?: Partial<AssessmentData>;
  onCancel?: () => void;
}

export const CreateAssessmentView: React.FC<CreateAssessmentViewProps> = ({
  onSubmit,
  initialData,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"Quiz" | "Test" | "Exam" | "Survey">("Quiz");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [instructions, setInstructions] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [dueDate, setDueDate] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  // Expanded question box state
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState<number | null>(0);

  const todayStr = new Date().toISOString().split("T")[0];

  const steps: StepItem[] = [
    { id: 1, title: "Basic Info", description: "Title, Subject & Format" },
    { id: 2, title: "Questions", description: "Add & Configure Questions" },
    { id: 3, title: "Settings", description: "Duration & Deadline" },
    { id: 4, title: "Review", description: "Finalize & Launch" },
  ];

  useEffect(() => {
    axios
      .get(`${API}/assessments`)
      .then((res) => {
        const cats = Array.from(
          new Set(
            (res.data || [])
              .map((a: any) => a.category)
              .filter(Boolean)
          )
        ) as string[];
        setExistingCategories(cats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!initialData) {
      if (questions.length === 0) {
        addQuestion("mcq");
      }
      return;
    }

    const safeQuestions: Question[] = (initialData.questions || []).map(
      (q: Partial<Question> & { answer?: string }) => ({
        type: q.type || "mcq",
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
    setDifficulty(initialData.difficulty || "Medium");
    setCategory(initialData.category || "");
    setTopic(initialData.topic || "");
    setInstructions(initialData.instructions || "");
    setTimeLimit(initialData.timeLimit || 30);
    setDueDate(initialData.dueDate || "");
    setQuestions(safeQuestions.length > 0 ? safeQuestions : [{
      type: "mcq",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      marks: 1,
    }]);
  }, [initialData]);

  // Question manipulation helpers
  const addQuestion = (qType: Question["type"] = "mcq") => {
    const newQ: Question = {
      type: qType,
      question: "",
      options:
        qType === "mcq"
          ? ["", "", "", ""]
          : qType === "truefalse"
          ? ["True", "False"]
          : [],
      correctAnswer: qType === "truefalse" ? "True" : "",
      marks: 1,
    };
    setQuestions((prev) => {
      const updated = [...prev, newQ];
      setExpandedQuestionIdx(updated.length - 1);
      return updated;
    });
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    if (field === "marks") {
      let num = Number(value);
      if (isNaN(num) || num < 1) num = 1;
      value = num;
    }
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert("Assessment must contain at least one question.");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
    setExpandedQuestionIdx((prev) => (prev === index ? Math.max(0, index - 1) : prev));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === questions.length - 1) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const copy = [...questions];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setQuestions(copy);
    setExpandedQuestionIdx(targetIdx);
  };

  // Calculations for summary side panel
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  const totalQuestions = questions.length;

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!title.trim()) {
        alert("Please provide an assessment title.");
        return;
      }
      if (!category.trim()) {
        alert("Please specify a subject or category.");
        return;
      }
    }
    if (currentStep === 2) {
      if (questions.length === 0) {
        alert("Please add at least one question.");
        return;
      }
      const emptyQ = questions.find((q) => !q.question.trim());
      if (emptyQ) {
        alert("Please fill in question statements for all added questions.");
        return;
      }
    }
    if (currentStep === 3) {
      if (!dueDate) {
        alert("Please set a deadline date.");
        return;
      }
      if (dueDate < todayStr) {
        alert("Deadline date must be today or a future date.");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(4, prev + 1));
  };

  const handleFinalSubmit = () => {
    if (!title.trim() || !category.trim() || !dueDate || questions.length === 0) {
      alert("Please ensure all required fields are filled out.");
      return;
    }
    onSubmit({
      ...initialData,
      title,
      type,
      difficulty,
      category,
      topic,
      instructions,
      timeLimit,
      dueDate,
      questions,
    });
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {initialData ? "Edit Assessment Template" : "Create New Assessment Template"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Design multi-format questions, set auto-grading keys, and configure delivery parameters.
          </p>
        </div>
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      {/* Progress Stepper */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <Stepper steps={steps} currentStep={currentStep} onStepClick={(id) => setCurrentStep(id)} />
        </CardContent>
      </Card>

      {/* Main Form Layout (2 columns: Step Form + Live Summary Side Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Step Content Container (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: BASIC INFO */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Step 1: Basic Information & Format
                </CardTitle>
                <CardDescription>
                  Define the core title, subject category, difficulty, and guidelines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <span>Assessment Title</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Mathematics Mid-Term Exam 2026"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Assessment Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Assessment Type *
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Quiz">Quiz</option>
                      <option value="Test">Test</option>
                      <option value="Exam">Exam</option>
                      <option value="Survey">Survey</option>
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Difficulty Level *
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Easy">Easy 🟢</option>
                      <option value="Medium">Medium 🟡</option>
                      <option value="Hard">Hard 🔴</option>
                    </select>
                  </div>

                  {/* Subject / Category (Creatable Dropdown) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Subject / Category *</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">Select or type new</span>
                    </label>
                    <input
                      type="text"
                      list="category-list"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Mathematics, Biology"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <datalist id="category-list">
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

                  {/* Topic */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Topic / Sub-area
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Algebra & Linear Calculus"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Instructions */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Instructions & Guidelines
                    </label>
                    <textarea
                      rows={3}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Write instructions for students (e.g., Read questions carefully before answering)..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: QUESTIONS BUILDER */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-600" />
                      Step 2: Questions & Scoring
                    </CardTitle>
                    <CardDescription>
                      Add questions, select formats, specify marks, and define correct answer keys
                    </CardDescription>
                  </div>

                  {/* Quick Add Question Toolbar */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="teal"
                      size="sm"
                      leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                      onClick={() => addQuestion("mcq")}
                    >
                      + MCQ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addQuestion("truefalse")}
                    >
                      + True/False
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Questions Stack */}
              {questions.map((q, idx) => {
                const isExpanded = expandedQuestionIdx === idx;

                return (
                  <Card key={idx} className="border-l-4 border-l-indigo-600 transition-all">
                    <CardHeader className="p-4 flex flex-row items-center justify-between bg-slate-50/70 dark:bg-slate-900/40 cursor-pointer" onClick={() => setExpandedQuestionIdx(isExpanded ? null : idx)}>
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                            {q.question.trim() || `Question #${idx + 1} (Untitled)`}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <Badge variant="indigo" size="sm">
                              {q.type.toUpperCase()}
                            </Badge>
                            <span>•</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {q.marks} {q.marks === 1 ? "Mark" : "Marks"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => moveQuestion(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveQuestion(idx, "down")}
                          disabled={idx === questions.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeQuestion(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700 ml-2"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="p-4 sm:p-6 space-y-4 border-t border-slate-100 dark:border-slate-700/60">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Question Format Selector */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Format
                            </label>
                            <select
                              value={q.type}
                              onChange={(e) => {
                                const newType = e.target.value as Question["type"];
                                const copy = [...questions];
                                copy[idx] = {
                                  ...copy[idx],
                                  type: newType,
                                  correctAnswer: newType === "truefalse" ? "True" : "",
                                  options:
                                    newType === "mcq"
                                      ? ["", "", "", ""]
                                      : newType === "truefalse"
                                      ? ["True", "False"]
                                      : [],
                                };
                                setQuestions(copy);
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100"
                            >
                              <option value="mcq">Multiple Choice (MCQ)</option>
                              <option value="truefalse">True / False</option>
                              <option value="short">Short Answer</option>
                              <option value="essay">Essay / Long Answer</option>
                            </select>
                          </div>

                          {/* Marks */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Score Weight / Marks
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={q.marks}
                              onChange={(e) => updateQuestion(idx, "marks", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>

                        {/* Statement */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Question Statement *
                          </label>
                          <textarea
                            rows={2}
                            value={q.question}
                            onChange={(e) => updateQuestion(idx, "question", e.target.value)}
                            placeholder="Type question text here..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Format Specific Configuration */}
                        {q.type === "mcq" && (
                          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                              Options & Correct Answer Key (Select radio button for correct option)
                            </label>
                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct-${idx}`}
                                    checked={q.correctAnswer === opt && opt.length > 0}
                                    onChange={() => updateQuestion(idx, "correctAnswer", opt)}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const updatedOpts = [...q.options];
                                      updatedOpts[optIdx] = e.target.value;
                                      updateQuestion(idx, "options", updatedOpts);
                                    }}
                                    placeholder={`Option ${optIdx + 1}`}
                                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {q.type === "truefalse" && (
                          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                              Select Correct Statement:
                            </label>
                            <div className="flex items-center gap-4 text-xs font-semibold">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`tf-${idx}`}
                                  checked={q.correctAnswer === "True"}
                                  onChange={() => updateQuestion(idx, "correctAnswer", "True")}
                                />
                                <span>True</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`tf-${idx}`}
                                  checked={q.correctAnswer === "False"}
                                  onChange={() => updateQuestion(idx, "correctAnswer", "False")}
                                />
                                <span>False</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {q.type === "short" && (
                          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Expected Correct Benchmark Answer / Keywords
                            </label>
                            <input
                              type="text"
                              value={q.correctAnswer}
                              onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)}
                              placeholder="Enter expected benchmark answer"
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        )}

                        {q.type === "essay" && (
                          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Grading Rubric Criteria / Sample Solution
                            </label>
                            <textarea
                              rows={2}
                              value={q.correctAnswer}
                              onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)}
                              placeholder="Describe key points or rubric criteria for manual/auto evaluation"
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full border-dashed"
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                  onClick={() => addQuestion("mcq")}
                >
                  Add Another Question Format
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: SETTINGS */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Step 3: Duration & Schedule Parameters
                </CardTitle>
                <CardDescription>
                  Configure exam time limits and future deadline dates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Time Limit */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Time Limit (Minutes) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Number(e.target.value) || 1)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Deadline Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <span>Deadline / Due Date *</span>
                      <span className="text-[10px] text-indigo-600 font-normal">(Future dates only)</span>
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p>
                    Automated Grading & Feedback: All objective questions (MCQ and True/False) will be automatically scored immediately upon student submission.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 4: REVIEW & FINALIZE */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Step 4: Review Assessment Summary
                </CardTitle>
                <CardDescription>
                  Verify template details before saving and assigning to students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Metadata */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="font-semibold text-slate-500">Title:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{title}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 block">Type:</span>
                      <span className="font-semibold">{type}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Category:</span>
                      <span className="font-semibold">{category}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Difficulty:</span>
                      <span className="font-semibold">{difficulty}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Deadline:</span>
                      <span className="font-semibold">{dueDate}</span>
                    </div>
                  </div>
                </div>

                {/* Questions Preview */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Configured Questions ({questions.length})
                  </h4>
                  {questions.map((q, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          #{i + 1}. {q.question || "Untitled Question"}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>{q.type.toUpperCase()}</span>
                          <span>•</span>
                          <span>{q.marks} Marks</span>
                        </div>
                      </div>
                      <Badge variant="teal" size="sm">
                        Ready
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Live Summary Side Panel (4 cols) */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          <Card className="bg-slate-900 text-white border-slate-800 shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Assessment Summary</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Title</span>
                <p className="font-bold text-sm text-indigo-300 line-clamp-1">
                  {title || "Untitled Assessment"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">Total Questions</span>
                  <span className="text-lg font-bold text-white">{totalQuestions}</span>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">Total Marks</span>
                  <span className="text-lg font-bold text-teal-400">{totalMarks} pts</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Subject:</span>
                  <span className="font-semibold text-white">{category || "Not set"}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Duration:</span>
                  <span className="font-semibold text-white">{timeLimit} mins</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Deadline:</span>
                  <span className="font-semibold text-amber-300">{dueDate || "Not set"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            size="md"
            disabled={currentStep === 1}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <Button
                variant="primary"
                size="md"
                rightIcon={<ChevronRight className="w-4 h-4" />}
                onClick={handleNextStep}
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="teal"
                size="md"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleFinalSubmit}
              >
                Save & Proceed to Assign
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
