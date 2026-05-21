import { NextRequest, NextResponse } from "next/server";
import { getAutomationSettings } from "@/lib/automation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getAutomationSettings();
    // Redact webhook secret for GET (only show whether it's set)
    return NextResponse.json({
      settings: {
        ...settings,
        webhookSecret: settings.webhookSecret ? "••••••••" : null,
        webhookSecretIsSet: Boolean(settings.webhookSecret),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/automation/settings]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      n8nBaseUrl,
      socialWorkflowWebhookUrl,
      trendWorkflowWebhookUrl,
      canvaWorkflowWebhookUrl,
      remotionWorkflowWebhookUrl,
      metaAdsWorkflowWebhookUrl,
      webhookSecret,
      isEnabled,
    } = body;

    const settings = await getAutomationSettings();
    const { prisma } = await import("@/lib/prisma");

    const data: Record<string, unknown> = {};
    if (n8nBaseUrl                 !== undefined) data.n8nBaseUrl                 = n8nBaseUrl                 || null;
    if (socialWorkflowWebhookUrl   !== undefined) data.socialWorkflowWebhookUrl   = socialWorkflowWebhookUrl   || null;
    if (trendWorkflowWebhookUrl    !== undefined) data.trendWorkflowWebhookUrl    = trendWorkflowWebhookUrl    || null;
    if (canvaWorkflowWebhookUrl    !== undefined) data.canvaWorkflowWebhookUrl    = canvaWorkflowWebhookUrl    || null;
    if (remotionWorkflowWebhookUrl !== undefined) data.remotionWorkflowWebhookUrl = remotionWorkflowWebhookUrl || null;
    if (metaAdsWorkflowWebhookUrl  !== undefined) data.metaAdsWorkflowWebhookUrl  = metaAdsWorkflowWebhookUrl  || null;
    if (webhookSecret              !== undefined && webhookSecret !== "••••••••") data.webhookSecret = webhookSecret || null;
    if (isEnabled                  !== undefined) data.isEnabled                  = isEnabled === true;

    const updated = await prisma.automationSettings.update({ where: { id: settings.id }, data });

    return NextResponse.json({
      settings: {
        ...updated,
        webhookSecret: updated.webhookSecret ? "••••••••" : null,
        webhookSecretIsSet: Boolean(updated.webhookSecret),
      },
    });
  } catch (err) {
    console.error("[PATCH /api/admin/automation/settings]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
