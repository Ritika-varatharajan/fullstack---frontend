"use client";

import React, { useState, useMemo } from "react";
import {
  UserCheck,
  BookOpen,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Send,
  UserMinus,
  CheckSquare,
  Square,
  AlertCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/app/components/ui/Table";
import { Modal } from "@/app/components/ui/Modal";
import { useToast } from "@/app/components/ui/Toast";

export interface AssignmentsViewProps {
  assessments: any[];
  students: any[];
  assignments: any[];
  results: any[];
  assignData: {
    assessmentId: string;
    studentIds: string[];
  };
  setAssignData: React.Dispatch<
    React.SetStateAction<{
      assessmentId: string;
      studentIds: string[];
    }>
  >;
  onAssignAssessment: () => Promise<void>;
  onUnassignStudent: (assignmentId: string) => Promise<void>;
  onNavigateToCreate: () => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  assessments,
  students,
  assignments,
  results,
  assignData,
  setAssignData,
  onAssignAssessment,
  onUnassignStudent,
  onNavigateToCreate,
}) => {
  const toast = useToast();

  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected assessment object
  const selectedTemplate = useMemo(() => {
    return assessments.find((a) => String(a.id) === String(assignData.assessmentId)) || assessments[0];
  }, [assessments, assignData.assessmentId]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return students;
    const q = studentSearchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
    );
  }, [students, studentSearchQuery]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    if (!templateSearchQuery.trim()) return assessments;
    const q = templateSearchQuery.toLowerCase();
    return assessments.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q)
    );
  }, [assessments, templateSearchQuery]);

  // Toggle single student
  const toggleStudentSelection = (studentId: string) => {
    const sId = String(studentId);
    setAssignData((prev) => {
      const exists = prev.studentIds.includes(sId);
      if (exists) {
        return { ...prev, studentIds: prev.studentIds.filter((id) => id !== sId) };
      } else {
        return { ...prev, studentIds: [...prev.studentIds, sId] };
      }
    });
  };

  // Toggle select all / clear
  const handleToggleSelectAll = () => {
    if (assignData.studentIds.length === students.length) {
      setAssignData((prev) => ({ ...prev, studentIds: [] }));
    } else {
      const allIds = students.map((s) => String(s.id));
      setAssignData((prev) => ({ ...prev, studentIds: allIds }));
    }
  };

  // Handle final delivery trigger
  const handleConfirmLaunch = async () => {
    setIsSubmitting(true);
    try {
      await onAssignAssessment();
      toast.success(
        "Assignment Launched!",
        `Delivered "${selectedTemplate?.title}" to ${assignData.studentIds.length} student(s).`
      );
      setIsConfirmModalOpen(false);
    } catch (err) {
      toast.error("Failed to launch assignment", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get Initials for Avatar
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "ST";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Assignments & Class Delivery
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Select an assessment template and assign it to individual students or the entire class
          </p>
        </div>
      </div>

      {/* 2-Step Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* STEP 1: SELECT TEMPLATE (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  Select Template
                </CardTitle>
                <Badge variant="indigo" size="sm">
                  {assessments.length} Available
                </Badge>
              </div>
              <CardDescription className="mt-1">
                Choose the template you wish to deliver to students
              </CardDescription>

              {/* Template Search Filter */}
              <div className="relative mt-3">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  placeholder="Filter templates..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {filteredTemplates.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No templates match your search filter.
                </p>
              ) : (
                filteredTemplates.map((a) => {
                  const isSelected = String(a.id) === String(assignData.assessmentId);
                  const totalMarks =
                    a.questions?.reduce((sum: number, q: any) => sum + (q.marks || 1), 0) || 100;
                  const qCount = a.questions?.length || 0;

                  return (
                    <div
                      key={a.id}
                      onClick={() =>
                        setAssignData((prev) => ({ ...prev, assessmentId: String(a.id) }))
                      }
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50/70 border-indigo-400 dark:bg-indigo-950/60 dark:border-indigo-600 shadow-2xs"
                          : "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                            {a.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Badge variant="indigo" size="sm">
                              {a.category || "General"}
                            </Badge>
                            <Badge variant="slate" size="sm">
                              {a.type || "Quiz"}
                            </Badge>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          {qCount} Questions
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {a.timeLimit || 30} mins
                        </span>
                        <span>•</span>
                        <span>{totalMarks} pts</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* STEP 2: SELECT RECIPIENT STUDENTS (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-500 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  Select Recipients
                  <Badge variant="teal" size="sm">
                    {assignData.studentIds.length} Selected
                  </Badge>
                </CardTitle>

                {/* Select All Toggle & Clear */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={
                      assignData.studentIds.length === students.length ? (
                        <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                      )
                    }
                    onClick={handleToggleSelectAll}
                  >
                    {assignData.studentIds.length === students.length
                      ? "Clear All"
                      : "Select All Students"}
                  </Button>
                </div>
              </div>
              <CardDescription className="mt-1">
                Students start unselected. Click cards to pick recipients for this test.
              </CardDescription>

              {/* Student Search Box */}
              <div className="relative mt-3">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Search students by name or email address..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {/* Student Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 sm:col-span-2">
                    No students match search query.
                  </p>
                ) : (
                  filteredStudents.map((s) => {
                    const isSelected = assignData.studentIds.includes(String(s.id));

                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleStudentSelection(String(s.id))}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-teal-50/70 border-teal-400 dark:bg-teal-950/60 dark:border-teal-600 shadow-2xs"
                            : "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {getInitials(s.fullName, s.email)}
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                              {s.fullName || "Student User"}
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {s.email}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-teal-500 border-teal-500 text-white"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Launch Action Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {assignData.studentIds.length} student(s) selected
                </span>

                <Button
                  variant="teal"
                  size="md"
                  disabled={!assignData.assessmentId || assignData.studentIds.length === 0}
                  leftIcon={<Send className="w-4 h-4" />}
                  onClick={() => setIsConfirmModalOpen(true)}
                >
                  Deliver Assignment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Delivered Assignments Table */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Active Delivered Assignments ({assignments.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitor active tests delivered to students and manage access
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assigned Student</TableHead>
              <TableHead>Assessment Template</TableHead>
              <TableHead>Category / Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                  No active assignments delivered yet. Select a template above and launch!
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((asg) => {
                const student = students.find((s) => String(s.id) === String(asg.studentId));
                const template = assessments.find((a) => String(a.id) === String(asg.assessmentId));
                const result = results.find(
                  (r) =>
                    String(r.assessmentId) === String(asg.assessmentId) &&
                    (String(r.userId) === String(asg.studentId) ||
                      String(r.studentId) === String(asg.studentId))
                );

                return (
                  <TableRow key={asg.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center">
                          {getInitials(student?.fullName, student?.email)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-xs">
                            {student?.fullName || student?.email || `Student #${asg.studentId}`}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {student?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-medium text-slate-900 dark:text-white text-xs">
                      {template?.title || `Assessment #${asg.assessmentId}`}
                    </TableCell>

                    <TableCell>
                      <Badge variant="indigo" size="sm">
                        {template?.category || "General"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {result ? (
                        <Badge variant="emerald" size="sm" dot>
                          Completed ({result.score} pts)
                        </Badge>
                      ) : (
                        <Badge variant="amber" size="sm" dot>
                          Pending Attempt
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs"
                        leftIcon={<UserMinus className="w-3.5 h-3.5" />}
                        onClick={() => onUnassignStudent(String(asg.id))}
                      >
                        Unassign
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Modal Before Launching Assignment */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Assignment Launch"
        description="Please review delivery parameters before sending to students"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Template:</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedTemplate?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Subject Category:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedTemplate?.category || "General"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Time Limit:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedTemplate?.timeLimit || 30} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Deadline:</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">{selectedTemplate?.dueDate || "Open"}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200">
            <p className="font-semibold mb-1">
              Recipients ({assignData.studentIds.length} Students Selected):
            </p>
            <p className="line-clamp-2 opacity-80">
              {students
                .filter((s) => assignData.studentIds.includes(String(s.id)))
                .map((s) => s.fullName || s.email)
                .join(", ")}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="teal"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<Send className="w-4 h-4" />}
              onClick={handleConfirmLaunch}
            >
              Confirm & Deliver Assignment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
