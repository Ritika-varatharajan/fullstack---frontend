"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  PlusCircle,
  LayoutGrid,
  List,
  UserCheck,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  Clock,
  Layers,
  Award,
  Filter,
  ArrowUpDown,
  BookOpen,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Card, CardContent } from "@/app/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/app/components/ui/Table";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Modal } from "@/app/components/ui/Modal";

export interface AssessmentsViewProps {
  assessments: any[];
  students: any[];
  onAssignTemplate: (templateId: string) => void;
  onEditTemplate: (template: any) => void;
  onDuplicateTemplate: (template: any) => void;
  onDeleteTemplate: (templateId: string) => void;
  onCreateNew: () => void;
}

export const AssessmentsView: React.FC<AssessmentsViewProps> = ({
  assessments,
  students,
  onAssignTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onCreateNew,
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title" | "questions">("newest");

  // State for active 3-dot dropdown menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // State for Delete Confirmation Modal
  const [deleteModalTarget, setDeleteModalTarget] = useState<any | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    assessments.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [assessments]);

  // Filtered and Sorted Assessments
  const filteredAssessments = useMemo(() => {
    let result = [...assessments];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q)
      );
    }

    if (selectedType !== "all") {
      result = result.filter((a) => (a.type || "Quiz").toLowerCase() === selectedType.toLowerCase());
    }

    if (selectedCategory !== "all") {
      result = result.filter((a) => a.category === selectedCategory);
    }

    if (selectedDifficulty !== "all") {
      result = result.filter((a) => (a.difficulty || "medium").toLowerCase() === selectedDifficulty.toLowerCase());
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "title") return a.title?.localeCompare(b.title || "") || 0;
      if (sortBy === "questions") return (b.questions?.length || 0) - (a.questions?.length || 0);
      if (sortBy === "oldest") return (a.id || 0) - (b.id || 0);
      return (b.id || 0) - (a.id || 0); // newest default
    });

    return result;
  }, [assessments, searchQuery, selectedType, selectedCategory, selectedDifficulty, sortBy]);

  const getDifficultyBadge = (difficulty?: string) => {
    const diff = (difficulty || "medium").toLowerCase();
    if (diff === "easy") return <Badge variant="emerald" size="sm" dot>Easy</Badge>;
    if (diff === "hard") return <Badge variant="rose" size="sm" dot>Hard</Badge>;
    return <Badge variant="amber" size="sm" dot>Medium</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Assessment Templates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organize, edit, and assign reusable test templates to your classes ({filteredAssessments.length} total)
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={onCreateNew}
        >
          Create Assessment
        </Button>
      </div>

      {/* Control Bar: Search, Filters, View Toggle, Sort */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assessment title, category, topic..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* View Toggle (Grid / List) */}
          <div className="flex items-center gap-1.5 self-end md:self-auto bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors text-xs font-medium flex items-center gap-1 ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors text-xs font-medium flex items-center gap-1 ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="quiz">Quiz</option>
            <option value="test">Test</option>
            <option value="exam">Exam</option>
            <option value="survey">Survey</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {/* Sort Dropdown */}
          <div className="ml-auto flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="newest">Sort by: Newest First</option>
              <option value="oldest">Sort by: Oldest First</option>
              <option value="title">Sort by: Title A-Z</option>
              <option value="questions">Sort by: Question Count</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid / List View */}
      {filteredAssessments.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-7 h-7" />}
          title="No assessment templates found"
          description="We couldn't find any templates matching your search filters. Try adjusting your keywords or create a brand new assessment."
          actionText="Create Assessment"
          onAction={onCreateNew}
        />
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssessments.map((a) => {
            const qCount = a.questions?.length || 0;
            const totalMarks =
              a.questions?.reduce((sum: number, q: any) => sum + (q.marks || 1), 0) || 100;
            const isMenuOpen = openMenuId === String(a.id);

            return (
              <Card key={a.id} hoverable className="flex flex-col justify-between relative group">
                <CardContent className="p-5 space-y-4">
                  {/* Top Header: Chips & 3-Dot Menu */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="indigo" size="sm">
                        {a.category || "General"}
                      </Badge>
                      <Badge variant="slate" size="sm">
                        {a.type || "Quiz"}
                      </Badge>
                      {getDifficultyBadge(a.difficulty)}
                    </div>

                    {/* 3-Dot Options Dropdown */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(isMenuOpen ? null : String(a.id));
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Assessment options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                onEditTemplate(a);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Edit Template</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                onDuplicateTemplate(a);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5 text-teal-500" />
                              <span>Duplicate</span>
                            </button>

                            <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setDeleteModalTarget(a);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {a.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {a.description || "Comprehensive assessment template designed for testing student knowledge and topic mastery."}
                    </p>
                  </div>

                  {/* Metadata Indicators */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>{qCount} Questions</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{a.timeLimit || a.durationMinutes || 30} mins</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>{totalMarks} Marks</span>
                    </div>
                  </div>
                </CardContent>

                {/* Card Footer: Primary Action "Assign" */}
                <div className="p-4 pt-0 mt-2">
                  <Button
                    variant="teal"
                    size="md"
                    className="w-full"
                    leftIcon={<UserCheck className="w-4 h-4" />}
                    onClick={() => onAssignTemplate(String(a.id))}
                  >
                    Assign to Students
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Name & Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Total Marks</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssessments.map((a) => {
              const qCount = a.questions?.length || 0;
              const totalMarks =
                a.questions?.reduce((sum: number, q: any) => sum + (q.marks || 1), 0) || 100;
              return (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {a.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Badge variant="indigo" size="sm">
                        {a.category || "General"}
                      </Badge>
                      {a.dueDate && <span>Due: {a.dueDate}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="slate" size="sm">
                      {a.type || "Quiz"}
                    </Badge>
                  </TableCell>
                  <TableCell>{getDifficultyBadge(a.difficulty)}</TableCell>
                  <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                    {qCount}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {a.timeLimit || a.durationMinutes || 30} mins
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900 dark:text-white">
                    {totalMarks} pts
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="teal"
                        size="sm"
                        leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                        onClick={() => onAssignTemplate(String(a.id))}
                      >
                        Assign
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditTemplate(a)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={() => setDeleteModalTarget(a)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Confirmation Modal for Delete */}
      <Modal
        isOpen={!!deleteModalTarget}
        onClose={() => setDeleteModalTarget(null)}
        title="Delete Assessment Template?"
        description="Are you sure you want to permanently delete this template?"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
            <p className="font-semibold mb-1">
              Assessment: "{deleteModalTarget?.title}"
            </p>
            This action cannot be undone. Deleting this template will permanently remove all associated questions and student active assignment records.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setDeleteModalTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => {
                if (deleteModalTarget) {
                  onDeleteTemplate(String(deleteModalTarget.id));
                  setDeleteModalTarget(null);
                }
              }}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
