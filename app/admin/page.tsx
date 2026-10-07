"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./admin.module.css";
import AssessmentForm from "../components/AssessmentForm";
import AdminSidebar from "../components/AdminSidebar";
import { API } from "@/app/config/api";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [showUserModal, setShowUserModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  const [filterRole, setFilterRole] = useState("All");

  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "Student",
  });

  const [editUser, setEditUser] = useState<any>(null);
  const [editAssessment, setEditAssessment] = useState<any>(null);

  let adminUser: any = {};
  try {
    adminUser =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user") || "{}")
        : {};
  } catch {
    adminUser = {};
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [u, a, r] = await Promise.all([
        axios.get(`${API}/users`),
        axios.get(`${API}/assessments`),
        axios.get(`${API}/results`),
      ]);

      setUsers(u.data || []);
      setAssessments(a.data || []);
      setResults(r.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load admin data");
    }
  };

  const handleLogout = () => {
    if (!confirm("Are you sure you want to log out of Admin Portal?")) return;
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete user account? This cannot be undone.")) return;
    try {
      await axios.delete(`${API}/users/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  const deleteAssessment = async (id: string) => {
    if (!confirm("Delete assessment template? All associated data will be removed.")) return;
    try {
      await axios.delete(`${API}/assessments/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete assessment");
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editUser) {
        await axios.put(`${API}/users/${editUser.id}`, newUser);
        alert("User account updated successfully ✅");
      } else {
        await axios.post(`${API}/users`, newUser);
        alert("New user created successfully ✅");
      }
      setShowUserModal(false);
      setEditUser(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to save user");
    }
  };

  // SEARCH FILTERING LOGIC
  const filteredUsers = users
    .filter((u) => filterRole === "All" || u.role === filterRole || (filterRole === "Admin" && u.role === "Administrator"))
    .filter(
      (u) =>
        u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredAssessments = assessments.filter(
    (a) =>
      a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = users.filter((u) => u.role === "Student").length;
  const totalEducators = users.filter((u) => u.role === "Educator").length;
  const totalAdmins = users.filter((u) => u.role === "Administrator" || u.role === "Admin").length;

  return (
    <div className={styles.layout}>
      {/* FIXED LEFT SIDEBAR */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        admin={adminUser}
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
              Administrator Command Center 🛡️
            </h1>
            <p className={styles.welcomeSub}>
              System Management, Role Access Control, Platform Analytics & Audit Reports.
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
                placeholder="Search users, tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* PROFILE PILL */}
            <div className={styles.profilePill}>
              <div className={styles.pillAvatar}>
                {(adminUser?.fullName || adminUser?.name || "A").charAt(0).toUpperCase()}
              </div>
              <span className={styles.pillText}>
                {adminUser?.fullName?.split(" ")[0] || "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* 1. DASHBOARD OVERVIEW */}
        {activeTab === "dashboard" && (
          <div className={styles.sectionContainer}>
            {/* HERO BANNER */}
            <div className={styles.heroBanner}>
              <div className={styles.bannerText}>
                <h2>Global System Overview & Management</h2>
                <p>Monitoring {users.length} active platform accounts across all user roles.</p>
              </div>
            </div>

            {/* VIBRANT MULTI-COLOR METRICS CARDS */}
            <div className={styles.metricsGrid}>
              <div className={styles.statCardIndigo}>
                <div className={styles.statIcon} style={{ background: "rgba(79, 70, 229, 0.1)", color: "#4f46e5" }}>
                  👥
                </div>
                <div>
                  <span className={styles.statLabel}>Total Users</span>
                  <h3 className={styles.statValue}>{users.length}</h3>
                </div>
              </div>

              <div className={styles.statCardEmerald}>
                <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                  🎓
                </div>
                <div>
                  <span className={styles.statLabel}>Students</span>
                  <h3 className={styles.statValue}>{totalStudents}</h3>
                </div>
              </div>

              <div className={styles.statCardAmber}>
                <div className={styles.statIcon} style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
                  👨‍🏫
                </div>
                <div>
                  <span className={styles.statLabel}>Educators</span>
                  <h3 className={styles.statValue}>{totalEducators}</h3>
                </div>
              </div>

              <div className={styles.statCardRose}>
                <div className={styles.statIcon} style={{ background: "rgba(225, 29, 72, 0.1)", color: "#e11d48" }}>
                  🛡️
                </div>
                <div>
                  <span className={styles.statLabel}>Administrators</span>
                  <h3 className={styles.statValue}>{totalAdmins}</h3>
                </div>
              </div>

              <div className={styles.statCardSky}>
                <div className={styles.statIcon} style={{ background: "rgba(2, 132, 199, 0.1)", color: "#0284c7" }}>
                  📝
                </div>
                <div>
                  <span className={styles.statLabel}>Total Assessments</span>
                  <h3 className={styles.statValue}>{assessments.length}</h3>
                </div>
              </div>
            </div>

            {/* RECENT ASSESSMENTS DIRECTORY */}
            <div className={styles.cardSection}>
              <h2>Recent Assessments Created</h2>
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Time Limit</th>
                    <th>Questions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.slice(0, 5).map((a) => (
                    <tr key={a.id}>
                      <td><strong>{a.title}</strong></td>
                      <td><span className={styles.roleTag}>{a.category || "General"}</span></td>
                      <td>{a.timeLimit || 30} mins</td>
                      <td>{a.questions?.length || 0} Questions</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. USER MANAGEMENT */}
        {activeTab === "users" && (
          <div className={styles.sectionContainer}>
            <div className={styles.topBar}>
              <button
                className={styles.primaryBtn}
                onClick={() => {
                  setEditUser(null);
                  setNewUser({
                    fullName: "",
                    email: "",
                    password: "",
                    role: "Student",
                  });
                  setShowUserModal(true);
                }}
              >
                + Add New User
              </button>

              <select
                className={styles.filterSelect}
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="All">All Roles ({users.length})</option>
                <option value="Student">Student ({totalStudents})</option>
                <option value="Educator">Educator ({totalEducators})</option>
                <option value="Admin">Administrator ({totalAdmins})</option>
              </select>
            </div>

            <div className={styles.cardSection}>
              <h2>User Accounts Roster ({filteredUsers.length})</h2>
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>User Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.fullName}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={styles.roleTag}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionCell}>
                          <button
                            className={styles.editBtn}
                            onClick={() => {
                              setEditUser(u);
                              setNewUser({
                                fullName: u.fullName || "",
                                email: u.email || "",
                                password: u.password || "",
                                role: u.role || "Student",
                              });
                              setShowUserModal(true);
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => deleteUser(u.id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. ASSESSMENTS DIRECTORY */}
        {activeTab === "assessments" && (
          <div className={styles.sectionContainer}>
            <div className={styles.topBar}>
              <h2>All System Assessment Templates ({filteredAssessments.length})</h2>
              <button
                className={styles.primaryBtn}
                onClick={() => {
                  setEditAssessment(null);
                  setShowAssessmentModal(true);
                }}
              >
                + Create Assessment
              </button>
            </div>

            <div className={styles.cardSection}>
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr>
                    <th>Assessment Title</th>
                    <th>Category</th>
                    <th>Time Limit</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssessments.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{a.title}</strong></td>
                      <td><span className={styles.roleTag}>{a.category || "General"}</span></td>
                      <td>{a.timeLimit || 30} mins</td>
                      <td>
                        <div className={styles.actionCell}>
                          <button
                            className={styles.editBtn}
                            onClick={() => {
                              setEditAssessment(a);
                              setShowAssessmentModal(true);
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => deleteAssessment(a.id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. REPORTS & ANALYTICS */}
        {activeTab === "reports" && (() => {
          // Subject breakdown analysis
          const subjectMap: Record<string, { category: string; totalTests: number; totalSubmissions: number; scores: number[] }> = {};

          assessments.forEach((a) => {
            const cat = a.category || "General";
            if (!subjectMap[cat]) {
              subjectMap[cat] = { category: cat, totalTests: 0, totalSubmissions: 0, scores: [] };
            }
            subjectMap[cat].totalTests += 1;
          });

          results.forEach((r) => {
            const assessment = assessments.find((a) => String(a.id) === String(r.assessmentId));
            const cat = assessment?.category || "General";
            if (!subjectMap[cat]) {
              subjectMap[cat] = { category: cat, totalTests: 0, totalSubmissions: 0, scores: [] };
            }
            subjectMap[cat].totalSubmissions += 1;

            const scoreNum = Number(r.score || 0);
            const totalNum = Number(r.totalMarks || 100);
            const pct = r.percentage !== undefined && r.percentage !== null
              ? Number(r.percentage)
              : Math.round((scoreNum / (totalNum || 1)) * 100);

            subjectMap[cat].scores.push(pct);
          });

          const subjectsList = Object.values(subjectMap).map((s) => {
            const avgPct = s.scores.length > 0
              ? Math.round(s.scores.reduce((sum, val) => sum + val, 0) / s.scores.length)
              : 0;
            return { ...s, avgPct };
          });

          // Distribution Tiers
          const dist = { excellent: 0, good: 0, average: 0, needsWork: 0 };
          let overallScoreSum = 0;

          results.forEach((r) => {
            const scoreNum = Number(r.score || 0);
            const totalNum = Number(r.totalMarks || 100);
            const pct = r.percentage !== undefined && r.percentage !== null
              ? Number(r.percentage)
              : Math.round((scoreNum / (totalNum || 1)) * 100);

            overallScoreSum += pct;

            if (pct >= 80) dist.excellent += 1;
            else if (pct >= 60) dist.good += 1;
            else if (pct >= 40) dist.average += 1;
            else dist.needsWork += 1;
          });

          const totalResultsCount = results.length || 1;
          const globalAvgScore = results.length > 0 ? Math.round(overallScoreSum / results.length) : 0;
          const topSubject = [...subjectsList].sort((a, b) => b.avgPct - a.avgPct)[0]?.category || "None";

          return (
            <div className={styles.sectionContainer}>
              <div className={styles.analyticsHeader}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>
                    📊 Subject-Wise Performance & Analytics Center
                  </h2>
                  <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.92rem" }}>
                    Real-time subject mastery distribution, test completion metrics, and performance analytics.
                  </p>
                </div>
              </div>

              {/* STAT CARDS OVERVIEW */}
              <div className={styles.metricsGrid}>
                <div className={styles.statCardEmerald}>
                  <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                    🎯
                  </div>
                  <div>
                    <span className={styles.statLabel}>Overall Platform Average</span>
                    <h3 className={styles.statValue}>{globalAvgScore}%</h3>
                  </div>
                </div>

                <div className={styles.statCardIndigo}>
                  <div className={styles.statIcon} style={{ background: "rgba(249, 115, 22, 0.1)", color: "#ea580c" }}>
                    📝
                  </div>
                  <div>
                    <span className={styles.statLabel}>Total Submissions</span>
                    <h3 className={styles.statValue}>{results.length}</h3>
                  </div>
                </div>

                <div className={styles.statCardAmber}>
                  <div className={styles.statIcon} style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
                    🏆
                  </div>
                  <div>
                    <span className={styles.statLabel}>Top Scoring Subject</span>
                    <h3 className={styles.statValue}>{topSubject}</h3>
                  </div>
                </div>

                <div className={styles.statCardSky}>
                  <div className={styles.statIcon} style={{ background: "rgba(2, 132, 199, 0.1)", color: "#0284c7" }}>
                    📚
                  </div>
                  <div>
                    <span className={styles.statLabel}>Active Subjects</span>
                    <h3 className={styles.statValue}>{subjectsList.length}</h3>
                  </div>
                </div>
              </div>

              {/* CHARTS GRID */}
              <div className={styles.analyticsGrid}>
                {/* SUBJECT MASTERY & ACCURACY PROGRESS BARS */}
                <div className={styles.chartCard}>
                  <div>
                    <h3 className={styles.chartTitle}>📖 Subject Performance & Accuracy Meters</h3>
                    <p className={styles.chartSub}>Average student test accuracy & total assessments created by category.</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {subjectsList.length === 0 ? (
                      <p style={{ color: "#64748b", fontStyle: "italic" }}>No subjects recorded yet.</p>
                    ) : (
                      subjectsList.map((sub) => {
                        const pctClass =
                          sub.avgPct >= 80 ? styles.pctHigh :
                          sub.avgPct >= 60 ? styles.pctMed :
                          sub.avgPct >= 40 ? styles.pctAvg : styles.pctLow;

                        const barColor =
                          sub.avgPct >= 80 ? "linear-gradient(90deg, #10b981, #059669)" :
                          sub.avgPct >= 60 ? "linear-gradient(90deg, #3b82f6, #2563eb)" :
                          sub.avgPct >= 40 ? "linear-gradient(90deg, #f59e0b, #d97706)" : "linear-gradient(90deg, #f43f5e, #e11d48)";

                        return (
                          <div key={sub.category} className={styles.subjectItem}>
                            <div className={styles.subjectHeader}>
                              <div>
                                <span className={styles.subjectName}>{sub.category}</span>
                                <span className={styles.subjectStats}> ({sub.totalTests} Tests • {sub.totalSubmissions} Submissions)</span>
                              </div>
                              <span className={`${styles.pctBadge} ${pctClass}`}>
                                {sub.avgPct}% Avg Score
                              </span>
                            </div>
                            <div className={styles.progressTrack}>
                              <div
                                className={styles.progressFill}
                                style={{ width: `${Math.max(sub.avgPct, 4)}%`, background: barColor }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* SCORE DISTRIBUTION HORIZONTAL BAR CHART */}
                <div className={styles.chartCard}>
                  <div>
                    <h3 className={styles.chartTitle}>📈 Student Score Distribution Tiers</h3>
                    <p className={styles.chartSub}>Visual breakdown of submission outcomes across performance bands.</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                    {/* EXCELLENT 80-100% */}
                    <div className={styles.distBarRow}>
                      <div className={styles.distBarMeta}>
                        <span>🟢 Excellent Mastery (80% - 100%)</span>
                        <span>{dist.excellent} students ({Math.round((dist.excellent / totalResultsCount) * 100)}%)</span>
                      </div>
                      <div className={styles.distBarTrack}>
                        <div
                          className={styles.distBarFill}
                          style={{
                            width: `${Math.max(Math.round((dist.excellent / totalResultsCount) * 100), 5)}%`,
                            background: "linear-gradient(90deg, #10b981, #059669)",
                          }}
                        >
                          {dist.excellent > 0 && `${dist.excellent}`}
                        </div>
                      </div>
                    </div>

                    {/* PROFICIENT 60-79% */}
                    <div className={styles.distBarRow}>
                      <div className={styles.distBarMeta}>
                        <span>🔵 Proficient Performance (60% - 79%)</span>
                        <span>{dist.good} students ({Math.round((dist.good / totalResultsCount) * 100)}%)</span>
                      </div>
                      <div className={styles.distBarTrack}>
                        <div
                          className={styles.distBarFill}
                          style={{
                            width: `${Math.max(Math.round((dist.good / totalResultsCount) * 100), 5)}%`,
                            background: "linear-gradient(90deg, #3b82f6, #2563eb)",
                          }}
                        >
                          {dist.good > 0 && `${dist.good}`}
                        </div>
                      </div>
                    </div>

                    {/* AVERAGE 40-59% */}
                    <div className={styles.distBarRow}>
                      <div className={styles.distBarMeta}>
                        <span>🟡 Developing / Average (40% - 59%)</span>
                        <span>{dist.average} students ({Math.round((dist.average / totalResultsCount) * 100)}%)</span>
                      </div>
                      <div className={styles.distBarTrack}>
                        <div
                          className={styles.distBarFill}
                          style={{
                            width: `${Math.max(Math.round((dist.average / totalResultsCount) * 100), 5)}%`,
                            background: "linear-gradient(90deg, #f59e0b, #d97706)",
                          }}
                        >
                          {dist.average > 0 && `${dist.average}`}
                        </div>
                      </div>
                    </div>

                    {/* NEEDS WORK <40% */}
                    <div className={styles.distBarRow}>
                      <div className={styles.distBarMeta}>
                        <span>🔴 Needs Improvement (&lt; 40%)</span>
                        <span>{dist.needsWork} students ({Math.round((dist.needsWork / totalResultsCount) * 100)}%)</span>
                      </div>
                      <div className={styles.distBarTrack}>
                        <div
                          className={styles.distBarFill}
                          style={{
                            width: `${Math.max(Math.round((dist.needsWork / totalResultsCount) * 100), 5)}%`,
                            background: "linear-gradient(90deg, #f43f5e, #e11d48)",
                          }}
                        >
                          {dist.needsWork > 0 && `${dist.needsWork}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DETAILED RESULTS AUDIT TABLE */}
              <div className={styles.cardSection}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                  📋 Assessment Submission Results Audit Log
                </h3>
                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th>Student Account</th>
                      <th>Assessment Title</th>
                      <th>Subject Category</th>
                      <th>Raw Score</th>
                      <th>Accuracy Meter</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>
                          No submission records found.
                        </td>
                      </tr>
                    ) : (
                      results.map((r, idx) => {
                        const user = users.find((u) => String(u.id) === String(r.userId || r.studentId));
                        const assessment = assessments.find((a) => String(a.id) === String(r.assessmentId));
                        const scoreNum = Number(r.score || 0);
                        const totalNum = Number(r.totalMarks || 100);
                        const pct = r.percentage !== undefined && r.percentage !== null
                          ? Number(r.percentage)
                          : Math.round((scoreNum / (totalNum || 1)) * 100);

                        const meterColor =
                          pct >= 80 ? "#10b981" :
                          pct >= 60 ? "#3b82f6" :
                          pct >= 40 ? "#f59e0b" : "#f43f5e";

                        return (
                          <tr key={r.id || idx}>
                            <td><strong>{user?.fullName || user?.email || r.studentId || "Student"}</strong></td>
                            <td>{assessment?.title || `Assessment #${r.assessmentId}`}</td>
                            <td>
                              <span className={styles.roleTag}>
                                {assessment?.category || "General"}
                              </span>
                            </td>
                            <td><strong>{r.score} / {r.totalMarks || 100}</strong></td>
                            <td>
                              <div className={styles.miniMeter}>
                                <div className={styles.miniTrack}>
                                  <div className={styles.miniFill} style={{ width: `${Math.max(pct, 5)}%`, background: meterColor }} />
                                </div>
                                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: meterColor }}>{pct}%</span>
                              </div>
                            </td>
                            <td>
                              <span className={styles.roleTag} style={{ background: "#d1fae5", color: "#047857" }}>
                                Completed ✅
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </main>

      {/* USER MODAL */}
      {showUserModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button
              className={styles.closeBtn}
              onClick={() => setShowUserModal(false)}
            >
              ✖
            </button>
            <h3>{editUser ? "Edit User Account" : "Create New User Account"}</h3>
            <form onSubmit={handleUserSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input
                placeholder="Full Name"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                required
              />
              <input
                placeholder="Email Address"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
              <input
                placeholder="Password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="Student">Student</option>
                <option value="Educator">Educator</option>
                <option value="Administrator">Administrator</option>
              </select>
              <button type="submit" className={styles.saveBtn}>
                Save User Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ASSESSMENT MODAL */}
      {showAssessmentModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: "750px" }}>
            <button
              className={styles.closeBtn}
              onClick={() => {
                setShowAssessmentModal(false);
                setEditAssessment(null);
              }}
            >
              ✖
            </button>
            <AssessmentForm
              initialData={editAssessment}
              onSubmit={async (data: any) => {
                try {
                  if (editAssessment) {
                    await axios.put(`${API}/assessments/${editAssessment.id}`, data);
                  } else {
                    await axios.post(`${API}/assessments`, data);
                  }
                  setShowAssessmentModal(false);
                  setEditAssessment(null);
                  fetchData();
                } catch (err) {
                  console.error(err);
                  alert("Failed to save assessment");
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}