"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ScheduleJobModal from "@/components/ScheduleJobModal";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DetailJobSummary {
  id:             string;
  title:          string;
  scheduleStatus: string | null;
  jobDate:        string | null;
  scheduledStart: string | null;
  scheduledEnd:   string | null;
  location:       string | null;
}

interface BookingRequest {
  id:               string;
  fullName:         string;
  email:            string;
  phone:            string;
  vehicleYear:      string;
  vehicleMake:      string;
  vehicleModel:     string;
  serviceRequested: string;
  preferredDate:    string;
  preferredTime:    string;
  vehicleCondition: string | null;
  notes:            string | null;
  town:             string;
  status:           string;
  createdAt:        string;
  client:           { id: string; fullName: string; status: string; isVip: boolean } | null;
  detailJobs:       DetailJobSummary[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const JOB_STATUS_BADGE: Record<string, string> = {
  PENDING_REVIEW:   "bg-amber-900/40 text-amber-300 border border-amber-800/40",
  NEEDS_SCHEDULING: "bg-orange-900/40 text-orange-300 border border-orange-800/40",
  SCHEDULED:        "bg-green-900/40 text-green-300 border border-green-800/40",
  IN_PROGRESS:      "bg-blue-900/40 text-blue-300 border border-blue-800/40",
  COMPLETED:        "bg-teal-900/40 text-teal-300 border border-teal-800/40",
  CANCELLED:        "bg-gray-800 text-gray-500 border border-transparent",
};

const LEAD_STATUS_BADGE: Record<string, string> = {
  NEW:       "text-blue-400",
  CONTACTED: "text-yellow-400",
  BOOKED:    "text-green-400",
  LOST:      "text-gray-500",
};

type Tab = "all" | "pending" | "scheduling" | "scheduled" | "declined";

const TABS: { key: Tab; label: string; jobStatuses?: string[]; leadStatus?: string }[] = [
  { key: "all",        label: "All" },
  { key: "pending",    label: "Pending Review",   jobStatuses: ["PENDING_REVIEW"] },
  { key: "scheduling", label: "Needs Scheduling", jobStatuses: ["NEEDS_SCHEDULING"] },
  { key: "scheduled",  label: "Scheduled",        jobStatuses: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
  { key: "declined",   label: "Declined",         leadStatus:  "LOST" },
];

// ── Booking Row ───────────────────────────────────────────────────────────────

function BookingRow({
  req,
  onAction,
  onSchedule,
}: {
  req: BookingRequest;
  onAction: (id: string, action: "review" | "decline") => Promise<void>;
  onSchedule: (req: BookingRequest) => void;
}) {
  const job       = req.detailJobs[0] ?? null;
  const jobStatus = job?.scheduleStatus ?? null;
  const [busy, setBusy] = useState(false);

  async function act(action: "review" | "decline") {
    setBusy(true);
    await onAction(req.id, action);
    setBusy(false);
  }

  return (
    <div className="bg-[#1a2028] border border-[#2d3840] rounded-xl p-5 hover:border-[#434e56] transition-colors">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[#e9f0ef] font-semibold text-sm">{req.fullName}</p>
            {req.client?.isVip && (
              <span className="text-[9px] bg-amber-900/40 text-amber-400 border border-amber-800/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">VIP</span>
            )}
            <span className={`text-[10px] font-medium ${LEAD_STATUS_BADGE[req.status] ?? "text-gray-400"}`}>
              {req.status}
            </span>
          </div>
          <p className="text-[#708289] text-xs mt-0.5">{req.email} · {req.phone}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
          {jobStatus && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${JOB_STATUS_BADGE[jobStatus] ?? "bg-gray-800 text-gray-500"}`}>
              {jobStatus.replace(/_/g, " ")}
            </span>
          )}
          <span className="text-[#434e56] text-[10px]">{fmtDate(req.createdAt)}</span>
        </div>
      </div>

      {/* Service + Vehicle grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 mb-3 text-xs">
        <div>
          <p className="text-[#434e56] uppercase tracking-wider text-[9px] font-semibold">Service</p>
          <p className="text-[#e9f0ef] mt-0.5">{req.serviceRequested}</p>
        </div>
        <div>
          <p className="text-[#434e56] uppercase tracking-wider text-[9px] font-semibold">Vehicle</p>
          <p className="text-[#e9f0ef] mt-0.5">{req.vehicleYear} {req.vehicleMake} {req.vehicleModel}</p>
        </div>
        <div>
          <p className="text-[#434e56] uppercase tracking-wider text-[9px] font-semibold">Requested</p>
          <p className="text-[#94b2b6] mt-0.5">{req.preferredDate} · {req.preferredTime}</p>
        </div>
        <div>
          <p className="text-[#434e56] uppercase tracking-wider text-[9px] font-semibold">Town</p>
          <p className="text-[#e9f0ef] mt-0.5">{req.town}</p>
        </div>
        {req.vehicleCondition && (
          <div>
            <p className="text-[#434e56] uppercase tracking-wider text-[9px] font-semibold">Condition</p>
            <p className="text-[#e9f0ef] mt-0.5">{req.vehicleCondition}</p>
          </div>
        )}
        {job?.scheduledStart && (
          <div>
            <p className="text-[#434e56] uppercase tracking-wider text-[9px] font-semibold">Scheduled For</p>
            <p className="text-green-400 mt-0.5 font-medium">{fmtDateTime(job.scheduledStart)}</p>
          </div>
        )}
      </div>

      {/* Customer notes */}
      {req.notes && (
        <div className="mb-3 bg-[#151b23] border border-[#2d3840] rounded-lg px-3 py-2">
          <p className="text-[9px] text-[#434e56] uppercase tracking-wider font-semibold mb-0.5">Customer Notes</p>
          <p className="text-[#708289] text-xs">{req.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#2d3840] mt-3">
        {/* Primary workflow actions */}
        {jobStatus === "PENDING_REVIEW" && (
          <>
            <button
              onClick={() => act("review")}
              disabled={busy}
              className="text-xs bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-[#434e56] text-[#151b23] disabled:text-[#708289] font-bold px-3.5 py-1.5 rounded-lg transition-colors"
            >
              {busy ? "…" : "Mark Reviewed"}
            </button>
            <button
              onClick={() => act("decline")}
              disabled={busy}
              className="text-xs text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-700/50 px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Decline
            </button>
          </>
        )}

        {jobStatus === "NEEDS_SCHEDULING" && (
          <>
            <button
              onClick={() => onSchedule(req)}
              className="text-xs bg-green-900/30 hover:bg-green-900/50 text-green-300 border border-green-800/40 font-semibold px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Schedule Job
            </button>
            <button
              onClick={() => act("decline")}
              disabled={busy}
              className="text-xs text-[#708289] hover:text-red-400 px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Decline
            </button>
          </>
        )}

        {jobStatus === "SCHEDULED" && (
          <span className="text-xs text-green-400 font-medium px-1">
            ✓ Confirmed {job?.scheduledStart ? `· ${fmtDateTime(job.scheduledStart)}` : ""}
          </span>
        )}

        {(jobStatus === "CANCELLED" || req.status === "LOST") && (
          <span className="text-xs text-[#434e56] px-1">Declined</span>
        )}

        {/* Entity links */}
        <div className="ml-auto flex items-center gap-1.5">
          {req.client && (
            <Link
              href={`/admin/clients/${req.client.id}`}
              className="text-[10px] text-[#708289] hover:text-[#94b2b6] border border-[#2d3840] hover:border-[#434e56] px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Open Client →
            </Link>
          )}
          {job && (
            <Link
              href={`/admin/jobs/${job.id}`}
              className="text-[10px] text-[#708289] hover:text-[#94b2b6] border border-[#2d3840] hover:border-[#434e56] px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Open Job →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const [requests,   setRequests]   = useState<BookingRequest[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState<Tab>("all");
  const [scheduling, setScheduling] = useState<BookingRequest | null>(null);
  const [search,     setSearch]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/bookings");
    const data = await res.json();
    if (res.ok) setRequests(data.leads ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAction(id: string, action: "review" | "decline") {
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
  }

  function countFor(tab: Tab): number {
    const tabDef = TABS.find((t) => t.key === tab)!;
    if (tab === "all") return requests.length;
    return requests.filter((r) => {
      const job = r.detailJobs[0] ?? null;
      if (tabDef.leadStatus)  return r.status === tabDef.leadStatus;
      if (tabDef.jobStatuses) return !!job && tabDef.jobStatuses.includes(job.scheduleStatus ?? "");
      return true;
    }).length;
  }

  const filtered = requests.filter((r) => {
    const job    = r.detailJobs[0] ?? null;
    const tabDef = TABS.find((t) => t.key === activeTab)!;
    const matchTab =
      activeTab === "all"  ? true :
      tabDef.leadStatus    ? r.status === tabDef.leadStatus :
      tabDef.jobStatuses   ? (!!job && tabDef.jobStatuses.includes(job.scheduleStatus ?? "")) :
      true;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.fullName.toLowerCase().includes(q) ||
      r.serviceRequested.toLowerCase().includes(q) ||
      r.vehicleMake.toLowerCase().includes(q) ||
      r.vehicleModel.toLowerCase().includes(q) ||
      r.town.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const pendingCount    = countFor("pending");
  const schedulingCount = countFor("scheduling");
  const actionCount     = pendingCount + schedulingCount;

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#e9f0ef]">Booking Requests</h1>
          <p className="text-[#708289] text-sm mt-1">
            Review incoming requests, schedule jobs, and manage your intake queue.
          </p>
        </div>
        {actionCount > 0 && (
          <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl px-4 py-2.5 flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 text-sm font-semibold">{actionCount} need attention</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {TABS.map((t) => {
          const count = countFor(t.key);
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === t.key
                  ? "bg-[#94b2b6] text-[#151b23]"
                  : "bg-[#1a2028] border border-[#2d3840] text-[#708289] hover:text-[#e9f0ef] hover:border-[#434e56]"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === t.key ? "bg-[#151b23]/30 text-[#151b23]" : "bg-[#2d3840] text-[#94b2b6]"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#434e56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, service, vehicle, town…"
          className="w-full bg-[#1a2028] border border-[#2d3840] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#e9f0ef] placeholder-[#434e56] focus:outline-none focus:border-[#708289] transition-colors"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-[#434e56] text-sm">Loading requests…</div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-[#2d3840] rounded-xl px-6 py-16 text-center">
          <p className="text-[#434e56] text-sm">
            {requests.length === 0
              ? "No booking requests yet — they'll appear here when customers submit the public form."
              : "No requests match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <BookingRow
              key={req.id}
              req={req}
              onAction={handleAction}
              onSchedule={setScheduling}
            />
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-[10px] text-[#434e56] mt-4">
          {filtered.length} of {requests.length} request{requests.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Schedule modal */}
      {scheduling && (
        <ScheduleJobModal
          leadId={scheduling.id}
          jobId={scheduling.detailJobs[0]?.id ?? null}
          jobTitle={
            scheduling.detailJobs[0]?.title ??
            `${scheduling.serviceRequested} — ${scheduling.vehicleYear} ${scheduling.vehicleMake} ${scheduling.vehicleModel}`
          }
          defaultDate={scheduling.preferredDate}
          defaultTime={scheduling.preferredTime}
          onClose={() => setScheduling(null)}
          onScheduled={load}
        />
      )}
    </div>
  );
}
