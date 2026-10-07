"use client";

import React from "react";
import styles from "./StudentSidebar.module.css";

interface StudentSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  student: any;
  onLogout: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function StudentSidebar({
  activeTab,
  setActiveTab,
  student,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
}: StudentSidebarProps) {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: "assessments",
      label: "My Assessments",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "upcoming",
      label: "Upcoming Assessments",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "completed",
      label: "Completed Assessments",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "results",
      label: "Results",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: "performance",
      label: "Performance",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
  ];

  const studentName = student?.fullName || student?.name || "Student";
  const studentEmail = student?.email || "student@example.com";
  const initial = studentName.charAt(0).toUpperCase();

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
      {/* BRANDING TOP */}
      <div className={styles.brandHeader}>
        <img src="/quill_logo.jpg" alt="Quill Logo" style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "cover" }} />
        {!isCollapsed && (
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Quill</span>
            <span className={styles.brandSub}>Portal</span>
          </div>
        )}
        {onToggleCollapse && (
          <button className={styles.toggleBtn} onClick={onToggleCollapse} title="Toggle Sidebar">
            {isCollapsed ? "❯" : "❮"}
          </button>
        )}
      </div>

      {/* STUDENT PROFILE CARD */}
      <div className={styles.profileSection}>
        <div className={styles.avatar}>{initial}</div>
        {!isCollapsed && (
          <div className={styles.profileInfo}>
            <h4 className={styles.profileName}>{studentName}</h4>
            <span className={styles.roleBadge}>Student</span>
          </div>
        )}
      </div>

      {/* NAVIGATION ITEMS */}
      <nav className={styles.navList}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={styles.icon}>{item.icon}</span>
              {!isCollapsed && <span className={styles.label}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* LOGOUT AT BOTTOM */}
      <div className={styles.bottomSection}>
        <button className={styles.logoutBtn} onClick={onLogout} title="Logout">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
