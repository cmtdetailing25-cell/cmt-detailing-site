import { prisma } from "@/lib/prisma";
import { generateDraftContent, CONTENT_ANGLES, CTA_STYLES } from "./generateDraftContent";
import type { SitePhoto, DetailJob } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyAgentResult {
  runId: string;
  postsCreated: number;
  reelsCreated: number;
  mediaUsed: number;
  error?: string;
}

// ─── Week bounds (Monday–Sunday) ──────────────────────────────────────────────

export function getWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + daysToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

// ─── DetailJob scoring ────────────────────────────────────────────────────────
//
// Higher = better candidate. Jobs with more social-ready photos, before/after
// pairs, and recent dates score higher. Recently-used jobs are penalised so the
// agent rotates across the library.

interface JobWithPhotos extends DetailJob {
  photos: SitePhoto[];
}

function scoreJob(job: JobWithPhotos, recentlyUsedJobIds: Set<string>): number {
  let s = 0;
  if (job.isSocialReady)  s += 40;
  if (job.isFeatured)     s += 20;

  const photos = job.photos;
  const socialReady     = photos.filter((p) => p.isSocialReady).length;
  const beforeAfterPair = photos.some((p) => p.isBeforeAfterCandidate);
  const postCandidates  = photos.filter((p) => p.isPostCandidate).length;
  const reelCandidates  = photos.filter((p) => p.isReelCandidate).length;

  s += socialReady     * 6;
  s += beforeAfterPair ? 15 : 0;
  s += postCandidates  * 3;
  s += reelCandidates  * 3;

  // Average marketing score of all photos
  if (photos.length > 0) {
    const avgMarketing = photos.reduce((sum, p) => sum + p.marketingScore, 0) / photos.length;
    const avgQuality   = photos.reduce((sum, p) => sum + p.qualityScore,   0) / photos.length;
    s += avgMarketing * 2;
    s += avgQuality   * 1;
  }

  // Minimum photo threshold: needs at least 2 photos to be a strong candidate
  if (photos.length < 2) s -= 20;

  // Recency bonus: jobs from past 30 days get a small boost
  if (job.jobDate) {
    const daysAgo = (Date.now() - new Date(job.jobDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo < 30)  s += 10;
    if (daysAgo < 7)   s += 5;
  }

  // Heavy penalty for recently-used jobs (used in the past 14 days)
  if (recentlyUsedJobIds.has(job.id)) s -= 80;

  return s;
}

// ─── Photo scoring (fallback when no DetailJob assigned) ──────────────────────

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
    data: { status: "RUNNING", startedAt: new Date() },
  });

  try {
    const settings      = await prisma.socialAgentSettings.findFirst();
    const postTarget    = settings?.weeklyPostTarget ?? 3;
    const reelTarget    = settings?.weeklyReelTarget ?? 2;
    const settingsPayload = settings
      ? { defaultHashtags: settings.defaultHashtags, brandVoice: settings.brandVoice, approvalRequired: settings.approvalRequired }
      : null;

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // ── 1. Try DetailJob-first approach ───────────────────────────────────────

    // Find job IDs used in drafts from the past 14 days (via their photos' job)
    const recentDraftMedia = await prisma.socialContentMedia.findMany({
      where: { draft: { createdAt: { gte: fourteenDaysAgo } } },
      select: { sitePhoto: { select: { detailJobId: true, id: true } } },
    });
    const recentlyUsedJobIds   = new Set(
      recentDraftMedia.map((m) => m.sitePhoto?.detailJobId).filter(Boolean) as string[]
    );
    const recentlyUsedPhotoIds = new Set(
      recentDraftMedia.map((m) => m.sitePhoto?.id).filter(Boolean) as string[]
    );

    // Fetch all DetailJobs that have at least one photo
    const allJobs = await prisma.detailJob.findMany({
      include: { photos: true },
    });
    const jobsWithPhotos = allJobs.filter((j) => j.photos.length > 0);

    // Score and rank jobs
    const rankedJobs = jobsWithPhotos
      .map((j) => ({ job: j, score: scoreJob(j, recentlyUsedJobIds) }))
      .sort((a, b) => b.score - a.score);

    const usedJobIds   = new Set<string>();
    const usedPhotoIds = new Set<string>();
    let postsCreated   = 0;
    let reelsCreated   = 0;
    const now          = new Date();

    const angleKeys = CONTENT_ANGLES.map((a) => a.key);
    const ctaKeys   = CTA_STYLES.map((c) => c.key);

    // Pick photos from a job — type-appropriate first, then relax
    const pickFromJob = (job: JobWithPhotos, count: number, preferReel: boolean): SitePhoto[] => {
      const unused = job.photos.filter((p) => !usedPhotoIds.has(p.id));
      let pool = preferReel
        ? unused.filter((p) => p.isReelCandidate || p.isSocialReady || p.isFavoriteForSocial)
        : unused.filter((p) => p.isPostCandidate  || p.isSocialReady || p.isFavoriteForSocial);
      if (pool.length < count) pool = unused;
      if (pool.length === 0)   pool = job.photos; // tiny library fallback
      return pool.slice(0, count);
    };

    // ── Generate posts ────────────────────────────────────────────────────────

    for (let i = 0; i < postTarget; i++) {
      // Find next unused job with enough photos
      const candidate = rankedJobs.find(
        ({ job }) => !usedJobIds.has(job.id) && job.photos.length >= 1
      );

      if (!candidate) break;
      const { job } = candidate;
      const photos  = pickFromJob(job, 2, false);
      if (photos.length === 0) break;

      const contentAngle = angleKeys[i % angleKeys.length];
      const ctaStyle     = ctaKeys[i % ctaKeys.length];

      const serviceTypes = [job.serviceType, ...photos.flatMap((p) => p.serviceType ? [p.serviceType] : [])].filter(Boolean) as string[];

      const content = generateDraftContent({
        contentType: "POST",
        contentAngle,
        ctaStyle,
        mediaCount:   photos.length,
        serviceTypes,
        settings:     settingsPayload,
      });

      await prisma.socialContentDraft.create({
        data: {
          type:        "POST",
          status:      "NEEDS_APPROVAL",
          source:      "AUTO_AGENT",
          agentRunId,
          detailJobId: job.id,
          generatedAt: now,
          title:       content.title,
          caption:     content.caption,
          hashtags:    content.hashtags,
          hook:        content.hook,
          notes:       content.notes,
          media: {
            create: photos.map((p, idx) => ({ sitePhotoId: p.id, sortOrder: idx })),
          },
        },
      });

      usedJobIds.add(job.id);
      photos.forEach((p) => usedPhotoIds.add(p.id));
      postsCreated++;
    }

    // ── Generate reels ────────────────────────────────────────────────────────

    for (let i = 0; i < reelTarget; i++) {
      // Reels can reuse the same job if it has enough photos
      const candidate = rankedJobs.find(
        ({ job }) => job.photos.filter((p) => !usedPhotoIds.has(p.id)).length >= 2 ||
                     job.photos.length >= 3
      );

      if (!candidate) break;
      const { job } = candidate;
      const photos  = pickFromJob(job, 3, true);
      if (photos.length === 0) break;

      const contentAngle = angleKeys[(postTarget + i) % angleKeys.length];
      const ctaStyle     = ctaKeys[(i + 2) % ctaKeys.length];

      const serviceTypes = [job.serviceType, ...photos.flatMap((p) => p.serviceType ? [p.serviceType] : [])].filter(Boolean) as string[];

      const content = generateDraftContent({
        contentType: "REEL",
        contentAngle,
        ctaStyle,
        mediaCount:   photos.length,
        serviceTypes,
        settings:     settingsPayload,
      });

      await prisma.socialContentDraft.create({
        data: {
          type:        "REEL",
          status:      "NEEDS_APPROVAL",
          source:      "AUTO_AGENT",
          agentRunId,
          detailJobId: job.id,
          generatedAt: now,
          title:       content.title,
          caption:     content.caption,
          hashtags:    content.hashtags,
          hook:        content.hook,
          notes:       content.notes,
          media: {
            create: photos.map((p, idx) => ({ sitePhotoId: p.id, sortOrder: idx })),
          },
        },
      });

      usedJobIds.add(job.id);
      photos.forEach((p) => usedPhotoIds.add(p.id));
      reelsCreated++;
    }

    // ── 2. Fallback: unassigned photos (no DetailJob) ─────────────────────────
    //
    // If job-based generation didn't hit the targets, fall back to the original
    // photo-based approach using unassigned photos.

    if (postsCreated < postTarget || reelsCreated < reelTarget) {
      const allPhotos = await prisma.sitePhoto.findMany({
        where: { detailJobId: null },
      });

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

          const i          = postsCreated;
          const contentAngle = angleKeys[i % angleKeys.length];
          const ctaStyle     = ctaKeys[i % ctaKeys.length];

          const content = generateDraftContent({
            contentType: "POST", contentAngle, ctaStyle, mediaCount: photos.length,
            serviceTypes: photos.flatMap((p) => p.serviceType ? [p.serviceType] : []),
            settings: settingsPayload,
          });

          await prisma.socialContentDraft.create({
            data: {
              type: "POST", status: "NEEDS_APPROVAL", source: "AUTO_AGENT",
              agentRunId, generatedAt: now,
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

          const i          = reelsCreated;
          const contentAngle = angleKeys[(postTarget + i) % angleKeys.length];
          const ctaStyle     = ctaKeys[(i + 2) % ctaKeys.length];

          const content = generateDraftContent({
            contentType: "REEL", contentAngle, ctaStyle, mediaCount: photos.length,
            serviceTypes: photos.flatMap((p) => p.serviceType ? [p.serviceType] : []),
            settings: settingsPayload,
          });

          await prisma.socialContentDraft.create({
            data: {
              type: "REEL", status: "NEEDS_APPROVAL", source: "AUTO_AGENT",
              agentRunId, generatedAt: now,
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

    // ── 3. Bail if nothing was generated ──────────────────────────────────────

    if (postsCreated === 0 && reelsCreated === 0) {
      await prisma.socialAgentRun.update({
        where: { id: agentRunId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errorMessage: "No media in library. Upload photos via Import Media first.",
        },
      });
      return { runId: agentRunId, postsCreated: 0, reelsCreated: 0, mediaUsed: 0, error: "No media in library." };
    }

    await prisma.socialAgentRun.update({
      where: { id: agentRunId },
      data: {
        status:        "COMPLETED",
        completedAt:   new Date(),
        draftsCreated: postsCreated + reelsCreated,
        postsGenerated: postsCreated,
        reelsGenerated: reelsCreated,
        mediaReviewed: usedPhotoIds.size,
      },
    });

    return { runId: agentRunId, postsCreated, reelsCreated, mediaUsed: usedPhotoIds.size };

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.socialAgentRun.update({
      where: { id: agentRunId },
      data: { status: "FAILED", completedAt: new Date(), errorMessage: message },
    });
    return { runId: agentRunId, postsCreated: 0, reelsCreated: 0, mediaUsed: 0, error: message };
  }
}
