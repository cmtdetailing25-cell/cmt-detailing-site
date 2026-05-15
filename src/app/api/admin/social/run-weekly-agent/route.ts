import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runWeeklyAgent, getWeekBounds } from "@/lib/social/runWeeklyAgent";

export async function POST(request: Request) {
  let body: { force?: unknown; preview?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }

  const force   = body?.force   === true;
  const preview = body?.preview === true;

  const { start, end } = getWeekBounds();

  const settings = await prisma.socialAgentSettings.findFirst();
  const postTarget = settings?.weeklyPostTarget ?? 3;
  const reelTarget = settings?.weeklyReelTarget ?? 2;

  // ── Preview mode: estimate without saving ────────────────────────────────

  if (preview) {
    const [allPhotos, socialReadyPhotos] = await Promise.all([
      prisma.sitePhoto.count(),
      prisma.sitePhoto.count({ where: { isSocialReady: true } }),
    ]);

    return NextResponse.json({
      preview: true,
      estimatedPosts:  Math.min(postTarget, allPhotos > 0 ? postTarget : 0),
      estimatedReels:  Math.min(reelTarget, allPhotos > 0 ? reelTarget : 0),
      availableMedia:  allPhotos,
      socialReadyMedia: socialReadyPhotos,
      postTarget,
      reelTarget,
      weekStart: start.toISOString(),
      weekEnd:   end.toISOString(),
    });
  }

  // ── Safety guard: duplicate weekly run ───────────────────────────────────

  if (!force) {
    const existingRun = await prisma.socialAgentRun.findFirst({
      where: {
        weekStartDate: { gte: start },
        status: { in: ["COMPLETED", "RUNNING"] },
      },
    });
    if (existingRun) {
      return NextResponse.json(
        {
          error:
            "A run already exists for this week. Use force to override.",
          existingRunId: existingRun.id,
          weekConflict: true,
        },
        { status: 409 }
      );
    }
  }

  // ── Create the run record ────────────────────────────────────────────────

  const agentRun = await prisma.socialAgentRun.create({
    data: {
      status: "PENDING",
      weekStartDate: start,
      weekEndDate:   end,
      postsTarget:   postTarget,
      reelsTarget:   reelTarget,
    },
  });

  // ── Execute ──────────────────────────────────────────────────────────────

  const result = await runWeeklyAgent(agentRun.id);

  if (result.error) {
    return NextResponse.json(
      { error: result.error, runId: result.runId },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    runId:        result.runId,
    postsCreated: result.postsCreated,
    reelsCreated: result.reelsCreated,
    mediaUsed:    result.mediaUsed,
    weekStart:    start.toISOString(),
    weekEnd:      end.toISOString(),
  });
}
