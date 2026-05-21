import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCallbackSecret } from "@/lib/automation";

// n8n calls this when Canva or Meta ad assets are ready
// Body: { campaignId, executionId, assets: [{ type, provider, url, thumbnailUrl, title }] }

export async function POST(req: NextRequest) {
  if (!await validateCallbackSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { campaignId, executionId, assets = [] } = body;

    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    await Promise.all([
      // Upsert assets
      assets.length > 0
        ? prisma.marketingAsset.createMany({
            data: assets.map((a: Record<string, string>) => ({
              campaignId,
              type:         a.type        ?? "IMAGE",
              provider:     a.provider    ?? "N8N",
              url:          a.url         ?? null,
              thumbnailUrl: a.thumbnailUrl ?? null,
              title:        a.title        ?? "Generated Asset",
              status:       "READY",
            })),
          })
        : Promise.resolve(),
      prisma.marketingCampaign.update({
        where: { id: campaignId },
        data:  { status: "CREATIVE_PENDING_APPROVAL" },
      }),
      executionId
        ? prisma.automationWorkflowRun.updateMany({
            where: { n8nExecutionId: executionId },
            data:  { status: "COMPLETED", outputPayload: body, completedAt: new Date() },
          })
        : Promise.resolve(),
      prisma.adminNotification.create({
        data: {
          type:      "ASSETS_READY",
          title:     "Creative Assets Ready",
          message:   `${assets.length} asset(s) generated for "${campaign.title}". Review to approve.`,
          actionUrl: "/admin/automation",
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[callback/assets]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
