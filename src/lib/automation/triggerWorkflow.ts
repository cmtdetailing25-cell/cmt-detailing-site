import { prisma } from "@/lib/prisma";
import { callN8nWebhook, getAutomationSettings, getCallbackBaseUrl } from "@/lib/automation";
import { AutomationWorkflowType, CampaignStatus } from "@prisma/client";
import { NextResponse } from "next/server";

interface TriggerOptions {
  campaignId:     string;
  workflowType:   AutomationWorkflowType;
  webhookUrlKey:  keyof Awaited<ReturnType<typeof getAutomationSettings>>;
  newCampaignStatus?: CampaignStatus;
  buildPayload:   (campaign: NonNullable<Awaited<ReturnType<typeof loadCampaign>>>, callbackBase: string) => Record<string, unknown>;
}

async function loadCampaign(id: string) {
  return prisma.marketingCampaign.findUnique({
    where: { id },
    include: {
      client:      { select: { fullName: true, phone: true, email: true } },
      vehicle:     { select: { year: true, make: true, model: true, color: true } },
      detailJob:   { include: { photos: { where: { isSocialReady: true }, take: 10, select: { imageUrl: true, title: true, socialTitle: true } } } },
      trendInsight:{ select: { title: true, category: true, exampleHook: true, suggestedUse: true, hashtags: true } },
    },
  });
}

export async function triggerWorkflow(opts: TriggerOptions) {
  const { campaignId, workflowType, webhookUrlKey, newCampaignStatus, buildPayload } = opts;

  const campaign = await loadCampaign(campaignId);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const settings = await getAutomationSettings();
  if (!settings.isEnabled) {
    return NextResponse.json({ error: "Automation is disabled. Enable it in Automation Settings." }, { status: 400 });
  }

  const webhookUrl = settings[webhookUrlKey] as string | null | undefined;
  if (!webhookUrl) {
    return NextResponse.json({
      error: `${workflowType} webhook URL is not configured. Add it in Automation Settings.`,
      notConfigured: true,
    }, { status: 400 });
  }

  const callbackBase = getCallbackBaseUrl();
  const payload = buildPayload(campaign, callbackBase);

  // Create run record
  const run = await prisma.automationWorkflowRun.create({
    data: {
      campaignId,
      workflowType,
      status:       "PENDING",
      inputPayload: payload as never,
      startedAt:    new Date(),
    },
  });

  // Update campaign status
  if (newCampaignStatus) {
    await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data:  { status: newCampaignStatus },
    });
  }

  // Call n8n
  const result = await callN8nWebhook(webhookUrl, payload, settings.webhookSecret ?? "");

  // Update run
  await prisma.automationWorkflowRun.update({
    where: { id: run.id },
    data: {
      status:        result.ok ? "RUNNING" : "FAILED",
      n8nExecutionId: (result.data as Record<string, string> | null)?.executionId ?? null,
      errorMessage:  result.ok ? null : `n8n returned HTTP ${result.status}`,
    },
  });

  return NextResponse.json({ ok: result.ok, runId: run.id, campaignId });
}
