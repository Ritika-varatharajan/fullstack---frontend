"use client";

import React from "react";
import {
  BookOpen,
  Users,
  CheckCircle2,
  Award,
  PlusCircle,
  UserCheck,
  BarChart2,
  PieChart,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Calendar,
  Layers,
} from "lucide-react";
import { StatCard } from "@/app/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";

export interface DashboardViewProps {
  educator: any;
  assessments: any[];
  results: any[];
  students: any[];
  assignments: any[];
  notificationsList: any[];
  setActiveTab: (tab: string) => void;
  onAssignTemplate?: (templateId: string) => void;
  onEditTemplate?: (template: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  educator,
  assessments,
  results,
  students,
  assignments,
  notificationsList,
  setActiveTab,
  onAssignTemplate,
  onEditTemplate,
}) => {
  // Determine greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const name = educator?.fullName || "Educator";

  // Calculate metrics
  const completedAssignmentsCount = assignments.filter((asg) =>
    results.some(
      (r) =>
        String(r.assessmentId) === String(asg.assessmentId) &&
        (String(r.userId) === String(asg.studentId) || String(r.studentId) === String(asg.studentId))
    )
  ).length;

  const totalAssigned = assignments.length;
  const completionRate = totalAssigned > 0 ? ((completedAssignmentsCount / totalAssigned) * 100).toFixed(0) : "0";

  const avgScore = results.length
    ? (results.reduce((acc, r) => acc + Number(r.score || 0), 0) / results.length).toFixed(1)
    : "0.0";

  // Overdue / Pending Attention items
  const overdueNotifications = notificationsList.filter((n) => n.type === "overdue");
  const completionNotifications = notificationsList.filter((n) => n.type === "completion");

  const recentAssessments = assessments.slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Friendly Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 p-6 sm:p-8 text-white shadow-lg shadow-indigo-600/15">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Spring Term Assessment Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {getGreeting()}, {name}!
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Welcome to your assessment management center. You have{" "}
            <span className="font-semibold text-white">{overdueNotifications.length} items</span> needing attention and{" "}
            <span className="font-semibold text-white">{completionNotifications.length} recent submissions</span>.
          </p>
        </div>

        {/* Quick action hero buttons */}
        <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3">
          <Button
            variant="teal"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setActiveTab("create")}
          >
            Create Assessment
          </Button>
          <Button
            variant="outline"
            size="md"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/30"
            leftIcon={<UserCheck className="w-4 h-4" />}
            onClick={() => setActiveTab("assign")}
          >
            Assign Students
          </Button>
          <Button
            variant="ghost"
            size="md"
            className="text-indigo-100 hover:text-white hover:bg-white/10"
            leftIcon={<BarChart2 className="w-4 h-4" />}
            onClick={() => setActiveTab("results")}
          >
            View Reports
          </Button>
        </div>

        {/* Decorative Background Accents */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent pointer-events-none rounded-r-2xl hidden lg:block" />
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Compact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Templates"
          value={assessments.length}
          icon={<BookOpen className="w-5 h-5" />}
          badgeColor="indigo"
          trend={{ value: "+2 this month", isPositive: true, label: "Ready to assign" }}
        />
        <StatCard
          title="Active Students"
          value={students.length}
          icon={<Users className="w-5 h-5" />}
          badgeColor="teal"
          trend={{ value: "Enrolled", isPositive: true, label: "Roster active" }}
        />
        <StatCard
          title="Submission Rate"
          value={`${completionRate}%`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          badgeColor="emerald"
          trend={{
            value: `${completedAssignmentsCount}/${totalAssigned}`,
            isPositive: Number(completionRate) > 50,
            label: "Completed attempts",
          }}
        />
        <StatCard
          title="Average Score"
          value={`${avgScore}%`}
          icon={<Award className="w-5 h-5" />}
          badgeColor="amber"
          trend={{ value: "+3.2%", isPositive: true, label: "Overall class performance" }}
        />
      </div>

      {/* Quick Action Cards Strip */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveTab("create")}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-card text-left transition-all duration-150 group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Create Assessment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Build quizzes, tests or exams
            </p>
          </button>

          <button
            onClick={() => setActiveTab("assign")}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-card text-left transition-all duration-150 group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              Assign Students
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Schedule test delivery to roster
            </p>
          </button>

          <button
            onClick={() => setActiveTab("results")}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-card text-left transition-all duration-150 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              View Reports
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Student answer sheets & scores
            </p>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-card text-left transition-all duration-150 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Detailed Analytics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Subject mastery & distribution
            </p>
          </button>
        </div>
      </div>

      {/* Middle Grid: Needs Attention Panel + Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Needs Attention Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Needs Attention
                </CardTitle>
                <CardDescription>
                  Pending student submissions and overdue deadlines
                </CardDescription>
              </div>
              <Badge variant="amber" size="sm">
                {overdueNotifications.length} Overdue
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdueNotifications.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    All caught up!
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    No overdue assessments or pending alerts right now.
                  </p>
                </div>
              ) : (
                overdueNotifications.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-amber-200/70 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-800/40 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {item.message}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-xs text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-700"
                      onClick={() => setActiveTab("assign")}
                    >
                      Manage
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Assessments List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Recent Assessment Templates</CardTitle>
                <CardDescription>Created templates ready for student delivery</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ChevronRight className="w-4 h-4" />}
                onClick={() => setActiveTab("assessments")}
              >
                View all
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAssessments.map((ass) => {
                const qCount = ass.questions?.length || 0;
                const totalMarks = ass.questions?.reduce((sum: number, q: any) => sum + (q.marks || 1), 0) || 100;
                return (
                  <div
                    key={ass.id}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="indigo" size="sm">
                          {ass.category || "General"}
                        </Badge>
                        <Badge variant="slate" size="sm">
                          {ass.type || "Quiz"}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {ass.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          {qCount} Questions
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {ass.durationMinutes || 30} mins
                        </span>
                        <span>•</span>
                        <span>{totalMarks} Total Marks</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
                      <Button
                        variant="teal"
                        size="sm"
                        leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                        onClick={() => onAssignTemplate && onAssignTemplate(String(ass.id))}
                      >
                        Assign
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditTemplate && onEditTemplate(ass)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Feed (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Recent Activity</span>
                <span className="text-xs font-normal text-slate-400">Real-time log</span>
              </CardTitle>
              <CardDescription>Recent test submissions & completions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {completionNotifications.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">
                  No submissions logged yet today.
                </p>
              ) : (
                completionNotifications.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
