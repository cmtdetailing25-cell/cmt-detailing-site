import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Redact the secret before sending to client — only expose whether it is set
function redact(settings: {
  webhookSecret: string | null;
  [key: string]: unknown;
}) {
  const { webhookSecret, ...rest } = settings;
  return {
    ...rest,
    webhookSecret:      null,          // never returned
    webhookSecretIsSet: Boolean(webhookSecret),
  };
}

async function getOrCreateSettings() {
  let settings = await prisma.automationSettings.findFirst();
  if (!settings) {
    console.log("[AutomationSettings] No settings row found — creating default");
    settings = await prisma.automationSettings.create({ data: {} });
  }
  return settings;
}

export async function GET() {
  try {
    const settings = await getOrCreateSettings();
    return NextResponse.json({ settings: redact(settings) });
  } catch (err) {
    console.error("[GET /api/admin/automation/settings]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    // Log received payload (secret redacted)
    console.log("[PATCH /api/admin/automation/settings] Received:", {
      ...body,
      ...(body.webhookSecret !== undefined ? { webhookSecret: "[REDACTED]" } : {}),
    });

    const {
      isEnabled,
      n8nBaseUrl,
      socialWorkflowWebhookUrl,
      trendWorkflowWebhookUrl,
      canvaWorkflowWebhookUrl,
      remotionWorkflowWebhookUrl,
      metaAdsWorkflowWebhookUrl,
      webhookSecret,
    } = body;

    // Build the data object — only include keys that were sent in the payload
    const data: Record<string, unknown> = {};
    if (isEnabled                  !== undefined) data.isEnabled                  = isEnabled === true;
    if (n8nBaseUrl                 !== undefined) data.n8nBaseUrl                 = n8nBaseUrl                 || null;
    if (socialWorkflowWebhookUrl   !== undefined) data.socialWorkflowWebhookUrl   = socialWorkflowWebhookUrl   || null;
    if (trendWorkflowWebhookUrl    !== undefined) data.trendWorkflowWebhookUrl    = trendWorkflowWebhookUrl    || null;
    if (canvaWorkflowWebhookUrl    !== undefined) data.canvaWorkflowWebhookUrl    = canvaWorkflowWebhookUrl    || null;
    if (remotionWorkflowWebhookUrl !== undefined) data.remotionWorkflowWebhookUrl = remotionWorkflowWebhookUrl || null;
    if (metaAdsWorkflowWebhookUrl  !== undefined) data.metaAdsWorkflowWebhookUrl  = metaAdsWorkflowWebhookUrl  || null;
    // Only update the secret if a non-empty, non-placeholder value was explicitly sent
    if (webhookSecret !== undefined && webhookSecret !== "" && webhookSecret !== "••••••••") {
      data.webhookSecret = webhookSecret;
    }

    console.log("[PATCH /api/admin/automation/settings] Writing to DB:", {
      ...data,
      ...(data.webhookSecret !== undefined ? { webhookSecret: "[REDACTED]" } : {}),
    });

    // Ensure a settings row exists, then update it
    const existing = await getOrCreateSettings();
    const updated  = await prisma.automationSettings.update({
      where: { id: existing.id },
      data,
    });

    console.log("[PATCH /api/admin/automation/settings] DB result:", {
      id:                         updated.id,
      isEnabled:                  updated.isEnabled,
      n8nBaseUrl:                 updated.n8nBaseUrl,
      socialWorkflowWebhookUrl:   updated.socialWorkflowWebhookUrl,
      trendWorkflowWebhookUrl:    updated.trendWorkflowWebhookUrl,
      canvaWorkflowWebhookUrl:    updated.canvaWorkflowWebhookUrl,
      remotionWorkflowWebhookUrl: updated.remotionWorkflowWebhookUrl,
      metaAdsWorkflowWebhookUrl:  updated.metaAdsWorkflowWebhookUrl,
      webhookSecretIsSet:         Boolean(updated.webhookSecret),
      updatedAt:                  updated.updatedAt,
    });

    return NextResponse.json({ settings: redact(updated) });
  } catch (err) {
    console.error("[PATCH /api/admin/automation/settings] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
