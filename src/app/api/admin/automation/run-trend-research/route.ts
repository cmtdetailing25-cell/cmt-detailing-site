import { NextRequest } from "next/server";
import { triggerWorkflow } from "@/lib/automation/triggerWorkflow";

export async function POST(req: NextRequest) {
  const { campaignId } = await req.json();
  return triggerWorkflow({
    campaignId,
    workflowType:       "TREND_RESEARCH",
    webhookUrlKey:      "trendWorkflowWebhookUrl",
    newCampaignStatus:  "TREND_REVIEW",
    buildPayload: (campaign, callbackBase) => ({
      campaignId:        campaign.id,
      campaignTitle:     campaign.title,
      campaignType:      campaign.type,
      goal:              campaign.goal,
      platform:          campaign.platform,
      callbackUrl:       `${callbackBase}/api/automation/callback/strategy`,
    }),
  });
}
