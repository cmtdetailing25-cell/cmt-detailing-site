"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobRow {
  id: string;
  title: string;
  serviceType: string | null;
  jobDate: string | null;
  isSocialReady: boolean;
  isFeatured: boolean;
  createdAt: string;
  client: { id: string; fullName: string; isVip: boolean } | null;
  vehicle: { id: string; year: string; make: string; model: string; color: string | null } | null;
  _count: { photos: number; socialDrafts: number };
}

const SERVICE_TYPES = [
  "Full Detail",
  "Exterior Detail",
  "Interior Detail",
  "Ceramic Coating",
  "Paint Correction",
  "Maintenance Wash",
  "Window Tint",
  "PPF",
  "Other",
];

// ─── Create Job Modal ─────────────────────────────────────────────────────────

function CreateJobModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (j: JobRow) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    serviceType: "",
    jobDate: new Date().toISOString().slice(0, 10),
    location: "Taunton, MA",
    description: "",
    isSocialReady: false,
    isFeatured: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); setSaving(false); return; }
      onCreated(data);
      onClose();
    } catch {
      setError("Network error");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-white font-semibold text-base mb-5">New Detail Job</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Service Type</label>
              <select
                value={form.serviceType}
                onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]"
              >
                <option value="">Select…</option>
                {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={form.jobDate}
                onChange={(e) => setForm((f) => ({ ...f, jobDate: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Job Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. 2026-05-15 Black BMW X5 Exterior Detail"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6] placeholder-gray-700"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Notes</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6] resize-none"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isSocialReady}
                onChange={(e) => setForm((f) => ({ ...f, isSocialReady: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-400">Social ready</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-400">Featured</span>
            </label>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-gray-700 text-[#151b23] text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
            >
              {saving ? "Saving…" : "Create Job"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const [jobs, setJobs]               = useState<JobRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [socialFilter, setSocialFilter]   = useState<"all" | "social">("all");
  const [showCreate, setShowCreate]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/jobs");
    const data = await res.json();
    setJobs(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = jobs.filter((j) => {
    const q           = search.toLowerCase();
    const matchSearch = !q ||
      j.title.toLowerCase().includes(q) ||
      j.client?.fullName.toLowerCase().includes(q) ||
      j.vehicle?.make.toLowerCase().includes(q) ||
      j.vehicle?.model.toLowerCase().includes(q) ||
      j.serviceType?.toLowerCase().includes(q) || false;
    const matchService = serviceFilter === "all" || j.serviceType === serviceFilter;
    const matchSocial  = socialFilter  === "all" || j.isSocialReady;
    return matchSearch && matchService && matchSocial;
  });

  const socialReadyCount = jobs.filter((j) => j.isSocialReady).length;
  const totalPhotos      = jobs.reduce((s, j) => s + j._count.photos, 0);

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Detail Jobs</h1>
          <p className="text-gray-400 text-sm">
            All detailing sessions — clients, vehicles, media, and social content.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/media/import"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 px-4 py-2.5 rounded-lg transition-colors"
          >
            Import Media
          </Link>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#94b2b6] hover:bg-[#7a9ea3] text-[#151b23] text-sm font-bold px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Job
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Jobs",    value: jobs.length },
          { label: "Social Ready",  value: socialReadyCount, accent: "text-green-400" },
          { label: "Total Photos",  value: totalPhotos },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.accent ?? "text-white"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs, clients, vehicles…"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#94b2b6]"
          />
        </div>
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-400 focus:outline-none focus:border-[#94b2b6]"
        >
          <option value="all">All services</option>
          {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex gap-1.5">
          {(["all", "social"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSocialFilter(f)}
              className={`text-xs px-3 py-2 rounded-lg transition-colors ${
                socialFilter === f
                  ? "bg-[#94b2b6] text-[#151b23] font-bold"
                  : "bg-gray-900 border border-gray-800 text-gray-500 hover:text-white"
              }`}
            >
              {f === "all" ? "All" : "Social Ready"}
            </button>
          ))}
        </div>
      </div>

      {/* Job list */}
      {loading ? (
        <div className="text-sm text-gray-600 py-12 text-center">Loading jobs…</div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-gray-800 rounded-xl px-6 py-16 flex flex-col items-center text-center gap-3">
          <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-medium text-gray-500">
            {jobs.length === 0 ? "No jobs yet" : "No jobs match your filters"}
          </p>
          {jobs.length === 0 && (
            <div className="flex gap-3">
              <Link href="/admin/media/import" className="text-xs text-[#94b2b6] hover:text-white transition-colors">
                Import media with a job →
              </Link>
              <span className="text-xs text-gray-700">or</span>
              <button onClick={() => setShowCreate(true)} className="text-xs text-gray-500 hover:text-white transition-colors">
                Create manually
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/60">
                <th className="text-left text-[10px] text-gray-600 uppercase tracking-widest font-semibold px-4 py-3">Job</th>
                <th className="text-left text-[10px] text-gray-600 uppercase tracking-widest font-semibold px-4 py-3 hidden md:table-cell">Client</th>
                <th className="text-left text-[10px] text-gray-600 uppercase tracking-widest font-semibold px-4 py-3 hidden lg:table-cell">Vehicle</th>
                <th className="text-left text-[10px] text-gray-600 uppercase tracking-widest font-semibold px-4 py-3 hidden sm:table-cell">Date</th>
                <th className="text-right text-[10px] text-gray-600 uppercase tracking-widest font-semibold px-4 py-3">Media</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job, idx) => (
                <tr
                  key={job.id}
                  className={`border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors ${idx % 2 === 0 ? "bg-gray-900/20" : ""}`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/admin/jobs/${job.id}`} className="group">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {job.isSocialReady && (
                          <span className="text-[9px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Social ✓</span>
                        )}
                        {job.isFeatured && (
                          <span className="text-[9px] bg-yellow-900/40 text-yellow-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Featured</span>
                        )}
                      </div>
                      <p className="text-sm text-white font-medium group-hover:text-[#94b2b6] transition-colors">
                        {job.title}
                      </p>
                      {job.serviceType && (
                        <p className="text-xs text-gray-600 mt-0.5">{job.serviceType}</p>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {job.client ? (
                      <Link href={`/admin/clients/${job.client.id}`} className="group">
                        <p className="text-xs text-gray-400 group-hover:text-[#94b2b6] transition-colors flex items-center gap-1">
                          {job.client.fullName}
                          {job.client.isVip && (
                            <span className="text-[9px] bg-yellow-900/40 text-yellow-400 px-1 py-0.5 rounded font-bold">VIP</span>
                          )}
                        </p>
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-700">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {job.vehicle ? (
                      <p className="text-xs text-gray-400">
                        {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                        {job.vehicle.color && <span className="text-gray-600"> · {job.vehicle.color}</span>}
                      </p>
                    ) : (
                      <span className="text-xs text-gray-700">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-xs text-gray-400">
                      {job.jobDate
                        ? new Date(job.jobDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-semibold text-white">{job._count.photos}</p>
                    {job._count.socialDrafts > 0 && (
                      <p className="text-[10px] text-gray-600">{job._count.socialDrafts} draft{job._count.socialDrafts !== 1 ? "s" : ""}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-700 mt-3">
          {filtered.length} of {jobs.length} job{jobs.length !== 1 ? "s" : ""}
        </p>
      )}

      {showCreate && (
        <CreateJobModal
          onClose={() => setShowCreate(false)}
          onCreated={(j) => setJobs((prev) => [j, ...prev])}
        />
      )}
    </div>
  );
}
