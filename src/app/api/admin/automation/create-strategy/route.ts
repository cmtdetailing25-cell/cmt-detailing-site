import { NextRequest } from "next/server";
import { triggerWorkflow } from "@/lib/automation/triggerWorkflow";

export async function POST(req: NextRequest) {
  const { campaignId } = await req.json();
  return triggerWorkflow({
    campaignId,
    workflowType:       "CLAUDE_STRATEGY",
    webhookUrlKey:      "socialWorkflowWebhookUrl",
    newCampaignStatus:  "STRATEGY_PENDING_APPROVAL",
    buildPayload: (campaign, callbackBase) => ({
      campaignId:        campaign.id,
      campaignTitle:     campaign.title,
      campaignType:      campaign.type,
      goal:              campaign.goal,
      platform:          campaign.platform,
      campaignBrief:     campaign.campaignBrief,
      brand:             "CMT Detailing",
      brandStyle:        "premium automotive, dark cinematic, clean luxury",
      trendInsight:      campaign.trendInsight ?? null,
      callbackUrl:       `${callbackBase}/api/automation/callback/strategy`,
    }),
  });
}
