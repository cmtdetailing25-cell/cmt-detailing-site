import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id: params.id },
      include: {
        assets:           { orderBy: { createdAt: "desc" } },
        workflowRuns:     { orderBy: { createdAt: "desc" } },
        performanceStats: { orderBy: { date: "desc" } },
        client:           true,
        vehicle:          true,
        detailJob:        { include: { photos: { take: 5 } } },
        trendInsight:     true,
      },
    });
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ campaign });
  } catch (err) {
    console.error("[GET /api/admin/automation/campaigns/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      title, goal, platform, status, campaignBrief,
      approvedStrategy, approvedCaption, approvedHashtags, approvedCreativeNotes,
      budget, startDate, endDate,
    } = body;

    const data: Record<string, unknown> = {};
    if (title                 !== undefined) data.title                 = String(title).trim();
    if (goal                  !== undefined) data.goal                  = goal                  ? String(goal).trim()                  : null;
    if (platform              !== undefined) data.platform              = platform              ? String(platform).trim()              : null;
    if (status                !== undefined) data.status                = status;
    if (campaignBrief         !== undefined) data.campaignBrief         = campaignBrief         ? String(campaignBrief).trim()         : null;
    if (approvedStrategy      !== undefined) data.approvedStrategy      = approvedStrategy      ? String(approvedStrategy).trim()      : null;
    if (approvedCaption       !== undefined) data.approvedCaption       = approvedCaption       ? String(approvedCaption).trim()       : null;
    if (approvedHashtags      !== undefined) data.approvedHashtags      = approvedHashtags      ? String(approvedHashtags).trim()      : null;
    if (approvedCreativeNotes !== undefined) data.approvedCreativeNotes = approvedCreativeNotes ? String(approvedCreativeNotes).trim() : null;
    if (budget                !== undefined) data.budget                = typeof budget === "number" ? budget : null;
    if (startDate             !== undefined) data.startDate             = startDate ? new Date(startDate) : null;
    if (endDate               !== undefined) data.endDate               = endDate   ? new Date(endDate)   : null;

    const campaign = await prisma.marketingCampaign.update({ where: { id: params.id }, data });
    return NextResponse.json({ campaign });
  } catch (err) {
    console.error("[PATCH /api/admin/automation/campaigns/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.marketingCampaign.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/automation/campaigns/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
