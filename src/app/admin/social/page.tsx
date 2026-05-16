import { prisma } from "@/lib/prisma";
import type { SocialAgentRunStatus } from "@prisma/client";
import MediaIntelligencePanel from "@/components/MediaIntelligencePanel";
import DraftGenerator from "@/components/DraftGenerator";
import DraftSection from "@/components/DraftSection";
import WeeklyAgentButton from "@/components/WeeklyAgentButton";
import TrendIntelligencePanel from "@/components/TrendIntelligencePanel";
import type { SerializedDraft } from "@/components/DraftSection";
import type { TrendInsightRow } from "@/components/TrendIntelligencePanel";

export const dynamic = "force-dynamic";

// ─── Small inline components ──────────────────────────────────────────────────

function ComingSoon() {
  return (
    <span className="text-[9px] bg-gray-800 text-gray-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ml-1.5 align-middle">
      Soon
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: "yellow" | "green" | "red";
}) {
  const valueColor =
    accent === "yellow" ? "text-yellow-400" :
    accent === "green"  ? "text-green-400"  :
    accent === "red"    ? "text-red-400"    : "text-white";
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-2">{label}</p>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

function AgentRunBadge({ status }: { status: SocialAgentRunStatus | null }) {
  if (!status) return <span className="text-xs text-gray-600 italic">No runs yet</span>;
  const map: Record<SocialAgentRunStatus, { label: string; cls: string }> = {
    PENDING:   { label: "Pending",   cls: "bg-gray-800 text-gray-400" },
    RUNNING:   { label: "Running",   cls: "bg-yellow-900/40 text-yellow-400" },
    COMPLETED: { label: "Completed", cls: "bg-green-900/40 text-green-400" },
    FAILED:    { label: "Failed",    cls: "bg-red-900/40 text-red-400" },
  };
  const { label, cls } = map[status];
  return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>;
}

function SectionHeader({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <div id={id} className="border-t border-gray-800/60 pt-10 mt-12">
      <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-[0.2em] mb-1">{eyebrow}</p>
      <h2 className="text-lg font-semibold text-white mb-6">{title}</h2>
    </div>
  );
}

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="border border-dashed border-gray-800 rounded-xl px-6 py-12 flex flex-col items-center text-center gap-3">
      <div className="text-gray-700">{icon}</div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-xs text-gray-600 max-w-sm leading-relaxed">{body}</p>
    </div>
  );
}

// ─── Weekly plan draft card ────────────────────────────────────────────────────

type PlanDraft = {
  id: string;
  type: string;
  status: string;
  title: string;
  hook: string | null;
  caption: string | null;
  generatedAt: Date | null;
  media: Array<{ sitePhoto: { imageUrl: string; title: string } | null }>;
  detailJob: {
    title: string;
    serviceType: string | null;
    jobDate: Date | null;
    client: { fullName: string } | null;
    vehicle: { year: string; make: string; model: string } | null;
  } | null;
  trendInsight: { title: string; category: string } | null;
};

const TREND_CATEGORY_LABELS: Record<string, string> = {
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

function WeeklyDraftCard({ draft }: { draft: PlanDraft }) {
  const statusMap: Record<string, { label: string; cls: string }> = {
    NEEDS_APPROVAL: { label: "Needs Approval", cls: "bg-yellow-900/40 text-yellow-400" },
    APPROVED:       { label: "Approved",       cls: "bg-green-900/40 text-green-400"  },
    DRAFT:          { label: "Draft",          cls: "bg-gray-800 text-gray-400"       },
    IDEA:           { label: "Idea",           cls: "bg-gray-800 text-gray-500"       },
    ARCHIVED:       { label: "Archived",       cls: "bg-gray-900 text-gray-600"       },
    SCHEDULED:      { label: "Scheduled",      cls: "bg-blue-900/30 text-blue-400"    },
    POSTED:         { label: "Posted",         cls: "bg-green-900/60 text-green-300"  },
  };
  const statusInfo   = statusMap[draft.status] ?? { label: draft.status, cls: "bg-gray-800 text-gray-500" };
  const thumbnails   = draft.media.filter((m) => m.sitePhoto).slice(0, 2);
  const sectionAnchor = draft.type === "REEL" ? "#reels" : "#drafts";

  const job     = draft.detailJob;
  const vehicle = job?.vehicle;
  const client  = job?.client;

  return (
    <a
      href={sectionAnchor}
      className="block bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors group"
    >
      {/* Type + status */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 uppercase tracking-widest">
          {draft.type}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${statusInfo.cls}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Thumbnails */}
      {thumbnails.length > 0 && (
        <div className="flex gap-1.5 mb-3">
          {thumbnails.map((m, i) => (
            <div key={i} className="w-14 h-14 rounded-lg overflow-hidden bg-gray-800 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.sitePhoto!.imageUrl} alt={m.sitePhoto!.title} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-white text-sm font-medium leading-snug mb-1 truncate group-hover:text-[#94b2b6] transition-colors">
        {draft.title}
      </p>

      {/* Hook */}
      {draft.hook && (
        <p className="text-xs text-gray-600 italic truncate mb-2">&ldquo;{draft.hook}&rdquo;</p>
      )}

      {/* Job / client / vehicle context */}
      {(client || vehicle || job?.serviceType) && (
        <div className="space-y-0.5 mb-2">
          {client && (
            <p className="text-[10px] text-gray-600">
              <span className="text-gray-700">Client:</span> {client.fullName}
            </p>
          )}
          {vehicle && (
            <p className="text-[10px] text-gray-600">
              <span className="text-gray-700">Vehicle:</span>{" "}
              {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")}
            </p>
          )}
          {job?.serviceType && (
            <p className="text-[10px] text-gray-600">
              <span className="text-gray-700">Service:</span> {job.serviceType}
            </p>
          )}
          {job?.jobDate && (
            <p className="text-[10px] text-gray-600">
              <span className="text-gray-700">Date:</span>{" "}
              {new Date(job.jobDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
      )}

      {/* Trend badge */}
      {draft.trendInsight && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-900/30 text-purple-400 uppercase tracking-wider">
            Trend
          </span>
          <span className="text-[10px] text-gray-600 truncate">{draft.trendInsight.title}</span>
        </div>
      )}

      <p className="text-[10px] text-gray-700 mt-2">Click to review ↓</p>
    </a>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SocialPage() {
  const [photos, drafts, trendInsights, recentRuns, settings] = await Promise.all([
    prisma.sitePhoto.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.socialContentDraft.findMany({
      where:   { status: { not: "ARCHIVED" } },
      orderBy: { createdAt: "desc" },
      take:    50,
      include: {
        media: {
          take:    3,
          orderBy: { sortOrder: "asc" },
          include: { sitePhoto: { select: { imageUrl: true, title: true } } },
        },
      },
    }),
    // TrendInsight replaces the old SocialTrendIdea for the intelligence panel
    prisma.trendInsight.findMany({
      orderBy: [{ confidenceScore: "desc" }, { popularityScore: "desc" }],
    }),
    prisma.socialAgentRun.findMany({
      orderBy: { createdAt: "desc" },
      take:    5,
      include: {
        drafts: {
          where:   { status: { not: "ARCHIVED" } },
          orderBy: { createdAt: "asc" },
          include: {
            media: {
              take:    2,
              orderBy: { sortOrder: "asc" },
              include: { sitePhoto: { select: { imageUrl: true, title: true } } },
            },
            detailJob: {
              select: {
                title:      true,
                serviceType: true,
                jobDate:    true,
                client:     { select: { fullName: true } },
                vehicle:    { select: { year: true, make: true, model: true } },
              },
            },
            trendInsight: { select: { title: true, category: true } },
          },
        },
      },
    }),
    prisma.socialAgentSettings.findFirst(),
  ]);

  const latestRun       = recentRuns[0] ?? null;
  const latestRunDrafts = (latestRun?.drafts ?? []) as PlanDraft[];

  const postDrafts     = drafts.filter((d) => d.type === "POST");
  const reelDrafts     = drafts.filter((d) => d.type === "REEL");
  const approvalDrafts = drafts.filter((d) => d.status === "NEEDS_APPROVAL");

  const weeklyPostTarget = settings?.weeklyPostTarget ?? 3;
  const weeklyReelTarget = settings?.weeklyReelTarget ?? 2;

  function serializeDraft(d: typeof drafts[0]): SerializedDraft {
    return {
      id:          d.id,
      type:        d.type,
      status:      d.status,
      source:      d.source,
      title:       d.title,
      caption:     d.caption,
      hashtags:    d.hashtags,
      hook:        d.hook,
      notes:       d.notes,
      generatedAt: d.generatedAt?.toISOString() ?? null,
      createdAt:   d.createdAt.toISOString(),
      media:       d.media.map((m) => ({ id: m.id, sitePhoto: m.sitePhoto })),
    };
  }

  const serializedPostDrafts = postDrafts.map(serializeDraft);
  const serializedReelDrafts = reelDrafts.map(serializeDraft);

  const serializedSettings = settings
    ? { defaultHashtags: settings.defaultHashtags, brandVoice: settings.brandVoice, approvalRequired: settings.approvalRequired }
    : null;

  const photosForClient = photos.map((p) => ({
    id:                     p.id,
    title:                  p.title,
    imageUrl:               p.imageUrl,
    category:               p.category,
    label:                  p.label,
    caption:                p.caption,
    isFeatured:             p.isFeatured,
    displayOrder:           p.displayOrder,
    createdAt:              p.createdAt.toISOString(),
    socialTitle:            p.socialTitle,
    socialNotes:            p.socialNotes,
    contentScore:           p.contentScore,
    qualityScore:           p.qualityScore,
    marketingScore:         p.marketingScore,
    isSocialReady:          p.isSocialReady,
    isReelCandidate:        p.isReelCandidate,
    isPostCandidate:        p.isPostCandidate,
    isBeforeAfterCandidate: p.isBeforeAfterCandidate,
    isFavoriteForSocial:    p.isFavoriteForSocial,
    contentTags:            p.contentTags,
    serviceType:            p.serviceType,
    visualCategory:         p.visualCategory,
    contentAngle:           p.contentAngle,
    seasonalRelevance:      p.seasonalRelevance,
    lastReviewedForSocial:  p.lastReviewedForSocial?.toISOString() ?? null,
    reviewedByAgent:        p.reviewedByAgent,
  }));

  // Serialize TrendInsights for the client component
  const serializedTrends: TrendInsightRow[] = trendInsights.map((t) => ({
    id:                  t.id,
    title:               t.title,
    platform:            t.platform,
    source:              t.source,
    category:            t.category,
    trendType:           t.trendType,
    summary:             t.summary,
    suggestedUse:        t.suggestedUse,
    exampleHook:         t.exampleHook,
    exampleCaptionAngle: t.exampleCaptionAngle,
    hashtags:            t.hashtags,
    confidenceScore:     t.confidenceScore,
    popularityScore:     t.popularityScore,
    isActive:            t.isActive,
    expiresAt:           t.expiresAt?.toISOString() ?? null,
    createdAt:           t.createdAt.toISOString(),
  }));

  const navItems = [
    { id: "overview",            label: "Overview"           },
    { id: "runs",                label: "Agent Runs"         },
    { id: "weekly-plan",         label: "Weekly Plan"        },
    { id: "draft-generator",     label: "Draft Generator"    },
    { id: "drafts",              label: "Draft Posts"        },
    { id: "reels",               label: "Draft Reels"        },
    { id: "media-picks",         label: "Media Picks"        },
    { id: "media-intelligence",  label: "Media Intelligence" },
    { id: "trend-intelligence",  label: "Trend Intelligence" },
    { id: "settings",            label: "Settings"           },
  ];

  function formatDuration(start: Date | null, end: Date | null): string | null {
    if (!start || !end) return null;
    const ms = end.getTime() - start.getTime();
    if (ms < 1000)  return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60000)}m`;
  }

  return (
    <div className="p-6 max-w-6xl">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Social Media Agent</h1>
        <p className="text-gray-400 text-sm">
          Plan, draft, approve, and eventually publish weekly social content.
        </p>
      </div>

      <div className="flex items-start gap-3 bg-gray-900 border border-gray-800 rounded-xl px-5 py-3.5 mb-8">
        <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-1" />
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="text-white font-semibold">Approval required.</span>{" "}
          All AI-generated content requires your review and explicit approval before it ever goes live. Nothing is published automatically.
        </p>
      </div>

      {/* ── Section Nav ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-10 border-b border-gray-800/60">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="shrink-0 text-xs text-gray-500 hover:text-white hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            {item.label}
          </a>
        ))}
      </div>

      {/* ── Overview Stats ───────────────────────────────────────────────── */}
      <div id="overview">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Draft Posts"      value={postDrafts.length}     sub={`Target: ${weeklyPostTarget} / week`} />
          <StatCard label="Draft Reels"      value={reelDrafts.length}     sub={`Target: ${weeklyReelTarget} / week`} />
          <StatCard label="Needs Approval"   value={approvalDrafts.length} accent={approvalDrafts.length > 0 ? "yellow" : undefined} sub="Waiting for review" />
          <StatCard label="Active Trends"    value={serializedTrends.filter((t) => t.isActive).length} sub={`${photos.filter((p) => p.isSocialReady).length} social-ready photos`} />
        </div>
      </div>

      {/* ── Weekly Agent Run ─────────────────────────────────────────────── */}
      <SectionHeader id="runs" eyebrow="Automation" title="Weekly Agent Run" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-1">Manual trigger</p>
          <h3 className="text-white font-semibold text-base mb-2">Run Weekly Agent v2</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-6 max-w-md">
            The agent selects the best DetailJobs from your library, builds{" "}
            {weeklyPostTarget} post{weeklyPostTarget !== 1 ? "s" : ""} +{" "}
            {weeklyReelTarget} reel{weeklyReelTarget !== 1 ? "s" : ""} using job context, vehicle
            info, and any active Trend Insights — then queues them for your approval.
          </p>
          <WeeklyAgentButton />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-4">Weekly Targets</p>
          <div className="space-y-3.5">
            {[
              { label: "Posts / week", value: weeklyPostTarget },
              { label: "Reels / week", value: weeklyReelTarget },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{r.label}</span>
                <span className="text-white font-semibold">{r.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Auto-generate</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${settings?.autoGenerateEnabled ? "bg-green-900/40 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                {settings?.autoGenerateEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Approval gate</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-green-900/40 text-green-400">Always on</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Active trends</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-900/30 text-purple-400">
                {serializedTrends.filter((t) => t.isActive).length} loaded
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent runs history */}
      <div className="mb-4">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3">Recent agent runs</p>

        {recentRuns.length === 0 ? (
          <p className="text-xs text-gray-600 italic">No runs yet. Click Run Weekly Agent above to get started.</p>
        ) : (
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            {recentRuns.map((run, idx) => {
              const weekStart = new Date(run.weekStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const weekEnd   = new Date(run.weekEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const duration  = formatDuration(run.startedAt, run.completedAt);

              return (
                <div
                  key={run.id}
                  className={`flex items-center gap-4 px-4 py-3 ${idx === 0 ? "bg-gray-900" : "bg-gray-900/50"} border-b border-gray-800/50 last:border-0`}
                >
                  <div className="min-w-[110px]">
                    <p className="text-xs text-white font-medium">{weekStart} – {weekEnd}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {new Date(run.createdAt).toLocaleDateString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <AgentRunBadge status={run.status} />
                  <div className="flex items-center gap-4 ml-auto text-right">
                    <div className="hidden sm:block text-center">
                      <p className="text-xs font-semibold text-white">{run.postsGenerated}</p>
                      <p className="text-[10px] text-gray-600">posts</p>
                    </div>
                    <div className="hidden sm:block text-center">
                      <p className="text-xs font-semibold text-white">{run.reelsGenerated}</p>
                      <p className="text-[10px] text-gray-600">reels</p>
                    </div>
                    <div className="hidden md:block text-center">
                      <p className="text-xs font-semibold text-white">{run.mediaReviewed}</p>
                      <p className="text-[10px] text-gray-600">media</p>
                    </div>
                    {duration && (
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-400">{duration}</p>
                        <p className="text-[10px] text-gray-600">duration</p>
                      </div>
                    )}
                  </div>
                  {run.errorMessage && (
                    <span
                      className="text-[10px] text-red-400 bg-red-900/20 border border-red-800/30 rounded px-2 py-0.5 truncate max-w-[140px]"
                      title={run.errorMessage}
                    >
                      {run.errorMessage}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── This Week's Content Plan ─────────────────────────────────────── */}
      <SectionHeader id="weekly-plan" eyebrow="Planning" title="This Week's Content Plan" />

      {latestRun === null || latestRunDrafts.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          title="No weekly plan yet"
          body="Run the Weekly Agent above to generate a batch of posts and reels. All generated drafts appear here grouped by run, with client, vehicle, job, and trend context."
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <AgentRunBadge status={latestRun.status} />
              <p className="text-xs text-gray-500">
                {new Date(latestRun.weekStartDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })}{" "}–{" "}
                {new Date(latestRun.weekEndDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="text-xs font-bold text-white">{latestRun.postsGenerated}</p>
                <p className="text-[10px] text-gray-600">posts</p>
              </div>
              <div>
                <p className="text-xs font-bold text-white">{latestRun.reelsGenerated}</p>
                <p className="text-[10px] text-gray-600">reels</p>
              </div>
              <div>
                <p className="text-xs font-bold text-white">{latestRun.mediaReviewed}</p>
                <p className="text-[10px] text-gray-600">media reviewed</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {latestRunDrafts.map((draft) => (
              <WeeklyDraftCard key={draft.id} draft={draft} />
            ))}
          </div>

          <p className="text-xs text-gray-600">
            Click any card to jump to the full draft.{" "}
            <a href="#drafts" className="text-gray-500 hover:text-white transition-colors">Review posts ↓</a>
            {" · "}
            <a href="#reels" className="text-gray-500 hover:text-white transition-colors">Review reels ↓</a>
          </p>
        </>
      )}

      {/* ── Draft Generator ──────────────────────────────────────────────── */}
      <SectionHeader id="draft-generator" eyebrow="Content Creation" title="Draft Generator" />

      <p className="text-xs text-gray-500 mb-6 leading-relaxed max-w-2xl">
        Create individual social media drafts by hand — pick photos, choose a content angle and CTA, then generate a ready-to-review draft. For batch generation use the Weekly Agent above.
      </p>

      <DraftGenerator photos={photosForClient} settings={serializedSettings} />

      {/* ── Draft Posts ──────────────────────────────────────────────────── */}
      <SectionHeader id="drafts" eyebrow="Content" title="Draft Posts" />
      <DraftSection type="POST" initialDrafts={serializedPostDrafts} />

      {/* ── Draft Reels ──────────────────────────────────────────────────── */}
      <SectionHeader id="reels" eyebrow="Content" title="Draft Reels" />
      <DraftSection type="REEL" initialDrafts={serializedReelDrafts} />

      {/* ── Media Library Picks ──────────────────────────────────────────── */}
      <SectionHeader id="media-picks" eyebrow="Content Sources" title="Media Library Picks" />

      <p className="text-xs text-gray-500 mb-5 leading-relaxed max-w-2xl">
        The agent scans these uploaded photos to identify strong content candidates — featured shots, before/after pairs, and hero-worthy images — and uses them to build post and reel drafts automatically.
      </p>

      {photos.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          title="No media uploaded yet"
          body="Upload photos via the Media Manager. The agent will review them and suggest the best candidates for social content."
        />
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {photos.slice(0, 12).map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                {photo.isFeatured && (
                  <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">FEAT</span>
                )}
                {photo.isSocialReady && (
                  <span className="absolute top-1.5 right-1.5 bg-green-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">✓</span>
                )}
                {photo.label && (
                  <span className="absolute bottom-1.5 right-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-black/70 text-gray-300">{photo.label}</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Showing {Math.min(photos.length, 12)} of {photos.length} most recent photo{photos.length !== 1 ? "s" : ""}.{" "}
            <a href="#media-intelligence" className="text-gray-500 hover:text-gray-300 transition-colors">Score &amp; review all media ↓</a>
            {" · "}
            <a href="/admin/media" className="text-gray-500 hover:text-gray-300 transition-colors">Manage in Media Manager →</a>
          </p>
        </>
      )}

      {/* ── Media Intelligence ───────────────────────────────────────────── */}
      <SectionHeader id="media-intelligence" eyebrow="Content Strategy" title="Media Intelligence" />

      <p className="text-xs text-gray-500 mb-6 leading-relaxed max-w-2xl">
        Organize and score uploaded media so the agent can choose stronger content for future posts and reels. Score each photo, flag candidates, and add classification tags.
      </p>

      {photos.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          title="No media to score yet"
          body="Upload photos via the Media Manager, then return here to score and classify them for the social agent."
        />
      ) : (
        <MediaIntelligencePanel photos={photosForClient} />
      )}

      {/* ── Trend Intelligence ───────────────────────────────────────────── */}
      <SectionHeader id="trend-intelligence" eyebrow="Research" title="Trend Intelligence" />

      <p className="text-xs text-gray-500 mb-6 leading-relaxed max-w-2xl">
        Add and manage trend insights that shape how the Weekly Agent writes hooks, captions, and hashtags.
        Each active trend is automatically referenced when generating drafts — the highest-confidence insights
        are used first.
      </p>

      {/* Active vs total summary */}
      {serializedTrends.length > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-center">
            <p className="text-lg font-bold text-white">{serializedTrends.filter((t) => t.isActive).length}</p>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">Active</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-center">
            <p className="text-lg font-bold text-white">{serializedTrends.length}</p>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">Total</p>
          </div>
          {serializedTrends.some((t) => t.expiresAt && new Date(t.expiresAt) < new Date()) && (
            <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-2.5 text-center">
              <p className="text-lg font-bold text-red-400">
                {serializedTrends.filter((t) => t.expiresAt && new Date(t.expiresAt) < new Date()).length}
              </p>
              <p className="text-[10px] text-red-600 uppercase tracking-widest">Expired</p>
            </div>
          )}
        </div>
      )}

      <TrendIntelligencePanel initialTrends={serializedTrends} />

      {/* ── Settings ─────────────────────────────────────────────────────── */}
      <SectionHeader id="settings" eyebrow="Configuration" title="Agent Settings" />

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 max-w-lg">
        <div className="space-y-0">
          {[
            { label: "Weekly post target",     value: `${weeklyPostTarget} posts / week` },
            { label: "Weekly reel target",     value: `${weeklyReelTarget} reels / week` },
            { label: "Approval required",      value: "Yes — always" },
            { label: "Auto-generate",          value: settings?.autoGenerateEnabled ? "Enabled" : "Disabled" },
            { label: "Brand voice",            value: settings?.brandVoice ?? "—" },
            { label: "Default hashtags",       value: settings?.defaultHashtags ?? "—" },
            { label: "Preferred posting days", value: settings?.preferredPostingDays ?? "—" },
            { label: "Preferred posting times",value: settings?.preferredPostingTimes ?? "—" },
            {
              label: "Last generated",
              value: settings?.lastGeneratedAt
                ? new Date(settings.lastGeneratedAt).toLocaleDateString()
                : "—",
            },
          ].map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-4 py-3 border-b border-gray-800/50 last:border-0">
              <span className="text-sm text-gray-500">{row.label}</span>
              <span className="text-sm text-white font-medium text-right">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-gray-800">
          <button disabled className="flex items-center text-xs text-gray-600 cursor-not-allowed">
            Edit Settings<ComingSoon />
          </button>
        </div>
      </div>

      <div className="h-16" />
    </div>
  );
}
