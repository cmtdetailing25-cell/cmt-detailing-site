"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { PhotoIntelligence } from "@/components/MediaIntelligencePanel";
import {
  CONTENT_ANGLES,
  CTA_STYLES,
  type ContentType,
  type ContentAngle,
  type CtaStyle,
} from "@/lib/social/generateDraftContent";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DraftGeneratorProps {
  photos: PhotoIntelligence[];
  settings: {
    defaultHashtags: string | null;
    brandVoice: string | null;
    approvalRequired: boolean;
  } | null;
}

type MediaFilterKey =
  | "all"
  | "social-ready"
  | "post"
  | "reel"
  | "favorites"
  | "before-after"
  | "top-marketing";

interface CreatedDraft {
  id: string;
  type: ContentType;
  status: string;
  title: string;
  caption: string | null;
  hashtags: string | null;
  hook: string | null;
  media: {
    id: string;
    sitePhoto: { imageUrl: string; title: string } | null;
  }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MEDIA_FILTERS: { key: MediaFilterKey; label: string }[] = [
  { key: "all",          label: "All Media" },
  { key: "social-ready", label: "Social Ready" },
  { key: "post",         label: "Post Candidates" },
  { key: "reel",         label: "Reel Candidates" },
  { key: "favorites",    label: "Favorites" },
  { key: "before-after", label: "Before/After" },
  { key: "top-marketing", label: "Top Marketing" },
];

const CONTENT_TYPES: { key: ContentType; label: string }[] = [
  { key: "POST",  label: "Instagram Post" },
  { key: "REEL",  label: "Instagram Reel" },
  { key: "STORY", label: "Instagram Story" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function filterPhotos(
  photos: PhotoIntelligence[],
  filter: MediaFilterKey
): PhotoIntelligence[] {
  switch (filter) {
    case "all":          return photos;
    case "social-ready": return photos.filter((p) => p.isSocialReady);
    case "post":         return photos.filter((p) => p.isPostCandidate);
    case "reel":         return photos.filter((p) => p.isReelCandidate);
    case "favorites":    return photos.filter((p) => p.isFavoriteForSocial);
    case "before-after": return photos.filter((p) => p.isBeforeAfterCandidate);
    case "top-marketing":
      return [...photos].sort((a, b) => b.marketingScore - a.marketingScore);
  }
}

function IntelligenceDot({
  active,
  color,
  title,
}: {
  active: boolean;
  color: string;
  title: string;
}) {
  if (!active) return null;
  return (
    <span
      title={title}
      className={`inline-block w-1.5 h-1.5 rounded-full ${color}`}
    />
  );
}

// ─── Photo thumbnail in picker ────────────────────────────────────────────────

function PickerPhoto({
  photo,
  selected,
  onToggle,
}: {
  photo: PhotoIntelligence;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative aspect-square rounded-lg overflow-hidden bg-gray-800 cursor-pointer transition-all ${
        selected
          ? "ring-2 ring-red-500 ring-offset-1 ring-offset-gray-950"
          : "hover:ring-1 hover:ring-gray-600"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.imageUrl}
        alt={photo.title}
        className="w-full h-full object-cover"
      />

      {/* Selection overlay */}
      {selected && (
        <div className="absolute inset-0 bg-red-600/25 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Intelligence dots */}
      {!selected && (
        <div className="absolute top-1.5 left-1.5 flex gap-0.5">
          <IntelligenceDot active={photo.isFavoriteForSocial} color="bg-amber-400" title="Favorite" />
          <IntelligenceDot active={photo.isSocialReady}       color="bg-green-400"  title="Social Ready" />
          <IntelligenceDot active={photo.isReelCandidate}     color="bg-violet-400" title="Reel Candidate" />
        </div>
      )}

      {/* Featured badge */}
      {photo.isFeatured && !selected && (
        <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[7px] font-bold px-1 py-0.5 rounded leading-none">
          F
        </span>
      )}
    </button>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────

function DraftCreatedState({
  draft,
  onCreateAnother,
}: {
  draft: CreatedDraft;
  onCreateAnother: () => void;
}) {
  const thumbnails = draft.media.filter((m) => m.sitePhoto).slice(0, 4);
  const typeLabel  = draft.type === "REEL" ? "Reel" : draft.type === "STORY" ? "Story" : "Post";
  const anchor     = draft.type === "REEL" ? "#reels" : "#drafts";

  return (
    <div className="bg-gray-900 border border-green-800/30 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-green-400 font-semibold text-sm">Draft created</p>
        <span className="text-[10px] text-gray-600 ml-auto">{typeLabel}</span>
      </div>

      {/* Media thumbnails */}
      {thumbnails.length > 0 && (
        <div className="flex gap-2 mb-4">
          {thumbnails.map((m) => (
            <div key={m.id} className="w-14 h-14 rounded-lg overflow-hidden bg-gray-800 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.sitePhoto!.imageUrl}
                alt={m.sitePhoto!.title}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-white font-semibold text-sm mb-3">{draft.title}</p>

      {/* Hook */}
      {draft.hook && (
        <p className="text-xs text-gray-400 italic mb-3 leading-relaxed">
          &ldquo;{draft.hook}&rdquo;
        </p>
      )}

      {/* Caption preview */}
      {draft.caption && (
        <div className="bg-gray-800/60 rounded-lg px-3 py-2.5 mb-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-1.5">
            Caption
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">{draft.caption}</p>
        </div>
      )}

      {/* Hashtags preview */}
      {draft.hashtags && (
        <p className="text-[10px] text-gray-700 leading-relaxed mb-4">
          {draft.hashtags}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
        <a
          href={anchor}
          className="text-xs text-gray-400 hover:text-white transition-colors font-medium"
        >
          View in {typeLabel === "Reel" ? "Draft Reels" : "Draft Posts"} ↓
        </a>
        <button
          onClick={onCreateAnother}
          className="ml-auto text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          Create Another Draft
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DraftGenerator({ photos, settings }: DraftGeneratorProps) {
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mediaFilter, setMediaFilter] = useState<MediaFilterKey>("all");
  const [contentType, setContentType]   = useState<ContentType>("POST");
  const [contentAngle, setContentAngle] = useState<ContentAngle>("exterior-gloss");
  const [ctaStyle, setCtaStyle]         = useState<CtaStyle>("request-quote");
  const [notes, setNotes]               = useState("");
  const [generating, setGenerating]     = useState(false);
  const [createdDraft, setCreatedDraft] = useState<CreatedDraft | null>(null);
  const [error, setError]               = useState<string | null>(null);

  const filteredPhotos = useMemo(
    () => filterPhotos(photos, mediaFilter),
    [photos, mediaFilter]
  );

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reset() {
    setCreatedDraft(null);
    setSelectedIds(new Set());
    setNotes("");
    setError(null);
  }

  async function handleGenerate() {
    if (selectedIds.size === 0) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/social/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaIds:     Array.from(selectedIds),
          contentType,
          contentAngle,
          ctaStyle,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Generation failed");
      }

      const draft: CreatedDraft = await res.json();
      router.refresh();
      setCreatedDraft(draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  // Show success state
  if (createdDraft) {
    return (
      <DraftCreatedState draft={createdDraft} onCreateAnother={reset} />
    );
  }

  const selectLabel =
    selectedIds.size === 0
      ? "Select photos below"
      : `${selectedIds.size} photo${selectedIds.size !== 1 ? "s" : ""} selected`;

  return (
    <div className="space-y-6">

      {/* Step 1: Select Media ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Step 1 — Select Media
          </p>
          <span
            className={`text-xs font-medium ${
              selectedIds.size > 0 ? "text-red-400" : "text-gray-600"
            }`}
          >
            {selectLabel}
          </span>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
          {MEDIA_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setMediaFilter(f.key)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                mediaFilter === f.key
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-gray-500 hover:text-white hover:bg-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Photo grid */}
        {photos.length === 0 ? (
          <div className="border border-dashed border-gray-800 rounded-xl px-6 py-10 text-center">
            <p className="text-sm text-gray-600">
              No photos in the media library yet.{" "}
              <a href="/admin/media" className="text-gray-500 hover:text-white transition-colors">
                Upload photos →
              </a>
            </p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="border border-dashed border-gray-800 rounded-xl px-6 py-8 text-center">
            <p className="text-sm text-gray-600">No photos match this filter.</p>
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto rounded-xl bg-gray-900/40 border border-gray-800/60 p-3">
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
              {filteredPhotos.map((photo) => (
                <PickerPhoto
                  key={photo.id}
                  photo={photo}
                  selected={selectedIds.has(photo.id)}
                  onToggle={() => toggleSelect(photo.id)}
                />
              ))}
            </div>
            <p className="text-[10px] text-gray-700 mt-2 text-center">
              {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? "s" : ""} shown
              {mediaFilter !== "all" ? " in this filter" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Step 2: Draft Settings ────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
          Step 2 — Draft Settings
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left column */}
          <div className="space-y-4">
            {/* Content Type */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Content Type</label>
              <div className="flex gap-1.5">
                {CONTENT_TYPES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setContentType(t.key)}
                    className={`flex-1 text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
                      contentType === t.key
                        ? "bg-red-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Angle */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Content Angle</label>
              <select
                value={contentAngle}
                onChange={(e) => setContentAngle(e.target.value as ContentAngle)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              >
                {CONTENT_ANGLES.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            {/* CTA Style */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">CTA Style</label>
              <select
                value={ctaStyle}
                onChange={(e) => setCtaStyle(e.target.value as CtaStyle)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              >
                {CTA_STYLES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Notes */}
            <div className="flex flex-col h-full">
              <label className="text-xs text-gray-500 mb-2 block">
                Notes / Instructions{" "}
                <span className="text-gray-700">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific instructions for this draft — vehicle type, service focus, tone adjustments, etc."
                rows={5}
                className="flex-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            {/* Settings info */}
            {settings && (
              <div className="text-[10px] text-gray-700 leading-relaxed space-y-0.5">
                {settings.defaultHashtags && (
                  <p>Using your saved default hashtags.</p>
                )}
                {settings.approvalRequired && (
                  <p>Draft will require approval before publishing.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Generate button */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-800/60">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={selectedIds.size === 0 || generating}
          className={`flex items-center gap-2 font-semibold text-sm px-6 py-2.5 rounded-xl transition-all ${
            selectedIds.size === 0 || generating
              ? "bg-gray-800 text-gray-600 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg"
          }`}
        >
          {generating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating…
            </>
          ) : (
            "Generate Draft"
          )}
        </button>

        {selectedIds.size === 0 && (
          <p className="text-xs text-gray-600">
            Select at least one photo to generate a draft.
          </p>
        )}
      </div>
    </div>
  );
}
