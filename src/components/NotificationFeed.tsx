"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id:         string;
  type:       string;
  title:      string;
  message:    string;
  isRead:     boolean;
  isArchived: boolean;
  actionUrl:  string | null;
  createdAt:  string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const TYPE_CONFIG: Record<string, { dot: string; icon: string }> = {
  NEW_BOOKING:       { dot: "bg-blue-400",   icon: "📋" },
  PENDING_REVIEW:    { dot: "bg-amber-400",  icon: "⏳" },
  NEW_CLIENT:        { dot: "bg-teal-400",   icon: "👤" },
  JOB_SCHEDULED:     { dot: "bg-green-400",  icon: "📅" },
  SCHEDULING_REQUIRED: { dot: "bg-orange-400", icon: "🗓" },
};

function cfg(type: string) {
  return TYPE_CONFIG[type] ?? { dot: "bg-gray-500", icon: "🔔" };
}

export default function NotificationFeed({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: Notification[];
  initialUnreadCount: number;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount,   setUnreadCount]   = useState(initialUnreadCount);
  const [loading,       setLoading]       = useState(false);

  const refresh = useCallback(async () => {
    const res  = await fetch("/api/admin/notifications?take=20");
    const data = await res.json();
    if (res.ok) {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }
  }, []);

  useEffect(() => { /* initial data already passed as props */ }, []);

  async function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch(`/api/admin/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
  }

  async function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => {
      const n = notifications.find((x) => x.id === id);
      return n && !n.isRead ? Math.max(0, c - 1) : c;
    });
    await fetch(`/api/admin/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true, isRead: true }),
    });
  }

  async function markAllRead() {
    setLoading(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/admin/notifications", { method: "PATCH" });
    setLoading(false);
  }

  async function handleClick(n: Notification) {
    if (!n.isRead) await markRead(n.id);
    if (n.actionUrl) router.push(n.actionUrl);
  }

  const visible = notifications.filter((n) => !n.isArchived);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-[#708289] uppercase tracking-widest">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={loading}
            className="text-[10px] text-[#708289] hover:text-[#94b2b6] transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Feed */}
      <div className="bg-[#1a2028] border border-[#2d3840] rounded-xl overflow-hidden">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="w-8 h-8 rounded-full bg-[#2d3840] flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-[#708289]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[#708289] text-xs font-medium">All caught up</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2d3840] max-h-[380px] overflow-y-auto">
            {visible.map((n) => (
              <div
                key={n.id}
                className={`relative group px-4 py-3 transition-colors ${
                  n.actionUrl
                    ? "cursor-pointer hover:bg-[#242d38]"
                    : "hover:bg-[#1e2730]"
                } ${!n.isRead ? "bg-[#1e2730]" : ""}`}
                onClick={() => n.actionUrl && handleClick(n)}
              >
                {/* Unread bar */}
                {!n.isRead && (
                  <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 rounded-r" />
                )}

                <div className="flex items-start gap-2.5 pr-6">
                  {/* Type dot */}
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${cfg(n.type).dot}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`text-xs font-semibold truncate ${n.isRead ? "text-[#e9f0ef]/70" : "text-[#e9f0ef]"}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-[#434e56] shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-[#708289] mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                    {n.actionUrl && (
                      <p className="text-[10px] text-[#94b2b6] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        View →
                      </p>
                    )}
                  </div>
                </div>

                {/* Dismiss button */}
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                  className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#434e56] hover:text-[#708289] p-0.5"
                  title="Dismiss"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
