import { NextRequest } from "next/server";
import { triggerWorkflow } from "@/lib/automation/triggerWorkflow";

export async function POST(req: NextRequest) {
  const { campaignId, format = "9:16", durationSeconds = 15 } = await req.json();
  return triggerWorkflow({
    campaignId,
    workflowType:       "REMOTION_VIDEO_CREATION",
    webhookUrlKey:      "remotionWorkflowWebhookUrl",
    newCampaignStatus:  "CREATIVE_PENDING",
    buildPayload: (campaign, callbackBase) => ({
      campaignId:     campaign.id,
      videoType:      campaign.type === "REEL" ? "REEL" : "VIDEO_AD",
      format,
      durationSeconds,
      brand:          "CMT Detailing",
      style:          "premium automotive, dark cinematic, clean luxury",
      sourceMedia:    campaign.detailJob?.photos?.map(p => p.imageUrl) ?? [],
      script:         campaign.approvedStrategy ?? campaign.campaignBrief ?? "",
      shotList:       [],
      captionOverlays:campaign.approvedCaption ? [campaign.approvedCaption] : [],
      cta:            campaign.goal ?? "Book your detail today",
      platform:       campaign.platform ?? "Instagram",
      outputCallbackUrl: `${callbackBase}/api/automation/callback/remotion-video`,
    }),
  });
}
