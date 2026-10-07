"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  ArrowUpDown,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  User,
  Mail,
  Shield,
  Layers,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/app/components/ui/Table";
import { Drawer } from "@/app/components/ui/Drawer";

export interface StudentsViewProps {
  students: any[];
  assessments: any[];
  results: any[];
  assignments: any[];
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  assessments,
  results,
  assignments,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "score" | "completed">("name");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Computed per-student metrics
  const studentMetrics = useMemo(() => {
    return students.map((s) => {
      const sId = String(s.id);

      // Assignments for this student
      const studentAsg = assignments.filter((a) => String(a.studentId) === sId);

      // Results for this student
      const studentResults = results.filter(
        (r) => String(r.userId || r.studentId) === sId
      );

      const assignedCount = studentAsg.length;
      const completedCount = studentResults.length;

      const avgPct = studentResults.length
        ? Math.round(
            studentResults.reduce((sum, r) => {
              const totalM = r.totalMarks || 100;
              return sum + (r.score / totalM) * 100;
            }, 0) / studentResults.length
          )
        : 0;

      return {
        student: s,
        assignedCount,
        completedCount,
        avgPct,
        studentResults,
        studentAsg,
      };
    });
  }, [students, assignments, results]);

  // Filtered & Sorted Roster
  const filteredMetrics = useMemo(() => {
    let result = [...studentMetrics];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.student.fullName?.toLowerCase().includes(q) ||
          m.student.email?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === "score") return b.avgPct - a.avgPct;
      if (sortBy === "completed") return b.completedCount - a.completedCount;
      return (a.student.fullName || a.student.email || "").localeCompare(
        b.student.fullName || b.student.email || ""
      );
    });

    return result;
  }, [studentMetrics, searchQuery, sortBy]);

  // Initials generator
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "ST";
  };

  const activeStudentData = useMemo(() => {
    if (!selectedStudent) return null;
    return studentMetrics.find((m) => String(m.student.id) === String(selectedStudent.id));
  }, [selectedStudent, studentMetrics]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Student Directory & Performance Roster
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor registered students, track individual test progress bars, and inspect attempt sheets ({students.length} Total Enrolled)
          </p>
        </div>
      </div>

      {/* Controls Bar: Search & Sort */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name or email address..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="name">Sort by: Name (A-Z)</option>
            <option value="score">Sort by: Average Score (Highest)</option>
            <option value="completed">Sort by: Tests Completed</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Assigned Tests</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>Avg Score & Progress</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMetrics.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                No students found matching search criteria.
              </TableCell>
            </TableRow>
          ) : (
            filteredMetrics.map((item) => {
              const { student, assignedCount, completedCount, avgPct } = item;
              const initial = getInitials(student.fullName, student.email);

              return (
                <TableRow
                  key={student.id}
                  className="cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                  onClick={() => setSelectedStudent(student)}
                >
                  {/* Student Name & Avatar */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {initial}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">
                          {student.fullName || "Student User"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {student.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Assigned Count */}
                  <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                    {assignedCount} Tests
                  </TableCell>

                  {/* Completed Badge */}
                  <TableCell>
                    <Badge variant={completedCount > 0 ? "emerald" : "slate"} size="sm">
                      {completedCount} Completed
                    </Badge>
                  </TableCell>

                  {/* Average Score & Progress Mini-Bar */}
                  <TableCell className="w-64">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">
                          {avgPct}% Avg Score
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                          {avgPct >= 80 ? "Excellent" : avgPct >= 60 ? "Good" : avgPct > 0 ? "Needs Review" : "No Tests"}
                        </span>
                      </div>
                      {/* Mini Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            avgPct >= 80
                              ? "bg-emerald-500"
                              : avgPct >= 60
                              ? "bg-indigo-500"
                              : avgPct > 0
                              ? "bg-amber-500"
                              : "bg-slate-300"
                          }`}
                          style={{ width: `${avgPct}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>

                  {/* Action */}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudent(student);
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Click-through Student Detail Side Drawer */}
      <Drawer
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title="Student Profile & Performance"
        subtitle={`Detailed report for ${selectedStudent?.fullName || selectedStudent?.email}`}
        width="xl"
      >
        {activeStudentData && (
          <div className="space-y-6">
            {/* Header Profile Badge */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-indigo-100/60 dark:from-indigo-950/60 dark:to-slate-800 border border-indigo-200/80 dark:border-indigo-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-md">
                {getInitials(activeStudentData.student.fullName, activeStudentData.student.email)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeStudentData.student.fullName || "Student User"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  {activeStudentData.student.email}
                </p>
              </div>
            </div>

            {/* Quick KPI Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Tests Assigned</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeStudentData.assignedCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Tests Completed</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {activeStudentData.completedCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Average Score</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {activeStudentData.avgPct}%
                </span>
              </div>
            </div>

            {/* Completed Test Attempts Log */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Completed Assessment Attempts</span>
                <span>({activeStudentData.studentResults.length})</span>
              </h4>

              {activeStudentData.studentResults.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center rounded-xl border border-dashed border-slate-200">
                  This student has not completed any test attempts yet.
                </p>
              ) : (
                activeStudentData.studentResults.map((r: any, idx: number) => {
                  const ass = assessments.find((a) => String(a.id) === String(r.assessmentId));
                  const totalM = r.totalMarks || 100;
                  const pct = Math.round((r.score / totalM) * 100);

                  return (
                    <div
                      key={r.id || idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                          {ass?.title || `Assessment #${r.assessmentId}`}
                        </h5>
                        <Badge variant={pct >= 60 ? "emerald" : "rose"} size="sm">
                          {pct}% Score
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                        <span>Score: {r.score} / {totalM} pts</span>
                        <span>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "Submitted"}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
