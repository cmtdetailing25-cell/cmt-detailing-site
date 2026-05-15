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

// ─── Media scoring ────────────────────────────────────────────────────────────
//
// Higher = better candidate. Recently-used photos get a heavy penalty so the
// agent rotates through the library rather than recycling the same shots.

function scorePhoto(photo: SitePhoto, recentlyUsedIds: Set<string>): number {
  let s = 0;
  if (photo.isSocialReady) s += 30;
  if (photo.isFavoriteForSocial) s += 20;
  if (photo.isBeforeAfterCandidate) s += 10;
  if (photo.isPostCandidate) s += 8;
  if (photo.isReelCandidate) s += 8;
  s += photo.marketingScore * 3;
  s += photo.qualityScore * 2;
  s += photo.contentScore * 2;
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
    const settings = await prisma.socialAgentSettings.findFirst();
    const postTarget = settings?.weeklyPostTarget ?? 3;
    const reelTarget = settings?.weeklyReelTarget ?? 2;

    // IDs used in drafts from the past 14 days → penalise in scoring
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentMedia = await prisma.socialContentMedia.findMany({
      where: { draft: { createdAt: { gte: fourteenDaysAgo } } },
      select: { sitePhotoId: true },
    });
    const recentlyUsedIds = new Set(recentMedia.map((m) => m.sitePhotoId));

    const allPhotos = await prisma.sitePhoto.findMany();
    if (allPhotos.length === 0) {
      await prisma.socialAgentRun.update({
        where: { id: agentRunId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errorMessage: "No media in library. Upload photos via the Media Manager first.",
        },
      });
      return {
        runId: agentRunId,
        postsCreated: 0,
        reelsCreated: 0,
        mediaUsed: 0,
        error: "No media in library.",
      };
    }

    // Score and rank all photos descending
    const ranked = allPhotos
      .map((p) => ({ photo: p, score: scorePhoto(p, recentlyUsedIds) }))
      .sort((a, b) => b.score - a.score);

    const usedIds = new Set<string>();
    let postsCreated = 0;
    let reelsCreated = 0;

    const angleKeys = CONTENT_ANGLES.map((a) => a.key);
    const ctaKeys   = CTA_STYLES.map((c) => c.key);

    // Pick up to `count` photos, preferring type-appropriate and unused ones.
    // Falls back progressively so we always generate something.
    const pick = (count: number, preferReel: boolean): SitePhoto[] => {
      const unused = ranked.filter((item) => !usedIds.has(item.photo.id));

      let pool = preferReel
        ? unused.filter(
            (item) =>
              item.photo.isReelCandidate ||
              item.photo.isFavoriteForSocial ||
              item.photo.isSocialReady
          )
        : unused.filter(
            (item) =>
              item.photo.isPostCandidate ||
              item.photo.isFavoriteForSocial ||
              item.photo.isSocialReady
          );

      // Relax: any unused photo
      if (pool.length < count) pool = unused;
      // Last resort: allow already-used photos (tiny library)
      if (pool.length === 0) pool = ranked;

      return pool.slice(0, count).map((item) => item.photo);
    }

    const now = new Date();
    const settingsPayload = settings
      ? {
          defaultHashtags: settings.defaultHashtags,
          brandVoice: settings.brandVoice,
          approvalRequired: settings.approvalRequired,
        }
      : null;

    // ── Generate posts ────────────────────────────────────────────────────────

    for (let i = 0; i < postTarget; i++) {
      const photos = pick(2, false);
      if (photos.length === 0) break;

      const contentAngle = angleKeys[i % angleKeys.length];
      const ctaStyle     = ctaKeys[i % ctaKeys.length];

      const content = generateDraftContent({
        contentType: "POST",
        contentAngle,
        ctaStyle,
        mediaCount: photos.length,
        serviceTypes: photos.flatMap((p) => (p.serviceType ? [p.serviceType] : [])),
        settings: settingsPayload,
      });

      await prisma.socialContentDraft.create({
        data: {
          type: "POST",
          status: "NEEDS_APPROVAL",
          source: "AUTO_AGENT",
          agentRunId,
          generatedAt: now,
          title: content.title,
          caption: content.caption,
          hashtags: content.hashtags,
          hook: content.hook,
          notes: content.notes,
          media: {
            create: photos.map((p, idx) => ({ sitePhotoId: p.id, sortOrder: idx })),
          },
        },
      });

      photos.forEach((p) => usedIds.add(p.id));
      postsCreated++;
    }

    // ── Generate reels ────────────────────────────────────────────────────────

    for (let i = 0; i < reelTarget; i++) {
      const photos = pick(3, true);
      if (photos.length === 0) break;

      const contentAngle = angleKeys[(postTarget + i) % angleKeys.length];
      const ctaStyle     = ctaKeys[(i + 2) % ctaKeys.length];

      const content = generateDraftContent({
        contentType: "REEL",
        contentAngle,
        ctaStyle,
        mediaCount: photos.length,
        serviceTypes: photos.flatMap((p) => (p.serviceType ? [p.serviceType] : [])),
        settings: settingsPayload,
      });

      await prisma.socialContentDraft.create({
        data: {
          type: "REEL",
          status: "NEEDS_APPROVAL",
          source: "AUTO_AGENT",
          agentRunId,
          generatedAt: now,
          title: content.title,
          caption: content.caption,
          hashtags: content.hashtags,
          hook: content.hook,
          notes: content.notes,
          media: {
            create: photos.map((p, idx) => ({ sitePhotoId: p.id, sortOrder: idx })),
          },
        },
      });

      photos.forEach((p) => usedIds.add(p.id));
      reelsCreated++;
    }

    await prisma.socialAgentRun.update({
      where: { id: agentRunId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        draftsCreated: postsCreated + reelsCreated,
        postsGenerated: postsCreated,
        reelsGenerated: reelsCreated,
        mediaReviewed: allPhotos.length,
      },
    });

    return {
      runId: agentRunId,
      postsCreated,
      reelsCreated,
      mediaUsed: usedIds.size,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.socialAgentRun.update({
      where: { id: agentRunId },
      data: { status: "FAILED", completedAt: new Date(), errorMessage: message },
    });
    return { runId: agentRunId, postsCreated: 0, reelsCreated: 0, mediaUsed: 0, error: message };
  }
}
