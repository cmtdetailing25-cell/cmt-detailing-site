"use client";

import { useState } from "react";

const CAMPAIGN_TYPES = [
  { value: "ORGANIC_POST", label: "Organic Post" },
  { value: "REEL",         label: "Reel" },
  { value: "VIDEO_AD",     label: "Video Ad" },
  { value: "META_AD",      label: "Meta Ad" },
  { value: "STORY",        label: "Story" },
  { value: "CAROUSEL",     label: "Carousel" },
];

const PLATFORMS = ["Instagram", "Facebook", "Instagram + Facebook", "TikTok"];

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateCampaignModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    type:          "ORGANIC_POST",
    title:         "",
    goal:          "",
    platform:      "Instagram",
    campaignBrief: "",
    budget:        "",
    startDate:     "",
    endDate:       "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.type || !form.title.trim()) {
      setError("Type and title are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/automation/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          budget:    form.budget    ? parseFloat(form.budget)   : undefined,
          startDate: form.startDate ? form.startDate            : undefined,
          endDate:   form.endDate   ? form.endDate              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); setSaving(false); return; }
      onCreated();
      onClose();
    } catch {
      setError("Network error — try again");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#151b23] border border-[#434e56] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2d3840]">
          <div>
            <h2 className="text-[#e9f0ef] font-semibold text-sm">New Campaign</h2>
            <p className="text-[#708289] text-xs mt-0.5">Create a marketing campaign to automate via n8n</p>
          </div>
          <button onClick={onClose} className="text-[#708289] hover:text-white transition-colors p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type + Platform */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-1.5">Campaign Type *</label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full bg-[#1e2730] border border-[#434e56] rounded-lg px-3 py-2.5 text-sm text-[#e9f0ef] focus:outline-none focus:border-[#94b2b6] transition-colors"
              >
                {CAMPAIGN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-1.5">Platform</label>
              <select
                value={form.platform}
                onChange={(e) => set("platform", e.target.value)}
                className="w-full bg-[#1e2730] border border-[#434e56] rounded-lg px-3 py-2.5 text-sm text-[#e9f0ef] focus:outline-none focus:border-[#94b2b6] transition-colors"
              >
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-1.5">Campaign Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Spring Ceramic Coating Push — May 2026"
              className="w-full bg-[#1e2730] border border-[#434e56] rounded-lg px-3 py-2.5 text-sm text-[#e9f0ef] placeholder-[#434e56] focus:outline-none focus:border-[#94b2b6] transition-colors"
            />
          </div>

          {/* Goal */}
          <div>
            <label className="block text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-1.5">Campaign Goal</label>
            <input
              value={form.goal}
              onChange={(e) => set("goal", e.target.value)}
              placeholder="e.g. Generate 5 ceramic coating leads"
              className="w-full bg-[#1e2730] border border-[#434e56] rounded-lg px-3 py-2.5 text-sm text-[#e9f0ef] placeholder-[#434e56] focus:outline-none focus:border-[#94b2b6] transition-colors"
            />
          </div>

          {/* Brief */}
          <div>
            <label className="block text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-1.5">Campaign Brief</label>
            <textarea
              rows={3}
              value={form.campaignBrief}
              onChange={(e) => set("campaignBrief", e.target.value)}
              placeholder="Describe the campaign angle, tone, target audience, key messages…"
              className="w-full bg-[#1e2730] border border-[#434e56] rounded-lg px-3 py-2.5 text-sm text-[#e9f0ef] placeholder-[#434e56] focus:outline-none focus:border-[#94b2b6] resize-none transition-colors"
            />
          </div>

          {/* Budget + Dates (only for META_AD / VIDEO_AD) */}
          {(form.type === "META_AD" || form.type === "VIDEO_AD") && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-1.5">Budget ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.budget}
                  onChange={(e) => set("budget", e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#1e2730] border border-[#434e56] rounded-lg px-3 py-2.5 text-sm text-[#e9f0ef] placeholder-[#434e56] focus:outline-none focus:border-[#94b2b6] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-1.5">Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)}
                  className="w-full bg-[#1e2730] border border-[#434e56] rounded-lg px-3 py-2.5 text-sm text-[#e9f0ef] focus:outline-none focus:border-[#94b2b6] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-1.5">End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)}
                  className="w-full bg-[#1e2730] border border-[#434e56] rounded-lg px-3 py-2.5 text-sm text-[#e9f0ef] focus:outline-none focus:border-[#94b2b6] transition-colors" />
              </div>
            </div>
          )}

          {form.type === "META_AD" && (
            <div className="bg-amber-950/30 border border-amber-800/30 rounded-lg px-4 py-3">
              <p className="text-amber-400 text-xs font-semibold mb-1">Ad Safety</p>
              <p className="text-amber-600 text-xs">Ad campaigns require approval before launch or budget changes. n8n will create ads in PAUSED mode only.</p>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-[#434e56] disabled:text-[#708289] text-[#151b23] text-sm font-bold py-2.5 rounded-lg transition-colors">
              {saving ? "Creating…" : "Create Campaign"}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-[#708289] hover:text-white transition-colors px-3 py-2.5">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
