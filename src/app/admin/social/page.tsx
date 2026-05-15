import { prisma } from "@/lib/prisma";
import type {
  SocialAgentRunStatus,
  SocialContentStatus,
  SocialContentType,
} from "@prisma/client";
import MediaIntelligencePanel from "@/components/MediaIntelligencePanel";

export const dynamic = "force-dynamic";

// ─── Small inline components ─────────────────────────────────────────────────

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
    accent === "yellow"
      ? "text-yellow-400"
      : accent === "green"
      ? "text-green-400"
      : accent === "red"
      ? "text-red-400"
      : "text-white";
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-2">
        {label}
      </p>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

function AgentRunBadge({ status }: { status: SocialAgentRunStatus | null }) {
  if (!status)
    return <span className="text-xs text-gray-600 italic">No runs yet</span>;
  const map: Record<SocialAgentRunStatus, { label: string; cls: string }> = {
    PENDING:   { label: "Pending",   cls: "bg-gray-800 text-gray-400" },
    RUNNING:   { label: "Running",   cls: "bg-yellow-900/40 text-yellow-400" },
    COMPLETED: { label: "Completed", cls: "bg-green-900/40 text-green-400" },
    FAILED:    { label: "Failed",    cls: "bg-red-900/40 text-red-400" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

function DraftStatusBadge({ status }: { status: SocialContentStatus }) {
  const map: Record<SocialContentStatus, { label: string; cls: string }> = {
    IDEA:           { label: "Idea",           cls: "bg-gray-800 text-gray-500" },
    DRAFT:          { label: "Draft",          cls: "bg-gray-800 text-gray-400" },
    NEEDS_APPROVAL: { label: "Needs Approval", cls: "bg-yellow-900/40 text-yellow-400" },
    APPROVED:       { label: "Approved",       cls: "bg-green-900/40 text-green-400" },
    SCHEDULED:      { label: "Scheduled",      cls: "bg-blue-900/30 text-blue-400" },
    POSTED:         { label: "Posted",         cls: "bg-green-900/60 text-green-300" },
    ARCHIVED:       { label: "Archived",       cls: "bg-gray-900 text-gray-600" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${cls}`}>
      {label}
    </span>
  );
}

function DraftTypeBadge({ type }: { type: SocialContentType }) {
  const cls =
    type === "REEL"
      ? "bg-violet-900/30 text-violet-400"
      : type === "STORY"
      ? "bg-blue-900/30 text-blue-400"
      : "bg-gray-800 text-gray-400";
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${cls}`}>
      {type}
    </span>
  );
}

function SectionHeader({
  id,
  eyebrow,
  title,
}: {
  id: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div id={id} className="border-t border-gray-800/60 pt-10 mt-12">
      <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-[0.2em] mb-1">
        {eyebrow}
      </p>
      <h2 className="text-lg font-semibold text-white mb-6">{title}</h2>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="border border-dashed border-gray-800 rounded-xl px-6 py-12 flex flex-col items-center text-center gap-3">
      <div className="text-gray-700">{icon}</div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-xs text-gray-600 max-w-sm leading-relaxed">{body}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SocialPage() {
  const [photos, drafts, trends, latestRun, settings] = await Promise.all([
    prisma.sitePhoto.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.socialContentDraft.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        media: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          include: { sitePhoto: { select: { imageUrl: true, title: true } } },
        },
      },
    }),
    prisma.socialTrendIdea.findMany({
      orderBy: { popularityScore: "desc" },
      take: 8,
    }),
    prisma.socialAgentRun.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.socialAgentSettings.findFirst(),
  ]);

  const postDrafts = drafts.filter((d) => d.type === "POST");
  const reelDrafts = drafts.filter((d) => d.type === "REEL");
  const approvalDrafts = drafts.filter((d) => d.status === "NEEDS_APPROVAL");

  const weeklyPostTarget = settings?.weeklyPostTarget ?? 3;
  const weeklyReelTarget = settings?.weeklyReelTarget ?? 2;

  const navItems = [
    { id: "overview",           label: "Overview" },
    { id: "runs",               label: "Agent Runs" },
    { id: "drafts",             label: "Draft Posts" },
    { id: "reels",              label: "Draft Reels" },
    { id: "media-picks",        label: "Media Picks" },
    { id: "media-intelligence", label: "Media Intelligence" },
    { id: "trends",             label: "Trend Research" },
    { id: "weekly-plan",        label: "Weekly Plan" },
    { id: "settings",           label: "Settings" },
  ];

  return (
    <div className="p-6 max-w-6xl">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Social Media Agent</h1>
        <p className="text-gray-400 text-sm">
          Plan, draft, approve, and eventually publish weekly social content.
        </p>
      </div>

      {/* Approval notice */}
      <div className="flex items-start gap-3 bg-gray-900 border border-gray-800 rounded-xl px-5 py-3.5 mb-8">
        <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-1" />
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="text-white font-semibold">Approval required.</span>{" "}
          No content is published automatically. Every piece of generated content
          requires your review and explicit approval before it ever goes live.
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
          <StatCard
            label="Draft Posts"
            value={postDrafts.length}
            sub={`Target: ${weeklyPostTarget} / week`}
          />
          <StatCard
            label="Draft Reels"
            value={reelDrafts.length}
            sub={`Target: ${weeklyReelTarget} / week`}
          />
          <StatCard
            label="Needs Approval"
            value={approvalDrafts.length}
            accent={approvalDrafts.length > 0 ? "yellow" : undefined}
            sub="Waiting for review"
          />
          <StatCard
            label="Available Media"
            value={photos.length}
            sub={`${photos.filter((p) => p.isSocialReady).length} social ready`}
          />
        </div>
      </div>

      {/* ── Weekly Agent Run ─────────────────────────────────────────────── */}
      <SectionHeader id="runs" eyebrow="Automation" title="Weekly Agent Run" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Run status */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">
                Last run
              </p>
              <p className="text-white font-medium text-sm">
                {latestRun
                  ? new Date(latestRun.createdAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  : "No runs yet"}
              </p>
            </div>
            <AgentRunBadge status={latestRun?.status ?? null} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Posts target",   value: latestRun?.postsTarget   ?? weeklyPostTarget },
              { label: "Reels target",   value: latestRun?.reelsTarget   ?? weeklyReelTarget },
              { label: "Drafts created", value: latestRun?.draftsCreated ?? 0 },
              { label: "Media reviewed", value: latestRun?.mediaReviewed ?? 0 },
            ].map((m) => (
              <div
                key={m.label}
                className="bg-gray-800/60 rounded-lg p-3 text-center"
              >
                <p className="text-2xl font-bold text-white">{m.value}</p>
                <p className="text-[10px] text-gray-600 mt-0.5 leading-snug">
                  {m.label}
                </p>
              </div>
            ))}
          </div>

          {latestRun?.errorMessage && (
            <p className="mt-4 text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
              {latestRun.errorMessage}
            </p>
          )}
        </div>

        {/* Targets */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-4">
            Weekly Targets
          </p>
          <div className="space-y-3.5">
            {[
              {
                label: "Posts / week",
                value: weeklyPostTarget,
                valueClass: "text-white font-semibold",
              },
              {
                label: "Reels / week",
                value: weeklyReelTarget,
                valueClass: "text-white font-semibold",
              },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{r.label}</span>
                <span className={r.valueClass}>{r.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Auto-generate</span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  settings?.autoGenerateEnabled
                    ? "bg-green-900/40 text-green-400"
                    : "bg-gray-800 text-gray-500"
                }`}
              >
                {settings?.autoGenerateEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Approval gate</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-green-900/40 text-green-400">
                Always on
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent action buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          "Run Agent Now",
          "Generate Weekly Plan",
          "Create Draft Post",
          "Create Reel Idea",
        ].map((label) => (
          <button
            key={label}
            disabled
            className="flex items-center bg-gray-800 border border-gray-800 text-gray-600 text-xs font-medium px-4 py-2 rounded-lg cursor-not-allowed"
          >
            {label}
            <ComingSoon />
          </button>
        ))}
      </div>

      {/* ── Draft Posts ──────────────────────────────────────────────────── */}
      <SectionHeader id="drafts" eyebrow="Content" title="Draft Posts" />

      {postDrafts.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title="No draft posts yet"
          body="The AI agent will create Instagram post drafts here each week. All drafts require your approval before publishing."
        />
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {["Title", "Status", "Source", "Created"].map((h, i) => (
                  <th
                    key={h}
                    className={`text-left text-[10px] text-gray-600 uppercase tracking-widest px-4 py-3 font-semibold ${
                      i > 0 ? "hidden sm:table-cell" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {postDrafts.map((draft) => (
                <tr
                  key={draft.id}
                  className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {draft.media[0]?.sitePhoto && (
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={draft.media[0].sitePhoto.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium leading-snug truncate">
                          {draft.title}
                        </p>
                        {draft.hook && (
                          <p className="text-xs text-gray-500 truncate max-w-[220px]">
                            {draft.hook}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <DraftStatusBadge status={draft.status} />
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-gray-600">
                      {draft.source === "AUTO_AGENT" ? "AI Agent" : "Manual"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-gray-600">
                      {new Date(draft.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Draft Reels ──────────────────────────────────────────────────── */}
      <SectionHeader id="reels" eyebrow="Content" title="Draft Reels" />

      {reelDrafts.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }
          title="No reel drafts yet"
          body="The agent will create Instagram Reel concepts here — hooks, structure, and recommended media. Review and approve before production."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reelDrafts.map((draft) => (
            <div
              key={draft.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2.5">
                <DraftTypeBadge type={draft.type} />
                <DraftStatusBadge status={draft.status} />
              </div>
              <p className="text-white font-medium text-sm mb-1">{draft.title}</p>
              {draft.hook && (
                <p className="text-xs text-gray-500 leading-relaxed">{draft.hook}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Media Library Picks ──────────────────────────────────────────── */}
      <SectionHeader
        id="media-picks"
        eyebrow="Content Sources"
        title="Media Library Picks"
      />

      <p className="text-xs text-gray-500 mb-5 leading-relaxed max-w-2xl">
        The AI agent will scan these uploaded photos to identify strong content
        candidates — featured shots, before/after pairs, and hero-worthy images —
        and use them to build post and reel drafts automatically.
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
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {photo.isFeatured && (
                  <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    FEAT
                  </span>
                )}
                {photo.isSocialReady && (
                  <span className="absolute top-1.5 right-1.5 bg-green-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    ✓
                  </span>
                )}
                {photo.label && (
                  <span className="absolute bottom-1.5 right-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-black/70 text-gray-300">
                    {photo.label}
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Showing {Math.min(photos.length, 12)} of {photos.length} most recent photo
            {photos.length !== 1 ? "s" : ""}.{" "}
            <a
              href="#media-intelligence"
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              Score &amp; review all media ↓
            </a>
            {" · "}
            <a
              href="/admin/media"
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              Manage in Media Manager →
            </a>
          </p>
        </>
      )}

      {/* ── Media Intelligence ───────────────────────────────────────────── */}
      <SectionHeader
        id="media-intelligence"
        eyebrow="Content Strategy"
        title="Media Intelligence"
      />

      <p className="text-xs text-gray-500 mb-6 leading-relaxed max-w-2xl">
        Organize and score uploaded media so the agent can choose stronger content
        for future posts and reels. Score each photo, flag candidates, and add
        classification tags — the agent will use this data to make smarter
        weekly selections.
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
        <MediaIntelligencePanel
          photos={photos.map((p) => ({
            id:                    p.id,
            title:                 p.title,
            imageUrl:              p.imageUrl,
            category:              p.category,
            label:                 p.label,
            caption:               p.caption,
            isFeatured:            p.isFeatured,
            displayOrder:          p.displayOrder,
            createdAt:             p.createdAt.toISOString(),
            socialTitle:           p.socialTitle,
            socialNotes:           p.socialNotes,
            contentScore:          p.contentScore,
            qualityScore:          p.qualityScore,
            marketingScore:        p.marketingScore,
            isSocialReady:         p.isSocialReady,
            isReelCandidate:       p.isReelCandidate,
            isPostCandidate:       p.isPostCandidate,
            isBeforeAfterCandidate: p.isBeforeAfterCandidate,
            isFavoriteForSocial:   p.isFavoriteForSocial,
            contentTags:           p.contentTags,
            serviceType:           p.serviceType,
            visualCategory:        p.visualCategory,
            contentAngle:          p.contentAngle,
            seasonalRelevance:     p.seasonalRelevance,
            lastReviewedForSocial: p.lastReviewedForSocial?.toISOString() ?? null,
            reviewedByAgent:       p.reviewedByAgent,
          }))}
        />
      )}

      {/* ── Trend Research ───────────────────────────────────────────────── */}
      <SectionHeader id="trends" eyebrow="Research" title="Trend Research" />

      {trends.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          title="No trend ideas yet"
          body="The agent will research detailing trends, popular audio, and seasonal content opportunities and surface them here each week."
        />
      ) : (
        <div className="space-y-2">
          {trends.map((t) => (
            <div
              key={t.id}
              className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-start justify-between gap-4"
            >
              <div>
                <p className="text-sm text-white font-medium">{t.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t.category} · {t.source}
                </p>
              </div>
              {t.popularityScore > 0 && (
                <span className="text-xs text-gray-600 shrink-0">
                  Score: {t.popularityScore}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Weekly Plan ──────────────────────────────────────────────────── */}
      <SectionHeader id="weekly-plan" eyebrow="Planning" title="Weekly Content Plan" />

      <EmptyState
        icon={
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
        title="Weekly plan coming soon"
        body="Each agent run will produce a structured weekly content plan — which posts go on which days, what media to use, and the theme for the week. Requires your approval before anything is queued."
      />

      {/* ── Content Ideas ────────────────────────────────────────────────── */}
      <SectionHeader id="content-ideas" eyebrow="Pipeline" title="Content Ideas" />

      <EmptyState
        icon={
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        }
        title="No content ideas yet"
        body="The agent will generate post ideas based on uploaded media, trend research, and seasonal relevance. Ideas appear here before becoming full drafts."
      />

      {/* ── Settings ─────────────────────────────────────────────────────── */}
      <SectionHeader id="settings" eyebrow="Configuration" title="Agent Settings" />

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 max-w-lg">
        <div className="space-y-0">
          {[
            {
              label: "Weekly post target",
              value: `${weeklyPostTarget} posts / week`,
            },
            {
              label: "Weekly reel target",
              value: `${weeklyReelTarget} reels / week`,
            },
            { label: "Approval required", value: "Yes — always" },
            {
              label: "Auto-generate",
              value: settings?.autoGenerateEnabled ? "Enabled" : "Disabled",
            },
            {
              label: "Brand voice",
              value: settings?.brandVoice ?? "—",
            },
            {
              label: "Default hashtags",
              value: settings?.defaultHashtags ?? "—",
            },
            {
              label: "Preferred posting days",
              value: settings?.preferredPostingDays ?? "—",
            },
            {
              label: "Preferred posting times",
              value: settings?.preferredPostingTimes ?? "—",
            },
            {
              label: "Last generated",
              value: settings?.lastGeneratedAt
                ? new Date(settings.lastGeneratedAt).toLocaleDateString()
                : "—",
            },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-4 py-3 border-b border-gray-800/50 last:border-0"
            >
              <span className="text-sm text-gray-500">{row.label}</span>
              <span className="text-sm text-white font-medium text-right">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-gray-800">
          <button
            disabled
            className="flex items-center text-xs text-gray-600 cursor-not-allowed"
          >
            Edit Settings
            <ComingSoon />
          </button>
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="h-16" />
    </div>
  );
}
