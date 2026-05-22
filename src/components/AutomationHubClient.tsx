"use client";

import { useState, useCallback } from "react";
import CreateCampaignModal from "./CreateCampaignModal";
import AutomationSettingsModal from "./AutomationSettingsModal";
import CampaignDetailModal from "./CampaignDetailModal";

type CS =
  | "IDEA" | "TREND_REVIEW" | "STRATEGY_PENDING_APPROVAL" | "CREATIVE_PENDING"
  | "CREATIVE_PENDING_APPROVAL" | "APPROVED_TO_PUBLISH" | "PUBLISHED"
  | "ACTIVE_AD" | "COMPLETED" | "ARCHIVED" | "FAILED";
type CT = "ORGANIC_POST" | "REEL" | "VIDEO_AD" | "META_AD" | "STORY" | "CAROUSEL";

export interface CampaignRow {
  id: string; type: CT; status: CS; title: string;
  goal: string | null; platform: string | null; budget: number | null;
  createdAt: string; updatedAt: string;
  client: { id: string; fullName: string } | null;
  trendInsight: { id: string; title: string } | null;
  assets: Array<{ id: string; type: string; status: string; url: string | null; thumbnailUrl: string | null; title: string }>;
  latestRun: { id: string; status: string; workflowType: string; createdAt: string; errorMessage: string | null } | null;
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
  STRATEGY_PENDING_APPROVAL:  "Needs Strategy Approval",
  CREATIVE_PENDING:           "Creative Pending",
  CREATIVE_PENDING_APPROVAL:  "Needs Creative Approval",
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

const PIPELINE_STAGES: { label: string; statuses: CS[]; amber?: boolean }[] = [
  { label: "Ideas",           statuses: ["IDEA"]                                           },
  { label: "Research",        statuses: ["TREND_REVIEW"]                                   },
  { label: "Strategy Review", statuses: ["STRATEGY_PENDING_APPROVAL"], amber: true         },
  { label: "Creative",        statuses: ["CREATIVE_PENDING", "CREATIVE_PENDING_APPROVAL"], amber: true },
  { label: "Approved",        statuses: ["APPROVED_TO_PUBLISH"]                            },
  { label: "Live",            statuses: ["PUBLISHED", "ACTIVE_AD"]                         },
  { label: "Done",            statuses: ["COMPLETED", "ARCHIVED", "FAILED"]                },
];

// ── Next-action logic ─────────────────────────────────────────────────────────

interface CampaignAction {
  label:    string;
  route:    string;
  body:     Record<string, unknown>;
  confirm?: string;
  variant?: "amber" | "green" | "default";
}

function getNextAction(c: CampaignRow): CampaignAction | null {
  const id = c.id;
  switch (c.status) {
    case "IDEA":
      return { label: "Research Trends", route: "/api/admin/automation/run-trend-research", body: { campaignId: id } };
    case "TREND_REVIEW":
      return { label: "Create Strategy",  route: "/api/admin/automation/create-strategy",       body: { campaignId: id } };
    case "STRATEGY_PENDING_APPROVAL":
      return { label: "Approve Strategy", route: `/api/admin/automation/campaigns/${id}/approve`, body: { stage: "strategy" }, variant: "amber" };
    case "CREATIVE_PENDING":
      return c.type === "VIDEO_AD"
        ? { label: "Generate Video",        route: "/api/admin/automation/create-remotion-video", body: { campaignId: id } }
        : { label: "Generate Canva Assets", route: "/api/admin/automation/create-canva-assets",   body: { campaignId: id } };
    case "CREATIVE_PENDING_APPROVAL":
      return { label: "Approve Creative",   route: `/api/admin/automation/campaigns/${id}/approve`, body: { stage: "creative" }, variant: "amber" };
    case "APPROVED_TO_PUBLISH":
      return c.type === "META_AD"
        ? {
            label:   "Create Meta Ad (Paused)",
            route:   "/api/admin/automation/create-meta-ad",
            body:    { campaignId: id },
            confirm: "This sends a PAUSED ad campaign to Meta via n8n. You must activate it manually in Meta Ads Manager.",
            variant: "green",
          }
        : {
            label:   "Publish Campaign",
            route:   "/api/admin/automation/publish-approved-campaign",
            body:    { campaignId: id },
            confirm: "This sends the approved campaign to n8n for publishing. Continue?",
            variant: "green",
          };
    case "PUBLISHED":
    case "ACTIVE_AD":
      return { label: "Sync Performance", route: "/api/admin/automation/sync-performance", body: { campaignId: id } };
    default:
      return null;
  }
}

// ── Campaign card ─────────────────────────────────────────────────────────────

function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  function copy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
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

function CampaignCard({
  campaign,
  loading,
  msg,
  onAction,
  onDetail,
}: {
  campaign:  CampaignRow;
  loading:   boolean;
  msg:       { type: "success" | "error"; text: string } | undefined;
  onAction:  (action: CampaignAction) => void;
  onDetail:  () => void;
}) {
  const action     = getNextAction(campaign);
  const needsAttn  = campaign.status === "STRATEGY_PENDING_APPROVAL" || campaign.status === "CREATIVE_PENDING_APPROVAL";

  const btnCls =
    action?.variant === "amber"   ? "bg-amber-600 hover:bg-amber-500 text-white" :
    action?.variant === "green"   ? "bg-green-700 hover:bg-green-600 text-white" :
                                    "bg-[#1e2730] hover:bg-[#2d3840] text-[#94b2b6] border border-[#434e56]";

  return (
    <div className={`bg-[#151b23] border rounded-xl p-4 ${needsAttn ? "border-amber-800/40" : "border-[#2d3840]"}`}>
      {/* Type + status */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
          {TYPE_LABEL[campaign.type]}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${STATUS_CLS[campaign.status]}`}>
          {STATUS_LABEL[campaign.status]}
        </span>
      </div>

      <p className="text-sm text-[#e9f0ef] font-medium leading-snug mb-1 line-clamp-2">{campaign.title}</p>

      {campaign.goal && (
        <p className="text-xs text-[#708289] truncate mb-2">{campaign.goal}</p>
      )}

      {/* Campaign ID row */}
      <div className="flex items-center gap-1.5 mb-3">
        <code className="text-[10px] text-[#434e56] font-mono truncate flex-1">{campaign.id}</code>
        <CopyIdButton id={campaign.id} />
      </div>

      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mb-3">
        {campaign.platform && <span className="text-[10px] text-[#708289]">{campaign.platform}</span>}
        {campaign.budget != null && <span className="text-[10px] text-[#708289]">${campaign.budget.toFixed(0)} budget</span>}
        {campaign.client && <span className="text-[10px] text-[#708289]">{campaign.client.fullName}</span>}
      </div>

      {campaign.latestRun && (
        <div className="flex items-center gap-1.5 mb-3">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            campaign.latestRun.status === "COMPLETED" ? "bg-green-500" :
            campaign.latestRun.status === "RUNNING"   ? "bg-yellow-400 animate-pulse" :
            campaign.latestRun.status === "FAILED"    ? "bg-red-500" : "bg-gray-600"
          }`} />
          <span className="text-[10px] text-[#708289]">
            {campaign.latestRun.workflowType.replace(/_/g, " ")} · {campaign.latestRun.status.toLowerCase()}
          </span>
        </div>
      )}

      {msg && (
        <p className={`text-[10px] mb-2 ${msg.type === "success" ? "text-green-400" : "text-red-400"}`}>{msg.text}</p>
      )}

      {action && (
        <button
          onClick={() => onAction(action)}
          disabled={loading}
          className={`w-full text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${btnCls}`}
        >
          {loading ? "Working…" : action.label}
        </button>
      )}

      {/* Details button */}
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
  initialCampaigns,
  initialRuns,
  initialAssets,
  initialSettings,
}: Props) {
  const [campaigns,         setCampaigns]         = useState<CampaignRow[]>(initialCampaigns);
  const [showCreate,        setShowCreate]        = useState(false);
  const [showSettings,      setShowSettings]      = useState(false);
  const [detailCampaignId,  setDetailCampaignId]  = useState<string | null>(null);
  const [actionLoading,     setActionLoading]     = useState<Record<string, boolean>>({});
  const [actionMsg,         setActionMsg]         = useState<Record<string, { type: "success" | "error"; text: string }>>({});

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/automation/campaigns");
    if (res.ok) {
      const data = await res.json();
      setCampaigns(data.campaigns);
    }
  }, []);

  async function triggerAction(campaign: CampaignRow, action: CampaignAction) {
    if (action.confirm && !window.confirm(action.confirm)) return;
    setActionLoading((p) => ({ ...p, [campaign.id]: true }));
    setActionMsg((p)  => { const n = { ...p }; delete n[campaign.id]; return n; });
    try {
      const res  = await fetch(action.route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.body),
      });
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

  const pendingApproval = campaigns.filter(
    (c) => c.status === "STRATEGY_PENDING_APPROVAL" || c.status === "CREATIVE_PENDING_APPROVAL"
  );
  const totalActive    = campaigns.filter((c) => c.status === "PUBLISHED" || c.status === "ACTIVE_AD").length;
  const totalCompleted = campaigns.filter((c) => c.status === "COMPLETED").length;

  const urlsConfigured = initialSettings
    ? [
        initialSettings.socialWorkflowWebhookUrl,
        initialSettings.trendWorkflowWebhookUrl,
        initialSettings.canvaWorkflowWebhookUrl,
        initialSettings.remotionWorkflowWebhookUrl,
        initialSettings.metaAdsWorkflowWebhookUrl,
      ].filter(Boolean).length
    : 0;

  return (
    <div className="p-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Marketing Automation</h1>
          <p className="text-gray-400 text-sm">Campaign pipeline · n8n workflow control center</p>
        </div>
        <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-4 bg-amber-950/30 border border-amber-800/40 rounded-xl px-5 py-4 mb-6">
          <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-amber-400 font-semibold text-sm">
              {pendingApproval.length} campaign{pendingApproval.length !== 1 ? "s" : ""} awaiting your approval
            </p>
            <p className="text-amber-600 text-xs mt-0.5 truncate max-w-lg">
              {pendingApproval.map((c) => c.title).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {([
          { label: "Total Campaigns", value: campaigns.length,        sub: "all time",           accent: undefined           },
          { label: "Needs Approval",  value: pendingApproval.length,  sub: undefined,            accent: pendingApproval.length > 0 ? "amber" : undefined },
          { label: "Live",            value: totalActive,             sub: undefined,            accent: totalActive > 0 ? "green" : undefined },
          { label: "Completed",       value: totalCompleted,          sub: "published + synced", accent: undefined           },
        ] as { label: string; value: number; sub: string | undefined; accent: string | undefined }[]).map(({ label, value, sub, accent }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-2">{label}</p>
            <p className={`text-3xl font-bold ${accent === "amber" ? "text-amber-400" : accent === "green" ? "text-green-400" : "text-white"}`}>
              {value}
            </p>
            {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Campaign Pipeline */}
      <div className="mb-10">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-5">Campaign Pipeline</p>

        {campaigns.length === 0 ? (
          <div className="border border-dashed border-gray-800 rounded-xl px-6 py-12 flex flex-col items-center text-center gap-3">
            <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm font-medium text-gray-500">No campaigns yet</p>
            <p className="text-xs text-gray-600 max-w-sm leading-relaxed">
              Create your first campaign to start the automation pipeline.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 text-xs text-[#151b23] bg-[#94b2b6] hover:bg-[#7a9ea3] rounded-lg px-4 py-2 font-bold transition-colors"
            >
              + New Campaign
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {PIPELINE_STAGES.map((stage) => {
              const stageCampaigns = campaigns.filter((c) => (stage.statuses as string[]).includes(c.status));
              if (stageCampaigns.length === 0) return null;
              return (
                <div key={stage.label}>
                  <div className="flex items-center gap-2 mb-3">
                    <p className={`text-xs font-semibold ${stage.amber ? "text-amber-400" : "text-gray-400"}`}>
                      {stage.label}
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${stage.amber ? "bg-amber-900/30 text-amber-500" : "bg-gray-800 text-gray-600"}`}>
                      {stageCampaigns.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {stageCampaigns.map((campaign) => (
                      <CampaignCard
                        key={campaign.id}
                        campaign={campaign}
                        loading={actionLoading[campaign.id] ?? false}
                        msg={actionMsg[campaign.id]}
                        onAction={(action) => triggerAction(campaign, action)}
                        onDetail={() => setDetailCampaignId(campaign.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Workflow Runs */}
      <div className="mb-10">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-4">Recent Workflow Runs</p>
        {initialRuns.length === 0 ? (
          <p className="text-xs text-gray-600 italic">No workflow runs yet.</p>
        ) : (
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            {initialRuns.slice(0, 15).map((run, idx) => (
              <div
                key={run.id}
                className={`flex items-center gap-3 px-4 py-3 ${idx % 2 === 0 ? "bg-gray-900" : "bg-gray-900/50"} border-b border-gray-800/50 last:border-0`}
              >
                <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${RUN_STATUS_CLS[run.status] ?? "bg-gray-800 text-gray-400"}`}>
                  {run.status}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">{run.workflowType.replace(/_/g, " ")}</p>
                  {run.campaign && (
                    <p className="text-[10px] text-gray-600 truncate">{run.campaign.title}</p>
                  )}
                </div>
                {run.n8nExecutionId && (
                  <span className="text-[10px] text-gray-600 font-mono shrink-0">#{run.n8nExecutionId.slice(-6)}</span>
                )}
                {run.errorMessage && (
                  <span className="text-[10px] text-red-400 truncate max-w-[120px]" title={run.errorMessage}>
                    {run.errorMessage}
                  </span>
                )}
                <span className="text-[10px] text-gray-700 shrink-0">
                  {new Date(run.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creative Assets */}
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
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    asset.status === "APPROVED"  ? "bg-green-900/40 text-green-400" :
                    asset.status === "REJECTED"  ? "bg-red-900/30 text-red-400"    :
                                                   "bg-gray-800 text-gray-500"
                  }`}>
                    {asset.status}
                  </span>
                  <span className="text-[10px] text-gray-600">{asset.provider}</span>
                </div>
                {asset.campaign && (
                  <p className="text-[10px] text-gray-700 truncate mt-1">{asset.campaign.title}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* n8n Connection status */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">n8n Connection</p>
          <button onClick={() => setShowSettings(true)} className="text-xs text-gray-500 hover:text-white transition-colors">
            Configure →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Automation",      value: initialSettings?.isEnabled         ? "Enabled"         : "Disabled",     ok: initialSettings?.isEnabled         },
            { label: "Base URL",        value: initialSettings?.n8nBaseUrl         ? "Configured"      : "Not set",      ok: !!initialSettings?.n8nBaseUrl        },
            { label: "Webhook Secret",  value: initialSettings?.webhookSecretIsSet ? "Set"             : "Not set",      ok: initialSettings?.webhookSecretIsSet  },
            { label: "Webhook URLs",    value: `${urlsConfigured} / 5 configured`,                                       ok: urlsConfigured > 0                   },
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

      {/* Modals */}
      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); refresh(); }}
        />
      )}
      {showSettings && (
        <AutomationSettingsModal
          initialSettings={
            initialSettings
              ? { ...initialSettings, webhookSecret: null }
              : null
          }
          onClose={() => setShowSettings(false)}
          onSaved={() => setShowSettings(false)}
        />
      )}
      {detailCampaignId && (
        <CampaignDetailModal
          campaignId={detailCampaignId}
          onClose={() => setDetailCampaignId(null)}
        />
      )}
    </div>
  );
}
