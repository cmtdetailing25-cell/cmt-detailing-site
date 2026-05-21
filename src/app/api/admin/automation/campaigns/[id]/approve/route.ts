import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/automation/campaigns/[id]/approve
// Body: { stage: "strategy" | "creative" | "archive" | "complete" }

const STAGE_TRANSITIONS: Record<string, { from: string[]; to: string }> = {
  strategy:  { from: ["STRATEGY_PENDING_APPROVAL"], to: "CREATIVE_PENDING" },
  creative:  { from: ["CREATIVE_PENDING_APPROVAL"], to: "APPROVED_TO_PUBLISH" },
  archive:   { from: ["IDEA", "TREND_REVIEW", "STRATEGY_PENDING_APPROVAL", "CREATIVE_PENDING", "CREATIVE_PENDING_APPROVAL", "APPROVED_TO_PUBLISH", "FAILED"], to: "ARCHIVED" },
  complete:  { from: ["PUBLISHED", "ACTIVE_AD"], to: "COMPLETED" },
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { stage } = await req.json();
    const transition = STAGE_TRANSITIONS[stage];
    if (!transition) {
      return NextResponse.json({ error: "Invalid approval stage" }, { status: 400 });
    }

    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: params.id } });
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!transition.from.includes(campaign.status)) {
      return NextResponse.json(
        { error: `Campaign in status ${campaign.status} cannot be approved at stage "${stage}"` },
        { status: 409 }
      );
    }

    const updated = await prisma.marketingCampaign.update({
      where: { id: params.id },
      data:  { status: transition.to as never },
    });

    await prisma.adminNotification.create({
      data: {
        type:       "CAMPAIGN_APPROVED",
        title:      "Campaign Approved",
        message:    `"${campaign.title}" approved at ${stage} stage → ${transition.to.replace(/_/g, " ")}`,
        actionUrl:  `/admin/automation`,
      },
    });

    return NextResponse.json({ campaign: updated });
  } catch (err) {
    console.error("[POST /api/admin/automation/campaigns/:id/approve]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
