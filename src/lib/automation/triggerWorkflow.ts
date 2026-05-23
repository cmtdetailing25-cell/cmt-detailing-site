import { prisma } from "@/lib/prisma";
import { callN8nWebhook, getAutomationSettings, getCallbackBaseUrl } from "@/lib/automation";
import { AutomationWorkflowType, CampaignStatus } from "@prisma/client";
import { NextResponse } from "next/server";

interface TriggerOptions {
  campaignId:        string;
  workflowType:      AutomationWorkflowType;
  webhookUrlKey:     keyof Awaited<ReturnType<typeof getAutomationSettings>>;
  newCampaignStatus?: CampaignStatus;
  buildPayload: (
    campaign:     NonNullable<Awaited<ReturnType<typeof loadCampaign>>>,
    callbackBase: string,
  ) => Record<string, unknown>;
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

  // ── Close any prior RUNNING/PENDING runs for this campaign ─────────────────
  // Prevents stale "RUNNING" runs showing in the UI after moving to the next step
  await prisma.automationWorkflowRun.updateMany({
    where: {
      campaignId,
      status: { in: ["RUNNING", "PENDING"] },
    },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  // ── Create the new run record (without workflowRunId in payload yet) ───────
  const run = await prisma.automationWorkflowRun.create({
    data: {
      campaignId,
      workflowType,
      status:    "PENDING",
      startedAt: new Date(),
    },
  });

  // ── Build payload and enrich with workflowRunId ────────────────────────────
  // n8n must echo workflowRunId back in the callback so we can mark this run COMPLETED
  const basePayload     = buildPayload(campaign, callbackBase);
  const enrichedPayload = { ...basePayload, workflowRunId: run.id };

  // Persist the full payload (including workflowRunId) for debugging
  await prisma.automationWorkflowRun.update({
    where: { id: run.id },
    data:  { inputPayload: enrichedPayload as never },
  });

  // ── Update campaign status ─────────────────────────────────────────────────
  if (newCampaignStatus) {
    await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data:  { status: newCampaignStatus },
    });
  }

  // ── Call n8n ───────────────────────────────────────────────────────────────
  const result = await callN8nWebhook(webhookUrl, enrichedPayload, settings.webhookSecret ?? "");

  // ── Update run with n8n response ───────────────────────────────────────────
  // Use updateMany with status:"PENDING" guard so a fast n8n callback that already
  // set status:"COMPLETED" is not overwritten back to "RUNNING" here.
  const n8nExecutionId = (result.data as Record<string, string> | null)?.executionId ?? null;

  if (result.ok) {
    // PENDING → RUNNING only; if the callback completed it already, this is a no-op
    await prisma.automationWorkflowRun.updateMany({
      where: { id: run.id, status: "PENDING" },
      data:  { status: "RUNNING", n8nExecutionId, errorMessage: null },
    });
  } else {
    // n8n rejected the webhook — mark FAILED regardless of current status
    await prisma.automationWorkflowRun.update({
      where: { id: run.id },
      data:  { status: "FAILED", errorMessage: `n8n returned HTTP ${result.status}` },
    });
  }

  return NextResponse.json({ ok: result.ok, runId: run.id, campaignId });
}
