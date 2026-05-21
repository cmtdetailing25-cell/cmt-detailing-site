import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCallbackSecret } from "@/lib/automation";

// n8n calls this when a post or ad has been published/confirmed
// Body: { campaignId, executionId, postUrl, platform, publishedAt, adStatus }

export async function POST(req: NextRequest) {
  if (!await validateCallbackSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { campaignId, executionId, postUrl, platform, adStatus } = body;

    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const newStatus = adStatus === "ACTIVE" ? "ACTIVE_AD" : "PUBLISHED";

    await Promise.all([
      prisma.marketingCampaign.update({
        where: { id: campaignId },
        data:  { status: newStatus },
      }),
      executionId
        ? prisma.automationWorkflowRun.updateMany({
            where: { n8nExecutionId: executionId },
            data:  { status: "COMPLETED", outputPayload: body, completedAt: new Date() },
          })
        : Promise.resolve(),
      prisma.adminNotification.create({
        data: {
          type:      "CAMPAIGN_PUBLISHED",
          title:     newStatus === "ACTIVE_AD" ? "Ad Campaign Live" : "Content Published",
          message:   `"${campaign.title}" is now ${newStatus.replace(/_/g, " ")} on ${platform ?? "Instagram"}.${postUrl ? ` Post URL: ${postUrl}` : ""}`,
          actionUrl: "/admin/automation",
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[callback/publish-confirmation]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
