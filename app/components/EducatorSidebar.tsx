"use client";

import React from "react";
import styles from "./EducatorSidebar.module.css";

type Props = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  educator: any;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

export default function EducatorSidebar({
  activeTab,
  setActiveTab,
  educator,
  onLogout,
  isCollapsed,
  onToggleCollapse,
}: Props) {
  const initial = (educator?.fullName || educator?.email || "E").charAt(0).toUpperCase();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "assessments", label: "My Assessments", icon: "📝" },
    { id: "create", label: "Create Assessment", icon: "➕" },
    { id: "assign", label: "Assignments", icon: "🎯" },
    { id: "students", label: "Students Roster", icon: "👥" },
    { id: "results", label: "Results & Reports", icon: "📈" },
  ];

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
      {/* BRAND HEADER */}
      <div className={styles.brandHeader}>
        <img src="/quill_logo.jpg" alt="Quill Logo" style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "cover" }} />
        {!isCollapsed && (
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Quill</span>
            <span className={styles.brandSub}>Portal</span>
          </div>
        )}
        <button
          className={styles.toggleBtn}
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? "❯" : "❮"}
        </button>
      </div>

      {/* EDUCATOR PROFILE SUMMARY */}
      <div className={styles.profileSection}>
        <div className={styles.avatar}>{initial}</div>
        {!isCollapsed && (
          <div className={styles.profileInfo}>
            <h4 className={styles.profileName}>
              {(() => {
                const raw = educator?.fullName || educator?.name || "Educator";
                return raw.toLowerCase().startsWith("prof.") ? raw : `Prof. ${raw}`;
              })()}
            </h4>
            <span className={styles.roleBadge}>Educator</span>
          </div>
        )}
      </div>

      {/* NAVIGATION LIST */}
      <nav className={styles.navList}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* SIDEBAR FOOTER - LOGOUT */}
      <div className={styles.footerSection}>
        <button className={styles.logoutBtn} onClick={onLogout}>
          <span className={styles.logoutIcon}>🚪</span>
          {!isCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
