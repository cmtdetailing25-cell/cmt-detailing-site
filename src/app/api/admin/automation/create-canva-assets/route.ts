import { NextRequest } from "next/server";
import { triggerWorkflow } from "@/lib/automation/triggerWorkflow";

export async function POST(req: NextRequest) {
  const { campaignId } = await req.json();
  return triggerWorkflow({
    campaignId,
    workflowType:       "CANVA_ASSET_CREATION",
    webhookUrlKey:      "canvaWorkflowWebhookUrl",
    newCampaignStatus:  "CREATIVE_PENDING",
    buildPayload: (campaign, callbackBase) => ({
      campaignId:           campaign.id,
      campaignTitle:        campaign.title,
      campaignType:         campaign.type,
      approvedStrategy:     campaign.approvedStrategy,
      approvedCaption:      campaign.approvedCaption,
      approvedHashtags:     campaign.approvedHashtags,
      approvedCreativeNotes:campaign.approvedCreativeNotes,
      brand:                "CMT Detailing",
      brandStyle:           "premium automotive, dark cinematic",
      sourceMedia:          campaign.detailJob?.photos?.map(p => p.imageUrl) ?? [],
      callbackUrl:          `${callbackBase}/api/automation/callback/assets`,
    }),
  });
}
