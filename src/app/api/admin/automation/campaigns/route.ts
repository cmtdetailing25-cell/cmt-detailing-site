import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type   = searchParams.get("type");

    const campaigns = await prisma.marketingCampaign.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(type   ? { type:   type   as never } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        assets:           { orderBy: { createdAt: "desc" }, take: 3 },
        workflowRuns:     { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, status: true, workflowType: true, createdAt: true } },
        performanceStats: { orderBy: { date: "desc" }, take: 1, select: { impressions: true, reach: true, likes: true, spend: true } },
        client:           { select: { id: true, fullName: true } },
        detailJob:        { select: { id: true, title: true } },
        trendInsight:     { select: { id: true, title: true, category: true } },
        _count:           { select: { assets: true, workflowRuns: true, performanceStats: true } },
      },
    });

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
