"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobDetail {
  id: string;
  title: string;
  slug: string | null;
  serviceType: string | null;
  jobDate: string | null;
  location: string | null;
  description: string | null;
  internalNotes: string | null;
  socialSummary: string | null;
  isSocialReady: boolean;
  isFeatured: boolean;
  createdAt: string;
  client: { id: string; fullName: string; phone: string | null; email: string | null; isVip: boolean } | null;
  vehicle: { id: string; year: string; make: string; model: string; color: string | null; trim: string | null } | null;
  photos: {
    id: string; imageUrl: string; title: string;
    isSocialReady: boolean; isPostCandidate: boolean; isReelCandidate: boolean;
    isBeforeAfterCandidate: boolean; marketingScore: number; qualityScore: number;
  }[];
  socialDrafts: { id: string; type: string; status: string; title: string; generatedAt: string | null }[];
}

const SERVICE_TYPES = [
  "Full Detail", "Exterior Detail", "Interior Detail", "Ceramic Coating",
  "Paint Correction", "Maintenance Wash", "Window Tint", "PPF", "Other",
];

const DRAFT_STATUS: Record<string, { label: string; cls: string }> = {
  NEEDS_APPROVAL: { label: "Needs Approval", cls: "bg-yellow-900/40 text-yellow-400" },
  APPROVED:       { label: "Approved",       cls: "bg-green-900/40 text-green-400" },
  DRAFT:          { label: "Draft",          cls: "bg-gray-800 text-gray-400" },
  ARCHIVED:       { label: "Archived",       cls: "bg-gray-900 text-gray-600" },
  POSTED:         { label: "Posted",         cls: "bg-green-900/60 text-green-300" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [job, setJob]           = useState<JobDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<JobDetail>>({});
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/jobs/${params.id}`);
    if (!res.ok) { router.push("/admin/jobs"); return; }
    const data = await res.json();
    setJob(data);
    setEditForm(data);
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!job) return;
    setSaving(true);
    const res = await fetch(`/api/admin/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title, serviceType: editForm.serviceType,
        jobDate: editForm.jobDate, location: editForm.location,
        description: editForm.description, internalNotes: editForm.internalNotes,
        socialSummary: editForm.socialSummary,
        isSocialReady: editForm.isSocialReady, isFeatured: editForm.isFeatured,
      }),
    });
    const data = await res.json();
    setJob((prev) => prev ? { ...prev, ...data } : prev);
    setEditMode(false);
    setSaving(false);
  }

  async function handleDelete() {
    if (!job || !confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/jobs/${job.id}`, { method: "DELETE" });
    router.push("/admin/jobs");
  }

  if (loading) return <div className="p-6 text-sm text-gray-600">Loading job…</div>;
  if (!job) return null;

  return (
    <div className="p-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-5">
        <Link href="/admin/jobs" className="hover:text-gray-300 transition-colors">Jobs</Link>
        <span>/</span>
        {job.client && (
          <>
            <Link href={`/admin/clients/${job.client.id}`} className="hover:text-gray-300 transition-colors">
              {job.client.fullName}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-400 truncate max-w-xs">{job.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {job.isSocialReady && (
              <span className="text-[10px] bg-green-900/40 text-green-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Social Ready</span>
            )}
            {job.isFeatured && (
              <span className="text-[10px] bg-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Featured</span>
            )}
            {job.serviceType && (
              <span className="text-[10px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">{job.serviceType}</span>
            )}
          </div>
          <h1 className="text-xl font-bold text-white">{job.title}</h1>
          {job.jobDate && (
            <p className="text-sm text-gray-500 mt-1">
              {new Date(job.jobDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              {job.location && ` · ${job.location}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setEditMode(!editMode)}
            className="text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-600 px-3 py-2 rounded-lg transition-colors"
          >
            {editMode ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-500 hover:text-red-400 border border-red-900/40 hover:border-red-800 px-3 py-2 rounded-lg transition-colors"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Photos",       value: job.photos.length },
          { label: "Social Drafts", value: job.socialDrafts.length },
          { label: "Social Ready", value: job.photos.filter((p) => p.isSocialReady).length, sub: "photos" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: info */}
        <div className="space-y-5">
          {/* Client + Vehicle card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3">Assignment</p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-gray-600 mb-1">Client</p>
                {job.client ? (
                  <Link href={`/admin/clients/${job.client.id}`} className="group">
                    <p className="text-sm text-white group-hover:text-[#94b2b6] transition-colors flex items-center gap-1.5">
                      {job.client.fullName}
                      {job.client.isVip && <span className="text-[9px] bg-yellow-900/40 text-yellow-400 px-1 py-0.5 rounded font-bold">VIP</span>}
                    </p>
                    {job.client.phone && <p className="text-xs text-gray-600">{job.client.phone}</p>}
                  </Link>
                ) : (
                  <p className="text-xs text-gray-700">Not assigned</p>
                )}
              </div>
              <div>
                <p className="text-[10px] text-gray-600 mb-1">Vehicle</p>
                {job.vehicle ? (
                  <p className="text-sm text-white">
                    {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                    {job.vehicle.color && <span className="text-gray-500"> · {job.vehicle.color}</span>}
                    {job.vehicle.trim  && <span className="text-gray-600"> · {job.vehicle.trim}</span>}
                  </p>
                ) : (
                  <p className="text-xs text-gray-700">Not assigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Edit / details card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3">Details</p>
            {editMode ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-600 mb-1">Title</label>
                  <input
                    value={editForm.title ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#94b2b6]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-1">Service Type</label>
                  <select
                    value={editForm.serviceType ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, serviceType: e.target.value || null }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#94b2b6]"
                  >
                    <option value="">None</option>
                    {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={editForm.jobDate ? editForm.jobDate.slice(0, 10) : ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, jobDate: e.target.value || null }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#94b2b6]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-1">Location</label>
                  <input
                    value={editForm.location ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#94b2b6]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editForm.description ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#94b2b6] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-1">Internal Notes</label>
                  <textarea
                    rows={2}
                    value={editForm.internalNotes ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, internalNotes: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#94b2b6] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-1">Social Summary</label>
                  <textarea
                    rows={2}
                    value={editForm.socialSummary ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, socialSummary: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#94b2b6] resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isSocialReady ?? false}
                      onChange={(e) => setEditForm((f) => ({ ...f, isSocialReady: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-400">Social ready</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isFeatured ?? false}
                      onChange={(e) => setEditForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-400">Featured</span>
                  </label>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-gray-700 text-[#151b23] text-xs font-bold py-2 rounded-lg transition-colors"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { label: "Service",  value: job.serviceType },
                  { label: "Location", value: job.location },
                  { label: "Description", value: job.description },
                  { label: "Internal Notes", value: job.internalNotes },
                  { label: "Social Summary", value: job.socialSummary },
                ].map(({ label, value }) => value ? (
                  <div key={label}>
                    <p className="text-[10px] text-gray-600">{label}</p>
                    <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{value}</p>
                  </div>
                ) : null)}
              </div>
            )}
          </div>

          {/* Social Drafts */}
          {job.socialDrafts.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">Social Drafts</p>
                <Link href="/admin/social#drafts" className="text-xs text-[#94b2b6] hover:text-white transition-colors">
                  View all →
                </Link>
              </div>
              <div className="space-y-2">
                {job.socialDrafts.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-white truncate">{d.title}</p>
                      <p className="text-[10px] text-gray-600">{d.type}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${(DRAFT_STATUS[d.status] ?? DRAFT_STATUS.DRAFT).cls}`}>
                      {(DRAFT_STATUS[d.status] ?? DRAFT_STATUS.DRAFT).label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: photo grid */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
              Photos ({job.photos.length})
            </p>
            <Link
              href={`/admin/media/import?jobId=${job.id}`}
              className="text-xs bg-[#94b2b6] hover:bg-[#7a9ea3] text-[#151b23] font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              + Upload Photos
            </Link>
          </div>

          {job.photos.length === 0 ? (
            <div className="border border-dashed border-gray-800 rounded-xl p-10 flex flex-col items-center text-center gap-3">
              <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-500">No photos yet</p>
              <Link
                href={`/admin/media/import?jobId=${job.id}`}
                className="text-xs text-[#94b2b6] hover:text-white transition-colors"
              >
                Upload photos for this job →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {job.photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-1.5 left-1.5 flex gap-1 flex-wrap">
                    {photo.isSocialReady && (
                      <span className="text-[9px] bg-green-600/90 text-white px-1.5 py-0.5 rounded font-bold">Social</span>
                    )}
                    {photo.isBeforeAfterCandidate && (
                      <span className="text-[9px] bg-purple-600/90 text-white px-1.5 py-0.5 rounded font-bold">B/A</span>
                    )}
                  </div>
                  {photo.marketingScore > 0 && (
                    <div className="absolute bottom-1.5 right-1.5">
                      <span className="text-[9px] bg-black/70 text-gray-300 px-1.5 py-0.5 rounded font-semibold">
                        {photo.marketingScore}/10
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
