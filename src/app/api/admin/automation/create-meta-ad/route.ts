import { NextRequest } from "next/server";
import { triggerWorkflow } from "@/lib/automation/triggerWorkflow";

// Safety: creates Meta ad in PAUSED/DRAFT mode only.
// No budget is spent without explicit admin approval.

export async function POST(req: NextRequest) {
  const { campaignId } = await req.json();
  return triggerWorkflow({
    campaignId,
    workflowType:      "META_AD_CREATION",
    webhookUrlKey:     "metaAdsWorkflowWebhookUrl",
    newCampaignStatus: "CREATIVE_PENDING",
    buildPayload: (campaign, callbackBase) => ({
      campaignId:           campaign.id,
      campaignTitle:        campaign.title,
      adObjective:          campaign.goal ?? "AWARENESS",
      platform:             campaign.platform ?? "Facebook,Instagram",
      approvedCaption:      campaign.approvedCaption,
      approvedHashtags:     campaign.approvedHashtags,
      approvedCreativeNotes:campaign.approvedCreativeNotes,
      budget:               campaign.budget ?? null,
      startDate:            campaign.startDate ?? null,
      endDate:              campaign.endDate ?? null,
      // SAFETY: always draft/paused. n8n must NOT activate without approval callback.
      adStatus:             "PAUSED",
      requireApprovalBeforeLaunch: true,
      callbackUrl:          `${callbackBase}/api/automation/callback/assets`,
      safetyNote:           "Ad campaigns require admin approval before launch or budget changes.",
    }),
  });
}
