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

export type TrendResearchSettingsRow = {
  id: string;
  isEnabled: boolean;
  researchFrequency: string;
  targetPlatforms: string[];
  targetHashtags: string[];
  competitorAccounts: string[];
  serviceCategories: string[];
  locationKeywords: string[];
  minConfidenceScore: number;
};

export type TrendResearchRunRow = {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  startedAt: string | null;
  completedAt: string | null;
  trendsFound: number;
  sourcesChecked: number;
  errorMessage: string | null;
  notes: string | null;
  createdAt: string;
};

// ─── Label maps ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<TrendCategory, string> = {
  MOBILE_DETAILING:             "Mobile Detailing",
  CERAMIC_COATING:              "Ceramic Coating",
  PAINT_CORRECTION:             "Paint Correction",
  INTERIOR_DETAILING:           "Interior Detailing",
  EXTERIOR_DETAILING:           "Exterior Detailing",
  BEFORE_AFTER_TRANSFORMATIONS: "Before/After",
  SEASONAL_PROTECTION:          "Seasonal Protection",
  CUSTOMER_EDUCATION:           "Customer Education",
  LUXURY_CAR_CARE:              "Luxury Car Care",
  LOCAL_BUSINESS_MARKETING:     "Local Marketing",
};

const CATEGORY_COLORS: Record<TrendCategory, string> = {
  MOBILE_DETAILING:             "bg-blue-900/40 text-blue-300",
  CERAMIC_COATING:              "bg-purple-900/40 text-purple-300",
  PAINT_CORRECTION:             "bg-red-900/40 text-red-300",
  INTERIOR_DETAILING:           "bg-green-900/40 text-green-300",
  EXTERIOR_DETAILING:           "bg-teal-900/40 text-teal-300",
  BEFORE_AFTER_TRANSFORMATIONS: "bg-orange-900/40 text-orange-300",
  SEASONAL_PROTECTION:          "bg-yellow-900/40 text-yellow-300",
  CUSTOMER_EDUCATION:           "bg-gray-700 text-gray-300",
  LUXURY_CAR_CARE:              "bg-amber-900/40 text-amber-300",
  LOCAL_BUSINESS_MARKETING:     "bg-pink-900/40 text-pink-300",
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

const CATEGORIES  = Object.keys(CATEGORY_LABELS) as TrendCategory[];
const TREND_TYPES = Object.keys(TYPE_LABELS) as TrendType[];
const PLATFORMS   = ["Instagram", "TikTok", "Facebook", "YouTube", "General"];

// ─── Empty form ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: "", platform: "Instagram", source: "",
  category: "MOBILE_DETAILING" as TrendCategory,
  trendType: "CONTENT_FORMAT" as TrendType,
  summary: "", suggestedUse: "", exampleHook: "", exampleCaptionAngle: "",
  hashtags: "", confidenceScore: 5, popularityScore: 5, expiresAt: "",
};
type FormState = typeof EMPTY_FORM;

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct   = Math.round((value / 10) * 100);
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

// ─── Trend Add/Edit Modal ─────────────────────────────────────────────────────

function TrendModal({
  title, form, setForm, onClose, onSubmit, submitting,
}: {
  title: string; form: FormState; setForm: (f: FormState) => void;
  onClose: () => void; onSubmit: () => void; submitting: boolean;
}) {
  const field = (key: keyof FormState, value: string | number) =>
    setForm({ ...form, [key]: value });

  const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors";
  const labelCls = "block text-xs text-gray-500 mb-1 font-medium";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Title <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder="e.g. Before/After Reels are trending on Instagram"
              value={form.title} onChange={(e) => field("title", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Platform <span className="text-red-500">*</span></label>
              <select className={inputCls} value={form.platform} onChange={(e) => field("platform", e.target.value)}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Category <span className="text-red-500">*</span></label>
              <select className={inputCls} value={form.category} onChange={(e) => field("category", e.target.value as TrendCategory)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Trend Type <span className="text-red-500">*</span></label>
              <select className={inputCls} value={form.trendType} onChange={(e) => field("trendType", e.target.value as TrendType)}>
                {TREND_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Source</label>
              <input className={inputCls} placeholder="e.g. Manual, Metricool, Client request"
                value={form.source} onChange={(e) => field("source", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Summary</label>
            <textarea className={`${inputCls} resize-none`} rows={2}
              placeholder="Brief description of what this trend is and why it matters"
              value={form.summary} onChange={(e) => field("summary", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Suggested Use</label>
            <textarea className={`${inputCls} resize-none`} rows={2}
              placeholder="How the Weekly Agent should use this trend in generated drafts"
              value={form.suggestedUse} onChange={(e) => field("suggestedUse", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Example Hook <span className="text-gray-600 font-normal">(used as Reel opener)</span></label>
            <input className={inputCls} placeholder={`e.g. "POV: your car gets a full detail in 60 seconds"`}
              value={form.exampleHook} onChange={(e) => field("exampleHook", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Example Caption Angle <span className="text-gray-600 font-normal">(framing sentence)</span></label>
            <textarea className={`${inputCls} resize-none`} rows={2}
              placeholder={`e.g. "Before and afters are the highest-performing content in detailing right now — here is one from this week."`}
              value={form.exampleCaptionAngle} onChange={(e) => field("exampleCaptionAngle", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Hashtags</label>
            <input className={inputCls} placeholder="#BeforeAfter #DetailReels"
              value={form.hashtags} onChange={(e) => field("hashtags", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Confidence Score (0–10)</label>
              <input type="number" min={0} max={10} className={inputCls}
                value={form.confidenceScore} onChange={(e) => field("confidenceScore", Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Popularity Score (0–10)</label>
              <input type="number" min={0} max={10} className={inputCls}
                value={form.popularityScore} onChange={(e) => field("popularityScore", Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Expires At <span className="text-gray-600 font-normal">(leave blank if evergreen)</span></label>
            <input type="date" className={inputCls}
              value={form.expiresAt} onChange={(e) => field("expiresAt", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-white px-4 py-2 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={onSubmit} disabled={submitting}
            className="text-sm bg-white text-gray-900 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50">
            {submitting ? "Saving…" : "Save Trend"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Research Settings Modal ──────────────────────────────────────────────────

function ResearchSettingsModal({
  settings,
  onClose,
  onSaved,
}: {
  settings: TrendResearchSettingsRow;
  onClose: () => void;
  onSaved: (s: TrendResearchSettingsRow) => void;
}) {
  const [form, setForm] = useState({
    isEnabled:          settings.isEnabled,
    researchFrequency:  settings.researchFrequency,
    minConfidenceScore: settings.minConfidenceScore,
    targetHashtags:     settings.targetHashtags.join("\n"),
    serviceCategories:  settings.serviceCategories.join("\n"),
    locationKeywords:   settings.locationKeywords.join("\n"),
    competitorAccounts: settings.competitorAccounts.join("\n"),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/social/trends/research-settings", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled:          form.isEnabled,
          researchFrequency:  form.researchFrequency,
          minConfidenceScore: form.minConfidenceScore,
          targetHashtags:     form.targetHashtags.split("\n").map((s) => s.trim()).filter(Boolean),
          serviceCategories:  form.serviceCategories.split("\n").map((s) => s.trim()).filter(Boolean),
          locationKeywords:   form.locationKeywords.split("\n").map((s) => s.trim()).filter(Boolean),
          competitorAccounts: form.competitorAccounts.split("\n").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      onSaved(data.settings);
      onClose();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  const inputCls   = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors";
  const labelCls   = "block text-xs text-gray-500 mb-1 font-medium";
  const textareaCls = `${inputCls} resize-none`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-base">Research Settings</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Enable toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-white font-medium">Enable Automated Research</p>
              <p className="text-xs text-gray-600 mt-0.5">Run trend research on a schedule</p>
            </div>
            <div
              onClick={() => setForm((f) => ({ ...f, isEnabled: !f.isEnabled }))}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.isEnabled ? "bg-[#94b2b6]" : "bg-gray-700"}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isEnabled ? "translate-x-5" : ""}`} />
            </div>
          </label>

          {/* Frequency */}
          <div>
            <label className={labelCls}>Research Frequency</label>
            <select className={inputCls} value={form.researchFrequency}
              onChange={(e) => setForm((f) => ({ ...f, researchFrequency: e.target.value }))}>
              <option value="manual">Manual only</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          {/* Min confidence */}
          <div>
            <label className={labelCls}>Minimum Confidence Score (0–10)</label>
            <input type="number" min={0} max={10} className={inputCls}
              value={form.minConfidenceScore}
              onChange={(e) => setForm((f) => ({ ...f, minConfidenceScore: Number(e.target.value) }))} />
            <p className="text-[10px] text-gray-600 mt-1">Trends below this score will not be saved.</p>
          </div>

          {/* Target hashtags */}
          <div>
            <label className={labelCls}>Target Hashtags <span className="text-gray-600 font-normal">(one per line, without #)</span></label>
            <textarea rows={5} className={textareaCls}
              value={form.targetHashtags}
              onChange={(e) => setForm((f) => ({ ...f, targetHashtags: e.target.value }))} />
          </div>

          {/* Location keywords */}
          <div>
            <label className={labelCls}>Location Keywords <span className="text-gray-600 font-normal">(one per line)</span></label>
            <textarea rows={4} className={textareaCls}
              value={form.locationKeywords}
              onChange={(e) => setForm((f) => ({ ...f, locationKeywords: e.target.value }))} />
          </div>

          {/* Service categories */}
          <div>
            <label className={labelCls}>Service Categories <span className="text-gray-600 font-normal">(one per line)</span></label>
            <textarea rows={4} className={textareaCls}
              value={form.serviceCategories}
              onChange={(e) => setForm((f) => ({ ...f, serviceCategories: e.target.value }))} />
          </div>

          {/* Competitor accounts */}
          <div>
            <label className={labelCls}>Competitor Accounts <span className="text-gray-600 font-normal">(Instagram handles, one per line)</span></label>
            <textarea rows={3} className={textareaCls}
              placeholder="e.g. somedetailshop"
              value={form.competitorAccounts}
              onChange={(e) => setForm((f) => ({ ...f, competitorAccounts: e.target.value }))} />
            <p className="text-[10px] text-gray-600 mt-1">For reference and future Instagram Graph API integration only.</p>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-white px-4 py-2 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="text-sm bg-white text-gray-900 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50">
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Research History Modal ───────────────────────────────────────────────────

function ResearchHistoryModal({
  runs,
  onClose,
}: {
  runs: TrendResearchRunRow[];
  onClose: () => void;
}) {
  const statusMap: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: "Pending",   cls: "bg-gray-800 text-gray-400" },
    RUNNING:   { label: "Running",   cls: "bg-yellow-900/40 text-yellow-400" },
    COMPLETED: { label: "Completed", cls: "bg-green-900/40 text-green-400" },
    FAILED:    { label: "Failed",    cls: "bg-red-900/40 text-red-400" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-base">Research History</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-4">
          {runs.length === 0 ? (
            <p className="text-xs text-gray-600 italic py-4 text-center">No research runs yet.</p>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => {
                const si = statusMap[run.status] ?? { label: run.status, cls: "bg-gray-800 text-gray-500" };
                return (
                  <div key={run.id} className="bg-gray-800/60 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${si.cls}`}>{si.label}</span>
                      <span className="text-[10px] text-gray-600">
                        {new Date(run.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    {run.status === "COMPLETED" && (
                      <div className="flex gap-4 mb-2">
                        <div className="text-center">
                          <p className="text-sm font-bold text-white">{run.trendsFound}</p>
                          <p className="text-[10px] text-gray-600">new trends</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-white">{run.sourcesChecked}</p>
                          <p className="text-[10px] text-gray-600">sources</p>
                        </div>
                      </div>
                    )}
                    {run.notes && <p className="text-xs text-gray-500">{run.notes}</p>}
                    {run.errorMessage && <p className="text-xs text-red-400">{run.errorMessage}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-800">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-white px-4 py-2 rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Automated Research Section ───────────────────────────────────────────────

function AutomatedResearchSection({
  settings,
  lastRun,
  onRunResearch,
  onEditSettings,
  onViewHistory,
  running,
}: {
  settings: TrendResearchSettingsRow | null;
  lastRun: TrendResearchRunRow | null;
  onRunResearch: () => void;
  onEditSettings: () => void;
  onViewHistory: () => void;
  running: boolean;
}) {
  const isEnabled   = settings?.isEnabled ?? false;
  const hashtags    = settings?.targetHashtags ?? [];
  const locations   = settings?.locationKeywords ?? [];
  const competitors = settings?.competitorAccounts ?? [];

  const lastRunDate = lastRun?.completedAt
    ? new Date(lastRun.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isEnabled ? "bg-green-500" : "bg-gray-600"}`} />
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              Automated Trend Research
            </p>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${isEnabled ? "bg-green-900/40 text-green-400" : "bg-gray-800 text-gray-600"}`}>
              {isEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <p className="text-xs text-gray-600 ml-3.5">
            {lastRun?.status === "COMPLETED" && lastRunDate
              ? `Last run ${lastRunDate} · ${lastRun.trendsFound} trend${lastRun.trendsFound !== 1 ? "s" : ""} found · ${lastRun.sourcesChecked} source${lastRun.sourcesChecked !== 1 ? "s" : ""} checked`
              : "No runs yet"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRunResearch}
            disabled={running}
            className="text-xs bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-gray-700 disabled:text-gray-500 text-[#151b23] font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            {running ? "Researching…" : "Run Now"}
          </button>
          <button
            onClick={onEditSettings}
            className="text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            Settings
          </button>
          <button
            onClick={onViewHistory}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            History
          </button>
        </div>
      </div>

      {/* Info rows */}
      <div className="space-y-3 border-t border-gray-800 pt-4">
        {/* Target hashtags */}
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-1.5">Target Hashtags</p>
          {hashtags.length === 0 ? (
            <p className="text-xs text-gray-700 italic">None configured — edit settings to add.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {hashtags.map((tag) => (
                <span key={tag} className="text-[10px] text-blue-400/70 bg-blue-900/10 border border-blue-900/20 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Location keywords */}
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-1.5">Location Keywords</p>
          {locations.length === 0 ? (
            <p className="text-xs text-gray-700 italic">None configured.</p>
          ) : (
            <p className="text-xs text-gray-500">{locations.join(" · ")}</p>
          )}
        </div>

        {/* Competitor accounts */}
        {competitors.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-1.5">Competitor Accounts</p>
            <p className="text-xs text-gray-500">{competitors.map((a) => `@${a}`).join(" · ")}</p>
          </div>
        )}
      </div>

      {/* Safety copy */}
      <div className="flex items-start gap-2 mt-4 pt-4 border-t border-gray-800">
        <svg className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Trend research helps suggest content ideas. It does not scrape private data or publish anything automatically.
        </p>
      </div>
    </div>
  );
}

// ─── Trend Card ───────────────────────────────────────────────────────────────

function TrendCard({
  trend, onEdit, onArchive,
}: {
  trend: TrendInsightRow; onEdit: () => void; onArchive: () => void;
}) {
  const isExpired = trend.expiresAt ? new Date(trend.expiresAt) < new Date() : false;

  return (
    <div className={`bg-gray-900 border rounded-xl p-5 flex flex-col gap-3 ${isExpired ? "border-gray-800/40 opacity-60" : "border-gray-800"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm leading-snug">{trend.title}</p>
          {trend.source && <p className="text-[10px] text-gray-600 mt-0.5">Source: {trend.source}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onEdit}
            className="text-[10px] text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 rounded px-2 py-1 transition-colors">
            Edit
          </button>
          <button onClick={onArchive}
            className="text-[10px] text-gray-600 hover:text-red-400 border border-gray-800 hover:border-red-900/50 rounded px-2 py-1 transition-colors">
            {trend.isActive ? "Archive" : "Restore"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 uppercase tracking-wider">{trend.platform}</span>
        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${CATEGORY_COLORS[trend.category]}`}>
          {CATEGORY_LABELS[trend.category]}
        </span>
        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 uppercase tracking-wider">
          {TYPE_LABELS[trend.trendType]}
        </span>
        {isExpired && (
          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-red-900/30 text-red-500 uppercase tracking-wider">Expired</span>
        )}
      </div>

      {trend.summary && <p className="text-xs text-gray-500 leading-relaxed">{trend.summary}</p>}

      {trend.exampleHook && (
        <div className="border-l-2 border-gray-700 pl-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Hook</p>
          <p className="text-xs text-gray-400 italic">&ldquo;{trend.exampleHook}&rdquo;</p>
        </div>
      )}

      {trend.suggestedUse && (
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Suggested Use</p>
          <p className="text-xs text-gray-500">{trend.suggestedUse}</p>
        </div>
      )}

      {trend.hashtags && <p className="text-[11px] text-blue-400/70 leading-relaxed">{trend.hashtags}</p>}

      <div className="space-y-2 pt-1">
        <ScoreBar label="Confidence" value={trend.confidenceScore} />
        <ScoreBar label="Popularity" value={trend.popularityScore} />
      </div>

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
  initialSettings,
  initialRuns,
}: {
  initialTrends: TrendInsightRow[];
  initialSettings: TrendResearchSettingsRow | null;
  initialRuns: TrendResearchRunRow[];
}) {
  const [trends, setTrends]             = useState<TrendInsightRow[]>(initialTrends);
  const [settings, setSettings]         = useState<TrendResearchSettingsRow | null>(initialSettings);
  const [runs, setRuns]                 = useState<TrendResearchRunRow[]>(initialRuns);

  const [showAddModal, setShowAddModal]     = useState(false);
  const [editingTrend, setEditingTrend]     = useState<TrendInsightRow | null>(null);
  const [form, setForm]                     = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting]         = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal]   = useState(false);
  const [running, setRunning]                     = useState(false);
  const [runResult, setRunResult]                 = useState<{ trendsFound: number; skipped: number } | null>(null);

  const [showArchived, setShowArchived] = useState(false);
  const visibleTrends = trends.filter((t) => showArchived || t.isActive);

  // ── Research ─────────────────────────────────────────────────────────────────

  async function handleRunResearch() {
    setRunning(true);
    setRunResult(null);
    try {
      const res  = await fetch("/api/admin/social/trends/run-research", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setRunResult({ trendsFound: data.trendsFound ?? 0, skipped: data.skipped ?? 0 });
        // Refresh runs list
        const runsRes  = await fetch("/api/admin/social/trends/research-runs");
        const runsData = await runsRes.json();
        if (runsData.runs) setRuns(runsData.runs);
        // Refresh trends if any were added
        if ((data.trendsFound ?? 0) > 0) {
          const trendRes  = await fetch("/api/admin/social/trends?activeOnly=false");
          const trendData = await trendRes.json();
          if (trendData.trends) setTrends(trendData.trends.map((t: TrendInsightRow & { expiresAt: string | null; createdAt: string }) => ({
            ...t,
            expiresAt: t.expiresAt ?? null,
            createdAt: t.createdAt,
          })));
        }
      }
    } catch { /* noop */ }
    finally { setRunning(false); }
  }

  // ── Trend CRUD ───────────────────────────────────────────────────────────────

  function openAdd() { setForm(EMPTY_FORM); setShowAddModal(true); }

  function openEdit(trend: TrendInsightRow) {
    setForm({
      title: trend.title, platform: trend.platform, source: trend.source ?? "",
      category: trend.category, trendType: trend.trendType,
      summary: trend.summary ?? "", suggestedUse: trend.suggestedUse ?? "",
      exampleHook: trend.exampleHook ?? "", exampleCaptionAngle: trend.exampleCaptionAngle ?? "",
      hashtags: trend.hashtags ?? "", confidenceScore: trend.confidenceScore,
      popularityScore: trend.popularityScore,
      expiresAt: trend.expiresAt ? new Date(trend.expiresAt).toISOString().split("T")[0] : "",
    });
    setEditingTrend(trend);
  }

  function closeModal() { setShowAddModal(false); setEditingTrend(null); }

  async function handleAdd() {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const res  = await fetch("/api/admin/social/trends", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, confidenceScore: Number(form.confidenceScore), popularityScore: Number(form.popularityScore), expiresAt: form.expiresAt || null }),
      });
      const data = await res.json();
      if (data.trend) {
        setTrends((prev) => [{ ...data.trend, createdAt: data.trend.createdAt ?? new Date().toISOString(), expiresAt: data.trend.expiresAt ?? null }, ...prev]);
        closeModal();
      }
    } finally { setSubmitting(false); }
  }

  async function handleEdit() {
    if (!editingTrend || !form.title.trim()) return;
    setSubmitting(true);
    try {
      const res  = await fetch(`/api/admin/social/trends/${editingTrend.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, confidenceScore: Number(form.confidenceScore), popularityScore: Number(form.popularityScore), expiresAt: form.expiresAt || null }),
      });
      const data = await res.json();
      if (data.trend) {
        setTrends((prev) => prev.map((t) => t.id === editingTrend.id
          ? { ...data.trend, createdAt: t.createdAt, expiresAt: data.trend.expiresAt ?? null }
          : t
        ));
        closeModal();
      }
    } finally { setSubmitting(false); }
  }

  async function handleToggleActive(trend: TrendInsightRow) {
    const res  = await fetch(`/api/admin/social/trends/${trend.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !trend.isActive }),
    });
    const data = await res.json();
    if (data.trend) setTrends((prev) => prev.map((t) => t.id === trend.id ? { ...t, isActive: data.trend.isActive } : t));
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const lastRun = runs[0] ?? null;

  return (
    <>
      {/* Automated Research section */}
      <AutomatedResearchSection
        settings={settings}
        lastRun={lastRun}
        onRunResearch={handleRunResearch}
        onEditSettings={() => setShowSettingsModal(true)}
        onViewHistory={() => setShowHistoryModal(true)}
        running={running}
      />

      {/* Run result flash */}
      {runResult !== null && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-green-900/20 border border-green-800/30 rounded-xl text-xs text-green-400">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Research complete — {runResult.trendsFound} new trend{runResult.trendsFound !== 1 ? "s" : ""} added
          {runResult.skipped > 0 && `, ${runResult.skipped} duplicate${runResult.skipped !== 1 ? "s" : ""} skipped`}.
          {runResult.trendsFound > 0 && " Scroll down to review."}
        </div>
      )}

      {/* Manual trend toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={openAdd}
          className="text-sm bg-white text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          + Add Trend
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
            Click <strong className="text-gray-400">Run Now</strong> above to generate trend ideas automatically,
            or <strong className="text-gray-400">+ Add Trend</strong> to enter one manually.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button onClick={handleRunResearch} disabled={running}
              className="text-xs bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-gray-700 text-[#151b23] font-bold px-4 py-2 rounded-lg transition-colors">
              {running ? "Researching…" : "Run Research"}
            </button>
            <button onClick={openAdd}
              className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-4 py-2 transition-colors">
              Add manually
            </button>
          </div>
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
        <TrendModal title="Add Trend Insight" form={form} setForm={setForm}
          onClose={closeModal} onSubmit={handleAdd} submitting={submitting} />
      )}

      {/* Edit modal */}
      {editingTrend && (
        <TrendModal title="Edit Trend Insight" form={form} setForm={setForm}
          onClose={closeModal} onSubmit={handleEdit} submitting={submitting} />
      )}

      {/* Settings modal */}
      {showSettingsModal && settings && (
        <ResearchSettingsModal
          settings={settings}
          onClose={() => setShowSettingsModal(false)}
          onSaved={(s) => { setSettings(s); setShowSettingsModal(false); }}
        />
      )}

      {/* History modal */}
      {showHistoryModal && (
        <ResearchHistoryModal runs={runs} onClose={() => setShowHistoryModal(false)} />
      )}
    </>
  );
}
