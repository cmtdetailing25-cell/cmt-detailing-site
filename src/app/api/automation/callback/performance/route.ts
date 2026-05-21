import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCallbackSecret } from "@/lib/automation";

// n8n calls this when performance stats are synced from Meta/Instagram
// Body: { campaignId, executionId, platform, postUrl, date, stats: { impressions, reach, views, likes, ... }, rawData }

export async function POST(req: NextRequest) {
  if (!await validateCallbackSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { campaignId, executionId, platform, postUrl, date, stats = {}, rawData } = body;

    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const statDate = date ? new Date(date) : new Date();

    await Promise.all([
      prisma.marketingPerformanceStat.create({
        data: {
          campaignId,
          platform:    platform    ?? "Instagram",
          postUrl:     postUrl     ?? null,
          date:        statDate,
          impressions: stats.impressions ?? 0,
          reach:       stats.reach       ?? 0,
          views:       stats.views       ?? 0,
          likes:       stats.likes       ?? 0,
          comments:    stats.comments    ?? 0,
          shares:      stats.shares      ?? 0,
          saves:       stats.saves       ?? 0,
          clicks:      stats.clicks      ?? 0,
          leads:       stats.leads       ?? 0,
          spend:       stats.spend       ?? 0,
          costPerLead: stats.costPerLead ?? null,
          rawData:     rawData ?? null,
        },
      }),
      executionId
        ? prisma.automationWorkflowRun.updateMany({
            where: { n8nExecutionId: executionId },
            data:  { status: "COMPLETED", outputPayload: body, completedAt: new Date() },
          })
        : Promise.resolve(),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[callback/performance]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
