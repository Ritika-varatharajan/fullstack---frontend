"use client";

import React, { useState, useMemo } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  CheckCheck,
  Trash2,
  X,
  Eye,
  Inbox,
  ShieldCheck,
  Award,
  FileText,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Card, CardContent } from "@/app/components/ui/Card";
import { Modal } from "@/app/components/ui/Modal";
import { EmptyState } from "@/app/components/ui/EmptyState";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  isRead?: boolean;
  details?: string;
}

export interface NotificationsViewProps {
  notificationsList: NotificationItem[];
  onDismissNotification: (id: string) => void;
  onClearAll?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notificationsList,
  onDismissNotification,
  onClearAll,
  onNavigateTab,
}) => {
  const [filterTab, setFilterTab] = useState<"unread" | "read">("unread");
  const [readIds, setReadIds] = useState<string[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  const handleMarkAllRead = () => {
    const allIds = notificationsList.map((n) => n.id);
    setReadIds(allIds);
  };

  const markAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!readIds.includes(id)) {
      setReadIds((prev) => [...prev, id]);
    }
  };

  const markAsUnread = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReadIds((prev) => prev.filter((i) => i !== id));
  };

  const handleViewDetails = (item: NotificationItem) => {
    markAsRead(item.id);
    setSelectedNotif(item);
  };

  // Strictly split into Unread list vs Read list
  const unreadList = useMemo(() => {
    return notificationsList.filter((n) => !readIds.includes(n.id));
  }, [notificationsList, readIds]);

  const readList = useMemo(() => {
    return notificationsList.filter((n) => readIds.includes(n.id));
  }, [notificationsList, readIds]);

  const displayedList = filterTab === "unread" ? unreadList : readList;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "completion":
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-2 border-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        );
      case "overdue":
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-2 border-rose-500 flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      case "result":
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-2 border-amber-500 flex items-center justify-center shrink-0 shadow-sm">
            <Award className="w-5 h-5" />
          </div>
        );
      case "system":
        return (
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400 border-2 border-sky-500 flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border-2 border-orange-500 flex items-center justify-center shrink-0 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* HEADER & TOP CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-orange-400 shadow-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-orange-500" />
            Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Manage test completions, overdue alerts, and system notifications
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {unreadList.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="border-2 border-orange-400 text-orange-700 hover:bg-orange-50 font-semibold"
              leftIcon={<CheckCheck className="w-4 h-4 text-orange-600" />}
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </Button>
          )}

          {notificationsList.length > 0 && onClearAll && (
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:bg-rose-50 font-semibold"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={onClearAll}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* FILTER TABS: UNREAD VS MARKED AS READ */}
      <div className="flex items-center gap-3 border-b-2 border-orange-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setFilterTab("unread")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2.5 ${
            filterTab === "unread"
              ? "bg-orange-500 text-white shadow-md border-2 border-orange-600"
              : "bg-white text-slate-700 border-2 border-slate-200 hover:border-orange-300 hover:bg-orange-50"
          }`}
        >
          <span>Unread / Active</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
              filterTab === "unread"
                ? "bg-white text-orange-600"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {unreadList.length}
          </span>
        </button>

        <button
          onClick={() => setFilterTab("read")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2.5 ${
            filterTab === "read"
              ? "bg-teal-600 text-white shadow-md border-2 border-teal-700"
              : "bg-white text-slate-700 border-2 border-slate-200 hover:border-teal-300 hover:bg-teal-50"
          }`}
        >
          <span>Marked as Read</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
              filterTab === "read"
                ? "bg-white text-teal-700"
                : "bg-teal-100 text-teal-700"
            }`}
          >
            {readList.length}
          </span>
        </button>
      </div>

      {/* NOTIFICATIONS LIST */}
      {displayedList.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border-2 border-orange-300 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 mx-auto flex items-center justify-center mb-3">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {filterTab === "unread"
              ? "🎉 You're all caught up!"
              : "No read notifications"}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {filterTab === "unread"
              ? "There are no unread notifications right now. Check the 'Marked as Read' tab to view past alerts."
              : "Notifications you mark as read will appear here in the read section."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {displayedList.map((item) => {
            const isRead = readIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => handleViewDetails(item)}
                className={`p-4 rounded-2xl border-2 transition-all duration-150 cursor-pointer flex items-start justify-between gap-4 shadow-sm hover:shadow-md ${
                  filterTab === "unread"
                    ? "bg-white dark:bg-slate-800 border-orange-400 hover:border-orange-500"
                    : "bg-slate-50 dark:bg-slate-900/60 border-teal-400 opacity-90"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {getNotificationIcon(item.type)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      {!isRead ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                      ) : (
                        <span className="bg-teal-100 text-teal-800 font-bold text-[11px] px-2 py-0.5 rounded-full border border-teal-300">
                          Read ✓
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {item.message}
                    </p>
                    <span className="text-xs text-slate-500 block pt-0.5 font-semibold">
                      ⏱️ {item.time}
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div
                  className="flex items-center gap-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {filterTab === "unread" ? (
                    <button
                      onClick={(e) => markAsRead(item.id, e)}
                      className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs border border-orange-300 transition-colors flex items-center gap-1.5"
                      title="Mark as read (Moves to Read section)"
                    >
                      <CheckCheck className="w-4 h-4 text-orange-600" />
                      <span>Mark as read</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => markAsUnread(item.id, e)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-colors flex items-center gap-1.5"
                      title="Move back to unread"
                    >
                      <span>Mark as unread</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismissNotification(item.id);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                    title="Dismiss Notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL OVERVIEW MODAL */}
      <Modal
        isOpen={Boolean(selectedNotif)}
        onClose={() => setSelectedNotif(null)}
        title="Notification Overview"
        description="Detailed activity information"
        maxWidth="md"
      >
        {selectedNotif && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-orange-50 border-2 border-orange-300">
              {getNotificationIcon(selectedNotif.type)}
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  {selectedNotif.title}
                </h4>
                <span className="text-xs text-slate-500 font-semibold">
                  Timestamp: {selectedNotif.time}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-500 block">Message Details:</span>
              <p className="text-slate-800 text-sm leading-relaxed font-medium">
                {selectedNotif.message}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (readIds.includes(selectedNotif.id)) {
                    markAsUnread(selectedNotif.id);
                  } else {
                    markAsRead(selectedNotif.id);
                  }
                }}
              >
                {readIds.includes(selectedNotif.id)
                  ? "Move to Unread"
                  : "Mark as Read ✓"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedNotif(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
