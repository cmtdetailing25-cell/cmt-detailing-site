"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import imageCompression from "browser-image-compression";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey =
  | "recent"
  | "oldest"
  | "order-asc"
  | "order-desc"
  | "title-az"
  | "title-za"
  | "featured";

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

type FileStatus =
  | "queued"
  | "compressing"
  | "compressed"
  | "already-optimized"
  | "uploading"
  | "uploaded"
  | "failed";

interface FileEntry {
  file: File;
  compressed: File | null;
  status: FileStatus;
  error?: string;
  originalSize: number;
  compressedSize?: number;
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

const CONTENT_TAGS = [
  "before", "after", "interior", "exterior", "process",
  "ceramic", "paint correction", "wheels", "final reveal",
];

interface CampaignOption { id: string; title: string; status: string; }

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent",     label: "Most Recent" },
  { value: "oldest",     label: "Oldest First" },
  { value: "order-asc",  label: "Display Order ↑" },
  { value: "order-desc", label: "Display Order ↓" },
  { value: "title-az",   label: "Title A–Z" },
  { value: "title-za",   label: "Title Z–A" },
  { value: "featured",   label: "Featured First" },
];

const CAT_FILTERS = ["all", ...CATEGORIES];
const LABEL_FILTERS = ["all", "none", ...LABEL_OPTIONS];

// Accepted MIME types (HEIC, TIFF, GIF, RAW are explicitly rejected)
const ACCEPTED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const ACCEPTED_EXT = new Set(["jpg", "jpeg", "png", "webp"]);

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

function fmtSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function savingsPct(original: number, compressed: number): number {
  return Math.round((1 - compressed / original) * 100);
}

function sortPhotos(arr: SitePhoto[], key: SortKey): SitePhoto[] {
  return [...arr].sort((a, b) => {
    switch (key) {
      case "recent":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "order-asc":
        return a.displayOrder - b.displayOrder;
      case "order-desc":
        return b.displayOrder - a.displayOrder;
      case "title-az":
        return a.title.localeCompare(b.title);
      case "title-za":
        return b.title.localeCompare(a.title);
      case "featured":
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
}

function isAcceptedType(file: File): boolean {
  const mime = file.type.toLowerCase();
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  return ACCEPTED_MIME.has(mime) || ACCEPTED_EXT.has(ext);
}

function formatRejectionReason(file: File): string {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const reasons: Record<string, string> = {
    heic: "HEIC not supported — convert to JPG first",
    heif: "HEIF not supported — convert to JPG first",
    tiff: "TIFF not supported",
    tif: "TIFF not supported",
    gif: "GIF not supported",
    raw: "RAW not supported — convert to JPG first",
    cr2: "RAW not supported",
    nef: "RAW not supported",
    dng: "RAW not supported",
    arw: "RAW not supported",
  };
  return reasons[ext] ?? `Unsupported format (.${ext || file.type})`;
}

// ─── StatusDot ────────────────────────────────────────────────────────────────

function Spinner({ color }: { color: string }) {
  return (
    <svg className={`w-3.5 h-3.5 ${color} animate-spin shrink-0`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function StatusDot({ status }: { status: FileStatus }) {
  switch (status) {
    case "queued":
      return <span className="w-2 h-2 rounded-full bg-gray-600 shrink-0 mt-0.5" />;
    case "compressing":
      return <Spinner color="text-yellow-400" />;
    case "compressed":
      return <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-0.5" />;
    case "already-optimized":
      return <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0 mt-0.5" />;
    case "uploading":
      return <Spinner color="text-blue-400" />;
    case "uploaded":
      return (
        <svg className="w-3.5 h-3.5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case "failed":
      return (
        <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
  }
}

function StatusLabel({ status }: { status: FileStatus }) {
  const map: Record<FileStatus, { text: string; cls: string }> = {
    queued:          { text: "Queued",           cls: "text-gray-500" },
    compressing:     { text: "Compressing…",     cls: "text-yellow-400" },
    compressed:      { text: "Compressed",       cls: "text-blue-400" },
    "already-optimized": { text: "Already optimized", cls: "text-gray-400" },
    uploading:       { text: "Uploading…",       cls: "text-blue-400" },
    uploaded:        { text: "Uploaded",         cls: "text-green-400" },
    failed:          { text: "Failed",           cls: "text-red-400" },
  };
  const { text, cls } = map[status];
  return <span className={`text-[10px] font-medium shrink-0 ${cls}`}>{text}</span>;
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
  selecting: boolean;
  selected: boolean;
  onSelect: (v: boolean) => void;
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
  selecting,
  selected,
  onSelect,
}: PhotoCardProps) {
  return (
    <div
      onClick={selecting ? () => onSelect(!selected) : undefined}
      className={`bg-gray-900 rounded-xl overflow-hidden group transition-all ${
        selecting ? "cursor-pointer" : ""
      } ${
        selected
          ? "border-2 border-red-500 ring-1 ring-red-500/40"
          : isEditing
          ? "border-2 border-red-600/60"
          : "border border-gray-800"
      }`}
    >
      <div className="relative aspect-square bg-gray-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover" />
        {selecting && (
          <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none" />
        )}
        {selecting && (
          <div
            className={`absolute top-2 left-2 z-20 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              selected ? "bg-red-600 border-red-600" : "bg-black/60 border-gray-400"
            }`}
          >
            {selected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
        {!selecting && photo.isFeatured && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            FEAT
          </span>
        )}
        {!selecting && !isEditing && (
          <button
            onClick={onDelete}
            className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all"
          >
            Del
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="p-3 space-y-2">
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">Title</label>
            <input
              value={draft.title}
              onChange={(e) => onChange("title", e.target.value)}
              disabled={saving}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">Caption</label>
            <input
              value={draft.caption}
              onChange={(e) => onChange("caption", e.target.value)}
              disabled={saving}
              placeholder="Optional"
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500 disabled:opacity-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">Category</label>
              <select
                value={draft.category}
                onChange={(e) => onChange("category", e.target.value)}
                disabled={saving}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{fmtCat(c)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">Label</label>
              <select
                value={draft.label}
                onChange={(e) => onChange("label", e.target.value)}
                disabled={saving}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
              >
                <option value="none">— none —</option>
                {LABEL_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">Order</label>
              <input
                type="number"
                min={0}
                value={draft.displayOrder}
                onChange={(e) => onChange("displayOrder", parseInt(e.target.value, 10) || 0)}
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
          {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
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
          {!selecting && (
            <button
              onClick={onEdit}
              className="w-full text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 py-1 rounded transition-colors"
            >
              Edit
            </button>
          )}
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

// 10 % savings threshold — below this we call it "already optimized"
const SAVINGS_THRESHOLD = 0.10;

export default function MediaPage() {
  // Library
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters + sort
  const [catFilter, setCatFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("recent");

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

  // Multi-select + campaign assignment
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

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

  // Restore filter/sort preferences from localStorage on mount
  useEffect(() => {
    const cat  = localStorage.getItem("cmt_media_cat");
    const lbl  = localStorage.getItem("cmt_media_label");
    const sort = localStorage.getItem("cmt_media_sort");
    if (cat) setCatFilter(cat);
    if (lbl) setLabelFilter(lbl);
    if (sort && SORT_OPTIONS.some((o) => o.value === sort)) setSortBy(sort as SortKey);
  }, []);

  function handleSetCat(value: string) {
    setCatFilter(value);
    localStorage.setItem("cmt_media_cat", value);
  }

  function handleSetLabel(value: string) {
    setLabelFilter(value);
    localStorage.setItem("cmt_media_label", value);
  }

  function handleSetSort(value: SortKey) {
    setSortBy(value);
    localStorage.setItem("cmt_media_sort", value);
  }

  // ── File selection ───────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setUploadError(null);
    setFileEntries(
      files.map((f) => {
        if (!isAcceptedType(f)) {
          return {
            file: f,
            compressed: null,
            status: "failed" as FileStatus,
            error: formatRejectionReason(f),
            originalSize: f.size,
          };
        }
        return {
          file: f,
          compressed: null,
          status: "queued" as FileStatus,
          originalSize: f.size,
        };
      })
    );
  }

  // ── Bulk compress + upload ───────────────────────────────────────────────

  async function handleBulkUpload() {
    if (uploading) return;
    const processable = fileEntries.filter((fe) => fe.status !== "failed");
    if (processable.length === 0) {
      setUploadError("No supported files to upload.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    let anyFailed = false;

    for (let i = 0; i < fileEntries.length; i++) {
      // Skip files already failed at selection (unsupported format)
      if (fileEntries[i].status === "failed") continue;

      const originalFile = fileEntries[i].file;
      const originalSize = fileEntries[i].originalSize;

      // ── Step 1: Compress ──────────────────────────────────────────────

      setFileEntries((prev) =>
        prev.map((fe, idx) => (idx === i ? { ...fe, status: "compressing" } : fe))
      );

      let fileToUpload: File;
      let compressedSize: number;
      let newStatus: FileStatus;

      try {
        const result = await imageCompression(originalFile, {
          maxWidthOrHeight: 2000,
          initialQuality: 0.82,
          fileType: "image/webp",
          useWebWorker: true,
        });

        if (result.size >= originalSize) {
          // Compression made it larger — upload original to avoid degradation
          fileToUpload = originalFile;
          compressedSize = originalSize;
          newStatus = "already-optimized";
        } else {
          const pct = (originalSize - result.size) / originalSize;
          newStatus = pct < SAVINGS_THRESHOLD ? "already-optimized" : "compressed";

          // Rename to .webp so Vercel Blob gets a clean URL
          const webpName = originalFile.name.replace(/\.[^.]+$/, ".webp");
          fileToUpload = new File([result], webpName, { type: "image/webp" });
          compressedSize = result.size;
        }

        setFileEntries((prev) =>
          prev.map((fe, idx) =>
            idx === i
              ? { ...fe, status: newStatus, compressed: fileToUpload, compressedSize }
              : fe
          )
        );
      } catch {
        anyFailed = true;
        setFileEntries((prev) =>
          prev.map((fe, idx) =>
            idx === i ? { ...fe, status: "failed", error: "Compression failed" } : fe
          )
        );
        continue;
      }

      // ── Step 2: Upload ────────────────────────────────────────────────

      setFileEntries((prev) =>
        prev.map((fe, idx) => (idx === i ? { ...fe, status: "uploading" } : fe))
      );

      try {
        const fd = new FormData();
        fd.append("file", fileToUpload);
        fd.append("title", cleanFilename(originalFile.name));
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
          prev.map((fe, idx) => (idx === i ? { ...fe, status: "uploaded" } : fe))
        );
      } catch (err) {
        anyFailed = true;
        setFileEntries((prev) =>
          prev.map((fe, idx) =>
            idx === i
              ? {
                  ...fe,
                  status: "failed",
                  error: err instanceof Error ? err.message : "Upload failed",
                }
              : fe
          )
        );
      }
    }

    setUploading(false);
    if (anyFailed) setUploadError("Some files failed — see details below.");
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

  // ── Multi-select + assign ────────────────────────────────────────────────

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const res = await fetch("/api/admin/automation/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns ?? []);
    } catch {
      // non-fatal
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  function toggleSelectMode() {
    setSelecting((v) => {
      if (v) setSelectedIds(new Set());
      return !v;
    });
    setAssignSuccess(null);
  }

  function handleSelect(id: string, v: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (v) next.add(id); else next.delete(id);
      return next;
    });
  }

  async function handleAssign() {
    if (!assignTarget || selectedIds.size === 0) return;
    setAssigning(true);
    setAssignError(null);
    try {
      const res = await fetch(`/api/admin/automation/campaigns/${assignTarget}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sitePhotoIds: Array.from(selectedIds), role: "general" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Assignment failed");
      }
      const campaignTitle = campaigns.find((c) => c.id === assignTarget)?.title ?? "campaign";
      setShowAssignModal(false);
      setSelecting(false);
      setSelectedIds(new Set());
      setAssignTarget("");
      setAssignSuccess(`${selectedIds.size} photo${selectedIds.size !== 1 ? "s" : ""} assigned to "${campaignTitle}"`);
      setTimeout(() => setAssignSuccess(null), 4000);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setAssigning(false);
    }
  }

  // ── Computed values ──────────────────────────────────────────────────────

  const filtered = photos.filter((p) => {
    if (catFilter !== "all" && p.category !== catFilter) return false;
    if (labelFilter === "none" && p.label) return false;
    if (labelFilter !== "all" && labelFilter !== "none" && p.label !== labelFilter) return false;
    return true;
  });

  const displayed = sortPhotos(filtered, sortBy);

  const uploadedCt = fileEntries.filter((fe) => fe.status === "uploaded").length;
  const failedCt = fileEntries.filter((fe) => fe.status === "failed").length;
  const optimizedCt = fileEntries.filter(
    (fe) =>
      fe.status === "uploaded" &&
      fe.compressedSize !== undefined &&
      fe.compressedSize < fe.originalSize * (1 - SAVINGS_THRESHOLD)
  ).length;
  const showSummary = !uploading && fileEntries.length > 0 && (uploadedCt > 0 || failedCt > 0);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-8">Media Manager</h1>

      {/* ── Bulk Upload ───────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-5">
        <h2 className="text-base font-semibold text-white mb-4">Upload Photos</h2>

        {/* Auto-optimization info card */}
        <div className="flex items-start gap-2.5 bg-blue-950/25 border border-blue-800/30 rounded-lg px-4 py-3 mb-4">
          <svg
            className="w-4 h-4 text-blue-400 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-xs text-blue-300/80 leading-relaxed">
            Images are automatically optimized before upload for faster loading, better SEO, and
            smoother galleries.
          </p>
        </div>

        {/* File picker */}
        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1">
            Select images — multiple files allowed (JPG, PNG, WebP)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
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
                <option key={c} value={c}>{fmtCat(c)}</option>
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
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Starting Display Order</label>
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
          <div className="mb-4 max-h-64 overflow-y-auto space-y-1 pr-1">
            {fileEntries.map((fe, i) => {
              const hasCompression =
                fe.compressedSize !== undefined && fe.compressedSize < fe.originalSize;
              const pct = hasCompression
                ? savingsPct(fe.originalSize, fe.compressedSize!)
                : 0;

              return (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-800/60"
                >
                  <StatusDot status={fe.status} />

                  {/* Filename */}
                  <span className="flex-1 text-xs text-gray-300 truncate min-w-0">
                    {fe.file.name}
                  </span>

                  {/* Size info */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-gray-500">{fmtSize(fe.originalSize)}</span>

                    {hasCompression && (
                      <>
                        <span className="text-[10px] text-gray-700">→</span>
                        <span className="text-[10px] text-green-400 font-medium">
                          {fmtSize(fe.compressedSize!)}
                        </span>
                        <span className="text-[10px] text-green-500 font-semibold">
                          -{pct}%
                        </span>
                      </>
                    )}
                  </div>

                  {/* Status label */}
                  <StatusLabel status={fe.status} />

                  {/* Error text */}
                  {fe.status === "failed" && fe.error && (
                    <span className="text-[10px] text-red-400 shrink-0 max-w-[120px] truncate" title={fe.error}>
                      {fe.error}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary after upload */}
        {showSummary && (
          <p className="text-xs text-gray-500 mb-3 flex flex-wrap gap-x-2">
            {uploadedCt > 0 && (
              <span className="text-green-400 font-medium">{uploadedCt} uploaded</span>
            )}
            {failedCt > 0 && (
              <span className="text-red-400 font-medium">{failedCt} failed</span>
            )}
            {optimizedCt > 0 && (
              <span className="text-blue-400 font-medium">{optimizedCt} optimized</span>
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
              ? "Processing…"
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
          To create a comparison slider on the gallery page: upload two photos, give them the{" "}
          <span className="text-gray-300 font-medium">exact same Title</span>, set one Label to{" "}
          <span className="text-gray-300 font-medium">before</span> and the other to{" "}
          <span className="text-gray-300 font-medium">after</span>. The gallery pairs them automatically.
        </p>
      </div>

      {/* ── Library ───────────────────────────────────────────────────────── */}
      <div>
        {assignSuccess && (
          <div className="mb-4 flex items-center gap-2 bg-green-950/40 border border-green-700/40 rounded-lg px-4 py-2.5">
            <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-green-300">{assignSuccess}</span>
          </div>
        )}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-baseline gap-2 flex-1">
            <h2 className="text-lg font-semibold text-white">Library</h2>
            {!loading && (
              <span className="text-gray-500 text-sm">
                {filtered.length !== photos.length
                  ? `${filtered.length} of ${photos.length}`
                  : `${photos.length} photo${photos.length !== 1 ? "s" : ""}`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleSelectMode}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selecting
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:text-white border border-gray-700"
              }`}
            >
              {selecting
                ? `Cancel${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`
                : "Select"}
            </button>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest whitespace-nowrap">
              Sort
            </label>
            <select
              value={sortBy}
              onChange={(e) => handleSetSort(e.target.value as SortKey)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 min-w-[148px]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category filter */}
        <div className="mb-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5">Category</p>
          <div className="flex flex-wrap gap-1.5">
            {CAT_FILTERS.map((c) => (
              <button
                key={c}
                onClick={() => handleSetCat(c)}
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
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5">Label</p>
          <div className="flex flex-wrap gap-1.5">
            {LABEL_FILTERS.map((l) => (
              <button
                key={l}
                onClick={() => handleSetLabel(l)}
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
            {displayed.map((photo) => (
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
                selecting={selecting}
                selected={selectedIds.has(photo.id)}
                onSelect={(v) => handleSelect(photo.id, v)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Floating selection bar ────────────────────────────────────────── */}
      {selecting && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 border border-gray-600 rounded-xl px-5 py-3 shadow-2xl">
          <span className="text-sm text-white font-medium">
            {selectedIds.size} photo{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => { setShowAssignModal(true); fetchCampaigns(); }}
            className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            Assign to Campaign
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Campaign picker modal ─────────────────────────────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-white font-semibold text-base mb-1">
              Assign to Campaign
            </h3>
            <p className="text-gray-400 text-xs mb-4">
              {selectedIds.size} photo{selectedIds.size !== 1 ? "s" : ""} will be added as General media.
              You can set roles in Campaign Detail.
            </p>
            {campaignsLoading ? (
              <p className="text-gray-500 text-sm mb-4">Loading campaigns…</p>
            ) : campaigns.length === 0 ? (
              <p className="text-gray-500 text-sm mb-4">No campaigns found.</p>
            ) : (
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1.5">Select Campaign</label>
                <select
                  value={assignTarget}
                  onChange={(e) => setAssignTarget(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">— choose a campaign —</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} · {c.status.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {assignError && <p className="text-red-400 text-xs mb-3">{assignError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleAssign}
                disabled={!assignTarget || assigning || campaignsLoading}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                {assigning ? "Assigning…" : "Assign"}
              </button>
              <button
                onClick={() => { setShowAssignModal(false); setAssignError(null); }}
                disabled={assigning}
                className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
