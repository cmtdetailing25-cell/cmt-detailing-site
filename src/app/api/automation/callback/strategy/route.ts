import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCallbackSecret } from "@/lib/automation";

// n8n calls this when Claude strategy is ready
// Body: { campaignId, executionId, strategy, caption, hashtags, creativeNotes }

export async function POST(req: NextRequest) {
  if (!await validateCallbackSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { campaignId, executionId, strategy, caption, hashtags, creativeNotes } = body;

    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    await Promise.all([
      prisma.marketingCampaign.update({
        where: { id: campaignId },
        data: {
          status:               "STRATEGY_PENDING_APPROVAL",
          approvedStrategy:     strategy     || null,
          approvedCaption:      caption      || null,
          approvedHashtags:     hashtags     || null,
          approvedCreativeNotes:creativeNotes || null,
        },
      }),
      executionId
        ? prisma.automationWorkflowRun.updateMany({
            where: { n8nExecutionId: executionId },
            data:  { status: "COMPLETED", outputPayload: body, completedAt: new Date() },
          })
        : Promise.resolve(),
      prisma.adminNotification.create({
        data: {
          type:      "STRATEGY_READY",
          title:     "Strategy Ready for Review",
          message:   `AI strategy for "${campaign.title}" is ready. Review and approve to proceed.`,
          actionUrl: "/admin/automation",
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[callback/strategy]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
