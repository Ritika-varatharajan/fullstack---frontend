"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Menu,
  Command,
  User,
  ShieldCheck,
} from "lucide-react";

export interface TopBarProps {
  activeTab: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onLogout: () => void;
  educator: any;
  onMobileMenuToggle?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  searchQuery,
  setSearchQuery,
  unreadCount,
  onOpenNotifications,
  onLogout,
  educator,
  onMobileMenuToggle,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  const getBreadcrumbTitle = (tab: string) => {
    switch (tab) {
      case "dashboard":
        return "Dashboard";
      case "assessments":
        return "My Assessments";
      case "create":
        return "Create Assessment";
      case "assign":
        return "Assignments & Delivery";
      case "students":
        return "Student Directory";
      case "results":
        return "Results & Reports";
      case "analytics":
        return "Detailed Analytics";
      default:
        return "Dashboard";
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "ED";
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="hidden sm:inline font-medium text-slate-400 dark:text-slate-500">
            Educator
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-600">/</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {getBreadcrumbTitle(activeTab)}
          </span>
        </div>
      </div>

      {/* Middle: Global Search (Command Palette input) */}
      <div className="hidden md:flex items-center relative max-w-xs w-full">
        <Search className="w-4 h-4 absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search assessments, students..."
          className="w-full pl-9 pr-12 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400"
        />
        <div className="absolute right-2.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 text-[10px] font-semibold text-slate-500 dark:text-slate-400 pointer-events-none">
          <Command className="w-2.5 h-2.5" />
          <span>K</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
          title="Toggle Dark/Light Mode"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="View notifications"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Vertical divider */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Educator Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
              {getInitials(educator?.fullName, educator?.email)}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {educator?.fullName || "Educator User"}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                {educator?.email || "educator@assessment.edu"}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700 py-2 z-20 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/60">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {educator?.fullName || "Educator Account"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {educator?.email || "educator@assessment.edu"}
                  </p>
                </div>

                <div className="py-1">
                  <div className="px-4 py-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Role: Educator / Teacher</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700/60 pt-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
