import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  const day = start.getDay();
  start.setDate(start.getDate() - day); // Sunday
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
  const todayEnd = endOfDay(todayStart);
  const { start: weekStart, end: weekEnd } = weekBounds();
  const { start: monthStart, end: monthEnd } = monthBounds();

  const [
    // Snapshot counts
    todayJobCount,
    unscheduledCount,
    totalClients,
    unreadNotifCount,

    // Revenue
    monthJobs,
    allTimeRevenue,

    // Recent bookings (leads)
    recentLeads,

    // This week's jobs for calendar
    weekJobs,

    // Social snapshot
    pendingDrafts,
    lastAgentRun,

    // Client activity
    recentClients,
    vipClients,

    // Top services
    allJobs,

    // Notifications
    recentNotifications,
  ] = await Promise.all([
    prisma.detailJob.count({
      where: { jobDate: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.detailJob.count({ where: { scheduleStatus: "UNSCHEDULED" } }),
    prisma.client.count(),
    prisma.adminNotification.count({ where: { isRead: false } }),

    // Revenue this month
    prisma.detailJob.findMany({
      where: { jobDate: { gte: monthStart, lte: monthEnd }, price: { not: null } },
      select: { price: true },
    }),
    prisma.detailJob.findMany({
      where: { price: { not: null } },
      select: { price: true },
    }),

    // Recent leads
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        client: { select: { id: true, fullName: true, status: true } },
      },
    }),

    // Week jobs for calendar
    prisma.detailJob.findMany({
      where: { jobDate: { gte: weekStart, lte: weekEnd } },
      orderBy: { jobDate: "asc" },
      select: {
        id: true,
        title: true,
        jobDate: true,
        scheduleStatus: true,
        serviceType: true,
        client: { select: { fullName: true } },
      },
    }),

    // Pending social drafts
    prisma.socialContentDraft.count({
      where: { status: { in: ["NEEDS_APPROVAL", "APPROVED"] } },
    }),

    // Last agent run
    prisma.socialAgentRun.findFirst({
      orderBy: { createdAt: "desc" },
      select: { status: true, createdAt: true, draftsCreated: true },
    }),

    // Recent clients
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fullName: true, status: true, city: true, createdAt: true },
    }),

    // VIP clients
    prisma.client.findMany({
      where: { isVip: true },
      take: 4,
      select: { id: true, fullName: true, city: true },
    }),

    // All jobs (for top services calc)
    prisma.detailJob.findMany({
      where: { serviceType: { not: null } },
      select: { serviceType: true, price: true },
    }),

    // Recent notifications
    prisma.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      where: { isRead: false },
    }),
  ]);

  // ── Derived stats ────────────────────────────────────────────────────────

  const monthRevenue = monthJobs.reduce((s, j) => s + (j.price ?? 0), 0);
  const totalRevenue = allTimeRevenue.reduce((s, j) => s + (j.price ?? 0), 0);
  const avgTicket = allTimeRevenue.length > 0 ? totalRevenue / allTimeRevenue.length : 0;

  // Top services by count
  const svcMap = new Map<string, { count: number; revenue: number }>();
  for (const j of allJobs) {
    if (!j.serviceType) continue;
    const cur = svcMap.get(j.serviceType) ?? { count: 0, revenue: 0 };
    svcMap.set(j.serviceType, { count: cur.count + 1, revenue: cur.revenue + (j.price ?? 0) });
  }
  const topServices = Array.from(svcMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4);

  // Build week calendar grid (Sun–Sat)
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    weekDays.push(d);
  }

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function jobsForDay(day: Date) {
    return weekJobs.filter((j) => {
      if (!j.jobDate) return false;
      const jd = new Date(j.jobDate);
      return (
        jd.getFullYear() === day.getFullYear() &&
        jd.getMonth() === day.getMonth() &&
        jd.getDate() === day.getDate()
      );
    });
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        {unreadNotifCount > 0 && (
          <div className="bg-red-600/20 border border-red-600/30 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-sm font-medium">{unreadNotifCount} unread notification{unreadNotifCount !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* ── Today's Snapshot ── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Today's Snapshot</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Today's Jobs" value={todayJobCount} color="text-white" />
          <StatCard label="Unscheduled" value={unscheduledCount} color="text-amber-400" href="/admin/jobs" />
          <StatCard label="Total Clients" value={totalClients} color="text-teal-400" href="/admin/clients" />
          <StatCard label="Month Revenue" value={fmt$(monthRevenue)} color="text-green-400" />
          <StatCard label="Pending Drafts" value={pendingDrafts} color="text-purple-400" href="/admin/social" />
          <StatCard label="Notifications" value={unreadNotifCount} color="text-red-400" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Recent Bookings ── */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-red-400 hover:text-red-300 text-xs">View all →</Link>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {recentLeads.length === 0 ? (
              <p className="text-gray-500 text-sm p-4">No bookings yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-800/60 text-gray-400 text-left">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Client</th>
                    <th className="px-4 py-2.5 font-medium">Service</th>
                    <th className="px-4 py-2.5 font-medium">Preferred</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {recentLeads.map((lead) => (
                    <tr key={lead.id} className="text-gray-300 hover:bg-gray-800/40">
                      <td className="px-4 py-2.5">
                        {lead.client ? (
                          <Link href={`/admin/clients/${lead.client.id}`} className="text-white hover:text-red-400 font-medium">
                            {lead.fullName}
                          </Link>
                        ) : (
                          <span className="font-medium">{lead.fullName}</span>
                        )}
                        <div className="text-gray-500 text-xs">{lead.town}</div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-300 text-xs">{lead.serviceRequested}</td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{lead.preferredDate}</td>
                      <td className="px-4 py-2.5">
                        <LeadStatusBadge status={lead.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* ── Notifications ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Notifications</h2>
            {unreadNotifCount > 0 && (
              <span className="bg-red-600/20 text-red-400 text-xs px-2 py-0.5 rounded-full">{unreadNotifCount}</span>
            )}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {recentNotifications.length === 0 ? (
              <p className="text-gray-500 text-sm p-4">All caught up.</p>
            ) : (
              <div className="divide-y divide-gray-800">
                {recentNotifications.map((n) => (
                  <div key={n.id} className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${notifDot(n.type)}`} />
                      <div>
                        <p className="text-white text-xs font-medium">{n.title}</p>
                        <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-gray-600 text-xs mt-1">{fmtDate(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Weekly Calendar Preview ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">This Week</h2>
          <Link href="/admin/jobs" className="text-red-400 hover:text-red-300 text-xs">All jobs →</Link>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const jobs = jobsForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div
                key={i}
                className={`bg-gray-900 border rounded-xl p-3 min-h-[90px] ${
                  isToday ? "border-red-600/50" : "border-gray-800"
                }`}
              >
                <p className={`text-xs font-semibold mb-1 ${isToday ? "text-red-400" : "text-gray-500"}`}>
                  {dayLabels[i]}
                </p>
                <p className={`text-lg font-bold mb-2 ${isToday ? "text-white" : "text-gray-400"}`}>
                  {day.getDate()}
                </p>
                {jobs.length === 0 ? (
                  <p className="text-gray-700 text-xs">—</p>
                ) : (
                  <div className="space-y-1">
                    {jobs.map((j) => (
                      <Link key={j.id} href={`/admin/jobs`}>
                        <div className="bg-red-900/30 border border-red-800/30 rounded px-1.5 py-1 text-xs text-red-300 truncate">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Financial Snapshot ── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Financial</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">This Month</p>
              <p className="text-3xl font-extrabold text-green-400">{fmt$(monthRevenue)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">All-time</p>
                <p className="text-white font-bold">{fmt$(totalRevenue)}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Avg ticket</p>
                <p className="text-white font-bold">{fmt$(avgTicket)}</p>
              </div>
            </div>
            {topServices.length > 0 && (
              <div>
                <p className="text-gray-500 text-xs mb-2">Top services</p>
                <div className="space-y-1.5">
                  {topServices.map(([svc, data]) => (
                    <div key={svc} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300 truncate max-w-[120px]">{svc}</span>
                      <span className="text-gray-500">{data.count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Social Snapshot ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Social Agent</h2>
            <Link href="/admin/social" className="text-red-400 hover:text-red-300 text-xs">Open →</Link>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Drafts pending</p>
                <p className={`text-2xl font-bold ${pendingDrafts > 0 ? "text-purple-400" : "text-gray-600"}`}>
                  {pendingDrafts}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Last run</p>
                <p className="text-white text-sm font-medium">
                  {lastAgentRun ? fmtDate(lastAgentRun.createdAt) : "Never"}
                </p>
              </div>
            </div>
            {lastAgentRun && (
              <div className="bg-gray-800/30 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Last agent run</span>
                  <AgentRunBadge status={lastAgentRun.status} />
                </div>
                <p className="text-gray-500 text-xs mt-1">{lastAgentRun.draftsCreated} draft{lastAgentRun.draftsCreated !== 1 ? "s" : ""} created</p>
              </div>
            )}
            {pendingDrafts > 0 && (
              <Link
                href="/admin/social"
                className="block w-full text-center bg-purple-700/20 hover:bg-purple-700/30 border border-purple-700/30 text-purple-300 text-xs font-medium py-2 rounded-lg transition-colors"
              >
                Review {pendingDrafts} draft{pendingDrafts !== 1 ? "s" : ""}
              </Link>
            )}
          </div>
        </section>

        {/* ── Client Activity ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Clients</h2>
            <Link href="/admin/clients" className="text-red-400 hover:text-red-300 text-xs">All clients →</Link>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {vipClients.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-800">
                <p className="text-xs text-amber-500 font-semibold mb-2">VIP</p>
                <div className="space-y-1">
                  {vipClients.map((c) => (
                    <Link
                      key={c.id}
                      href={`/admin/clients/${c.id}`}
                      className="flex items-center gap-2 text-xs text-gray-300 hover:text-white"
                    >
                      <span className="text-amber-500">★</span>
                      {c.fullName}
                      {c.city && <span className="text-gray-600">· {c.city}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 font-semibold mb-2">Recently added</p>
              <div className="space-y-2">
                {recentClients.map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/clients/${c.id}`}
                    className="flex items-center justify-between text-xs hover:text-white group"
                  >
                    <span className="text-gray-300 group-hover:text-white">{c.fullName}</span>
                    <ClientStatusBadge status={c.status} />
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

function StatCard({
  label,
  value,
  color,
  href,
}: {
  label: string;
  value: string | number;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function LeadStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    NEW: "bg-blue-900/50 text-blue-300",
    CONTACTED: "bg-yellow-900/50 text-yellow-300",
    BOOKED: "bg-green-900/50 text-green-300",
    LOST: "bg-gray-800 text-gray-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? "bg-gray-800 text-gray-400"}`}>
      {status}
    </span>
  );
}

function ClientStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    LEAD: "text-blue-400",
    ACTIVE: "text-green-400",
    MAINTENANCE: "text-teal-400",
    INACTIVE: "text-gray-500",
  };
  return <span className={`text-xs ${map[status] ?? "text-gray-400"}`}>{status}</span>;
}

function AgentRunBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: "bg-green-900/50 text-green-300",
    RUNNING: "bg-blue-900/50 text-blue-300",
    FAILED: "bg-red-900/50 text-red-300",
    PENDING: "bg-gray-800 text-gray-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? "bg-gray-800 text-gray-400"}`}>
      {status}
    </span>
  );
}

function notifDot(type: string) {
  const map: Record<string, string> = {
    NEW_BOOKING: "bg-blue-400",
    SCHEDULING_REQUIRED: "bg-amber-400",
    NEW_CLIENT: "bg-teal-400",
  };
  return map[type] ?? "bg-gray-500";
}
