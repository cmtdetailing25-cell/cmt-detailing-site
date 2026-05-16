import { prisma } from "@/lib/prisma";
import { generateDraftContent, CONTENT_ANGLES, CTA_STYLES } from "./generateDraftContent";
import type { SitePhoto } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyAgentResult {
  runId: string;
  postsCreated: number;
  reelsCreated: number;
  mediaUsed: number;
  error?: string;
}

// Inlined shape of a job row returned by the query below
interface JobWithContext {
  id: string;
  serviceType: string | null;
  jobDate: Date | null;
  isSocialReady: boolean;
  isFeatured: boolean;
  photos: SitePhoto[];
  client: { fullName: string } | null;
  vehicle: { year: string; make: string; model: string; color: string | null } | null;
}

// ─── Week bounds (Monday–Sunday) ──────────────────────────────────────────────

export function getWeekBounds(): { start: Date; end: Date } {
  const now        = new Date();
  const dayOfWeek  = now.getDay(); // 0 = Sunday
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday     = new Date(now);
  monday.setDate(monday.getDate() + daysToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

// ─── DetailJob scoring ────────────────────────────────────────────────────────
//
// Higher = better candidate. Social-ready, featured, before/after pairs, and
// recent jobs score higher. Recently-used jobs take a heavy penalty so the
// agent rotates across the library over successive weeks.

function scoreJob(job: JobWithContext, recentlyUsedJobIds: Set<string>): number {
  let s = 0;
  if (job.isSocialReady) s += 40;
  if (job.isFeatured)    s += 20;

  const { photos } = job;
  const socialReady      = photos.filter((p) => p.isSocialReady).length;
  const beforeAfterPair  = photos.some((p) => p.isBeforeAfterCandidate);
  const postCandidates   = photos.filter((p) => p.isPostCandidate).length;
  const reelCandidates   = photos.filter((p) => p.isReelCandidate).length;

  s += socialReady    * 6;
  s += beforeAfterPair ? 15 : 0;
  s += postCandidates * 3;
  s += reelCandidates * 3;

  if (photos.length > 0) {
    const avgMarketing = photos.reduce((sum, p) => sum + p.marketingScore, 0) / photos.length;
    const avgQuality   = photos.reduce((sum, p) => sum + p.qualityScore,   0) / photos.length;
    s += avgMarketing * 2;
    s += avgQuality;
  }

  // Need at least 2 photos to be a strong candidate
  if (photos.length < 2) s -= 20;

  // Recency bonus
  if (job.jobDate) {
    const daysAgo = (Date.now() - new Date(job.jobDate).getTime()) / 86_400_000;
    if (daysAgo < 30) s += 10;
    if (daysAgo < 7)  s += 5;
  }

  // Heavy penalty for recently-used jobs (past 14 days)
  if (recentlyUsedJobIds.has(job.id)) s -= 80;

  return s;
}

// ─── Photo scoring (fallback: unassigned photos with no DetailJob) ─────────────

function scorePhoto(photo: SitePhoto, recentlyUsedIds: Set<string>): number {
  let s = 0;
  if (photo.isSocialReady)          s += 30;
  if (photo.isFavoriteForSocial)    s += 20;
  if (photo.isBeforeAfterCandidate) s += 10;
  if (photo.isPostCandidate)        s += 8;
  if (photo.isReelCandidate)        s += 8;
  s += photo.marketingScore * 3;
  s += photo.qualityScore   * 2;
  s += photo.contentScore   * 2;
  if (recentlyUsedIds.has(photo.id)) s -= 60;
  return s;
}

// ─── Main agent function ──────────────────────────────────────────────────────

export async function runWeeklyAgent(agentRunId: string): Promise<WeeklyAgentResult> {
  await prisma.socialAgentRun.update({
    where: { id: agentRunId },
    data:  { status: "RUNNING", startedAt: new Date() },
  });

  try {
    const settings    = await prisma.socialAgentSettings.findFirst();
    const postTarget  = settings?.weeklyPostTarget ?? 3;
    const reelTarget  = settings?.weeklyReelTarget ?? 2;
    const settingsPayload = settings
      ? { defaultHashtags: settings.defaultHashtags, brandVoice: settings.brandVoice, approvalRequired: settings.approvalRequired }
      : null;

    const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000);

    // ── 0. Fetch active, non-expired TrendInsights for caption shaping ─────────

    // Prefer high-confidence, then recently added (research runs surface new trends with fresh createdAt)
    const activeTrends = await prisma.trendInsight.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      orderBy: [{ confidenceScore: "desc" }, { createdAt: "desc" }],
    });

    // ── 1. Find recently-used job/photo IDs (rotation guard) ──────────────────

    const recentDraftMedia = await prisma.socialContentMedia.findMany({
      where: { draft: { createdAt: { gte: fourteenDaysAgo } } },
      select: { sitePhoto: { select: { detailJobId: true, id: true } } },
    });
    const recentlyUsedJobIds = new Set(
      recentDraftMedia.map((m) => m.sitePhoto?.detailJobId).filter(Boolean) as string[]
    );
    const recentlyUsedPhotoIds = new Set(
      recentDraftMedia.map((m) => m.sitePhoto?.id).filter(Boolean) as string[]
    );

    // ── 2. Fetch all DetailJobs with full context ──────────────────────────────

    const allJobs = await prisma.detailJob.findMany({
      include: {
        photos:  true,
        client:  { select: { fullName: true } },
        vehicle: { select: { year: true, make: true, model: true, color: true } },
      },
    });

    const jobsWithPhotos = allJobs.filter((j) => j.photos.length > 0) as JobWithContext[];

    // Safety guard: if any jobs have assigned photos, never fall back to unassigned photos.
    // Mixing job-context and non-job content produces confusing drafts.
    const hasJobMedia = jobsWithPhotos.length > 0;

    const rankedJobs = jobsWithPhotos
      .map((j) => ({ job: j, score: scoreJob(j, recentlyUsedJobIds) }))
      .sort((a, b) => b.score - a.score);

    const usedJobIds   = new Set<string>();
    const usedPhotoIds = new Set<string>();
    let   postsCreated = 0;
    let   reelsCreated = 0;
    const now          = new Date();

    const angleKeys = CONTENT_ANGLES.map((a) => a.key);
    const ctaKeys   = CTA_STYLES.map((c) => c.key);

    // Pick photos from a single job — type-appropriate first, then relax to any
    const pickFromJob = (job: JobWithContext, count: number, preferReel: boolean): SitePhoto[] => {
      const unused = job.photos.filter((p) => !usedPhotoIds.has(p.id));
      let pool = preferReel
        ? unused.filter((p) => p.isReelCandidate || p.isSocialReady || p.isFavoriteForSocial)
        : unused.filter((p) => p.isPostCandidate  || p.isSocialReady || p.isFavoriteForSocial);
      if (pool.length < count) pool = unused;
      if (pool.length === 0)   pool = job.photos; // tiny-library fallback within same job
      return pool.slice(0, count);
    };

    // ── 3. Generate posts from ranked jobs ────────────────────────────────────

    for (let i = 0; i < postTarget; i++) {
      const candidate = rankedJobs.find(
        ({ job }) => !usedJobIds.has(job.id) && job.photos.length >= 1
      );
      if (!candidate) break;

      const { job }  = candidate;
      const photos   = pickFromJob(job, 2, false);
      if (photos.length === 0) break;

      const contentAngle = angleKeys[i % angleKeys.length];
      const ctaStyle     = ctaKeys[i % ctaKeys.length];
      const trendInsight = activeTrends.length > 0 ? activeTrends[i % activeTrends.length] : null;

      const serviceTypes = [
        job.serviceType,
        ...photos.flatMap((p) => (p.serviceType ? [p.serviceType] : [])),
      ].filter(Boolean) as string[];

      const content = generateDraftContent({
        contentType:    "POST",
        contentAngle,
        ctaStyle,
        mediaCount:     photos.length,
        serviceTypes,
        vehicleInfo:    job.vehicle,
        clientName:     job.client?.fullName,
        jobServiceType: job.serviceType,
        jobDate:        job.jobDate ? new Date(job.jobDate).toLocaleDateString("en-US") : undefined,
        mediaLabels:    photos.map((p) => p.label).filter(Boolean) as string[],
        trendInsight:   trendInsight
          ? {
              id:                 trendInsight.id,
              title:              trendInsight.title,
              exampleHook:        trendInsight.exampleHook,
              exampleCaptionAngle: trendInsight.exampleCaptionAngle,
              hashtags:           trendInsight.hashtags,
              suggestedUse:       trendInsight.suggestedUse,
            }
          : null,
        settings: settingsPayload,
      });

      await prisma.socialContentDraft.create({
        data: {
          type:          "POST",
          status:        "NEEDS_APPROVAL",
          source:        "AUTO_AGENT",
          agentRunId,
          detailJobId:   job.id,
          trendInsightId: trendInsight?.id ?? undefined,
          generatedAt:   now,
          title:         content.title,
          caption:       content.caption,
          hashtags:      content.hashtags,
          hook:          content.hook,
          notes:         content.notes,
          media: { create: photos.map((p, idx) => ({ sitePhotoId: p.id, sortOrder: idx })) },
        },
      });

      usedJobIds.add(job.id);
      photos.forEach((p) => usedPhotoIds.add(p.id));
      postsCreated++;
    }

    // ── 4. Generate reels from ranked jobs ────────────────────────────────────

    for (let i = 0; i < reelTarget; i++) {
      // Reels can reuse the same job when it has enough unused photos
      const candidate = rankedJobs.find(
        ({ job }) =>
          job.photos.filter((p) => !usedPhotoIds.has(p.id)).length >= 2 ||
          job.photos.length >= 3
      );
      if (!candidate) break;

      const { job }  = candidate;
      const photos   = pickFromJob(job, 3, true);
      if (photos.length === 0) break;

      const contentAngle = angleKeys[(postTarget + i) % angleKeys.length];
      const ctaStyle     = ctaKeys[(i + 2) % ctaKeys.length];
      const trendInsight = activeTrends.length > 0 ? activeTrends[(postTarget + i) % activeTrends.length] : null;

      const serviceTypes = [
        job.serviceType,
        ...photos.flatMap((p) => (p.serviceType ? [p.serviceType] : [])),
      ].filter(Boolean) as string[];

      const content = generateDraftContent({
        contentType:    "REEL",
        contentAngle,
        ctaStyle,
        mediaCount:     photos.length,
        serviceTypes,
        vehicleInfo:    job.vehicle,
        clientName:     job.client?.fullName,
        jobServiceType: job.serviceType,
        jobDate:        job.jobDate ? new Date(job.jobDate).toLocaleDateString("en-US") : undefined,
        mediaLabels:    photos.map((p) => p.label).filter(Boolean) as string[],
        trendInsight:   trendInsight
          ? {
              id:                 trendInsight.id,
              title:              trendInsight.title,
              exampleHook:        trendInsight.exampleHook,
              exampleCaptionAngle: trendInsight.exampleCaptionAngle,
              hashtags:           trendInsight.hashtags,
              suggestedUse:       trendInsight.suggestedUse,
            }
          : null,
        settings: settingsPayload,
      });

      await prisma.socialContentDraft.create({
        data: {
          type:          "REEL",
          status:        "NEEDS_APPROVAL",
          source:        "AUTO_AGENT",
          agentRunId,
          detailJobId:   job.id,
          trendInsightId: trendInsight?.id ?? undefined,
          generatedAt:   now,
          title:         content.title,
          caption:       content.caption,
          hashtags:      content.hashtags,
          hook:          content.hook,
          notes:         content.notes,
          media: { create: photos.map((p, idx) => ({ sitePhotoId: p.id, sortOrder: idx })) },
        },
      });

      usedJobIds.add(job.id);
      photos.forEach((p) => usedPhotoIds.add(p.id));
      reelsCreated++;
    }

    // ── 5. Fallback: unassigned photos — only when zero jobs exist ─────────────
    //
    // Safety guard: if jobs with photos exist, we never mix in unassigned media.
    // Mixing job-context and context-free photos produces inconsistent drafts.

    if (!hasJobMedia && (postsCreated < postTarget || reelsCreated < reelTarget)) {
      const allPhotos = await prisma.sitePhoto.findMany({ where: { detailJobId: null } });

      if (allPhotos.length > 0) {
        const rankedPhotos = allPhotos
          .map((p) => ({ photo: p, score: scorePhoto(p, recentlyUsedPhotoIds) }))
          .sort((a, b) => b.score - a.score);

        const pickPhoto = (count: number, preferReel: boolean): SitePhoto[] => {
          const unused = rankedPhotos.filter((item) => !usedPhotoIds.has(item.photo.id));
          let pool = preferReel
            ? unused.filter((item) => item.photo.isReelCandidate || item.photo.isSocialReady)
            : unused.filter((item) => item.photo.isPostCandidate  || item.photo.isSocialReady);
          if (pool.length < count) pool = unused;
          if (pool.length === 0)   pool = rankedPhotos;
          return pool.slice(0, count).map((item) => item.photo);
        };

        while (postsCreated < postTarget) {
          const photos = pickPhoto(2, false);
          if (photos.length === 0) break;

          const i            = postsCreated;
          const contentAngle = angleKeys[i % angleKeys.length];
          const ctaStyle     = ctaKeys[i % ctaKeys.length];
          const trendInsight = activeTrends.length > 0 ? activeTrends[i % activeTrends.length] : null;

          const content = generateDraftContent({
            contentType: "POST", contentAngle, ctaStyle, mediaCount: photos.length,
            serviceTypes: photos.flatMap((p) => (p.serviceType ? [p.serviceType] : [])),
            mediaLabels:  photos.map((p) => p.label).filter(Boolean) as string[],
            trendInsight: trendInsight
              ? { id: trendInsight.id, title: trendInsight.title, exampleHook: trendInsight.exampleHook, exampleCaptionAngle: trendInsight.exampleCaptionAngle, hashtags: trendInsight.hashtags }
              : null,
            settings: settingsPayload,
          });

          await prisma.socialContentDraft.create({
            data: {
              type: "POST", status: "NEEDS_APPROVAL", source: "AUTO_AGENT",
              agentRunId, generatedAt: now,
              trendInsightId: trendInsight?.id ?? undefined,
              title: content.title, caption: content.caption,
              hashtags: content.hashtags, hook: content.hook, notes: content.notes,
              media: { create: photos.map((p, idx) => ({ sitePhotoId: p.id, sortOrder: idx })) },
            },
          });

          photos.forEach((p) => usedPhotoIds.add(p.id));
          postsCreated++;
        }

        while (reelsCreated < reelTarget) {
          const photos = pickPhoto(3, true);
          if (photos.length === 0) break;

          const i            = reelsCreated;
          const contentAngle = angleKeys[(postTarget + i) % angleKeys.length];
          const ctaStyle     = ctaKeys[(i + 2) % ctaKeys.length];
          const trendInsight = activeTrends.length > 0 ? activeTrends[(postTarget + i) % activeTrends.length] : null;

          const content = generateDraftContent({
            contentType: "REEL", contentAngle, ctaStyle, mediaCount: photos.length,
            serviceTypes: photos.flatMap((p) => (p.serviceType ? [p.serviceType] : [])),
            mediaLabels:  photos.map((p) => p.label).filter(Boolean) as string[],
            trendInsight: trendInsight
              ? { id: trendInsight.id, title: trendInsight.title, exampleHook: trendInsight.exampleHook, exampleCaptionAngle: trendInsight.exampleCaptionAngle, hashtags: trendInsight.hashtags }
              : null,
            settings: settingsPayload,
          });

          await prisma.socialContentDraft.create({
            data: {
              type: "REEL", status: "NEEDS_APPROVAL", source: "AUTO_AGENT",
              agentRunId, generatedAt: now,
              trendInsightId: trendInsight?.id ?? undefined,
              title: content.title, caption: content.caption,
              hashtags: content.hashtags, hook: content.hook, notes: content.notes,
              media: { create: photos.map((p, idx) => ({ sitePhotoId: p.id, sortOrder: idx })) },
            },
          });

          photos.forEach((p) => usedPhotoIds.add(p.id));
          reelsCreated++;
        }
      }
    }

    // ── 6. Bail if nothing was generated ──────────────────────────────────────

    if (postsCreated === 0 && reelsCreated === 0) {
      const reason = hasJobMedia
        ? "Jobs exist but none had enough social-ready photos. Mark jobs as Social Ready and ensure they have at least 2 photos."
        : "No media in library. Upload photos via Import Media first.";

      await prisma.socialAgentRun.update({
        where: { id: agentRunId },
        data:  { status: "FAILED", completedAt: new Date(), errorMessage: reason },
      });
      return { runId: agentRunId, postsCreated: 0, reelsCreated: 0, mediaUsed: 0, error: reason };
    }

    await prisma.socialAgentRun.update({
      where: { id: agentRunId },
      data: {
        status:         "COMPLETED",
        completedAt:    new Date(),
        draftsCreated:  postsCreated + reelsCreated,
        postsGenerated: postsCreated,
        reelsGenerated: reelsCreated,
        mediaReviewed:  usedPhotoIds.size,
      },
    });

    return { runId: agentRunId, postsCreated, reelsCreated, mediaUsed: usedPhotoIds.size };

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.socialAgentRun.update({
      where: { id: agentRunId },
      data:  { status: "FAILED", completedAt: new Date(), errorMessage: message },
    });
    return { runId: agentRunId, postsCreated: 0, reelsCreated: 0, mediaUsed: 0, error: message };
  }
}
