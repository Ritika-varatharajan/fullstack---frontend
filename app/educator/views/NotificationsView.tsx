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
  Clock,
  Inbox,
  Filter,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Card, CardContent } from "@/app/components/ui/Card";
import { Modal } from "@/app/components/ui/Modal";
import { EmptyState } from "@/app/components/ui/EmptyState";

export interface NotificationItem {
  id: string;
  type: "completion" | "overdue" | "assignment";
  title: string;
  message: string;
  time: string;
  isRead?: boolean;
  details?: string;
}

export interface NotificationsViewProps {
  notificationsList: NotificationItem[];
  onDismissNotification: (id: string) => void;
  onClearAll: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notificationsList,
  onDismissNotification,
  onClearAll,
  onNavigateTab,
}) => {
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "read">("all");
  const [readIds, setReadIds] = useState<string[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  const handleMarkAllRead = () => {
    const allIds = notificationsList.map((n) => n.id);
    setReadIds(allIds);
  };

  const toggleReadStatus = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      setReadIds((prev) => [...prev, id]);
    }
  };

  const handleViewDetails = (item: NotificationItem) => {
    markAsRead(item.id);
    setSelectedNotif(item);
  };

  // Filtered Notifications List
  const filteredList = useMemo(() => {
    if (filterTab === "unread") {
      return notificationsList.filter((n) => !readIds.includes(n.id));
    }
    if (filterTab === "read") {
      return notificationsList.filter((n) => readIds.includes(n.id));
    }
    return notificationsList;
  }, [notificationsList, filterTab, readIds]);

  const unreadCount = useMemo(() => {
    return notificationsList.filter((n) => !readIds.includes(n.id)).length;
  }, [notificationsList, readIds]);

  const readCount = useMemo(() => {
    return notificationsList.filter((n) => readIds.includes(n.id)).length;
  }, [notificationsList, readIds]);

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    if (type === "completion") {
      return (
        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      );
    }
    if (type === "overdue") {
      return (
        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center justify-center shrink-0">
        <UserCheck className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-indigo-600" />
            Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track test submissions, overdue deadlines, and student delivery events
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notificationsList.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<CheckCheck className="w-3.5 h-3.5 text-indigo-600" />}
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={onClearAll}
              >
                Clear All
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filter Tabs: ALL vs UNREAD vs READ */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setFilterTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            filterTab === "all"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <span>All Notifications</span>
          <Badge variant="slate" size="sm" className="bg-white/20 text-current border-none">
            {notificationsList.length}
          </Badge>
        </button>

        <button
          onClick={() => setFilterTab("unread")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            filterTab === "unread"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <span>Unread</span>
          <Badge variant="rose" size="sm">
            {unreadCount}
          </Badge>
        </button>

        <button
          onClick={() => setFilterTab("read")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            filterTab === "read"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <span>Marked as Read</span>
          <Badge variant="emerald" size="sm">
            {readCount}
          </Badge>
        </button>
      </div>

      {/* Main Notifications List */}
      {filteredList.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-8 h-8 text-indigo-500" />}
          title={
            filterTab === "unread"
              ? "No unread notifications"
              : filterTab === "read"
              ? "No read notifications found"
              : "No notifications available"
          }
          description={
            filterTab === "unread"
              ? "You are all caught up! Switch to 'All Notifications' or 'Marked as Read' to view past alerts."
              : "No activity records matching your current filter tab."
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredList.map((item) => {
            const isRead = readIds.includes(item.id);
            return (
              <Card
                key={item.id}
                onClick={() => handleViewDetails(item)}
                className={`transition-all duration-150 cursor-pointer group hover:border-indigo-300 ${
                  !isRead
                    ? "bg-white dark:bg-slate-800 border-l-4 border-l-indigo-600 shadow-2xs"
                    : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 opacity-80"
                }`}
              >
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    {getNotificationIcon(item.type)}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </h4>
                        {!isRead ? (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                        ) : (
                          <Badge variant="emerald" size="sm">
                            Read ✓
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-slate-400 block pt-1">
                        ⏱️ {item.time}
                      </span>
                    </div>
                  </div>

                  {/* Actions: View Details, Toggle Read, Cancel/Cross Dismiss */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleViewDetails(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="View Notification Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => toggleReadStatus(item.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title={isRead ? "Mark as unread" : "Mark as read"}
                    >
                      <CheckCheck className={`w-4 h-4 ${isRead ? "text-emerald-600 font-bold" : ""}`} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismissNotification(item.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Dismiss Notification (✕)"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* VIEW NOTIFICATION DETAILS MODAL */}
      <Modal
        isOpen={Boolean(selectedNotif)}
        onClose={() => setSelectedNotif(null)}
        title="Notification Details"
        description="Full activity alert overview"
        maxWidth="md"
      >
        {selectedNotif && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {getNotificationIcon(selectedNotif.type)}
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedNotif.title}
                </h4>
                <span className="text-[10px] text-slate-400">
                  Received: {selectedNotif.time}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-semibold text-slate-400 block">Notification Message:</span>
              <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
                {selectedNotif.message}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleReadStatus(selectedNotif.id)}
              >
                {readIds.includes(selectedNotif.id) ? "Mark as Unread" : "Mark as Read ✓"}
              </Button>

              <div className="flex items-center gap-2">
                {selectedNotif.type === "completion" && onNavigateTab && (
                  <Button
                    variant="teal"
                    size="sm"
                    onClick={() => {
                      setSelectedNotif(null);
                      onNavigateTab("results");
                    }}
                  >
                    View Results Tab →
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedNotif(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
