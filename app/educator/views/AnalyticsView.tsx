"use client";

import React, { useState, useMemo } from "react";
import {
  PieChart,
  BarChart2,
  TrendingUp,
  Award,
  Users,
  Calendar,
  Filter,
  Layers,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/app/components/ui/Table";

export interface AnalyticsViewProps {
  assessments: any[];
  results: any[];
  students: any[];
  assignments: any[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  assessments,
  results,
  students,
  assignments,
}) => {
  const [dateRange, setDateRange] = useState("all");

  // Filter results by date range if needed
  const filteredResults = useMemo(() => {
    if (dateRange === "all") return results;
    const now = new Date().getTime();
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return results.filter((r) => {
      const time = r.submittedAt ? new Date(r.submittedAt).getTime() : now;
      return time >= cutoff;
    });
  }, [results, dateRange]);

  // 1. Score Distribution Bar Chart Data
  const scoreDistributionData = useMemo(() => {
    const dist = [
      { tier: "Excellent (80-100%)", count: 0, color: "#10B981" },
      { tier: "Good (60-79%)", count: 0, color: "#4F46E5" },
      { tier: "Average (40-59%)", count: 0, color: "#F59E0B" },
      { tier: "Needs Help (<40%)", count: 0, color: "#F43F5E" },
    ];

    filteredResults.forEach((r) => {
      const totalM = r.totalMarks || 100;
      const pct = (r.score / totalM) * 100;
      if (pct >= 80) dist[0].count++;
      else if (pct >= 60) dist[1].count++;
      else if (pct >= 40) dist[2].count++;
      else dist[3].count++;
    });

    return dist;
  }, [filteredResults]);

  // 2. Subject Mastery Data
  const subjectMasteryData = useMemo(() => {
    const catMap: Record<string, { totalPct: number; count: number }> = {};

    filteredResults.forEach((r) => {
      const ass = assessments.find((a) => String(a.id) === String(r.assessmentId));
      const cat = ass?.category || "General";
      const totalM = r.totalMarks || 100;
      const pct = (r.score / totalM) * 100;

      if (!catMap[cat]) catMap[cat] = { totalPct: 0, count: 0 };
      catMap[cat].totalPct += pct;
      catMap[cat].count++;
    });

    return Object.keys(catMap).map((cat) => ({
      subject: cat,
      accuracy: Math.round(catMap[cat].totalPct / catMap[cat].count),
    }));
  }, [filteredResults, assessments]);

  // 3. Performance Trend Line Data (per assessment)
  const performanceTrendData = useMemo(() => {
    return assessments.map((ass) => {
      const assResults = filteredResults.filter(
        (r) => String(r.assessmentId) === String(ass.id)
      );
      const avg = assResults.length
        ? Math.round(
            assResults.reduce((sum, r) => {
              const totalM = r.totalMarks || 100;
              return sum + (r.score / totalM) * 100;
            }, 0) / assResults.length
          )
        : 0;

      return {
        title: ass.title.length > 15 ? ass.title.slice(0, 15) + "..." : ass.title,
        fullTitle: ass.title,
        avgScore: avg,
        attempts: assResults.length,
      };
    });
  }, [assessments, filteredResults]);

  // 4. Student Leaderboard Data
  const studentLeaderboard = useMemo(() => {
    const studentMap: Record<string, { student: any; totalPct: number; count: number }> = {};

    filteredResults.forEach((r) => {
      const stId = String(r.userId || r.studentId);
      const st = students.find((s) => String(s.id) === stId);
      if (st) {
        const totalM = r.totalMarks || 100;
        const pct = (r.score / totalM) * 100;
        if (!studentMap[stId]) studentMap[stId] = { student: st, totalPct: 0, count: 0 };
        studentMap[stId].totalPct += pct;
        studentMap[stId].count++;
      }
    });

    return Object.values(studentMap)
      .map((item) => ({
        student: item.student,
        avgPct: Math.round(item.totalPct / item.count),
        completedCount: item.count,
      }))
      .sort((a, b) => b.avgPct - a.avgPct);
  }, [filteredResults, students]);

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
      {/* Header & Date-Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Detailed Class Analytics & Mastery Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Visual charts for score distribution, performance trends over time, and subject mastery
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs shadow-2xs">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span className="font-medium text-slate-500">Date Range:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* 2 Main Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Tier Distribution Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              Score Tier Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of student submissions across performance tiers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="tier" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      borderColor: "#334155",
                      color: "#FFF",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {scoreDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Class Performance Trend Line Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-500" />
              Performance Trend Line
            </CardTitle>
            <CardDescription>
              Average class accuracy percentage per assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="title" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      borderColor: "#334155",
                      color: "#FFF",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgScore"
                    stroke="#14B8A6"
                    strokeWidth={3}
                    dot={{ fill: "#14B8A6", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Mastery & Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Subject Mastery Bars (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Subject Mastery Accuracy
              </CardTitle>
              <CardDescription>
                Average percentage accuracy by subject category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subjectMasteryData.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No subject mastery data logged yet.
                </p>
              ) : (
                subjectMasteryData.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-900 dark:text-white">{item.subject}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">{item.accuracy}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${item.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Student Leaderboard (6 cols) */}
        <div className="lg:col-span-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Top Students Leaderboard
              </CardTitle>
              <CardDescription>
                Highest performing learners across all submitted tests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {studentLeaderboard.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No student leaderboard entries recorded yet.
                </p>
              ) : (
                studentLeaderboard.slice(0, 5).map((item, idx) => {
                  const initial = getInitials(item.student.fullName, item.student.email);
                  const rankIcon =
                    idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;

                  return (
                    <div
                      key={item.student.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 text-center font-bold text-base shrink-0">
                          {rankIcon}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {initial}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {item.student.fullName || item.student.email}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {item.completedCount} Tests Completed
                          </span>
                        </div>
                      </div>

                      <Badge variant="teal" size="md">
                        {item.avgPct}% Avg Score
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
