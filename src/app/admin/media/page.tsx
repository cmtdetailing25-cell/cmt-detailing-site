"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SitePhoto {
  id: string;
  title: string;
  caption: string | null;
  imageUrl: string;
  category: string;
  label: string | null;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
}

type UploadStatus = "pending" | "uploading" | "done" | "failed";

interface FileEntry {
  file: File;
  status: UploadStatus;
  error?: string;
}

interface EditDraft {
  title: string;
  caption: string;
  category: string;
  label: string;
  isFeatured: boolean;
  displayOrder: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "home-hero",
  "home-results",
  "interior",
  "exterior",
  "full-detail",
  "paint-enhancement",
  "paint-correction",
  "ceramic-coating",
  "before-after",
  "about",
  "other",
];

const LABEL_OPTIONS = ["before", "after", "interior", "exterior", "detail", "coating"];

const CAT_FILTERS = ["all", ...CATEGORIES];
const LABEL_FILTERS = ["all", "none", ...LABEL_OPTIONS];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function fmtCat(cat: string): string {
  return cat
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function fmtLabel(l: string): string {
  if (l === "all") return "All";
  if (l === "none") return "No Label";
  return l.charAt(0).toUpperCase() + l.slice(1);
}

// ─── StatusDot ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: UploadStatus }) {
  if (status === "uploading") {
    return (
      <svg
        className="w-3.5 h-3.5 text-yellow-400 animate-spin shrink-0"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    );
  }
  if (status === "done") {
    return (
      <svg
        className="w-3.5 h-3.5 text-green-400 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (status === "failed") {
    return (
      <svg
        className="w-3.5 h-3.5 text-red-400 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    );
  }
  // pending
  return <span className="w-2 h-2 rounded-full bg-gray-600 shrink-0 mt-0.5" />;
}

// ─── PhotoCard ────────────────────────────────────────────────────────────────

interface PhotoCardProps {
  photo: SitePhoto;
  isEditing: boolean;
  draft: EditDraft;
  saving: boolean;
  saveError: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  onChange: <K extends keyof EditDraft>(field: K, value: EditDraft[K]) => void;
}

function PhotoCard({
  photo,
  isEditing,
  draft,
  saving,
  saveError,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onChange,
}: PhotoCardProps) {
  return (
    <div
      className={`bg-gray-900 rounded-xl overflow-hidden group transition-colors ${
        isEditing ? "border-2 border-red-600/60" : "border border-gray-800"
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.imageUrl}
          alt={photo.title}
          className="w-full h-full object-cover"
        />
        {photo.isFeatured && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            FEAT
          </span>
        )}
        {!isEditing && (
          <button
            onClick={onDelete}
            className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all"
          >
            Del
          </button>
        )}
      </div>

      {/* Body */}
      {isEditing ? (
        <div className="p-3 space-y-2">
          {/* Title */}
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">
              Title
            </label>
            <input
              value={draft.title}
              onChange={(e) => onChange("title", e.target.value)}
              disabled={saving}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500 disabled:opacity-50"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">
              Caption
            </label>
            <input
              value={draft.caption}
              onChange={(e) => onChange("caption", e.target.value)}
              disabled={saving}
              placeholder="Optional"
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500 disabled:opacity-50"
            />
          </div>

          {/* Category + Label */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">
                Category
              </label>
              <select
                value={draft.category}
                onChange={(e) => onChange("category", e.target.value)}
                disabled={saving}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {fmtCat(c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">
                Label
              </label>
              <select
                value={draft.label}
                onChange={(e) => onChange("label", e.target.value)}
                disabled={saving}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
              >
                <option value="none">— none —</option>
                {LABEL_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Order + Featured */}
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">
                Order
              </label>
              <input
                type="number"
                min={0}
                value={draft.displayOrder}
                onChange={(e) =>
                  onChange("displayOrder", parseInt(e.target.value, 10) || 0)
                }
                disabled={saving}
                className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
              />
            </div>
            <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={draft.isFeatured}
                onChange={(e) => onChange("isFeatured", e.target.checked)}
                disabled={saving}
                className="w-3.5 h-3.5 accent-red-500"
              />
              <span className="text-xs text-gray-300">Featured</span>
            </label>
          </div>

          {saveError && (
            <p className="text-red-400 text-xs">{saveError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-medium py-1.5 rounded transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium py-1.5 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3">
          <p className="text-white text-sm font-medium truncate mb-0.5" title={photo.title}>
            {photo.title}
          </p>
          {photo.caption && (
            <p className="text-gray-400 text-xs truncate mb-1" title={photo.caption}>
              {photo.caption}
            </p>
          )}
          <div className="flex flex-wrap gap-1 mb-2">
            <span className="bg-gray-800 text-gray-300 text-[10px] px-1.5 py-0.5 rounded">
              {fmtCat(photo.category)}
            </span>
            {photo.label && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  photo.label === "before"
                    ? "bg-zinc-700 text-zinc-200"
                    : photo.label === "after"
                    ? "bg-blue-900/60 text-blue-300"
                    : "bg-gray-800 text-gray-300"
                }`}
              >
                {photo.label}
              </span>
            )}
            <span className="bg-gray-800 text-gray-500 text-[10px] px-1.5 py-0.5 rounded">
              #{photo.displayOrder}
            </span>
          </div>
          <button
            onClick={onEdit}
            className="w-full text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 py-1 rounded transition-colors"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEFAULT_DRAFT: EditDraft = {
  title: "",
  caption: "",
  category: "exterior",
  label: "none",
  isFeatured: false,
  displayOrder: 0,
};

export default function MediaPage() {
  // Library
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [catFilter, setCatFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState("all");

  // Bulk upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Default upload metadata
  const [defCategory, setDefCategory] = useState("exterior");
  const [defLabel, setDefLabel] = useState("none");
  const [defFeatured, setDefFeatured] = useState(false);
  const [defStartOrder, setDefStartOrder] = useState(0);

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft>(DEFAULT_DRAFT);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/media");
    const data = await res.json();
    setPhotos(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // ── Bulk upload ──────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setFileEntries(files.map((f) => ({ file: f, status: "pending" })));
    setUploadError(null);
  }

  async function handleBulkUpload() {
    if (fileEntries.length === 0 || uploading) return;
    setUploading(true);
    setUploadError(null);
    let anyFailed = false;

    for (let i = 0; i < fileEntries.length; i++) {
      setFileEntries((prev) =>
        prev.map((fe, idx) => (idx === i ? { ...fe, status: "uploading" } : fe))
      );
      try {
        const fd = new FormData();
        fd.append("file", fileEntries[i].file);
        fd.append("title", cleanFilename(fileEntries[i].file.name));
        fd.append("caption", "");
        fd.append("category", defCategory);
        fd.append("label", defLabel === "none" ? "" : defLabel);
        fd.append("isFeatured", defFeatured ? "true" : "false");
        fd.append("displayOrder", String(defStartOrder + i));

        const res = await fetch("/api/admin/media", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Upload failed");
        }
        setFileEntries((prev) =>
          prev.map((fe, idx) => (idx === i ? { ...fe, status: "done" } : fe))
        );
      } catch (err) {
        anyFailed = true;
        setFileEntries((prev) =>
          prev.map((fe, idx) =>
            idx === i
              ? {
                  ...fe,
                  status: "failed",
                  error: err instanceof Error ? err.message : "Failed",
                }
              : fe
          )
        );
      }
    }

    setUploading(false);
    if (anyFailed) setUploadError("Some files failed — see list below.");
    await fetchPhotos();
  }

  function resetUpload() {
    setFileEntries([]);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    if (res.ok) setPhotos((prev) => prev.filter((p) => p.id !== id));
    else alert("Failed to delete photo.");
  }

  // ── Edit ─────────────────────────────────────────────────────────────────

  function startEdit(photo: SitePhoto) {
    setEditingId(photo.id);
    setDraft({
      title: photo.title,
      caption: photo.caption ?? "",
      category: photo.category,
      label: photo.label ?? "none",
      isFeatured: photo.isFeatured,
      displayOrder: photo.displayOrder,
    });
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(DEFAULT_DRAFT);
    setEditError(null);
  }

  async function saveEdit(id: string) {
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          caption: draft.caption || null,
          category: draft.category,
          label: draft.label === "none" ? null : draft.label,
          isFeatured: draft.isFeatured,
          displayOrder: draft.displayOrder,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }
      const updated: SitePhoto = await res.json();
      setPhotos((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
      setDraft(DEFAULT_DRAFT);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setEditSaving(false);
    }
  }

  function updateDraft<K extends keyof EditDraft>(field: K, value: EditDraft[K]) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  // ── Filtered photos ──────────────────────────────────────────────────────

  const filtered = photos.filter((p) => {
    if (catFilter !== "all" && p.category !== catFilter) return false;
    if (labelFilter === "none" && p.label) return false;
    if (
      labelFilter !== "all" &&
      labelFilter !== "none" &&
      p.label !== labelFilter
    )
      return false;
    return true;
  });

  // ── Render ───────────────────────────────────────────────────────────────

  const doneCt = fileEntries.filter((fe) => fe.status === "done").length;
  const failedCt = fileEntries.filter((fe) => fe.status === "failed").length;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-8">Media Manager</h1>

      {/* ── Bulk Upload ───────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-5">
        <h2 className="text-base font-semibold text-white mb-4">Upload Photos</h2>

        {/* File picker */}
        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1">
            Select images — multiple files allowed
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-red-600 file:text-white hover:file:bg-red-500 cursor-pointer disabled:opacity-50"
          />
        </div>

        {/* Default metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Default Category</label>
            <select
              value={defCategory}
              onChange={(e) => setDefCategory(e.target.value)}
              disabled={uploading}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {fmtCat(c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Default Label</label>
            <select
              value={defLabel}
              onChange={(e) => setDefLabel(e.target.value)}
              disabled={uploading}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
            >
              <option value="none">— none —</option>
              {LABEL_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Starting Display Order
            </label>
            <input
              type="number"
              min={0}
              value={defStartOrder}
              onChange={(e) => setDefStartOrder(parseInt(e.target.value, 10) || 0)}
              disabled={uploading}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={defFeatured}
                onChange={(e) => setDefFeatured(e.target.checked)}
                disabled={uploading}
                className="w-4 h-4 accent-red-500"
              />
              <span className="text-sm text-gray-300">Featured by default</span>
            </label>
          </div>
        </div>

        {/* File status list */}
        {fileEntries.length > 0 && (
          <div className="mb-4 max-h-52 overflow-y-auto space-y-1 pr-1">
            {fileEntries.map((fe, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-gray-800/60"
              >
                <StatusDot status={fe.status} />
                <span className="flex-1 text-xs text-gray-300 truncate">
                  {fe.file.name}
                </span>
                <span className="text-[10px] text-gray-600 shrink-0">
                  {(fe.file.size / 1024 / 1024).toFixed(1)} MB
                </span>
                {fe.status === "failed" && fe.error && (
                  <span className="text-[10px] text-red-400 shrink-0 max-w-[100px] truncate">
                    {fe.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary line after upload finishes */}
        {!uploading && fileEntries.length > 0 && (doneCt > 0 || failedCt > 0) && (
          <p className="text-xs text-gray-500 mb-3">
            {doneCt > 0 && (
              <span className="text-green-400 font-medium">{doneCt} uploaded</span>
            )}
            {doneCt > 0 && failedCt > 0 && " · "}
            {failedCt > 0 && (
              <span className="text-red-400 font-medium">{failedCt} failed</span>
            )}
          </p>
        )}

        {uploadError && <p className="text-red-400 text-sm mb-3">{uploadError}</p>}

        <div className="flex items-center gap-3">
          <button
            onClick={handleBulkUpload}
            disabled={uploading || fileEntries.length === 0}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {uploading
              ? "Uploading…"
              : `Upload ${
                  fileEntries.length > 0
                    ? `${fileEntries.length} Photo${fileEntries.length !== 1 ? "s" : ""}`
                    : "Photos"
                }`}
          </button>
          {fileEntries.length > 0 && !uploading && (
            <button
              onClick={resetUpload}
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Before/After help ─────────────────────────────────────────────── */}
      <div className="border border-dashed border-gray-700 rounded-xl px-5 py-4 mb-8">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
          Before / After Pairs
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          To create a comparison slider on the gallery page: upload two photos,
          give them the{" "}
          <span className="text-gray-300 font-medium">exact same Title</span>, set
          one Label to{" "}
          <span className="text-gray-300 font-medium">before</span> and the other
          to <span className="text-gray-300 font-medium">after</span>. The gallery
          pairs them automatically.
        </p>
      </div>

      {/* ── Library ───────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-baseline gap-2 mb-5">
          <h2 className="text-lg font-semibold text-white">Library</h2>
          {!loading && (
            <span className="text-gray-500 text-sm">
              {filtered.length !== photos.length
                ? `${filtered.length} of ${photos.length}`
                : `${photos.length} photo${photos.length !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>

        {/* Category filter */}
        <div className="mb-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5">
            Category
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CAT_FILTERS.map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  catFilter === c
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-gray-200"
                }`}
              >
                {c === "all" ? "All" : fmtCat(c)}
              </button>
            ))}
          </div>
        </div>

        {/* Label filter */}
        <div className="mb-6">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5">
            Label
          </p>
          <div className="flex flex-wrap gap-1.5">
            {LABEL_FILTERS.map((l) => (
              <button
                key={l}
                onClick={() => setLabelFilter(l)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  labelFilter === l
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-gray-200"
                }`}
              >
                {fmtLabel(l)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {photos.length === 0
              ? "No photos yet. Upload one above."
              : "No photos match the current filters."}
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isEditing={editingId === photo.id}
                draft={draft}
                saving={editSaving}
                saveError={editingId === photo.id ? editError : null}
                onEdit={() => startEdit(photo)}
                onCancel={cancelEdit}
                onSave={() => saveEdit(photo.id)}
                onDelete={() => handleDelete(photo.id, photo.title)}
                onChange={updateDraft}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
