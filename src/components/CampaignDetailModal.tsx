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
  const [campaign,    setCampaign]    = useState<CampaignDetail | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [runBusy,     setRunBusy]     = useState<Record<string, boolean>>({});

  const loadCampaign = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/automation/campaigns/${campaignId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.campaign) setCampaign(data.campaign);
        else setError(data.error ?? "Failed to load");
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

  const fmtDate = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

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
                    { path: "/api/automation/callback/strategy",             note: "Sets strategy + moves to CREATIVE_PENDING" },
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
