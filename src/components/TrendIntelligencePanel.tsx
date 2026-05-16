"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TrendCategory =
  | "MOBILE_DETAILING" | "CERAMIC_COATING" | "PAINT_CORRECTION"
  | "INTERIOR_DETAILING" | "EXTERIOR_DETAILING" | "BEFORE_AFTER_TRANSFORMATIONS"
  | "SEASONAL_PROTECTION" | "CUSTOMER_EDUCATION" | "LUXURY_CAR_CARE"
  | "LOCAL_BUSINESS_MARKETING";

type TrendType =
  | "HASHTAG" | "CONTENT_FORMAT" | "CAPTION_STYLE" | "REEL_STRUCTURE"
  | "AUDIO_IDEA" | "SEASONAL_TOPIC" | "LOCAL_TREND" | "COMPETITOR_INSPIRATION";

export type TrendInsightRow = {
  id: string;
  title: string;
  platform: string;
  source: string | null;
  category: TrendCategory;
  trendType: TrendType;
  summary: string | null;
  suggestedUse: string | null;
  exampleHook: string | null;
  exampleCaptionAngle: string | null;
  hashtags: string | null;
  confidenceScore: number;
  popularityScore: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
};

// ─── Label maps ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<TrendCategory, string> = {
  MOBILE_DETAILING:           "Mobile Detailing",
  CERAMIC_COATING:            "Ceramic Coating",
  PAINT_CORRECTION:           "Paint Correction",
  INTERIOR_DETAILING:         "Interior Detailing",
  EXTERIOR_DETAILING:         "Exterior Detailing",
  BEFORE_AFTER_TRANSFORMATIONS: "Before/After",
  SEASONAL_PROTECTION:        "Seasonal Protection",
  CUSTOMER_EDUCATION:         "Customer Education",
  LUXURY_CAR_CARE:            "Luxury Car Care",
  LOCAL_BUSINESS_MARKETING:   "Local Marketing",
};

const CATEGORY_COLORS: Record<TrendCategory, string> = {
  MOBILE_DETAILING:           "bg-blue-900/40 text-blue-300",
  CERAMIC_COATING:            "bg-purple-900/40 text-purple-300",
  PAINT_CORRECTION:           "bg-red-900/40 text-red-300",
  INTERIOR_DETAILING:         "bg-green-900/40 text-green-300",
  EXTERIOR_DETAILING:         "bg-teal-900/40 text-teal-300",
  BEFORE_AFTER_TRANSFORMATIONS: "bg-orange-900/40 text-orange-300",
  SEASONAL_PROTECTION:        "bg-yellow-900/40 text-yellow-300",
  CUSTOMER_EDUCATION:         "bg-gray-700 text-gray-300",
  LUXURY_CAR_CARE:            "bg-amber-900/40 text-amber-300",
  LOCAL_BUSINESS_MARKETING:   "bg-pink-900/40 text-pink-300",
};

const TYPE_LABELS: Record<TrendType, string> = {
  HASHTAG:               "Hashtag",
  CONTENT_FORMAT:        "Content Format",
  CAPTION_STYLE:         "Caption Style",
  REEL_STRUCTURE:        "Reel Structure",
  AUDIO_IDEA:            "Audio Idea",
  SEASONAL_TOPIC:        "Seasonal Topic",
  LOCAL_TREND:           "Local Trend",
  COMPETITOR_INSPIRATION: "Competitor Inspiration",
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as TrendCategory[];
const TREND_TYPES = Object.keys(TYPE_LABELS) as TrendType[];
const PLATFORMS = ["Instagram", "TikTok", "Facebook", "YouTube", "General"];

// ─── Empty form ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title:               "",
  platform:            "Instagram",
  source:              "",
  category:            "MOBILE_DETAILING" as TrendCategory,
  trendType:           "CONTENT_FORMAT" as TrendType,
  summary:             "",
  suggestedUse:        "",
  exampleHook:         "",
  exampleCaptionAngle: "",
  hashtags:            "",
  confidenceScore:     5,
  popularityScore:     5,
  expiresAt:           "",
};

type FormState = typeof EMPTY_FORM;

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct  = Math.round((value / 10) * 100);
  const color = value >= 7 ? "bg-green-500" : value >= 4 ? "bg-yellow-500" : "bg-gray-600";
  return (
    <div>
      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
        <span>{label}</span>
        <span className="text-gray-400 font-medium">{value}/10</span>
      </div>
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function TrendModal({
  title,
  form,
  setForm,
  onClose,
  onSubmit,
  submitting,
}: {
  title: string;
  form: FormState;
  setForm: (f: FormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const field = (key: keyof FormState, value: string | number) =>
    setForm({ ...form, [key]: value });

  const inputCls =
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors";
  const labelCls = "block text-xs text-gray-500 mb-1 font-medium";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className={labelCls}>Title <span className="text-red-500">*</span></label>
            <input
              className={inputCls}
              placeholder="e.g. Before/After Reels are trending on Instagram"
              value={form.title}
              onChange={(e) => field("title", e.target.value)}
            />
          </div>

          {/* Platform + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Platform <span className="text-red-500">*</span></label>
              <select
                className={inputCls}
                value={form.platform}
                onChange={(e) => field("platform", e.target.value)}
              >
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Category <span className="text-red-500">*</span></label>
              <select
                className={inputCls}
                value={form.category}
                onChange={(e) => field("category", e.target.value as TrendCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Trend Type + Source */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Trend Type <span className="text-red-500">*</span></label>
              <select
                className={inputCls}
                value={form.trendType}
                onChange={(e) => field("trendType", e.target.value as TrendType)}
              >
                {TREND_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Source</label>
              <input
                className={inputCls}
                placeholder="e.g. Manual, Metricool, Client request"
                value={form.source}
                onChange={(e) => field("source", e.target.value)}
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className={labelCls}>Summary</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="Brief description of what this trend is and why it matters"
              value={form.summary}
              onChange={(e) => field("summary", e.target.value)}
            />
          </div>

          {/* Suggested use */}
          <div>
            <label className={labelCls}>Suggested Use</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="How the Weekly Agent should use this trend in generated drafts"
              value={form.suggestedUse}
              onChange={(e) => field("suggestedUse", e.target.value)}
            />
          </div>

          {/* Example Hook */}
          <div>
            <label className={labelCls}>Example Hook <span className="text-gray-600 font-normal">(used as Reel opener)</span></label>
            <input
              className={inputCls}
              placeholder='e.g. "POV: your car gets a full detail in 60 seconds"'
              value={form.exampleHook}
              onChange={(e) => field("exampleHook", e.target.value)}
            />
          </div>

          {/* Example Caption Angle */}
          <div>
            <label className={labelCls}>Example Caption Angle <span className="text-gray-600 font-normal">(framing sentence for captions)</span></label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder='e.g. "Before and afters are the highest-performing content in detailing right now — here is one from this week."'
              value={form.exampleCaptionAngle}
              onChange={(e) => field("exampleCaptionAngle", e.target.value)}
            />
          </div>

          {/* Hashtags */}
          <div>
            <label className={labelCls}>Hashtags</label>
            <input
              className={inputCls}
              placeholder="#BeforeAfter #DetailReels"
              value={form.hashtags}
              onChange={(e) => field("hashtags", e.target.value)}
            />
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Confidence Score (0–10)</label>
              <input
                type="number" min={0} max={10}
                className={inputCls}
                value={form.confidenceScore}
                onChange={(e) => field("confidenceScore", Number(e.target.value))}
              />
            </div>
            <div>
              <label className={labelCls}>Popularity Score (0–10)</label>
              <input
                type="number" min={0} max={10}
                className={inputCls}
                value={form.popularityScore}
                onChange={(e) => field("popularityScore", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Expires at */}
          <div>
            <label className={labelCls}>Expires At <span className="text-gray-600 font-normal">(leave blank if evergreen)</span></label>
            <input
              type="date"
              className={inputCls}
              value={form.expiresAt}
              onChange={(e) => field("expiresAt", e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="text-sm bg-white text-gray-900 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save Trend"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Trend Card ───────────────────────────────────────────────────────────────

function TrendCard({
  trend,
  onEdit,
  onArchive,
}: {
  trend: TrendInsightRow;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const isExpired = trend.expiresAt ? new Date(trend.expiresAt) < new Date() : false;

  return (
    <div className={`bg-gray-900 border rounded-xl p-5 flex flex-col gap-3 ${
      isExpired ? "border-gray-800/40 opacity-60" : "border-gray-800"
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm leading-snug">{trend.title}</p>
          {trend.source && (
            <p className="text-[10px] text-gray-600 mt-0.5">Source: {trend.source}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onEdit}
            className="text-[10px] text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 rounded px-2 py-1 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onArchive}
            className="text-[10px] text-gray-600 hover:text-red-400 border border-gray-800 hover:border-red-900/50 rounded px-2 py-1 transition-colors"
          >
            {trend.isActive ? "Archive" : "Restore"}
          </button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 uppercase tracking-wider">
          {trend.platform}
        </span>
        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${CATEGORY_COLORS[trend.category]}`}>
          {CATEGORY_LABELS[trend.category]}
        </span>
        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 uppercase tracking-wider">
          {TYPE_LABELS[trend.trendType]}
        </span>
        {isExpired && (
          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-red-900/30 text-red-500 uppercase tracking-wider">
            Expired
          </span>
        )}
      </div>

      {/* Summary */}
      {trend.summary && (
        <p className="text-xs text-gray-500 leading-relaxed">{trend.summary}</p>
      )}

      {/* Example hook */}
      {trend.exampleHook && (
        <div className="border-l-2 border-gray-700 pl-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Hook</p>
          <p className="text-xs text-gray-400 italic">&ldquo;{trend.exampleHook}&rdquo;</p>
        </div>
      )}

      {/* Suggested use */}
      {trend.suggestedUse && (
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Suggested Use</p>
          <p className="text-xs text-gray-500">{trend.suggestedUse}</p>
        </div>
      )}

      {/* Hashtags */}
      {trend.hashtags && (
        <p className="text-[11px] text-blue-400/70 leading-relaxed">{trend.hashtags}</p>
      )}

      {/* Scores */}
      <div className="space-y-2 pt-1">
        <ScoreBar label="Confidence" value={trend.confidenceScore} />
        <ScoreBar label="Popularity" value={trend.popularityScore} />
      </div>

      {/* Expiration */}
      {trend.expiresAt && (
        <p className={`text-[10px] ${isExpired ? "text-red-500" : "text-gray-600"}`}>
          Expires: {new Date(trend.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function TrendIntelligencePanel({
  initialTrends,
}: {
  initialTrends: TrendInsightRow[];
}) {
  const [trends, setTrends]           = useState<TrendInsightRow[]>(initialTrends);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTrend, setEditingTrend] = useState<TrendInsightRow | null>(null);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const visibleTrends = trends.filter((t) => showArchived || t.isActive);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function openAdd() {
    setForm(EMPTY_FORM);
    setShowAddModal(true);
  }

  function openEdit(trend: TrendInsightRow) {
    setForm({
      title:               trend.title,
      platform:            trend.platform,
      source:              trend.source ?? "",
      category:            trend.category,
      trendType:           trend.trendType,
      summary:             trend.summary ?? "",
      suggestedUse:        trend.suggestedUse ?? "",
      exampleHook:         trend.exampleHook ?? "",
      exampleCaptionAngle: trend.exampleCaptionAngle ?? "",
      hashtags:            trend.hashtags ?? "",
      confidenceScore:     trend.confidenceScore,
      popularityScore:     trend.popularityScore,
      expiresAt:           trend.expiresAt
        ? new Date(trend.expiresAt).toISOString().split("T")[0]
        : "",
    });
    setEditingTrend(trend);
  }

  function closeModal() {
    setShowAddModal(false);
    setEditingTrend(null);
  }

  async function handleAdd() {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const res  = await fetch("/api/admin/social/trends", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...form,
          confidenceScore: Number(form.confidenceScore),
          popularityScore: Number(form.popularityScore),
          expiresAt:       form.expiresAt || null,
        }),
      });
      const data = await res.json();
      if (data.trend) {
        setTrends((prev) => [
          { ...data.trend, createdAt: data.trend.createdAt ?? new Date().toISOString(), expiresAt: data.trend.expiresAt ?? null },
          ...prev,
        ]);
        closeModal();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit() {
    if (!editingTrend || !form.title.trim()) return;
    setSubmitting(true);
    try {
      const res  = await fetch(`/api/admin/social/trends/${editingTrend.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...form,
          confidenceScore: Number(form.confidenceScore),
          popularityScore: Number(form.popularityScore),
          expiresAt:       form.expiresAt || null,
        }),
      });
      const data = await res.json();
      if (data.trend) {
        setTrends((prev) =>
          prev.map((t) =>
            t.id === editingTrend.id
              ? { ...data.trend, createdAt: t.createdAt, expiresAt: data.trend.expiresAt ?? null }
              : t
          )
        );
        closeModal();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(trend: TrendInsightRow) {
    const res  = await fetch(`/api/admin/social/trends/${trend.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isActive: !trend.isActive }),
    });
    const data = await res.json();
    if (data.trend) {
      setTrends((prev) =>
        prev.map((t) => (t.id === trend.id ? { ...t, isActive: data.trend.isActive } : t))
      );
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={openAdd}
          className="text-sm bg-white text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          + Add Trend
        </button>

        <button
          disabled
          className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-800 px-4 py-2 rounded-lg cursor-not-allowed"
        >
          Research Trends
          <span className="text-[9px] bg-gray-800 text-gray-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
            Soon
          </span>
        </button>

        {trends.some((t) => !t.isActive) && (
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors ml-auto"
          >
            {showArchived ? "Hide archived" : `Show archived (${trends.filter((t) => !t.isActive).length})`}
          </button>
        )}
      </div>

      {/* Cards grid */}
      {visibleTrends.length === 0 ? (
        <div className="border border-dashed border-gray-800 rounded-xl px-6 py-12 flex flex-col items-center text-center gap-3">
          <div className="text-gray-700">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">No trend insights yet</p>
          <p className="text-xs text-gray-600 max-w-sm leading-relaxed">
            Add trend insights manually to help the Weekly Agent shape captions, hooks, and hashtags
            around what's performing on Instagram and TikTok right now.
          </p>
          <button
            onClick={openAdd}
            className="mt-2 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-4 py-2 transition-colors"
          >
            Add your first trend
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleTrends.map((trend) => (
            <TrendCard
              key={trend.id}
              trend={trend}
              onEdit={() => openEdit(trend)}
              onArchive={() => handleToggleActive(trend)}
            />
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAddModal && (
        <TrendModal
          title="Add Trend Insight"
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={handleAdd}
          submitting={submitting}
        />
      )}

      {/* Edit modal */}
      {editingTrend && (
        <TrendModal
          title="Edit Trend Insight"
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={handleEdit}
          submitting={submitting}
        />
      )}
    </>
  );
}
