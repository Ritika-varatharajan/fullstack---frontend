"use client";

import React from "react";
import styles from "./AdminSidebar.module.css";

type Props = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  admin: any;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  admin,
  onLogout,
  isCollapsed,
  onToggleCollapse,
}: Props) {
  const initial = (admin?.fullName || admin?.email || "A").charAt(0).toUpperCase();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "users", label: "Users Roster", icon: "👥" },
    { id: "assessments", label: "Assessments", icon: "📝" },
    { id: "reports", label: "Reports & Analytics", icon: "📈" },
  ];

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
      {/* BRAND HEADER */}
      <div className={styles.brandHeader}>
        <img src="/quill_logo.jpg" alt="Quill Logo" style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "cover" }} />
        {!isCollapsed && (
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Quill</span>
            <span className={styles.brandSub}>Admin</span>
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

      {/* ADMIN PROFILE SUMMARY */}
      <div className={styles.profileSection}>
        <div className={styles.avatar}>{initial}</div>
        {!isCollapsed && (
          <div className={styles.profileInfo}>
            <h4 className={styles.profileName}>
              {admin?.fullName || admin?.name || "Administrator"}
            </h4>
            <span className={styles.roleBadge}>Admin</span>
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
              <span className={styles.icon}>{item.icon}</span>
              {!isCollapsed && <span className={styles.label}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* SIDEBAR FOOTER - LOGOUT */}
      <div className={styles.bottomSection}>
        <button className={styles.logoutBtn} onClick={onLogout}>
          <span className={styles.icon}>🚪</span>
          {!isCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
