import { prisma } from "@/lib/prisma";
import Link from "next/link";
import NotificationFeed from "@/components/NotificationFeed";

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtDateTime(d: Date | string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(d: Date) {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
}

function weekBounds() {
  const start = today();
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function monthBounds() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const todayStart = today();
  const todayEnd   = endOfDay(todayStart);
  const { start: weekStart, end: weekEnd } = weekBounds();
  const { start: monthStart, end: monthEnd } = monthBounds();

  const [
    // Action required counts
    pendingReviewCount,
    needsSchedulingCount,
    unreadNotifCount,
    pendingDraftsCount,

    // Today
    todayJobCount,
    todayScheduledJobs,

    // General stats
    totalClients,

    // Revenue
    monthJobs,
    allTimeRevenue,

    // Recent bookings
    recentLeads,

    // Week jobs
    weekJobs,

    // Social
    lastAgentRun,

    // Client activity
    recentClients,
    vipClients,

    // Services breakdown
    allJobs,

    // Notifications for feed
    notifications,
  ] = await Promise.all([
    prisma.detailJob.count({ where: { scheduleStatus: "PENDING_REVIEW" } }),
    prisma.detailJob.count({ where: { scheduleStatus: "NEEDS_SCHEDULING" } }),
    prisma.adminNotification.count({ where: { isRead: false, isArchived: false } }),
    prisma.socialContentDraft.count({ where: { status: { in: ["NEEDS_APPROVAL", "APPROVED"] } } }),

    prisma.detailJob.count({ where: { scheduledStart: { gte: todayStart, lte: todayEnd } } }),
    prisma.detailJob.findMany({
      where: { scheduledStart: { gte: todayStart, lte: todayEnd } },
      orderBy: { scheduledStart: "asc" },
      select: { id: true, title: true, serviceType: true, scheduledStart: true, scheduledEnd: true, client: { select: { fullName: true } } },
    }),

    prisma.client.count(),

    prisma.detailJob.findMany({
      where: { jobDate: { gte: monthStart, lte: monthEnd }, price: { not: null } },
      select: { price: true },
    }),
    prisma.detailJob.findMany({
      where: { price: { not: null } },
      select: { price: true },
    }),

    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        client: { select: { id: true } },
        detailJobs: { select: { id: true, scheduleStatus: true }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),

    prisma.detailJob.findMany({
      where: { jobDate: { gte: weekStart, lte: weekEnd } },
      orderBy: { jobDate: "asc" },
      select: { id: true, title: true, jobDate: true, scheduleStatus: true, serviceType: true, scheduledStart: true, client: { select: { fullName: true } } },
    }),

    prisma.socialAgentRun.findFirst({
      orderBy: { createdAt: "desc" },
      select: { status: true, createdAt: true, draftsCreated: true },
    }),

    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fullName: true, status: true, city: true, createdAt: true },
    }),

    prisma.client.findMany({
      where: { isVip: true },
      take: 4,
      select: { id: true, fullName: true, city: true },
    }),

    prisma.detailJob.findMany({
      where: { serviceType: { not: null } },
      select: { serviceType: true, price: true },
    }),

    prisma.adminNotification.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const monthRevenue = monthJobs.reduce((s, j) => s + (j.price ?? 0), 0);
  const totalRevenue = allTimeRevenue.reduce((s, j) => s + (j.price ?? 0), 0);
  const avgTicket    = allTimeRevenue.length > 0 ? totalRevenue / allTimeRevenue.length : 0;

  const svcMap = new Map<string, number>();
  for (const j of allJobs) {
    if (!j.serviceType) continue;
    svcMap.set(j.serviceType, (svcMap.get(j.serviceType) ?? 0) + 1);
  }
  const topServices = Array.from(svcMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  function jobsForDay(day: Date) {
    return weekJobs.filter((j) => {
      if (!j.jobDate) return false;
      const jd = new Date(j.jobDate);
      return jd.getFullYear() === day.getFullYear() && jd.getMonth() === day.getMonth() && jd.getDate() === day.getDate();
    });
  }

  const totalActionItems = pendingReviewCount + needsSchedulingCount;
  const notificationsSerialized = notifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    actionUrl: n.actionUrl ?? null,
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e9f0ef]">Operations</h1>
          <p className="text-[#708289] text-sm mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* ── ACTION REQUIRED ── */}
      {totalActionItems > 0 && (
        <section>
          <div className="bg-gradient-to-r from-amber-950/50 to-orange-950/30 border border-amber-800/40 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-amber-300 font-bold text-sm uppercase tracking-widest">Action Required</h2>
              <span className="bg-amber-900/60 border border-amber-700/40 text-amber-300 text-xs font-bold px-2 py-0.5 rounded-full">
                {totalActionItems}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {pendingReviewCount > 0 && (
                <Link href="/admin/bookings?tab=pending">
                  <div className="bg-amber-950/60 border border-amber-800/30 rounded-xl p-4 hover:border-amber-700/50 transition-colors group">
                    <p className="text-3xl font-extrabold text-amber-300">{pendingReviewCount}</p>
                    <p className="text-amber-500/80 text-xs mt-1">Pending Review</p>
                    <p className="text-amber-600 text-[10px] mt-2 group-hover:text-amber-400 transition-colors">Review requests →</p>
                  </div>
                </Link>
              )}
              {needsSchedulingCount > 0 && (
                <Link href="/admin/bookings?tab=scheduling">
                  <div className="bg-orange-950/60 border border-orange-800/30 rounded-xl p-4 hover:border-orange-700/50 transition-colors group">
                    <p className="text-3xl font-extrabold text-orange-300">{needsSchedulingCount}</p>
                    <p className="text-orange-500/80 text-xs mt-1">Needs Scheduling</p>
                    <p className="text-orange-600 text-[10px] mt-2 group-hover:text-orange-400 transition-colors">Schedule jobs →</p>
                  </div>
                </Link>
              )}
              {unreadNotifCount > 0 && (
                <div className="bg-red-950/40 border border-red-900/30 rounded-xl p-4">
                  <p className="text-3xl font-extrabold text-red-400">{unreadNotifCount}</p>
                  <p className="text-red-600/80 text-xs mt-1">Unread Notifications</p>
                </div>
              )}
              {pendingDraftsCount > 0 && (
                <Link href="/admin/social">
                  <div className="bg-purple-950/40 border border-purple-800/30 rounded-xl p-4 hover:border-purple-700/50 transition-colors group">
                    <p className="text-3xl font-extrabold text-purple-400">{pendingDraftsCount}</p>
                    <p className="text-purple-600/80 text-xs mt-1">Drafts to Review</p>
                    <p className="text-purple-700 text-[10px] mt-2 group-hover:text-purple-400 transition-colors">Review drafts →</p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Snapshot Stats ── */}
      <section>
        <h2 className="text-[10px] font-semibold text-[#708289] uppercase tracking-widest mb-3">Today&apos;s Snapshot</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Today's Jobs"    value={todayJobCount}       color="text-white" />
          <StatCard label="Month Revenue"   value={fmt$(monthRevenue)}  color="text-green-400" />
          <StatCard label="Total Clients"   value={totalClients}        color="text-[#94b2b6]"  href="/admin/clients" />
          <StatCard label="Pending Review"  value={pendingReviewCount}  color="text-amber-400"  href="/admin/bookings" />
          <StatCard label="Needs Scheduling" value={needsSchedulingCount} color="text-orange-400" href="/admin/bookings" />
        </div>
      </section>

      {/* ── Today's Schedule ── */}
      {todayScheduledJobs.length > 0 && (
        <section>
          <h2 className="text-[10px] font-semibold text-[#708289] uppercase tracking-widest mb-3">Today&apos;s Schedule</h2>
          <div className="bg-[#1a2028] border border-[#2d3840] rounded-xl overflow-hidden">
            {todayScheduledJobs.map((job, i) => (
              <div key={job.id} className={`flex items-center gap-4 px-5 py-3.5 ${i > 0 ? "border-t border-[#2d3840]" : ""}`}>
                <div className="w-1 h-8 rounded-full bg-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[#e9f0ef] text-sm font-medium truncate">{job.serviceType ?? job.title}</p>
                  <p className="text-[#708289] text-xs">{job.client?.fullName ?? "—"}</p>
                </div>
                {job.scheduledStart && (
                  <p className="text-green-400 text-sm font-semibold shrink-0">
                    {new Date(job.scheduledStart).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    {job.scheduledEnd && (
                      <span className="text-[#708289] font-normal">
                        {" – "}
                        {new Date(job.scheduledEnd).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Main content: Recent Bookings + Notification Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Bookings */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-semibold text-[#708289] uppercase tracking-widest">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-red-400 hover:text-red-300 text-xs transition-colors">View all →</Link>
          </div>
          <div className="bg-[#1a2028] border border-[#2d3840] rounded-xl overflow-hidden">
            {recentLeads.length === 0 ? (
              <p className="text-[#434e56] text-sm p-5">No bookings yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#151b23] text-[#434e56] text-left text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Client</th>
                    <th className="px-4 py-3 font-semibold">Service</th>
                    <th className="px-4 py-3 font-semibold">Preferred</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2d3840]">
                  {recentLeads.map((lead) => {
                    const job = lead.detailJobs[0] ?? null;
                    return (
                      <tr key={lead.id} className="hover:bg-[#1e2730] transition-colors">
                        <td className="px-4 py-3">
                          {lead.client ? (
                            <Link href={`/admin/clients/${lead.client.id}`} className="text-[#e9f0ef] hover:text-red-400 font-medium transition-colors">
                              {lead.fullName}
                            </Link>
                          ) : (
                            <span className="text-[#e9f0ef] font-medium">{lead.fullName}</span>
                          )}
                          <p className="text-[#434e56] text-[10px]">{lead.town}</p>
                        </td>
                        <td className="px-4 py-3 text-[#708289] text-xs">{lead.serviceRequested}</td>
                        <td className="px-4 py-3 text-[#708289] text-xs">{lead.preferredDate}</td>
                        <td className="px-4 py-3">
                          {job?.scheduleStatus ? (
                            <JobStatusPill status={job.scheduleStatus} />
                          ) : (
                            <LeadStatusPill status={lead.status} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Notification Feed — client component */}
        <section>
          <NotificationFeed
            initialNotifications={notificationsSerialized}
            initialUnreadCount={unreadNotifCount}
          />
        </section>
      </div>

      {/* ── Weekly Calendar ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-semibold text-[#708289] uppercase tracking-widest">This Week</h2>
          <Link href="/admin/jobs" className="text-red-400 hover:text-red-300 text-xs transition-colors">All jobs →</Link>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const jobs    = jobsForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div
                key={i}
                className={`bg-[#1a2028] border rounded-xl p-2.5 min-h-[80px] ${isToday ? "border-red-600/50" : "border-[#2d3840]"}`}
              >
                <p className={`text-[10px] font-semibold mb-0.5 ${isToday ? "text-red-400" : "text-[#434e56]"}`}>{dayLabels[i]}</p>
                <p className={`text-base font-bold mb-2 ${isToday ? "text-white" : "text-[#708289]"}`}>{day.getDate()}</p>
                {jobs.length === 0 ? (
                  <p className="text-[#2d3840] text-[10px]">—</p>
                ) : (
                  <div className="space-y-1">
                    {jobs.map((j) => (
                      <Link key={j.id} href="/admin/jobs">
                        <div className={`rounded px-1.5 py-0.5 text-[9px] truncate font-medium ${
                          j.scheduleStatus === "SCHEDULED" ? "bg-green-900/40 text-green-300" :
                          j.scheduleStatus === "PENDING_REVIEW" ? "bg-amber-900/40 text-amber-300" :
                          "bg-[#2d3840] text-[#708289]"
                        }`}>
                          {j.serviceType ?? j.title}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Financial + Social + Clients ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Financial */}
        <section>
          <h2 className="text-[10px] font-semibold text-[#708289] uppercase tracking-widest mb-3">Financial</h2>
          <div className="bg-[#1a2028] border border-[#2d3840] rounded-xl p-5 space-y-4">
            <div>
              <p className="text-[#708289] text-xs mb-1">This Month</p>
              <p className="text-3xl font-extrabold text-green-400">{fmt$(monthRevenue)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#151b23] rounded-lg p-3">
                <p className="text-[#434e56] text-[10px] mb-1">All-time</p>
                <p className="text-[#e9f0ef] font-bold text-sm">{fmt$(totalRevenue)}</p>
              </div>
              <div className="bg-[#151b23] rounded-lg p-3">
                <p className="text-[#434e56] text-[10px] mb-1">Avg ticket</p>
                <p className="text-[#e9f0ef] font-bold text-sm">{fmt$(avgTicket)}</p>
              </div>
            </div>
            {topServices.length > 0 && (
              <div>
                <p className="text-[#434e56] text-[10px] uppercase tracking-widest font-semibold mb-2">Top services</p>
                <div className="space-y-1.5">
                  {topServices.map(([svc, count]) => (
                    <div key={svc} className="flex items-center justify-between text-xs">
                      <span className="text-[#708289] truncate max-w-[130px]">{svc}</span>
                      <span className="text-[#434e56]">{count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Social Agent */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-semibold text-[#708289] uppercase tracking-widest">Social Agent</h2>
            <Link href="/admin/social" className="text-red-400 hover:text-red-300 text-xs transition-colors">Open →</Link>
          </div>
          <div className="bg-[#1a2028] border border-[#2d3840] rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#151b23] rounded-lg p-3">
                <p className="text-[#434e56] text-[10px] mb-1">Drafts pending</p>
                <p className={`text-2xl font-bold ${pendingDraftsCount > 0 ? "text-purple-400" : "text-[#434e56]"}`}>
                  {pendingDraftsCount}
                </p>
              </div>
              <div className="bg-[#151b23] rounded-lg p-3">
                <p className="text-[#434e56] text-[10px] mb-1">Last run</p>
                <p className="text-[#e9f0ef] text-sm font-medium">
                  {lastAgentRun ? fmtDate(lastAgentRun.createdAt) : "Never"}
                </p>
              </div>
            </div>
            {lastAgentRun && (
              <div className="bg-[#151b23] rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-[#434e56] text-[10px]">Last run status</p>
                  <p className="text-[#708289] text-xs mt-0.5">{lastAgentRun.draftsCreated} draft{lastAgentRun.draftsCreated !== 1 ? "s" : ""} created</p>
                </div>
                <AgentRunBadge status={lastAgentRun.status} />
              </div>
            )}
            {pendingDraftsCount > 0 && (
              <Link
                href="/admin/social"
                className="block w-full text-center bg-purple-900/20 hover:bg-purple-900/30 border border-purple-800/30 text-purple-300 text-xs font-medium py-2 rounded-lg transition-colors"
              >
                Review {pendingDraftsCount} draft{pendingDraftsCount !== 1 ? "s" : ""}
              </Link>
            )}
          </div>
        </section>

        {/* Client Activity */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-semibold text-[#708289] uppercase tracking-widest">Clients</h2>
            <Link href="/admin/clients" className="text-red-400 hover:text-red-300 text-xs transition-colors">All →</Link>
          </div>
          <div className="bg-[#1a2028] border border-[#2d3840] rounded-xl overflow-hidden">
            {vipClients.length > 0 && (
              <div className="px-4 py-3 border-b border-[#2d3840]">
                <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest mb-2">VIP</p>
                <div className="space-y-1.5">
                  {vipClients.map((c) => (
                    <Link key={c.id} href={`/admin/clients/${c.id}`} className="flex items-center gap-2 text-xs text-[#708289] hover:text-[#e9f0ef] transition-colors">
                      <span className="text-amber-500">★</span>
                      {c.fullName}
                      {c.city && <span className="text-[#434e56]">· {c.city}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="px-4 py-3">
              <p className="text-[9px] text-[#434e56] font-bold uppercase tracking-widest mb-2">Recently Added</p>
              <div className="space-y-2">
                {recentClients.map((c) => (
                  <Link key={c.id} href={`/admin/clients/${c.id}`} className="flex items-center justify-between text-xs group">
                    <span className="text-[#708289] group-hover:text-[#e9f0ef] transition-colors">{c.fullName}</span>
                    <ClientStatusPill status={c.status} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color, href }: { label: string; value: string | number; color: string; href?: string }) {
  const inner = (
    <div className="bg-[#1a2028] border border-[#2d3840] rounded-xl p-4 hover:border-[#434e56] transition-colors h-full">
      <p className="text-[#434e56] text-[10px] uppercase tracking-widest font-semibold mb-1">{label}</p>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

function JobStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING_REVIEW:   "bg-amber-900/40 text-amber-300",
    NEEDS_SCHEDULING: "bg-orange-900/40 text-orange-300",
    SCHEDULED:        "bg-green-900/40 text-green-300",
    IN_PROGRESS:      "bg-blue-900/40 text-blue-300",
    COMPLETED:        "bg-teal-900/40 text-teal-300",
    CANCELLED:        "bg-gray-800 text-gray-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${map[status] ?? "bg-gray-800 text-gray-500"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function LeadStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    NEW:       "bg-blue-900/40 text-blue-300",
    CONTACTED: "bg-yellow-900/40 text-yellow-300",
    BOOKED:    "bg-green-900/40 text-green-300",
    LOST:      "bg-gray-800 text-gray-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${map[status] ?? "bg-gray-800 text-gray-400"}`}>
      {status}
    </span>
  );
}

function ClientStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    LEAD:        "text-blue-400",
    ACTIVE:      "text-green-400",
    MAINTENANCE: "text-teal-400",
    INACTIVE:    "text-[#434e56]",
  };
  return <span className={`text-[10px] ${map[status] ?? "text-[#434e56]"}`}>{status}</span>;
}

function AgentRunBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: "bg-green-900/50 text-green-300",
    RUNNING:   "bg-blue-900/50 text-blue-300",
    FAILED:    "bg-red-900/50 text-red-300",
    PENDING:   "bg-gray-800 text-gray-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${map[status] ?? "bg-gray-800 text-gray-400"}`}>
      {status}
    </span>
  );
}
