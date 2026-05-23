"use client";

import { useEffect, useState, useCallback } from "react";

interface WorkflowRun {
  id: string;
  workflowType: string;
  status: string;
  n8nExecutionId: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface CampaignMediaItem {
  id: string;
  role: string;
  sortOrder: number;
  sitePhoto: {
    id: string;
    imageUrl: string;
    title: string;
    category: string;
    label: string | null;
    fileType: string | null;
  };
}

interface LibraryPhoto {
  id: string;
  imageUrl: string;
  title: string;
  category: string;
  label: string | null;
}

interface AssetDetail {
  id: string;
  type: string;
  url: string | null;
  thumbnailUrl: string | null;
  title: string;
  notes: string | null;
  status: string;
  createdAt: string;
}

interface CampaignDetail {
  id: string;
  type: string;
  status: string;
  title: string;
  goal: string | null;
  platform: string | null;
  campaignBrief: string | null;
  approvedStrategy: string | null;
  approvedCaption: string | null;
  approvedHashtags: string | null;
  approvedCreativeNotes: string | null;
  budget: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  assets: AssetDetail[];
  campaignMedia: CampaignMediaItem[];
  workflowRuns: WorkflowRun[];
}

interface Props {
  campaignId: string;
  onClose: () => void;
}

const RUN_STATUS_CLS: Record<string, string> = {
  PENDING:   "bg-gray-800 text-gray-400",
  RUNNING:   "bg-yellow-900/40 text-yellow-400",
  COMPLETED: "bg-green-900/40 text-green-400",
  FAILED:    "bg-red-900/30 text-red-400",
};

const WORKFLOW_TYPE_LABEL: Record<string, string> = {
  TREND_RESEARCH:          "Trend Research",
  CLAUDE_STRATEGY:         "Strategy Generation",
  CANVA_ASSET_CREATION:    "Canva Asset Creation",
  REMOTION_VIDEO_CREATION: "Remotion Video",
  META_PUBLISHING:         "Meta Publishing",
  META_AD_CREATION:        "Meta Ad Creation",
  PERFORMANCE_SYNC:        "Performance Sync",
};

function fmtWorkflowType(t: string): string {
  return WORKFLOW_TYPE_LABEL[t] ?? t.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(iso: string | null | undefined): string {
  return iso
    ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "—";
}

const BTN_CLS = "text-[10px] font-semibold px-2 py-1 rounded bg-[#1e2730] border border-[#434e56] text-[#94b2b6] hover:text-white hover:border-[#94b2b6] transition-colors";

const CAMPAIGN_ROLES = [
  { value: "before",    label: "Before"         },
  { value: "process",   label: "Process"         },
  { value: "after",     label: "After"           },
  { value: "reveal",    label: "Reveal"          },
  { value: "logo",      label: "Logo / Branding" },
  { value: "thumbnail", label: "Thumbnail"       },
  { value: "general",   label: "General"         },
];

const ROLE_CLS: Record<string, string> = {
  before:    "bg-zinc-800 text-zinc-300",
  process:   "bg-blue-900/40 text-blue-400",
  after:     "bg-green-900/40 text-green-400",
  reveal:    "bg-violet-900/40 text-violet-300",
  logo:      "bg-purple-900/30 text-purple-400",
  thumbnail: "bg-amber-900/30 text-amber-400",
  general:   "bg-gray-800 text-gray-400",
};

function VideoAssetCard({ asset, isLatest }: { asset: AssetDetail; isLatest: boolean }) {
  const [videoErrored, setVideoErrored] = useState(false);

  return (
    <div className="bg-[#0e1520] border border-[#2d3840] rounded-xl overflow-hidden">
      {!isLatest && (
        <div className="px-3 py-1.5 bg-[#1a2128] border-b border-[#2d3840]">
          <p className="text-[10px] text-[#434e56]">Previous render</p>
        </div>
      )}

      {asset.url ? (
        <>
          {!videoErrored ? (
            /* eslint-disable-next-line jsx-a11y/media-has-caption */
            <video
              controls
              className="w-full max-h-64 bg-black"
              poster={asset.thumbnailUrl ?? undefined}
              src={asset.url}
              onError={() => setVideoErrored(true)}
            />
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center gap-2 bg-[#0e1520]">
              <p className="text-xs text-red-400">Video failed to load</p>
              <a href={asset.url} target="_blank" rel="noopener noreferrer" className={BTN_CLS}>
                Open URL ↗
              </a>
            </div>
          )}
          <div className="p-3 space-y-2">
            <p className="text-xs text-[#e9f0ef] font-medium">{asset.title}</p>
            {asset.notes && <p className="text-[10px] text-[#708289]">{asset.notes}</p>}
            <p className="text-[10px] text-[#434e56]">Rendered: {fmtDate(asset.createdAt)}</p>
            <div className="flex gap-2 flex-wrap">
              {!videoErrored && (
                <a href={asset.url} target="_blank" rel="noopener noreferrer" className={BTN_CLS}>
                  Open Video ↗
                </a>
              )}
              <a href={asset.url} download className={BTN_CLS}>Download</a>
              <CopyButton text={asset.url} label="Copy URL" />
            </div>
          </div>
        </>
      ) : (
        <div className="px-4 py-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <p className="text-xs text-red-400">Video asset missing — URL not returned by Remotion callback</p>
        </div>
      )}
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }
  return (
    <button
      onClick={copy}
      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1e2730] border border-[#434e56] text-[#94b2b6] hover:text-white hover:border-[#94b2b6] transition-colors shrink-0"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className="text-xs text-[#e9f0ef] leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export default function CampaignDetailModal({ campaignId, onClose }: Props) {
  const [campaign,       setCampaign]       = useState<CampaignDetail | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [runBusy,        setRunBusy]        = useState<Record<string, boolean>>({});
  // Campaign Media state
  const [mediaItems,     setMediaItems]     = useState<CampaignMediaItem[]>([]);
  const [mediaBusy,      setMediaBusy]      = useState<Record<string, boolean>>({});
  const [mediaLoading,   setMediaLoading]   = useState(false);
  const [showPicker,     setShowPicker]     = useState(false);
  const [libraryPhotos,  setLibraryPhotos]  = useState<LibraryPhoto[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [pickerSearch,   setPickerSearch]   = useState("");

  const loadCampaign = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/automation/campaigns/${campaignId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.campaign) {
          setCampaign(data.campaign);
          setMediaItems(data.campaign.campaignMedia ?? []);
        } else {
          setError(data.error ?? "Failed to load");
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [campaignId]);

  useEffect(() => { loadCampaign(); }, [loadCampaign]);

  async function updateRun(runId: string, action: "complete" | "cancel") {
    setRunBusy((p) => ({ ...p, [runId]: true }));
    try {
      await fetch(`/api/admin/automation/runs/${runId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      loadCampaign();
    } finally {
      setRunBusy((p) => ({ ...p, [runId]: false }));
    }
  }

  const loadLibraryPhotos = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) setLibraryPhotos(await res.json());
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  async function attachMedia(sitePhotoId: string, role: string) {
    setMediaLoading(true);
    try {
      const res = await fetch(`/api/admin/automation/campaigns/${campaignId}/media`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sitePhotoId, role }),
      });
      if (res.ok) {
        const data = await res.json();
        setMediaItems((prev) => {
          const idx = prev.findIndex((m) => m.sitePhoto.id === sitePhotoId);
          return idx >= 0 ? prev.map((m, i) => i === idx ? data.media : m) : [...prev, data.media];
        });
      }
    } finally {
      setMediaLoading(false);
    }
  }

  async function removeMedia(mediaId: string) {
    setMediaBusy((p) => ({ ...p, [mediaId]: true }));
    try {
      await fetch(`/api/admin/automation/campaigns/${campaignId}/media/${mediaId}`, { method: "DELETE" });
      setMediaItems((prev) => prev.filter((m) => m.id !== mediaId));
    } finally {
      setMediaBusy((p) => { const n = { ...p }; delete n[mediaId]; return n; });
    }
  }

  async function updateMediaRole(mediaId: string, role: string) {
    setMediaBusy((p) => ({ ...p, [mediaId]: true }));
    try {
      const res = await fetch(`/api/admin/automation/campaigns/${campaignId}/media/${mediaId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ role }),
      });
      if (res.ok) {
        const data = await res.json();
        setMediaItems((prev) => prev.map((m) => m.id === mediaId ? data.media : m));
      }
    } finally {
      setMediaBusy((p) => { const n = { ...p }; delete n[mediaId]; return n; });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#151b23] border border-[#434e56] rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2d3840] shrink-0">
          <div>
            <h2 className="text-[#e9f0ef] font-semibold text-sm">Campaign Detail</h2>
            <p className="text-[#708289] text-xs mt-0.5">Full record for n8n testing</p>
          </div>
          <button onClick={onClose} className="text-[#708289] hover:text-white transition-colors p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {loading && <p className="text-xs text-[#708289] text-center py-8">Loading…</p>}
          {error && <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">{error}</p>}

          {campaign && (
            <>
              {/* Campaign ID */}
              <div className="bg-[#1e2730] border border-[#434e56] rounded-xl px-4 py-3">
                <p className="text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-2">Campaign ID</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-[#94b2b6] font-mono break-all">{campaign.id}</code>
                  <CopyButton text={campaign.id} label="Copy ID" />
                </div>
                <p className="text-[10px] text-[#434e56] mt-2">
                  Use this as <code className="text-[#708289]">campaignId</code> in n8n callback payloads.
                </p>
              </div>

              {/* Core fields */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Title",    value: campaign.title },
                  { label: "Status",   value: campaign.status.replace(/_/g, " ") },
                  { label: "Type",     value: campaign.type.replace(/_/g, " ") },
                  { label: "Platform", value: campaign.platform },
                  { label: "Budget",   value: campaign.budget != null ? `$${campaign.budget.toFixed(2)}` : null },
                  { label: "Goal",     value: campaign.goal },
                ].map(({ label, value }) =>
                  value ? (
                    <div key={label}>
                      <p className="text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-0.5">{label}</p>
                      <p className="text-xs text-[#e9f0ef]">{value}</p>
                    </div>
                  ) : null
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-0.5">Created</p>
                  <p className="text-xs text-[#e9f0ef] font-mono">{fmtDate(campaign.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-0.5">Updated</p>
                  <p className="text-xs text-[#e9f0ef] font-mono">{fmtDate(campaign.updatedAt)}</p>
                </div>
                {campaign.startDate && (
                  <div>
                    <p className="text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-0.5">Start Date</p>
                    <p className="text-xs text-[#e9f0ef] font-mono">{fmtDate(campaign.startDate)}</p>
                  </div>
                )}
                {campaign.endDate && (
                  <div>
                    <p className="text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-0.5">End Date</p>
                    <p className="text-xs text-[#e9f0ef] font-mono">{fmtDate(campaign.endDate)}</p>
                  </div>
                )}
              </div>

              {/* Strategy & Copy */}
              {(campaign.campaignBrief || campaign.approvedStrategy || campaign.approvedCaption || campaign.approvedHashtags || campaign.approvedCreativeNotes) && (
                <div className="border-t border-[#2d3840] pt-4 space-y-4">
                  <p className="text-[10px] text-[#708289] uppercase tracking-wider font-semibold">Strategy & Copy</p>
                  <Field label="Campaign Brief"    value={campaign.campaignBrief} />
                  <Field label="Approved Strategy" value={campaign.approvedStrategy} />
                  <Field label="Approved Caption"  value={campaign.approvedCaption} />
                  <Field label="Approved Hashtags" value={campaign.approvedHashtags} />
                  <Field label="Creative Notes"    value={campaign.approvedCreativeNotes} />
                </div>
              )}

              {/* Campaign Media */}
              <div className="border-t border-[#2d3840] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] text-[#708289] uppercase tracking-wider font-semibold">
                    Campaign Media ({mediaItems.length})
                  </p>
                  <button
                    onClick={() => { setShowPicker(!showPicker); if (!showPicker && libraryPhotos.length === 0) loadLibraryPhotos(); }}
                    className={BTN_CLS}
                  >
                    {showPicker ? "Close Picker" : "+ Add from Library"}
                  </button>
                </div>

                {/* No media warning */}
                {mediaItems.length === 0 && (
                  <div className="flex items-start gap-2 bg-amber-950/30 border border-amber-800/30 rounded-lg px-3 py-2.5 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1" />
                    <p className="text-[10px] text-amber-300/80 leading-relaxed">
                      No media attached. Render will be a placeholder test only. Attach at least 1 before, 1 process, and 1 after photo for a real render.
                    </p>
                  </div>
                )}

                {/* Role coverage hint */}
                {mediaItems.length > 0 && (() => {
                  const roles = new Set(mediaItems.map((m) => m.role));
                  const hasAfter = roles.has("after") || roles.has("reveal");
                  const missing = [
                    !roles.has("before")  && "before",
                    !roles.has("process") && "process",
                    !hasAfter             && "after/reveal",
                  ].filter(Boolean) as string[];
                  if (missing.length === 0) return null;
                  return (
                    <p className="text-[10px] text-amber-500 mb-3">
                      Missing roles: {missing.join(", ")} — reel structure may be incomplete.
                    </p>
                  );
                })()}

                {/* Attached grid */}
                {mediaItems.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {mediaItems.map((item) => (
                      <div key={item.id} className="bg-[#0e1520] border border-[#2d3840] rounded-lg overflow-hidden">
                        <div className="relative aspect-square">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.sitePhoto.imageUrl} alt={item.sitePhoto.title} className="w-full h-full object-cover" />
                          <span className={`absolute top-1 left-1 text-[9px] font-bold px-1 py-0.5 rounded ${ROLE_CLS[item.role] ?? ROLE_CLS.general}`}>
                            {item.role}
                          </span>
                          <button
                            onClick={() => removeMedia(item.id)}
                            disabled={mediaBusy[item.id]}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 flex items-center justify-center text-white text-xs transition-colors disabled:opacity-50"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                        <div className="p-1.5">
                          <p className="text-[9px] text-[#708289] truncate mb-1" title={item.sitePhoto.title}>{item.sitePhoto.title}</p>
                          <select
                            value={item.role}
                            onChange={(e) => updateMediaRole(item.id, e.target.value)}
                            disabled={mediaBusy[item.id]}
                            className="w-full bg-[#1a2128] border border-[#2d3840] rounded px-1 py-0.5 text-[9px] text-[#e9f0ef] focus:outline-none focus:border-[#94b2b6] disabled:opacity-50"
                          >
                            {CAMPAIGN_ROLES.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Photo picker */}
                {showPicker && (
                  <div className="border border-[#2d3840] rounded-xl p-3 bg-[#0e1520]">
                    <input
                      type="text"
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      placeholder="Search library by title or category…"
                      className="w-full bg-[#1a2128] border border-[#2d3840] rounded px-2 py-1.5 text-xs text-[#e9f0ef] placeholder-[#434e56] focus:outline-none focus:border-[#94b2b6] mb-3"
                    />
                    {libraryLoading ? (
                      <p className="text-[10px] text-[#708289] text-center py-4">Loading library…</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                          {libraryPhotos
                            .filter((p) => {
                              if (mediaItems.some((m) => m.sitePhoto.id === p.id)) return false;
                              if (!pickerSearch) return true;
                              const q = pickerSearch.toLowerCase();
                              return p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
                            })
                            .map((photo) => (
                              <button
                                key={photo.id}
                                onClick={() => attachMedia(photo.id, photo.label ?? "general")}
                                disabled={mediaLoading}
                                className="relative aspect-square rounded overflow-hidden border border-transparent hover:border-[#94b2b6] group transition-colors disabled:opacity-50"
                                title={photo.title}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <span className="text-[10px] text-white font-bold">+ Add</span>
                                </div>
                              </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-[#434e56] mt-2">
                          Click a photo to attach it. Role is auto-set from the photo&apos;s label — change it in the grid above.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Video Assets */}
              {campaign.assets.filter((a) => a.type === "REMOTION_VIDEO").length > 0 && (
                <div className="border-t border-[#2d3840] pt-4 space-y-4">
                  <p className="text-[10px] text-[#708289] uppercase tracking-wider font-semibold">
                    Video Assets ({campaign.assets.filter((a) => a.type === "REMOTION_VIDEO").length})
                  </p>
                  {campaign.assets
                    .filter((a) => a.type === "REMOTION_VIDEO")
                    .map((asset, idx) => (
                      <VideoAssetCard key={asset.id} asset={asset} isLatest={idx === 0} />
                    ))}
                </div>
              )}

              {/* Workflow Runs */}
              <div className="border-t border-[#2d3840] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] text-[#708289] uppercase tracking-wider font-semibold">
                    Workflow Runs ({campaign.workflowRuns.length})
                  </p>
                  <button
                    onClick={loadCampaign}
                    className="text-[10px] text-[#708289] hover:text-white transition-colors"
                  >
                    Refresh ↻
                  </button>
                </div>
                {campaign.workflowRuns.length === 0 ? (
                  <p className="text-xs text-[#434e56] italic">No runs yet.</p>
                ) : (
                  <div className="rounded-xl border border-[#2d3840] overflow-hidden">
                    {campaign.workflowRuns.slice(0, 20).map((run, idx) => {
                      const isActive = run.status === "RUNNING" || run.status === "PENDING";
                      const busy     = runBusy[run.id] ?? false;
                      return (
                        <div
                          key={run.id}
                          className={`px-4 py-3 border-b border-[#2d3840] last:border-0 ${idx % 2 === 0 ? "bg-[#1a2128]" : "bg-[#151b23]"}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${RUN_STATUS_CLS[run.status] ?? "bg-gray-800 text-gray-400"}`}>
                              {run.status}
                            </span>
                            <span className="text-xs text-[#e9f0ef] font-medium flex-1">
                              {fmtWorkflowType(run.workflowType)}
                            </span>
                            {/* Per-run management buttons for active runs */}
                            {isActive && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => updateRun(run.id, "complete")}
                                  disabled={busy}
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-green-900/30 border border-green-800/50 text-green-400 hover:text-green-300 transition-colors disabled:opacity-40"
                                >
                                  {busy ? "…" : "Mark Complete"}
                                </button>
                                <button
                                  onClick={() => updateRun(run.id, "cancel")}
                                  disabled={busy}
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-900/20 border border-red-900/40 text-red-400 hover:text-red-300 transition-colors disabled:opacity-40"
                                >
                                  {busy ? "…" : "Cancel"}
                                </button>
                              </div>
                            )}
                            <span className="text-[10px] text-[#434e56] shrink-0">{fmtDate(run.createdAt)}</span>
                          </div>

                          {/* Run ID for debugging */}
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] text-[#708289]">Run ID:</p>
                            <code className="text-[10px] text-[#434e56] font-mono truncate">{run.id}</code>
                            <CopyButton text={run.id} label="Copy" />
                          </div>

                          {run.n8nExecutionId && (
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[10px] text-[#708289]">Execution ID:</p>
                              <code className="text-[10px] text-[#94b2b6] font-mono">{run.n8nExecutionId}</code>
                              <CopyButton text={run.n8nExecutionId} label="Copy" />
                            </div>
                          )}
                          {run.errorMessage && (
                            <p className="text-[10px] text-red-400 mt-1">{run.errorMessage}</p>
                          )}
                          {(run.startedAt || run.completedAt) && (
                            <p className="text-[10px] text-[#434e56] mt-1">
                              {run.startedAt   ? `Started: ${fmtDate(run.startedAt)}`    : ""}
                              {run.completedAt ? ` · Done: ${fmtDate(run.completedAt)}` : ""}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Callback URLs reference */}
              <div className="bg-[#0e1520] border border-[#2d3840] rounded-xl px-4 py-3">
                <p className="text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-2">n8n Callback Routes</p>
                <div className="space-y-1">
                  {[
                    { path: "/api/automation/callback/trends",               note: "Stores trend research · stays TREND_REVIEW" },
                    { path: "/api/automation/callback/strategy",             note: "Sets strategy · moves to STRATEGY_PENDING_APPROVAL" },
                    { path: "/api/automation/callback/assets",               note: "Adds Canva/Remotion assets" },
                    { path: "/api/automation/callback/remotion-video",       note: "Adds rendered video asset" },
                    { path: "/api/automation/callback/publish-confirmation", note: "Marks PUBLISHED or ACTIVE_AD" },
                    { path: "/api/automation/callback/performance",          note: "Records performance stats" },
                  ].map(({ path, note }) => (
                    <div key={path} className="flex items-start gap-2">
                      <code className="text-[10px] text-[#94b2b6] font-mono shrink-0">{path}</code>
                      <span className="text-[10px] text-[#434e56]">— {note}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#434e56] mt-3">
                  Callbacks require <code className="text-[#708289]">X-Webhook-Secret</code> header,{" "}
                  <code className="text-[#708289]">campaignId</code>, and{" "}
                  <code className="text-[#708289]">workflowRunId</code> in the body.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2d3840] shrink-0">
          <button onClick={onClose} className="text-sm text-[#708289] hover:text-white transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}
