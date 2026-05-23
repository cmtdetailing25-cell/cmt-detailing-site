import { NextRequest, NextResponse } from "next/server";
import { triggerWorkflow } from "@/lib/automation/triggerWorkflow";
import { prisma } from "@/lib/prisma";

function buildMediaItem(cm: {
  role: string;
  sitePhoto: {
    id: string; imageUrl: string; title: string;
    fileType: string | null; width: number | null;
    height: number | null; duration: number | null;
  };
}) {
  return {
    id:       cm.sitePhoto.id,
    url:      cm.sitePhoto.imageUrl,
    type:     cm.sitePhoto.fileType ?? "image",
    role:     cm.role,
    filename: cm.sitePhoto.title,
    width:    cm.sitePhoto.width    ?? null,
    height:   cm.sitePhoto.height   ?? null,
    duration: cm.sitePhoto.duration ?? null,
  };
}

export async function POST(req: NextRequest) {
  const {
    campaignId,
    format          = "9:16",
    durationSeconds = 15,
    isTestRender    = false,
  } = await req.json();

  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }

  // ── Media guard (skip for test renders) ───────────────────────────────────
  if (!isTestRender) {
    const mediaCount = await prisma.campaignMedia.count({ where: { campaignId } });
    if (mediaCount === 0) {
      return NextResponse.json({
        error:   "No media attached to this campaign. Attach photos/videos in Campaign Detail, or use Test Render.",
        noMedia: true,
      }, { status: 400 });
    }
  }

  return triggerWorkflow({
    campaignId,
    workflowType:      "REMOTION_VIDEO_CREATION",
    webhookUrlKey:     "remotionWorkflowWebhookUrl",
    newCampaignStatus: "VIDEO_RENDER_PENDING",
    buildPayload: (campaign, callbackBase) => {
      const media = (campaign.campaignMedia ?? []).map(buildMediaItem);

      // Structural breakdown for Remotion compositor
      const reelStructure = {
        hook:    media.filter((m) => m.role === "general").slice(0, 1),
        before:  media.filter((m) => m.role === "before"),
        process: media.filter((m) => m.role === "process"),
        after:   media.filter((m) => m.role === "after" || m.role === "reveal"),
        logo:    media.filter((m) => m.role === "logo"),
      };

      return {
        campaignId:           campaign.id,
        campaignTitle:        campaign.title,
        videoType:            campaign.type === "REEL" ? "REEL" : "VIDEO_AD",
        format,
        durationSeconds,
        isTestRender,
        brand:                "CMT Detailing",
        style:                "premium automotive, dark cinematic, clean luxury",
        approvedStrategy:     campaign.approvedStrategy      ?? campaign.campaignBrief ?? "",
        approvedCaption:      campaign.approvedCaption       ?? "",
        approvedHashtags:     campaign.approvedHashtags      ?? "",
        approvedCreativeNotes:campaign.approvedCreativeNotes ?? "",
        cta:                  campaign.goal     ?? "Book your detail today",
        platform:             campaign.platform ?? "Instagram",
        media,
        reelStructure,
        outputCallbackUrl: `${callbackBase}/api/automation/callback/remotion-video`,
      };
    },
  });
}
