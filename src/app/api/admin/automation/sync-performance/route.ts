import { NextRequest } from "next/server";
import { triggerWorkflow } from "@/lib/automation/triggerWorkflow";

export async function POST(req: NextRequest) {
  const { campaignId } = await req.json();
  return triggerWorkflow({
    campaignId,
    workflowType:    "PERFORMANCE_SYNC",
    webhookUrlKey:   "metaAdsWorkflowWebhookUrl",
    buildPayload: (campaign, callbackBase) => ({
      campaignId:  campaign.id,
      platform:    campaign.platform ?? "Instagram,Facebook",
      callbackUrl: `${callbackBase}/api/automation/callback/performance`,
    }),
  });
}
