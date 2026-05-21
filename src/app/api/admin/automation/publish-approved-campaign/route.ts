import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerWorkflow } from "@/lib/automation/triggerWorkflow";

export async function POST(req: NextRequest) {
  const { campaignId } = await req.json();

  // Safety gate: only allow publishing if status is APPROVED_TO_PUBLISH
  const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.status !== "APPROVED_TO_PUBLISH") {
    return NextResponse.json({
      error: `Campaign must be in APPROVED_TO_PUBLISH status to publish. Current: ${campaign.status}`,
    }, { status: 409 });
  }

  return triggerWorkflow({
    campaignId,
    workflowType:       "META_PUBLISHING",
    webhookUrlKey:      "socialWorkflowWebhookUrl",
    buildPayload: (c, callbackBase) => ({
      campaignId:        c.id,
      campaignTitle:     c.title,
      campaignType:      c.type,
      platform:          c.platform ?? "Instagram",
      approvedCaption:   c.approvedCaption,
      approvedHashtags:  c.approvedHashtags,
      scheduleMode:      "DRAFT",
      callbackUrl:       `${callbackBase}/api/automation/callback/publish-confirmation`,
    }),
  });
}
