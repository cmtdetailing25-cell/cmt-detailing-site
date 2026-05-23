import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCallbackSecret } from "@/lib/automation";
import { AutomationRunStatus, AssetType, AssetProvider, AssetStatus } from "@prisma/client";

// n8n calls this when Remotion finishes rendering.
// Body: { campaignId, workflowRunId?, executionId?,
//         videoUrl, thumbnailUrl?, format?, durationSeconds? }

export const dynamic = "force-dynamic";

function str(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") return val.trim() || null;
  return String(val).trim() || null;
}

export async function POST(req: NextRequest) {
  if (!await validateCallbackSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log("[remotion-video callback body]", body);

  const {
    campaignId,
    workflowRunId: rawWorkflowRunId,
    executionId:   rawExecutionId,
    videoUrl:      rawVideoUrl,
    thumbnailUrl:  rawThumbnailUrl,
    format:        rawFormat,
    durationSeconds: rawDuration,
  } = body;

  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required", received: campaignId }, { status: 400 });
  }

  const cleanCampaignId  = String(campaignId).trim();
  const cleanRunId       = typeof rawWorkflowRunId === "string" ? rawWorkflowRunId.trim() : null;
  const cleanExecutionId = typeof rawExecutionId   === "string" ? rawExecutionId.trim()   : null;
  const videoUrl         = str(rawVideoUrl);
  const thumbnailUrl     = str(rawThumbnailUrl);
  const format           = str(rawFormat)    ?? "mp4";
  const durationStr      = rawDuration != null ? String(rawDuration) : "?";

  console.log("[remotion-video callback] IDs:", { cleanCampaignId, cleanRunId, cleanExecutionId, videoUrl });

  if (!videoUrl) {
    return NextResponse.json({ error: "videoUrl is required", received: rawVideoUrl }, { status: 400 });
  }

  try {
    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: cleanCampaignId } });

    if (!campaign) {
      const sample = await prisma.marketingCampaign.findMany({ select: { id: true, title: true }, take: 10 });
      return NextResponse.json({
        error: "Campaign not found",
        cleanCampaignId,
        availableCampaignIds: sample.map((c) => c.id),
      }, { status: 404 });
    }

    // ── Resolve workflow run (triple fallback) ─────────────────────────────
    const statusData = { status: AutomationRunStatus.COMPLETED, completedAt: new Date() };
    let runUpdated   = 0;
    let matchedRunId: string | null = null;

    if (cleanRunId) {
      const r = await prisma.automationWorkflowRun.updateMany({
        where: { id: cleanRunId, campaignId: cleanCampaignId },
        data:  statusData,
      });
      runUpdated = r.count;
      if (runUpdated > 0) matchedRunId = cleanRunId;
      console.log("[remotion-video callback] updated run via workflowRunId", { cleanRunId, count: r.count });
    }

    if (runUpdated === 0 && cleanExecutionId) {
      const r = await prisma.automationWorkflowRun.updateMany({
        where: { n8nExecutionId: cleanExecutionId },
        data:  statusData,
      });
      runUpdated = r.count;
      console.log("[remotion-video callback] updated run via executionId", { cleanExecutionId, count: r.count });
    }

    if (runUpdated === 0) {
      const activeRun = await prisma.automationWorkflowRun.findFirst({
        where: {
          campaignId:   cleanCampaignId,
          workflowType: "REMOTION_VIDEO_CREATION",
          status:       { in: [AutomationRunStatus.RUNNING, AutomationRunStatus.PENDING] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (activeRun) {
        const r = await prisma.automationWorkflowRun.updateMany({
          where: { id: activeRun.id },
          data:  statusData,
        });
        runUpdated = r.count;
        matchedRunId = activeRun.id;
        console.log("[remotion-video callback] updated run via fallback scan", { id: activeRun.id, count: r.count });
      } else {
        console.warn("[remotion-video callback] no active REMOTION_VIDEO_CREATION run for campaign", cleanCampaignId);
      }
    }

    // Save outputPayload (non-critical)
    if (matchedRunId) {
      try {
        await prisma.automationWorkflowRun.update({
          where: { id: matchedRunId },
          data:  { outputPayload: body as never },
        });
      } catch (e) {
        console.warn("[remotion-video callback] outputPayload save failed (non-fatal)", e);
      }
    }

    console.log("[remotion-video callback] run resolution:", { runUpdated, matchedRunId });

    // ── Attach rendered video asset + move campaign ────────────────────────
    await Promise.all([
      prisma.marketingAsset.create({
        data: {
          campaignId:   cleanCampaignId,
          type:         AssetType.REMOTION_VIDEO,
          provider:     AssetProvider.REMOTION,
          url:          videoUrl,
          thumbnailUrl: thumbnailUrl,
          title:        `Remotion ${format} Video — ${durationStr}s`,
          status:       AssetStatus.READY,
          notes:        `Format: ${format} · Duration: ${durationStr}s`,
        },
      }),
      prisma.marketingCampaign.update({
        where: { id: cleanCampaignId },
        data:  { status: "VIDEO_READY_REVIEW" },
      }),
      prisma.adminNotification.create({
        data: {
          type:      "VIDEO_READY",
          title:     "Video Ready for Review",
          message:   `Remotion render complete for "${campaign.title}" (${format} · ${durationStr}s). Review and approve to publish.`,
          actionUrl: "/admin/automation",
        },
      }),
    ]);

    return NextResponse.json({
      ok:              true,
      cleanCampaignId,
      videoAttached:   true,
      runUpdatedCount: runUpdated,
    });
  } catch (err) {
    console.error("[callback/remotion-video] Prisma error:", err);
    return NextResponse.json({
      error:  "Database update failed",
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
