import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type   = searchParams.get("type");

    const rows = await prisma.marketingCampaign.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(type   ? { type:   type   as never } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        assets:           { orderBy: { createdAt: "desc" }, take: 3, select: { id: true, type: true, status: true, url: true, thumbnailUrl: true, title: true } },
        workflowRuns:     { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, status: true, workflowType: true, createdAt: true, errorMessage: true } },
        performanceStats: { orderBy: { date: "desc" }, take: 1, select: { impressions: true, reach: true, likes: true, spend: true, leads: true } },
        client:           { select: { id: true, fullName: true } },
        trendInsight:     { select: { id: true, title: true } },
      },
    });

    // Serialize into the CampaignRow shape the client expects
    const campaigns = rows.map((c) => ({
      id:                    c.id,
      type:                  c.type,
      status:                c.status,
      title:                 c.title,
      goal:                  c.goal,
      platform:              c.platform,
      budget:                c.budget,
      createdAt:             c.createdAt.toISOString(),
      updatedAt:             c.updatedAt.toISOString(),
      approvedStrategy:      c.approvedStrategy,
      approvedCaption:       c.approvedCaption,
      approvedHashtags:      c.approvedHashtags,
      approvedCreativeNotes: c.approvedCreativeNotes,
      client:                c.client,
      trendInsight:          c.trendInsight,
      assets:                c.assets,
      latestRun: c.workflowRuns[0]
        ? {
            id:           c.workflowRuns[0].id,
            status:       c.workflowRuns[0].status,
            workflowType: c.workflowRuns[0].workflowType,
            createdAt:    c.workflowRuns[0].createdAt.toISOString(),
            errorMessage: c.workflowRuns[0].errorMessage,
          }
        : null,
      latestStats: c.performanceStats[0] ?? null,
    }));

    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error("[GET /api/admin/automation/campaigns]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type, title, goal, platform, campaignBrief,
      budget, startDate, endDate,
      detailJobId, clientId, vehicleId, trendInsightId,
    } = body;

    if (!type || !title) {
      return NextResponse.json({ error: "type and title are required" }, { status: 400 });
    }

    const campaign = await prisma.marketingCampaign.create({
      data: {
        type,
        title:         String(title).trim(),
        goal:          goal          ? String(goal).trim()          : null,
        platform:      platform      ? String(platform).trim()      : null,
        campaignBrief: campaignBrief ? String(campaignBrief).trim() : null,
        budget:        typeof budget === "number" ? budget : null,
        startDate:     startDate ? new Date(startDate) : null,
        endDate:       endDate   ? new Date(endDate)   : null,
        detailJobId:   detailJobId   || null,
        clientId:      clientId      || null,
        vehicleId:     vehicleId     || null,
        trendInsightId:trendInsightId || null,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/automation/campaigns]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
