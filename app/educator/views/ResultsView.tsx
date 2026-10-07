"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart2,
  Search,
  Download,
  FileText,
  Award,
  Users,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Eye,
  Check,
  X,
  Layers,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/app/components/ui/Table";
import { Drawer } from "@/app/components/ui/Drawer";
import { useToast } from "@/app/components/ui/Toast";

export interface ResultsViewProps {
  assessments: any[];
  results: any[];
  students: any[];
  assignments: any[];
  selectedAssessmentId: string;
  setSelectedAssessmentId: (id: string) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  assessments,
  results,
  students,
  assignments,
  selectedAssessmentId,
  setSelectedAssessmentId,
}) => {
  const toast = useToast();
  const [selectedStudentResult, setSelectedStudentResult] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Current selected assessment
  const currentAss = useMemo(() => {
    return (
      assessments.find((a) => String(a.id) === String(selectedAssessmentId)) ||
      assessments[0]
    );
  }, [assessments, selectedAssessmentId]);

  // Current assessment results
  const currentAssResults = useMemo(() => {
    if (!currentAss) return [];
    return results.filter(
      (r) => String(r.assessmentId) === String(currentAss.id)
    );
  }, [results, currentAss]);

  // Current assessment assignments
  const currentAssAssignments = useMemo(() => {
    if (!currentAss) return [];
    return assignments.filter(
      (asg) => String(asg.assessmentId) === String(currentAss.id)
    );
  }, [assignments, currentAss]);

  // Filtered Roster by Search Query
  const filteredRoster = useMemo(() => {
    if (!searchQuery.trim()) return currentAssResults;
    const q = searchQuery.toLowerCase();
    return currentAssResults.filter((r) => {
      const st = students.find((s) => String(s.id) === String(r.userId || r.studentId));
      return (
        st?.fullName?.toLowerCase().includes(q) ||
        st?.email?.toLowerCase().includes(q)
      );
    });
  }, [currentAssResults, students, searchQuery]);

  // Calculations
  const attendedCount = currentAssResults.length;
  const pendingCount = Math.max(
    0,
    currentAssAssignments.length - attendedCount
  );

  const avgMark = currentAssResults.length
    ? (
        currentAssResults.reduce((sum, r) => sum + Number(r.score || 0), 0) /
        currentAssResults.length
      ).toFixed(1)
    : "0.0";

  const topMark = currentAssResults.length
    ? Math.max(...currentAssResults.map((r) => Number(r.score || 0)))
    : 0;

  const totalMarks =
    currentAss?.questions?.reduce(
      (sum: number, q: any) => sum + (q.marks || 1),
      0
    ) || 100;

  // Export to CSV Function
  const exportToCSV = () => {
    if (!currentAssResults || currentAssResults.length === 0) {
      toast.info("No data available to export.");
      return;
    }

    const headers = [
      "Student ID",
      "Student Name",
      "Email",
      "Assessment Title",
      "Score",
      "Total Marks",
      "Percentage",
      "Submission Date",
    ];

    const rows = currentAssResults.map((r) => {
      const st = students.find((s) => String(s.id) === String(r.userId || r.studentId));
      const pct = Math.round((r.score / (r.totalMarks || totalMarks)) * 100);
      return [
        r.userId || r.studentId || "",
        `"${st?.fullName || 'Student'}"`,
        `"${st?.email || ''}"`,
        `"${currentAss?.title || ''}"`,
        r.score,
        r.totalMarks || totalMarks,
        `${pct}%`,
        `"${r.submittedAt ? new Date(r.submittedAt).toLocaleString() : 'N/A'}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Report_${(currentAss?.title || "Assessment").replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Report Exported!", "CSV report downloaded successfully.");
  };

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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Export CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Results & Individual Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Inspect question-by-question student answer sheets and export performance gradebooks
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          leftIcon={<Download className="w-4 h-4 text-indigo-600" />}
          onClick={exportToCSV}
        >
          Export CSV Report
        </Button>
      </div>

      {/* Assessment Selector Strip / Searchable Select */}
      <Card>
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select Assessment Report
            </span>
            <select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              className="w-full md:w-80 px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.category || "General"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
            <div>
              <span className="text-slate-400 block">Category:</span>
              <Badge variant="indigo" size="sm">
                {currentAss?.category || "General"}
              </Badge>
            </div>
            <div>
              <span className="text-slate-400 block">Time Limit:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {currentAss?.timeLimit || 30} mins
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Weight:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {totalMarks} pts
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4 KPI Metric Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Attended Submissions
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {attendedCount}
            </span>
            <Badge variant="emerald" size="sm">
              Completed
            </Badge>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Pending Students
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {pendingCount}
            </span>
            <Badge variant="amber" size="sm">
              Pending
            </Badge>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Average Score
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {avgMark} / {totalMarks}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {totalMarks ? Math.round((Number(avgMark) / totalMarks) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Top Score (Class Max)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {topMark} / {totalMarks}
            </span>
            <Badge variant="teal" size="sm">
              Highest
            </Badge>
          </div>
        </div>
      </div>

      {/* Roster Table with Search Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Student Answer Sheet Directory ({filteredRoster.length})
          </h2>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student results..."
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Submission Timestamp</TableHead>
              <TableHead>Score Pill</TableHead>
              <TableHead>Performance Level</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoster.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                  No student results submitted for this assessment yet.
                </TableCell>
              </TableRow>
            ) : (
              filteredRoster.map((r) => {
                const st = students.find((s) => String(s.id) === String(r.userId || r.studentId));
                const pct = Math.round((r.score / (r.totalMarks || totalMarks)) * 100);

                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {getInitials(st?.fullName, st?.email)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-xs">
                            {st?.fullName || st?.email || `Student #${r.userId || r.studentId}`}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {st?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "Recently Submitted"}
                    </TableCell>

                    {/* Score Pill */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center font-bold px-3 py-1 rounded-full text-xs ${
                          pct >= 80
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                            : pct >= 60
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                            : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                        }`}
                      >
                        {r.score} / {r.totalMarks || totalMarks} pts ({pct}%)
                      </span>
                    </TableCell>

                    <TableCell>
                      {pct >= 80 ? (
                        <Badge variant="emerald" size="sm" dot>
                          High Mastery
                        </Badge>
                      ) : pct >= 60 ? (
                        <Badge variant="indigo" size="sm" dot>
                          Proficient
                        </Badge>
                      ) : (
                        <Badge variant="amber" size="sm" dot>
                          Needs Support
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5 text-indigo-600" />}
                        onClick={() => setSelectedStudentResult(r)}
                      >
                        View Answer Sheet
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Answer Sheet Side Drawer */}
      <Drawer
        isOpen={!!selectedStudentResult}
        onClose={() => setSelectedStudentResult(null)}
        title="Student Answer Sheet Inspection"
        subtitle={`Submitted by ${
          students.find(
            (s) => String(s.id) === String(selectedStudentResult?.userId || selectedStudentResult?.studentId)
          )?.fullName || "Student"
        }`}
        width="2xl"
      >
        {selectedStudentResult && (
          <div className="space-y-6">
            {/* Header Performance Card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-indigo-300">
                    {currentAss?.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Submitted at:{" "}
                    {selectedStudentResult.submittedAt
                      ? new Date(selectedStudentResult.submittedAt).toLocaleString()
                      : "Recently"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-teal-400">
                    {selectedStudentResult.score} / {selectedStudentResult.totalMarks || totalMarks}
                  </span>
                  <span className="text-xs text-slate-400 block">Total Awarded Score</span>
                </div>
              </div>
            </div>

            {/* Question-by-Question Breakdown */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Detailed Question Breakdown ({currentAss?.questions?.length || 0} Questions)
              </h4>

              {currentAss?.questions?.map((q: any, qIdx: number) => {
                const studentAns = selectedStudentResult.answers?.[qIdx];

                const isCorrect =
                  studentAns !== undefined &&
                  String(studentAns).trim().toLowerCase() ===
                    String(q.correctAnswer).trim().toLowerCase();

                return (
                  <div
                    key={qIdx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Question #{qIdx + 1} ({q.type.toUpperCase()})
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          {q.question}
                        </p>
                      </div>

                      <Badge
                        variant={isCorrect ? "emerald" : "rose"}
                        size="sm"
                      >
                        {isCorrect ? `${q.marks || 1}/${q.marks || 1} pts` : `0/${q.marks || 1} pts`}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                      {/* Student's Response */}
                      <div
                        className={`p-2.5 rounded-lg border ${
                          isCorrect
                            ? "bg-emerald-50/60 border-emerald-200 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-100"
                            : "bg-rose-50/60 border-rose-200 text-rose-950 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100"
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase block opacity-70 mb-0.5">
                          Student Response:
                        </span>
                        <span className="font-semibold">
                          {studentAns !== undefined && studentAns !== "" ? String(studentAns) : "No Response"}
                        </span>
                      </div>

                      {/* Correct Benchmark */}
                      <div className="p-2.5 rounded-lg border bg-indigo-50/60 border-indigo-200 text-indigo-950 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-100">
                        <span className="text-[10px] font-bold uppercase block opacity-70 mb-0.5">
                          Correct Benchmark Key:
                        </span>
                        <span className="font-semibold">{q.correctAnswer || "Benchmark Solution"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
