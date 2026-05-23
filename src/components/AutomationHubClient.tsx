"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import CreateCampaignModal from "./CreateCampaignModal";
import AutomationSettingsModal, { type LiveAutomationSettings } from "./AutomationSettingsModal";
import CampaignDetailModal from "./CampaignDetailModal";

type CS =
  | "IDEA" | "TREND_REVIEW" | "STRATEGY_PENDING_APPROVAL" | "CREATIVE_PENDING"
  | "CREATIVE_PENDING_APPROVAL" | "VIDEO_RENDER_PENDING" | "VIDEO_READY_REVIEW"
  | "APPROVED_TO_PUBLISH" | "PUBLISHED"
  | "ACTIVE_AD" | "COMPLETED" | "ARCHIVED" | "FAILED";
type CT = "ORGANIC_POST" | "REEL" | "VIDEO_AD" | "META_AD" | "STORY" | "CAROUSEL";

export interface CampaignRow {
  id: string; type: CT; status: CS; title: string;
  goal: string | null; platform: string | null; budget: number | null;
  createdAt: string; updatedAt: string;
  isTest: boolean;
  approvedStrategy:      string | null;
  approvedCaption:       string | null;
  approvedHashtags:      string | null;
  approvedCreativeNotes: string | null;
  client: { id: string; fullName: string } | null;
  trendInsight: { id: string; title: string } | null;
  assets: Array<{ id: string; type: string; status: string; url: string | null; thumbnailUrl: string | null; title: string }>;
  latestRun: { id: string; status: string; workflowType: string; createdAt: string; completedAt: string | null; errorMessage: string | null } | null;
  latestStats: { impressions: number; reach: number; likes: number; spend: number; leads: number } | null;
}

export interface WorkflowRunRow {
  id: string; campaignId: string | null; workflowType: string; status: string;
  n8nExecutionId: string | null; errorMessage: string | null;
  startedAt: string | null; completedAt: string | null; createdAt: string;
  campaign: { id: string; title: string; type: string } | null;
}

export interface AssetRow {
  id: string; campaignId: string; type: string; provider: string;
  url: string | null; thumbnailUrl: string | null; title: string; status: string;
  createdAt: string; campaign: { id: string; title: string } | null;
}

export interface SettingsRow {
  id: string;
  n8nBaseUrl: string | null;
  socialWorkflowWebhookUrl: string | null;
  trendWorkflowWebhookUrl: string | null;
  canvaWorkflowWebhookUrl: string | null;
  remotionWorkflowWebhookUrl: string | null;
  metaAdsWorkflowWebhookUrl: string | null;
  webhookSecretIsSet: boolean;
  isEnabled: boolean;
}

interface Props {
  initialCampaigns: CampaignRow[];
  initialRuns: WorkflowRunRow[];
  initialAssets: AssetRow[];
  initialSettings: SettingsRow | null;
}

// ── Display maps ──────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<CS, string> = {
  IDEA:                       "Idea",
  TREND_REVIEW:               "Trend Review",
  STRATEGY_PENDING_APPROVAL:  "Strategy Ready — Review",
  CREATIVE_PENDING:           "Creative Pending",
  CREATIVE_PENDING_APPROVAL:  "Needs Creative Approval",
  VIDEO_RENDER_PENDING:       "Rendering Video…",
  VIDEO_READY_REVIEW:         "Video Ready — Review",
  APPROVED_TO_PUBLISH:        "Approved to Publish",
  PUBLISHED:                  "Published",
  ACTIVE_AD:                  "Live Ad",
  COMPLETED:                  "Completed",
  ARCHIVED:                   "Archived",
  FAILED:                     "Failed",
};

const STATUS_CLS: Record<CS, string> = {
  IDEA:                       "bg-gray-800 text-gray-400",
  TREND_REVIEW:               "bg-blue-900/30 text-blue-400",
  STRATEGY_PENDING_APPROVAL:  "bg-amber-900/40 text-amber-400",
  CREATIVE_PENDING:           "bg-purple-900/30 text-purple-400",
  CREATIVE_PENDING_APPROVAL:  "bg-amber-900/40 text-amber-400",
  VIDEO_RENDER_PENDING:       "bg-indigo-900/40 text-indigo-400",
  VIDEO_READY_REVIEW:         "bg-violet-900/40 text-violet-300",
  APPROVED_TO_PUBLISH:        "bg-green-900/40 text-green-400",
  PUBLISHED:                  "bg-green-900/60 text-green-300",
  ACTIVE_AD:                  "bg-emerald-900/40 text-emerald-300",
  COMPLETED:                  "bg-teal-900/30 text-teal-400",
  ARCHIVED:                   "bg-gray-900 text-gray-600",
  FAILED:                     "bg-red-900/30 text-red-400",
};

const RUN_STATUS_CLS: Record<string, string> = {
  PENDING:   "bg-gray-800 text-gray-400",
  RUNNING:   "bg-yellow-900/40 text-yellow-400",
  COMPLETED: "bg-green-900/40 text-green-400",
  FAILED:    "bg-red-900/30 text-red-400",
};

const TYPE_LABEL: Record<CT, string> = {
  ORGANIC_POST: "Post",
  REEL:         "Reel",
  VIDEO_AD:     "Video Ad",
  META_AD:      "Meta Ad",
  STORY:        "Story",
  CAROUSEL:     "Carousel",
};

const PIPELINE_STAGES: { label: string; statuses: CS[]; amber?: boolean; muted?: boolean }[] = [
  { label: "Ideas",           statuses: ["IDEA"]                                                             },
  { label: "Research",        statuses: ["TREND_REVIEW"]                                                     },
  { label: "Strategy Review", statuses: ["STRATEGY_PENDING_APPROVAL"],                 amber: true           },
  { label: "Creative",        statuses: ["CREATIVE_PENDING", "CREATIVE_PENDING_APPROVAL"], amber: true       },
  { label: "Video Render",    statuses: ["VIDEO_RENDER_PENDING"]                                             },
  { label: "Video Review",    statuses: ["VIDEO_READY_REVIEW"],                         amber: true           },
  { label: "Approved",        statuses: ["APPROVED_TO_PUBLISH"]                                              },
  { label: "Published",       statuses: ["PUBLISHED", "ACTIVE_AD"]                                          },
  { label: "Completed",       statuses: ["COMPLETED"]                                                        },
  { label: "Archived",        statuses: ["ARCHIVED"],                                  muted: true           },
  { label: "Failed",          statuses: ["FAILED"],                                    muted: true           },
];

// ── Next-action logic ─────────────────────────────────────────────────────────

interface CampaignAction {
  label: string; route: string; body: Record<string, unknown>;
  confirm?: string; variant?: "amber" | "green" | "default";
}

function getNextAction(c: CampaignRow): CampaignAction | null {
  const id = c.id;
  switch (c.status) {
    case "IDEA":
      return { label: "Research Trends", route: "/api/admin/automation/run-trend-research", body: { campaignId: id } };
    case "TREND_REVIEW":
      return { label: "Create Strategy", route: "/api/admin/automation/create-strategy", body: { campaignId: id } };
    case "STRATEGY_PENDING_APPROVAL":
      return { label: "Approve Strategy", route: `/api/admin/automation/campaigns/${id}/approve`, body: { stage: "strategy" }, variant: "amber" };
    case "CREATIVE_PENDING":
      return c.type === "VIDEO_AD"
        ? { label: "Generate Video",        route: "/api/admin/automation/create-remotion-video", body: { campaignId: id } }
        : { label: "Generate Canva Assets", route: "/api/admin/automation/create-canva-assets",   body: { campaignId: id } };
    case "CREATIVE_PENDING_APPROVAL":
      return { label: "Approve Creative", route: `/api/admin/automation/campaigns/${id}/approve`, body: { stage: "creative" }, variant: "amber" };
    case "VIDEO_RENDER_PENDING":
      // Auto-trigger fires on creative approval; this button is a manual fallback
      return { label: "Render Video", route: "/api/admin/automation/create-remotion-video", body: { campaignId: id } };
    case "VIDEO_READY_REVIEW":
      return { label: "Approve Video", route: `/api/admin/automation/campaigns/${id}/approve`, body: { stage: "video" }, variant: "amber" };
    case "APPROVED_TO_PUBLISH":
      return c.type === "META_AD"
        ? { label: "Create Meta Ad (Paused)", route: "/api/admin/automation/create-meta-ad", body: { campaignId: id }, confirm: "This sends a PAUSED ad campaign to Meta via n8n. You must activate it manually in Meta Ads Manager.", variant: "green" }
        : { label: "Publish Campaign",        route: "/api/admin/automation/publish-approved-campaign", body: { campaignId: id }, confirm: "This sends the approved campaign to n8n for publishing. Continue?", variant: "green" };
    case "PUBLISHED":
    case "ACTIVE_AD":
      return { label: "Sync Performance", route: "/api/admin/automation/sync-performance", body: { campaignId: id } };
    default:
      return null;
  }
}

// ── Derived workflow state ────────────────────────────────────────────────────
// Single source of truth for all run-state-derived booleans on a campaign card.
// A run is only "processing" if it has no completedAt — guards against stale
// RUNNING/PENDING records left over from prior test runs.

interface WorkflowState {
  isProcessing:      boolean; // actively running in n8n right now
  isCompleted:       boolean; // last run finished successfully
  isStuck:           boolean; // processing AND older than 10 min
  latestWorkflowState: string | null;
}

function deriveWorkflowState(c: CampaignRow): WorkflowState {
  const run = c.latestRun;
  if (!run) return { isProcessing: false, isCompleted: false, isStuck: false, latestWorkflowState: null };

  const runActive = (run.status === "RUNNING" || run.status === "PENDING") && run.completedAt === null;
  // VIDEO_RENDER_PENDING and VIDEO_READY_REVIEW have dedicated pipeline sections with retry UI;
  // never classify as stuck so they always stay in their sections and never get swallowed by the stuck bucket
  const isVideoRenderStatus = c.status === "VIDEO_RENDER_PENDING" || c.status === "VIDEO_READY_REVIEW";
  const stuck = !isVideoRenderStatus && runActive && Date.now() - new Date(run.createdAt).getTime() > 10 * 60 * 1000;

  return {
    isProcessing:      runActive,
    isCompleted:       run.status === "COMPLETED",
    isStuck:           stuck,
    latestWorkflowState: run.status,
  };
}

function isStuck(c: CampaignRow): boolean { return deriveWorkflowState(c).isStuck; }

// ── Sub-components ────────────────────────────────────────────────────────────

function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  function copy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(id).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }
  return (
    <button
      onClick={copy}
      title="Copy campaign ID"
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#1e2730] border border-[#434e56] text-[#708289] hover:text-[#94b2b6] hover:border-[#94b2b6] transition-colors shrink-0"
    >
      {copied ? "✓" : "Copy ID"}
    </button>
  );
}

type ManageAction = "archive" | "delete" | "reset" | "cancel" | "markTest";

function CardMenu({ campaign, onAction }: { campaign: CampaignRow; onAction: (a: ManageAction) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isProcessing } = deriveWorkflowState(campaign);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function act(a: ManageAction) { setOpen(false); onAction(a); }

  const item    = "w-full text-left px-3 py-1.5 text-xs text-[#e9f0ef] hover:bg-[#2d3840] transition-colors";
  const danger  = "w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/30 transition-colors";

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 text-[#434e56] hover:text-[#708289] transition-colors rounded"
        title="Campaign actions"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-6 z-30 bg-[#151b23] border border-[#434e56] rounded-xl shadow-2xl w-44 py-1 overflow-hidden">
          {campaign.status !== "ARCHIVED" && <button className={item} onClick={() => act("archive")}>Archive</button>}
          {campaign.status !== "IDEA"     && <button className={item} onClick={() => act("reset")}>Reset to IDEA</button>}
          {isProcessing                    && <button className={item} onClick={() => act("cancel")}>Cancel Processing</button>}
          <button className={item} onClick={() => act("markTest")}>
            {campaign.isTest ? "Unmark as Test" : "Mark as Test"}
          </button>
          <div className="border-t border-[#2d3840] my-1" />
          <button className={danger} onClick={() => act("delete")}>Delete Campaign</button>
        </div>
      )}
    </div>
  );
}

function CampaignCard({
  campaign, loading, msg, onAction, onDetail, onManageAction, managing, isSelected, onSelect,
}: {
  campaign:       CampaignRow;
  loading:        boolean;
  msg:            { type: "success" | "error"; text: string } | undefined;
  onAction:       (action: CampaignAction) => void;
  onDetail:       () => void;
  onManageAction: (a: ManageAction) => void;
  managing:       boolean;
  isSelected:     boolean;
  onSelect:       (v: boolean) => void;
}) {
  const action = getNextAction(campaign);
  const { isProcessing, isStuck: stuck, latestWorkflowState } = deriveWorkflowState(campaign);
  const hasFailed = latestWorkflowState === "FAILED" && !!campaign.latestRun?.errorMessage;
  const isVideoRenderFailed = campaign.status === "VIDEO_RENDER_PENDING" && latestWorkflowState === "FAILED";
  const needsAttn = campaign.status === "STRATEGY_PENDING_APPROVAL" || campaign.status === "CREATIVE_PENDING_APPROVAL" || campaign.status === "VIDEO_READY_REVIEW";
  const videoAsset = campaign.status === "VIDEO_READY_REVIEW"
    ? (campaign.assets.find((a) => a.type === "REMOTION_VIDEO") ?? null)
    : null;
  const hasStrategy =
    campaign.status === "STRATEGY_PENDING_APPROVAL" &&
    !!(campaign.approvedCaption || campaign.approvedStrategy || campaign.approvedHashtags);

  const btnCls =
    action?.variant === "amber" ? "bg-amber-600 hover:bg-amber-500 text-white" :
    action?.variant === "green" ? "bg-green-700 hover:bg-green-600 text-white" :
                                  "bg-[#1e2730] hover:bg-[#2d3840] text-[#94b2b6] border border-[#434e56]";

  const borderCls =
    stuck              ? "border-orange-800/50" :
    isProcessing       ? "border-yellow-800/40" :
    isVideoRenderFailed ? "border-red-800/40"   :
    needsAttn          ? "border-amber-800/40"  :
    isSelected         ? "border-[#94b2b6]/50"  :
                         "border-[#2d3840]";

  return (
    <div className={`bg-[#151b23] border rounded-xl p-4 flex flex-col gap-0 relative ${borderCls}${isSelected ? " ring-1 ring-[#94b2b6]/20" : ""}`}>

      {/* Selection checkbox */}
      {managing && (
        <label className="absolute top-3 left-3 z-10 cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="accent-[#94b2b6] w-3.5 h-3.5"
          />
        </label>
      )}

      {/* Type + status + menu row */}
      <div className={`flex items-center gap-1.5 mb-2.5 ${managing ? "pl-5" : ""}`}>
        <span className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
          {TYPE_LABEL[campaign.type]}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${STATUS_CLS[campaign.status]}`}>
          {STATUS_LABEL[campaign.status]}
        </span>
        {campaign.isTest && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-400 font-semibold">TEST</span>
        )}
        <div className="ml-auto">
          <CardMenu campaign={campaign} onAction={onManageAction} />
        </div>
      </div>

      <p className="text-sm text-[#e9f0ef] font-medium leading-snug mb-1 line-clamp-2">{campaign.title}</p>
      {campaign.goal && <p className="text-xs text-[#708289] truncate mb-2">{campaign.goal}</p>}

      {/* Campaign ID */}
      <div className="flex items-center gap-1.5 mb-3">
        <code className="text-[10px] text-[#434e56] font-mono truncate flex-1">{campaign.id}</code>
        <CopyIdButton id={campaign.id} />
      </div>

      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mb-3">
        {campaign.platform  && <span className="text-[10px] text-[#708289]">{campaign.platform}</span>}
        {campaign.budget != null && <span className="text-[10px] text-[#708289]">${campaign.budget.toFixed(0)} budget</span>}
        {campaign.client    && <span className="text-[10px] text-[#708289]">{campaign.client.fullName}</span>}
      </div>

      {/* ── Stuck state ───────────────────────────────────────────── */}
      {stuck && (
        <div className="flex items-start gap-2.5 bg-orange-950/30 border border-orange-800/30 rounded-lg px-3 py-2.5 mb-3">
          <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-orange-300 font-medium">Stuck — processing &gt; 10 min</p>
            <p className="text-[10px] text-orange-700 mb-2">{campaign.latestRun!.workflowType.replace(/_/g, " ")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => onManageAction("reset")}
                className="text-[10px] font-semibold px-2 py-1 rounded bg-orange-900/40 border border-orange-700/50 text-orange-300 hover:text-orange-200 transition-colors"
              >Reset to IDEA</button>
              <button
                onClick={() => onManageAction("cancel")}
                className="text-[10px] font-semibold px-2 py-1 rounded bg-[#1e2730] border border-[#434e56] text-[#708289] hover:text-white transition-colors"
              >Cancel Run</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Processing state (non-stuck) ──────────────────────────── */}
      {isProcessing && !stuck && (
        <div className="flex items-center gap-2.5 bg-yellow-950/30 border border-yellow-800/30 rounded-lg px-3 py-2.5 mb-3">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin shrink-0" />
          <div>
            <p className="text-xs text-yellow-300 font-medium">Processing in n8n…</p>
            <p className="text-[10px] text-yellow-700">{campaign.latestRun!.workflowType.replace(/_/g, " ")} · auto-refreshing</p>
          </div>
        </div>
      )}

      {/* ── Run status line (not processing) ──────────────────────── */}
      {campaign.latestRun && !isProcessing && (
        <div className="flex items-center gap-1.5 mb-3">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${latestWorkflowState === "COMPLETED" ? "bg-green-500" : latestWorkflowState === "FAILED" ? "bg-red-500" : "bg-gray-600"}`} />
          <span className="text-[10px] text-[#708289]">
            {campaign.latestRun.workflowType.replace(/_/g, " ")} · {latestWorkflowState?.toLowerCase()}
          </span>
        </div>
      )}

      {/* ── Error state ───────────────────────────────────────────── */}
      {hasFailed && (
        <div className="bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2.5 mb-3">
          <p className="text-xs text-red-400 font-medium">Workflow failed</p>
          <p className="text-[10px] text-red-600 mt-0.5 line-clamp-2">{campaign.latestRun!.errorMessage}</p>
        </div>
      )}

      {/* ── Video preview (VIDEO_READY_REVIEW) ───────────────────── */}
      {campaign.status === "VIDEO_READY_REVIEW" && (
        <div className="rounded-lg overflow-hidden mb-3 border border-[#2d3840] bg-[#0e1520]">
          {videoAsset?.thumbnailUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={videoAsset.thumbnailUrl}
                alt="Video thumbnail"
                className="w-full aspect-video object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  const placeholder = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement | null;
                  if (placeholder) placeholder.style.display = "flex";
                }}
              />
              <div
                style={{ display: "none" }}
                className="aspect-video items-center justify-center bg-[#0e1520]"
              >
                <p className="text-[10px] text-[#708289]">Video Preview</p>
              </div>
            </>
          ) : videoAsset?.url ? (
            <div className="aspect-video flex items-center justify-center">
              <div className="flex flex-col items-center gap-1.5">
                <svg className="w-7 h-7 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <p className="text-[10px] text-[#708289]">Video ready</p>
              </div>
            </div>
          ) : (
            <div className="px-3 py-2.5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <p className="text-[10px] text-red-400">Video asset missing — URL not returned</p>
            </div>
          )}
        </div>
      )}

      {/* ── Strategy preview ──────────────────────────────────────── */}
      {hasStrategy && (
        <div className="bg-[#0e1520] border border-[#2d3840] rounded-xl p-3 mb-3">
          <p className="text-[10px] text-[#94b2b6] uppercase tracking-wider font-semibold mb-2">Generated Strategy</p>
          {campaign.approvedStrategy && (
            <p className="text-xs text-[#e9f0ef] leading-relaxed line-clamp-3 mb-2">{campaign.approvedStrategy}</p>
          )}
          {campaign.approvedCaption && (
            <p className="text-xs text-[#708289] italic line-clamp-2 mb-1.5">&ldquo;{campaign.approvedCaption}&rdquo;</p>
          )}
          {campaign.approvedHashtags && (
            <p className="text-[10px] text-[#94b2b6]/70 line-clamp-1">{campaign.approvedHashtags}</p>
          )}
        </div>
      )}

      {/* Only show msg when not actively processing — prevents "Done ✓" + spinner coexisting */}
      {msg && !isProcessing && (
        <p className={`text-[10px] mb-2 ${msg.type === "success" ? "text-green-400" : "text-red-400"}`}>{msg.text}</p>
      )}

      {/* Action button (hidden while processing) */}
      {!isProcessing && action && (
        <button
          onClick={() => onAction(action)}
          disabled={loading}
          className={`w-full text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${btnCls}`}
        >
          {loading ? "Working…" : isVideoRenderFailed ? "Retry Render Video" : action.label}
        </button>
      )}

      {/* Test Render fallback — always available at VIDEO_RENDER_PENDING */}
      {!isProcessing && campaign.status === "VIDEO_RENDER_PENDING" && (
        <button
          onClick={() => onAction({
            label: "Test Render",
            route: "/api/admin/automation/create-remotion-video",
            body:  { campaignId: campaign.id, isTestRender: true },
          })}
          disabled={loading}
          className="w-full mt-1 text-[10px] text-[#434e56] hover:text-[#708289] py-1 transition-colors disabled:opacity-50"
        >
          or Test Render (no media required)
        </button>
      )}

      <button
        onClick={onDetail}
        className="w-full mt-2 text-[11px] text-[#708289] hover:text-[#94b2b6] py-1.5 rounded-lg transition-colors border border-transparent hover:border-[#2d3840]"
      >
        View details &amp; runs →
      </button>

      {campaign.latestStats && (campaign.status === "PUBLISHED" || campaign.status === "ACTIVE_AD") && (
        <div className="grid grid-cols-3 gap-1.5 mt-2 pt-3 border-t border-[#2d3840]">
          {[
            { label: "Reach", value: campaign.latestStats.reach.toLocaleString() },
            { label: "Likes", value: campaign.latestStats.likes.toLocaleString() },
            { label: "Leads", value: campaign.latestStats.leads.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-xs font-semibold text-white">{value}</p>
              <p className="text-[9px] text-[#708289]">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main hub ──────────────────────────────────────────────────────────────────

export default function AutomationHubClient({
  initialCampaigns, initialRuns, initialAssets, initialSettings,
}: Props) {
  const [campaigns,        setCampaigns]        = useState<CampaignRow[]>(initialCampaigns);
  const [showCreate,       setShowCreate]       = useState(false);
  const [showSettings,     setShowSettings]     = useState(false);
  const [detailCampaignId, setDetailCampaignId] = useState<string | null>(null);
  const [actionLoading,    setActionLoading]    = useState<Record<string, boolean>>({});
  const [actionMsg,        setActionMsg]        = useState<Record<string, { type: "success" | "error"; text: string }>>({});
  const [liveSettings,     setLiveSettings]     = useState<SettingsRow | null>(initialSettings);
  const [managing,         setManaging]         = useState(false);
  const [selectedIds,      setSelectedIds]      = useState<Set<string>>(new Set<string>());
  const [bulkLoading,      setBulkLoading]      = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/automation/campaigns");
    if (res.ok) {
      const data = await res.json();
      setCampaigns(data.campaigns);
    }
  }, []);

  // Poll every 3 s while any campaign is actively processing (RUNNING/PENDING with no completedAt)
  useEffect(() => {
    const hasActive = campaigns.some((c) => deriveWorkflowState(c).isProcessing);
    if (!hasActive) return;
    const timer = setTimeout(refresh, 3000);
    return () => clearTimeout(timer);
  }, [campaigns, refresh]);

  // ── Workflow action (trigger n8n) ──────────────────────────────────────────

  async function triggerAction(campaign: CampaignRow, action: CampaignAction) {
    if (action.confirm && !window.confirm(action.confirm)) return;
    setActionLoading((p) => ({ ...p, [campaign.id]: true }));
    setActionMsg((p) => { const n = { ...p }; delete n[campaign.id]; return n; });
    try {
      const res  = await fetch(action.route, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action.body) });
      const data = await res.json();
      if (res.ok) {
        setActionMsg((p) => ({ ...p, [campaign.id]: { type: "success", text: data.message ?? "Done ✓" } }));
        await refresh();
      } else {
        setActionMsg((p) => ({ ...p, [campaign.id]: { type: "error", text: data.error ?? "Failed" } }));
      }
    } catch {
      setActionMsg((p) => ({ ...p, [campaign.id]: { type: "error", text: "Network error" } }));
    } finally {
      setActionLoading((p) => ({ ...p, [campaign.id]: false }));
    }
  }

  // ── Per-card management actions ────────────────────────────────────────────

  async function manageAction(campaign: CampaignRow, action: ManageAction) {
    const id = campaign.id;

    if (action === "delete") {
      if (!window.confirm(`Permanently delete "${campaign.title}"? This cannot be undone.`)) return;
      await fetch(`/api/admin/automation/campaigns/${id}`, { method: "DELETE" });
      await refresh();
      return;
    }

    if (action === "cancel") {
      if (!window.confirm(`Cancel processing for "${campaign.title}" and reset to IDEA?`)) return;
      await fetch("/api/admin/automation/campaigns/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", ids: [id] }),
      });
      await refresh();
      return;
    }

    const body: Record<string, unknown> =
      action === "archive"  ? { status: "ARCHIVED" }      :
      action === "reset"    ? { status: "IDEA" }           :
      action === "markTest" ? { isTest: !campaign.isTest } : {};

    await fetch(`/api/admin/automation/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await refresh();
  }

  // ── Bulk selection helpers ─────────────────────────────────────────────────

  function toggleSelect(id: string, v: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (v) next.add(id); else next.delete(id);
      return next;
    });
  }

  function selectAll() { setSelectedIds(new Set<string>(campaigns.map((c) => c.id))); }
  function clearSel()  { setSelectedIds(new Set<string>()); }

  function addStageToSelection(stageCampaigns: CampaignRow[]) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      stageCampaigns.forEach((c) => next.add(c.id));
      return next;
    });
  }

  // ── Bulk operations ────────────────────────────────────────────────────────

  async function runBulkAction(action: string) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (action === "delete" && !window.confirm(`Permanently delete ${ids.length} campaign(s)? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      await fetch("/api/admin/automation/campaigns/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      clearSel();
      setManaging(false);
      await refresh();
    } finally {
      setBulkLoading(false);
    }
  }

  async function clearTestCampaigns() {
    const testCount = campaigns.filter((c) => c.isTest || c.title.toLowerCase().includes("test")).length;
    if (testCount === 0) { window.alert("No test campaigns found."); return; }
    if (!window.confirm(`Archive ${testCount} test campaign(s)? (isTest=true or title contains "test")`)) return;
    setBulkLoading(true);
    try {
      await fetch("/api/admin/automation/campaigns/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clearTest" }),
      });
      await refresh();
    } finally {
      setBulkLoading(false);
    }
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const stuckCampaigns  = campaigns.filter(isStuck);
  const nonStuck        = campaigns.filter((c) => !isStuck(c));
  const pendingApproval = campaigns.filter((c) => c.status === "STRATEGY_PENDING_APPROVAL" || c.status === "CREATIVE_PENDING_APPROVAL" || c.status === "VIDEO_READY_REVIEW");
  const totalActive     = campaigns.filter((c) => c.status === "PUBLISHED" || c.status === "ACTIVE_AD").length;
  const totalCompleted  = campaigns.filter((c) => c.status === "COMPLETED").length;
  const testCount       = campaigns.filter((c) => c.isTest || c.title.toLowerCase().includes("test")).length;

  const urlsConfigured = liveSettings
    ? [
        liveSettings.socialWorkflowWebhookUrl, liveSettings.trendWorkflowWebhookUrl,
        liveSettings.canvaWorkflowWebhookUrl,  liveSettings.remotionWorkflowWebhookUrl,
        liveSettings.metaAdsWorkflowWebhookUrl,
      ].filter(Boolean).length
    : 0;

  function renderCard(campaign: CampaignRow) {
    return (
      <CampaignCard
        key={campaign.id}
        campaign={campaign}
        loading={actionLoading[campaign.id] ?? false}
        msg={actionMsg[campaign.id]}
        onAction={(action) => triggerAction(campaign, action)}
        onDetail={() => setDetailCampaignId(campaign.id)}
        onManageAction={(action) => manageAction(campaign, action)}
        managing={managing}
        isSelected={selectedIds.has(campaign.id)}
        onSelect={(v) => toggleSelect(campaign.id, v)}
      />
    );
  }

  return (
    <div className="p-6 max-w-6xl pb-28">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Marketing Automation</h1>
          <p className="text-gray-400 text-sm">Campaign pipeline · n8n workflow control center</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {testCount > 0 && (
            <button
              onClick={clearTestCampaigns}
              disabled={bulkLoading}
              className="text-xs text-purple-400 hover:text-purple-300 bg-purple-900/20 border border-purple-800/40 hover:border-purple-700/60 rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
            >
              Clear Test ({testCount})
            </button>
          )}
          <button
            onClick={() => { setManaging(!managing); clearSel(); }}
            className={`text-xs rounded-lg px-3 py-2 border transition-colors ${
              managing
                ? "bg-[#94b2b6] text-[#151b23] border-transparent font-bold"
                : "text-gray-400 hover:text-white bg-gray-900 border-gray-800 hover:border-gray-700"
            }`}
          >
            {managing ? "Done Selecting" : "Manage"}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-lg px-3 py-2 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            n8n Settings
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-xs text-[#151b23] bg-[#94b2b6] hover:bg-[#7a9ea3] rounded-lg px-3 py-2 font-bold transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Campaign
          </button>
        </div>
      </div>

      {/* Safety notice */}
      <div className="flex items-start gap-3 bg-gray-900 border border-gray-800 rounded-xl px-5 py-3.5 mb-6">
        <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-1" />
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="text-white font-semibold">Approval gates active.</span>{" "}
          Nothing publishes automatically. Ads are created in PAUSED mode only. Budget changes require admin approval. n8n webhook URLs are server-side — never sent to the browser.
        </p>
      </div>

      {/* Action Required banner */}
      {pendingApproval.length > 0 && (
        <div className="flex items-center gap-4 bg-amber-950/30 border border-amber-800/40 rounded-xl px-5 py-4 mb-4">
          <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-amber-400 font-semibold text-sm">
              {pendingApproval.length} campaign{pendingApproval.length !== 1 ? "s" : ""} awaiting your approval
            </p>
            <p className="text-amber-600 text-xs mt-0.5 truncate max-w-lg">{pendingApproval.map((c) => c.title).join(" · ")}</p>
          </div>
        </div>
      )}

      {/* Stuck banner */}
      {stuckCampaigns.length > 0 && (
        <div className="flex items-center gap-4 bg-orange-950/30 border border-orange-800/40 rounded-xl px-5 py-4 mb-4">
          <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-orange-400 font-semibold text-sm">
              {stuckCampaigns.length} campaign{stuckCampaigns.length !== 1 ? "s" : ""} stuck in processing (&gt;10 min)
            </p>
            <p className="text-orange-700 text-xs mt-0.5">{stuckCampaigns.map((c) => c.title).join(" · ")}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {([
          { label: "Total Campaigns", value: campaigns.length,       sub: "all time",           accent: undefined },
          { label: "Needs Approval",  value: pendingApproval.length, sub: undefined,            accent: pendingApproval.length > 0 ? "amber" : undefined },
          { label: "Live",            value: totalActive,            sub: undefined,            accent: totalActive > 0 ? "green" : undefined },
          { label: "Completed",       value: totalCompleted,         sub: "published + synced", accent: undefined },
        ] as { label: string; value: number; sub: string | undefined; accent: string | undefined }[]).map(({ label, value, sub, accent }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-2">{label}</p>
            <p className={`text-3xl font-bold ${accent === "amber" ? "text-amber-400" : accent === "green" ? "text-green-400" : "text-white"}`}>{value}</p>
            {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Campaign Pipeline ──────────────────────────────────────────────── */}
      <div className="mb-10">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-5">Campaign Pipeline</p>

        {campaigns.length === 0 ? (
          <div className="border border-dashed border-gray-800 rounded-xl px-6 py-12 flex flex-col items-center text-center gap-3">
            <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm font-medium text-gray-500">No campaigns yet</p>
            <button onClick={() => setShowCreate(true)} className="mt-2 text-xs text-[#151b23] bg-[#94b2b6] hover:bg-[#7a9ea3] rounded-lg px-4 py-2 font-bold transition-colors">
              + New Campaign
            </button>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Stuck section */}
            {stuckCampaigns.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-semibold text-orange-400">Stuck / Timed Out</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-orange-900/30 text-orange-500">{stuckCampaigns.length}</span>
                  {managing && (
                    <button onClick={() => addStageToSelection(stuckCampaigns)} className="text-[10px] text-[#708289] hover:text-white transition-colors ml-1">
                      Select all stuck
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {stuckCampaigns.map(renderCard)}
                </div>
              </div>
            )}

            {/* Pipeline stages (non-stuck) */}
            {PIPELINE_STAGES.map((stage) => {
              const stageCampaigns = nonStuck.filter((c) => (stage.statuses as string[]).includes(c.status));
              if (stageCampaigns.length === 0) return null;
              return (
                <div key={stage.label}>
                  <div className="flex items-center gap-2 mb-3">
                    <p className={`text-xs font-semibold ${stage.amber ? "text-amber-400" : stage.muted ? "text-gray-600" : "text-gray-400"}`}>
                      {stage.label}
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${stage.amber ? "bg-amber-900/30 text-amber-500" : stage.muted ? "bg-gray-900 text-gray-700" : "bg-gray-800 text-gray-600"}`}>
                      {stageCampaigns.length}
                    </span>
                    {managing && (
                      <button onClick={() => addStageToSelection(stageCampaigns)} className="text-[10px] text-[#708289] hover:text-white transition-colors ml-1">
                        Select all
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {stageCampaigns.map(renderCard)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent Workflow Runs ───────────────────────────────────────────── */}
      <div className="mb-10">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-4">Recent Workflow Runs</p>
        {initialRuns.length === 0 ? (
          <p className="text-xs text-gray-600 italic">No workflow runs yet.</p>
        ) : (
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            {initialRuns.slice(0, 15).map((run, idx) => (
              <div key={run.id} className={`flex items-center gap-3 px-4 py-3 ${idx % 2 === 0 ? "bg-gray-900" : "bg-gray-900/50"} border-b border-gray-800/50 last:border-0`}>
                <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${RUN_STATUS_CLS[run.status] ?? "bg-gray-800 text-gray-400"}`}>{run.status}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">{run.workflowType.replace(/_/g, " ")}</p>
                  {run.campaign && <p className="text-[10px] text-gray-600 truncate">{run.campaign.title}</p>}
                </div>
                {run.n8nExecutionId && <span className="text-[10px] text-gray-600 font-mono shrink-0">#{run.n8nExecutionId.slice(-6)}</span>}
                {run.errorMessage && <span className="text-[10px] text-red-400 truncate max-w-[120px]" title={run.errorMessage}>{run.errorMessage}</span>}
                <span className="text-[10px] text-gray-700 shrink-0">
                  {new Date(run.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Creative Assets ────────────────────────────────────────────────── */}
      {initialAssets.length > 0 && (
        <div className="mb-10">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-4">Recent Creative Assets</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {initialAssets.slice(0, 8).map((asset) => (
              <div key={asset.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                {asset.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.thumbnailUrl} alt={asset.title} className="w-full aspect-video object-cover rounded-lg mb-2" />
                ) : (
                  <div className="w-full aspect-video bg-gray-800 rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-xs text-gray-600">{asset.type}</span>
                  </div>
                )}
                <p className="text-xs text-white font-medium truncate">{asset.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${asset.status === "APPROVED" ? "bg-green-900/40 text-green-400" : asset.status === "REJECTED" ? "bg-red-900/30 text-red-400" : "bg-gray-800 text-gray-500"}`}>
                    {asset.status}
                  </span>
                  <span className="text-[10px] text-gray-600">{asset.provider}</span>
                </div>
                {asset.campaign && <p className="text-[10px] text-gray-700 truncate mt-1">{asset.campaign.title}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── n8n Connection ─────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">n8n Connection</p>
          <button onClick={() => setShowSettings(true)} className="text-xs text-gray-500 hover:text-white transition-colors">Configure →</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Automation",     value: liveSettings?.isEnabled         ? "Enabled"    : "Disabled", ok: liveSettings?.isEnabled         },
            { label: "Base URL",       value: liveSettings?.n8nBaseUrl         ? "Configured" : "Not set",  ok: !!liveSettings?.n8nBaseUrl        },
            { label: "Webhook Secret", value: liveSettings?.webhookSecretIsSet ? "Set"        : "Not set",  ok: liveSettings?.webhookSecretIsSet  },
            { label: "Webhook URLs",   value: `${urlsConfigured} / 5 configured`,                           ok: urlsConfigured > 0                },
          ].map(({ label, value, ok }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ok ? "bg-green-500" : "bg-gray-700"}`} />
              <div>
                <p className="text-[10px] text-gray-600">{label}</p>
                <p className={`text-xs font-medium ${ok ? "text-white" : "text-gray-600"}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); refresh(); }}
        />
      )}
      {showSettings && (
        <AutomationSettingsModal
          onClose={() => setShowSettings(false)}
          onSaved={(updated: LiveAutomationSettings) => {
            setLiveSettings({
              id:                         updated.id,
              isEnabled:                  updated.isEnabled,
              n8nBaseUrl:                 updated.n8nBaseUrl,
              socialWorkflowWebhookUrl:   updated.socialWorkflowWebhookUrl,
              trendWorkflowWebhookUrl:    updated.trendWorkflowWebhookUrl,
              canvaWorkflowWebhookUrl:    updated.canvaWorkflowWebhookUrl,
              remotionWorkflowWebhookUrl: updated.remotionWorkflowWebhookUrl,
              metaAdsWorkflowWebhookUrl:  updated.metaAdsWorkflowWebhookUrl,
              webhookSecretIsSet:         updated.webhookSecretIsSet,
            });
            setShowSettings(false);
          }}
        />
      )}
      {detailCampaignId && (
        <CampaignDetailModal
          campaignId={detailCampaignId}
          onClose={() => setDetailCampaignId(null)}
        />
      )}

      {/* ── Bulk action bar (fixed bottom) ────────────────────────────────── */}
      {managing && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#151b23] border-t border-[#434e56] px-6 py-4 flex items-center gap-3 shadow-2xl">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <p className="text-sm text-white font-semibold shrink-0">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select campaigns above"}
            </p>
            {selectedIds.size === 0 ? (
              <button onClick={selectAll} className="text-xs text-[#708289] hover:text-white transition-colors">
                Select all ({campaigns.length})
              </button>
            ) : (
              <button onClick={clearSel} className="text-xs text-[#708289] hover:text-white transition-colors">Clear</button>
            )}
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button onClick={() => runBulkAction("archive")}  disabled={bulkLoading} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition-colors disabled:opacity-50">Archive</button>
              <button onClick={() => runBulkAction("reset")}    disabled={bulkLoading} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition-colors disabled:opacity-50">Reset to IDEA</button>
              <button onClick={() => runBulkAction("cancel")}   disabled={bulkLoading} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition-colors disabled:opacity-50">Cancel Processing</button>
              <button onClick={() => runBulkAction("delete")}   disabled={bulkLoading} className="text-xs px-3 py-1.5 rounded-lg bg-red-900/40 text-red-400 hover:text-red-300 border border-red-900/60 transition-colors disabled:opacity-50">Delete</button>
            </div>
          )}
          <button onClick={() => { setManaging(false); clearSel(); }} className="text-xs text-[#708289] hover:text-white transition-colors shrink-0 ml-2">Done</button>
        </div>
      )}
    </div>
  );
}
