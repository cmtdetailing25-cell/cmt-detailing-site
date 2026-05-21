import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCallbackSecret } from "@/lib/automation";

// n8n calls this when Remotion finishes rendering a video
// Body: { campaignId, executionId, videoUrl, thumbnailUrl, format, durationSeconds }

export async function POST(req: NextRequest) {
  if (!await validateCallbackSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { campaignId, executionId, videoUrl, thumbnailUrl, format, durationSeconds } = body;

    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    await Promise.all([
      prisma.marketingAsset.create({
        data: {
          campaignId,
          type:         "REMOTION_VIDEO",
          provider:     "REMOTION",
          url:          videoUrl     || null,
          thumbnailUrl: thumbnailUrl || null,
          title:        `Remotion ${format ?? ""} Video — ${durationSeconds ?? ""}s`.trim(),
          status:       "READY",
          notes:        `Format: ${format ?? "unknown"} · Duration: ${durationSeconds ?? "?"}s`,
        },
      }),
      prisma.marketingCampaign.update({
        where: { id: campaignId },
        data:  { status: "CREATIVE_PENDING_APPROVAL" },
      }),
      executionId
        ? prisma.automationWorkflowRun.updateMany({
            where: { n8nExecutionId: executionId },
            data:  { status: "COMPLETED", outputPayload: body, completedAt: new Date() },
          })
        : Promise.resolve(),
      prisma.adminNotification.create({
        data: {
          type:      "VIDEO_READY",
          title:     "Remotion Video Ready",
          message:   `Video rendered for "${campaign.title}" (${format ?? ""} · ${durationSeconds ?? "?"}s). Review to approve.`,
          actionUrl: "/admin/automation",
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[callback/remotion-video]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
