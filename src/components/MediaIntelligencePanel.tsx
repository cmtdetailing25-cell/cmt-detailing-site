"use client";

import { useState, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PhotoIntelligence {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  label: string | null;
  caption: string | null;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
  socialTitle: string | null;
  socialNotes: string | null;
  contentScore: number;
  qualityScore: number;
  marketingScore: number;
  isSocialReady: boolean;
  isReelCandidate: boolean;
  isPostCandidate: boolean;
  isBeforeAfterCandidate: boolean;
  isFavoriteForSocial: boolean;
  contentTags: string[];
  serviceType: string | null;
  visualCategory: string | null;
  contentAngle: string | null;
  seasonalRelevance: string | null;
  lastReviewedForSocial: string | null;
  reviewedByAgent: boolean;
}

type FilterKey =
  | "all"
  | "social-ready"
  | "reel"
  | "post"
  | "before-after"
  | "favorites"
  | "needs-review";

type SortKey =
  | "recent"
  | "content-score"
  | "quality-score"
  | "marketing-score"
  | "favorites-first"
  | "needs-review-first";

interface FormState {
  socialTitle: string;
  socialNotes: string;
  contentScore: number;
  qualityScore: number;
  marketingScore: number;
  isSocialReady: boolean;
  isReelCandidate: boolean;
  isPostCandidate: boolean;
  isBeforeAfterCandidate: boolean;
  isFavoriteForSocial: boolean;
  serviceType: string;
  visualCategory: string;
  contentAngle: string;
  seasonalRelevance: string;
  contentTagsStr: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Media" },
  { key: "social-ready", label: "Social Ready" },
  { key: "reel", label: "Reel Candidates" },
  { key: "post", label: "Post Candidates" },
  { key: "before-after", label: "Before/After" },
  { key: "favorites", label: "Favorites" },
  { key: "needs-review", label: "Needs Review" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Most Recent" },
  { key: "content-score", label: "Highest Content Score" },
  { key: "quality-score", label: "Highest Quality Score" },
  { key: "marketing-score", label: "Highest Marketing Score" },
  { key: "favorites-first", label: "Favorites First" },
  { key: "needs-review-first", label: "Needs Review First" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function needsReview(p: PhotoIntelligence): boolean {
  return (
    !p.isSocialReady &&
    !p.reviewedByAgent &&
    p.contentScore === 0 &&
    p.qualityScore === 0 &&
    p.marketingScore === 0
  );
}

function applyFilter(photos: PhotoIntelligence[], f: FilterKey): PhotoIntelligence[] {
  switch (f) {
    case "all":          return photos;
    case "social-ready": return photos.filter((p) => p.isSocialReady);
    case "reel":         return photos.filter((p) => p.isReelCandidate);
    case "post":         return photos.filter((p) => p.isPostCandidate);
    case "before-after": return photos.filter((p) => p.isBeforeAfterCandidate);
    case "favorites":    return photos.filter((p) => p.isFavoriteForSocial);
    case "needs-review": return photos.filter(needsReview);
  }
}

function applySort(photos: PhotoIntelligence[], s: SortKey): PhotoIntelligence[] {
  return [...photos].sort((a, b) => {
    switch (s) {
      case "recent":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "content-score":
        return b.contentScore - a.contentScore;
      case "quality-score":
        return b.qualityScore - a.qualityScore;
      case "marketing-score":
        return b.marketingScore - a.marketingScore;
      case "favorites-first": {
        if (a.isFavoriteForSocial !== b.isFavoriteForSocial)
          return a.isFavoriteForSocial ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      case "needs-review-first": {
        const aNR = needsReview(a);
        const bNR = needsReview(b);
        if (aNR !== bNR) return aNR ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    }
  });
}

function scoreColor(n: number): string {
  if (n === 0) return "text-gray-600";
  if (n <= 3)  return "text-red-400";
  if (n <= 6)  return "text-yellow-400";
  return "text-green-400";
}

function photoToForm(p: PhotoIntelligence): FormState {
  return {
    socialTitle:           p.socialTitle ?? "",
    socialNotes:           p.socialNotes ?? "",
    contentScore:          p.contentScore,
    qualityScore:          p.qualityScore,
    marketingScore:        p.marketingScore,
    isSocialReady:         p.isSocialReady,
    isReelCandidate:       p.isReelCandidate,
    isPostCandidate:       p.isPostCandidate,
    isBeforeAfterCandidate: p.isBeforeAfterCandidate,
    isFavoriteForSocial:   p.isFavoriteForSocial,
    serviceType:           p.serviceType ?? "",
    visualCategory:        p.visualCategory ?? "",
    contentAngle:          p.contentAngle ?? "",
    seasonalRelevance:     p.seasonalRelevance ?? "",
    contentTagsStr:        p.contentTags.join(", "),
  };
}

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
        checked ? "bg-gray-700/50" : "bg-gray-800/40"
      }`}
    >
      <div
        className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${
          checked ? "bg-red-600" : "bg-gray-700"
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-150 ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
      <span className="text-sm text-gray-300">{label}</span>
      {checked && (
        <span className="ml-auto text-[10px] font-semibold text-green-400">ON</span>
      )}
    </button>
  );
}

// ─── ScoreInput ──────────────────────────────────────────────────────────────

function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-gray-500">{label}</label>
        <span className={`text-sm font-bold tabular-nums ${scoreColor(value)}`}>
          {value}/10
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-red-500"
      />
    </div>
  );
}

// ─── PhotoCard ───────────────────────────────────────────────────────────────

function PhotoCard({
  photo,
  onEdit,
}: {
  photo: PhotoIntelligence;
  onEdit: () => void;
}) {
  const hasScore =
    photo.contentScore > 0 || photo.qualityScore > 0 || photo.marketingScore > 0;
  const reviewed = photo.isSocialReady || photo.reviewedByAgent || hasScore;

  return (
    <div className="group relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
      {/* Image */}
      <div className="relative aspect-[3/2] overflow-hidden bg-gray-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.imageUrl}
          alt={photo.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Top-left badges */}
        <div className="absolute top-1.5 left-1.5 flex gap-1 flex-wrap">
          {photo.isFeatured && (
            <span className="bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
              FEAT
            </span>
          )}
          {photo.isFavoriteForSocial && (
            <span className="bg-amber-500/90 text-black text-[8px] font-bold px-1.5 py-0.5 rounded">
              ★
            </span>
          )}
          {!reviewed && (
            <span className="bg-gray-900/80 text-gray-400 text-[8px] font-semibold px-1.5 py-0.5 rounded">
              REVIEW
            </span>
          )}
        </div>
        {/* Edit hover overlay */}
        <button
          onClick={onEdit}
          className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-colors"
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow">
            Edit Intelligence
          </span>
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-white text-xs font-semibold truncate mb-0.5">
          {photo.socialTitle || photo.title}
        </p>
        <p className="text-gray-600 text-[10px] truncate mb-2">
          {photo.category}
          {photo.label ? ` · ${photo.label}` : ""}
        </p>

        {/* Scores row */}
        <div className="flex items-center gap-3 mb-2">
          {[
            { label: "C", value: photo.contentScore },
            { label: "Q", value: photo.qualityScore },
            { label: "M", value: photo.marketingScore },
          ].map((s) => (
            <span key={s.label} className="text-[10px] font-mono">
              <span className="text-gray-700">{s.label}:</span>
              <span className={scoreColor(s.value)}>{s.value}</span>
            </span>
          ))}
        </div>

        {/* Candidate badges */}
        <div className="flex flex-wrap gap-1">
          {photo.isSocialReady && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-green-900/30 text-green-400">
              Ready
            </span>
          )}
          {photo.isReelCandidate && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-violet-900/30 text-violet-400">
              Reel
            </span>
          )}
          {photo.isPostCandidate && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-400">
              Post
            </span>
          )}
          {photo.isBeforeAfterCandidate && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-orange-900/30 text-orange-400">
              B/A
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EditModal ───────────────────────────────────────────────────────────────

function EditModal({
  photo,
  form,
  setForm,
  saving,
  onSave,
  onClose,
}: {
  photo: PhotoIntelligence;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal card */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-snug">
                {photo.title}
              </p>
              <p className="text-gray-500 text-[11px]">
                {photo.category}
                {photo.label ? ` · ${photo.label}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white transition-colors p-1 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">

          {/* Identity */}
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3">
              Identity
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Social Title</label>
                <input
                  type="text"
                  value={form.socialTitle}
                  onChange={(e) => set("socialTitle", e.target.value)}
                  placeholder={photo.title}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Social Notes</label>
                <textarea
                  value={form.socialNotes}
                  onChange={(e) => set("socialNotes", e.target.value)}
                  placeholder="Notes for the agent about this photo..."
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Scores */}
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3">
              Scores
            </p>
            <div className="space-y-4">
              <ScoreInput
                label="Content Score — How useful is this image as social content?"
                value={form.contentScore}
                onChange={(v) => set("contentScore", v)}
              />
              <ScoreInput
                label="Quality Score — How sharp, well-lit, and professional is the image?"
                value={form.qualityScore}
                onChange={(v) => set("qualityScore", v)}
              />
              <ScoreInput
                label="Marketing Score — How well does this represent the brand?"
                value={form.marketingScore}
                onChange={(v) => set("marketingScore", v)}
              />
            </div>
          </div>

          {/* Content Flags */}
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3">
              Content Flags
            </p>
            <div className="space-y-1.5">
              <Toggle
                checked={form.isSocialReady}
                onChange={(v) => set("isSocialReady", v)}
                label="Social Ready — approved for agent use"
              />
              <Toggle
                checked={form.isReelCandidate}
                onChange={(v) => set("isReelCandidate", v)}
                label="Reel Candidate — strong for video content"
              />
              <Toggle
                checked={form.isPostCandidate}
                onChange={(v) => set("isPostCandidate", v)}
                label="Post Candidate — suitable for a feed post"
              />
              <Toggle
                checked={form.isBeforeAfterCandidate}
                onChange={(v) => set("isBeforeAfterCandidate", v)}
                label="Before / After Candidate"
              />
              <Toggle
                checked={form.isFavoriteForSocial}
                onChange={(v) => set("isFavoriteForSocial", v)}
                label="Favorite for Social — prioritize this image"
              />
            </div>
          </div>

          {/* Classification */}
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3">
              Classification
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  {
                    key: "serviceType" as const,
                    label: "Service Type",
                    placeholder: "e.g. Interior Detail",
                  },
                  {
                    key: "visualCategory" as const,
                    label: "Visual Category",
                    placeholder: "e.g. Hero Shot, Before/After",
                  },
                  {
                    key: "contentAngle" as const,
                    label: "Content Angle",
                    placeholder: "e.g. Transformation, Lifestyle",
                  },
                  {
                    key: "seasonalRelevance" as const,
                    label: "Seasonal Relevance",
                    placeholder: "e.g. Summer, Year-round",
                  },
                ] as const
              ).map((field) => (
                <div key={field.key}>
                  <label className="text-xs text-gray-500 mb-1 block">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={form[field.key]}
                    onChange={(e) => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3">
              Content Tags
            </p>
            <input
              type="text"
              value={form.contentTagsStr}
              onChange={(e) => set("contentTagsStr", e.target.value)}
              placeholder="e.g. interior, bmw, transformation, before-after"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
            />
            <p className="text-[10px] text-gray-600 mt-1.5">
              Comma-separated tags used by the agent for content matching.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800 shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function MediaIntelligencePanel({
  photos: initialPhotos,
}: {
  photos: PhotoIntelligence[];
}) {
  const [photos, setPhotos] = useState<PhotoIntelligence[]>(initialPhotos);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Derived stats
  const stats = useMemo(() => {
    const total       = photos.length;
    const socialReady = photos.filter((p) => p.isSocialReady).length;
    const reel        = photos.filter((p) => p.isReelCandidate).length;
    const post        = photos.filter((p) => p.isPostCandidate).length;
    const beforeAfter = photos.filter((p) => p.isBeforeAfterCandidate).length;
    const favorites   = photos.filter((p) => p.isFavoriteForSocial).length;
    const review      = photos.filter(needsReview).length;
    return { total, socialReady, reel, post, beforeAfter, favorites, review };
  }, [photos]);

  // Filtered + sorted view
  const displayed = useMemo(
    () => applySort(applyFilter(photos, filter), sort),
    [photos, filter, sort]
  );

  const editingPhoto = editing
    ? (photos.find((p) => p.id === editing) ?? null)
    : null;

  function openEdit(photo: PhotoIntelligence) {
    setSaveError(false);
    setEditing(photo.id);
    setForm(photoToForm(photo));
  }

  function closeEdit() {
    setEditing(null);
    setForm(null);
    setSaveError(false);
  }

  async function handleSave() {
    if (!editing || !form) return;
    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch(
        `/api/admin/social/media-intelligence/${editing}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            socialTitle:           form.socialTitle || null,
            socialNotes:           form.socialNotes || null,
            contentScore:          form.contentScore,
            qualityScore:          form.qualityScore,
            marketingScore:        form.marketingScore,
            isSocialReady:         form.isSocialReady,
            isReelCandidate:       form.isReelCandidate,
            isPostCandidate:       form.isPostCandidate,
            isBeforeAfterCandidate: form.isBeforeAfterCandidate,
            isFavoriteForSocial:   form.isFavoriteForSocial,
            serviceType:           form.serviceType || null,
            visualCategory:        form.visualCategory || null,
            contentAngle:          form.contentAngle || null,
            seasonalRelevance:     form.seasonalRelevance || null,
            contentTags:           form.contentTagsStr
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          }),
        }
      );
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      setPhotos((prev) =>
        prev.map((p) => (p.id === editing ? { ...p, ...updated } : p))
      );
      closeEdit();
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[
          { label: "Total Media",     value: stats.total,       cls: "text-white" },
          { label: "Social Ready",    value: stats.socialReady, cls: "text-green-400" },
          { label: "Reel Candidates", value: stats.reel,        cls: "text-violet-400" },
          { label: "Post Candidates", value: stats.post,        cls: "text-blue-400" },
          { label: "Before/After",    value: stats.beforeAfter, cls: "text-orange-400" },
          { label: "Favorites",       value: stats.favorites,   cls: "text-amber-400" },
          {
            label: "Needs Review",
            value: stats.review,
            cls: stats.review > 0 ? "text-red-400" : "text-gray-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center"
          >
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
            <p className="text-[10px] text-gray-600 mt-0.5 leading-snug">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filter === f.key
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-gray-500 hover:text-white hover:bg-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort + Auto-Score */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 min-w-[188px]"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            disabled
            title="Future AI scoring will review image quality, content usefulness, service type, and social media potential."
            className="flex items-center text-xs bg-gray-800 border border-gray-800 text-gray-600 px-3 py-1.5 rounded-lg cursor-not-allowed whitespace-nowrap"
          >
            Auto-Score Media
            <span className="text-[9px] bg-gray-700 text-gray-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ml-1.5">
              Soon
            </span>
          </button>
        </div>
      </div>

      <p className="text-[11px] text-gray-700 mb-5 leading-relaxed">
        Future AI scoring will review image quality, content usefulness, service type,
        and social media potential — and populate scores automatically.
      </p>

      {/* Grid or empty */}
      {displayed.length === 0 ? (
        <div className="border border-dashed border-gray-800 rounded-xl px-6 py-12 text-center">
          <p className="text-sm text-gray-500 mb-1">No media in this view</p>
          <p className="text-xs text-gray-600">Try a different filter.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {displayed.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onEdit={() => openEdit(photo)}
              />
            ))}
          </div>
          <p className="text-[11px] text-gray-700 mt-3">
            Showing {displayed.length} of {photos.length} photo
            {photos.length !== 1 ? "s" : ""}.
          </p>
        </>
      )}

      {/* Edit Modal */}
      {editingPhoto && form && (
        <EditModal
          photo={editingPhoto}
          form={form}
          setForm={
            setForm as React.Dispatch<React.SetStateAction<FormState>>
          }
          saving={saving}
          onSave={handleSave}
          onClose={closeEdit}
        />
      )}

      {/* Save error toast */}
      {saveError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-700 text-red-200 text-xs px-4 py-2.5 rounded-xl shadow-lg z-50">
          Save failed. Please try again.
        </div>
      )}
    </>
  );
}
