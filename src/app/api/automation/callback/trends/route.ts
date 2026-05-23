import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCallbackSecret } from "@/lib/automation";
import { AutomationRunStatus } from "@prisma/client";

// n8n calls this when trend research is complete.
// Body: { campaignId, workflowRunId?, executionId?,
//         trendResearch: object | string,
//         trendSummary?, recommendedAngle?, trendIdeas?, recommendedNextStep? }

export const dynamic = "force-dynamic";

function parseTrendResearch(raw: unknown): Record<string, unknown> | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      return { summary: raw };
    }
  }
  return null;
}

function str(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "string")  return val.trim() || null;
  if (Array.isArray(val))       return val.join("\n").trim() || null;
  return String(val).trim() || null;
}

export async function POST(req: NextRequest) {
  if (!await validateCallbackSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log("[trends callback body]", body);

  const {
    campaignId,
    workflowRunId:    rawWorkflowRunId,
    executionId:      rawExecutionId,
    trendResearch:    rawTrendResearch,
    trendSummary:     rawTrendSummary,
    recommendedAngle: rawAngle,
    trendIdeas:       rawIdeas,
    recommendedNextStep: rawNextStep,
  } = body;

  // ── Validate campaignId ────────────────────────────────────────────────────
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required", received: campaignId }, { status: 400 });
  }
  const cleanCampaignId  = String(campaignId).trim();
  const cleanRunId       = typeof rawWorkflowRunId === "string" ? rawWorkflowRunId.trim() : null;
  const cleanExecutionId = typeof rawExecutionId   === "string" ? rawExecutionId.trim()   : null;

  console.log("[trends callback] IDs:", { cleanCampaignId, cleanRunId, cleanExecutionId });

  // ── Guard against n8n's "[object Object]" bug ──────────────────────────────
  if (rawTrendResearch === "[object Object]") {
    return NextResponse.json({
      error:    'trendResearch arrived as "[object Object]"',
      guidance: "Add a Code node in n8n that calls JSON.stringify() on the research result before the HTTP Request node.",
    }, { status: 400 });
  }

  // ── Parse trendResearch + extract fields ───────────────────────────────────
  const parsed = parseTrendResearch(rawTrendResearch);

  // Build a complete research object from all available sources
  const trendSummary     = str(rawTrendSummary)  ?? str(parsed?.trendSummary)     ?? str(parsed?.summary)             ?? null;
  const recommendedAngle = str(rawAngle)          ?? str(parsed?.recommendedAngle) ?? str(parsed?.angle)               ?? null;
  const trendIdeas       = str(rawIdeas)          ?? str(parsed?.trendIdeas)       ?? str(parsed?.ideas)               ?? null;
  const recommendedNextStep = str(rawNextStep)    ?? str(parsed?.recommendedNextStep) ?? str(parsed?.nextStep)         ?? null;

  // Effective research object: prefer the parsed object; fall back to assembling from top-level fields
  const effectiveResearch: Record<string, unknown> = parsed ?? {
    trendSummary,
    recommendedAngle,
    trendIdeas:  rawIdeas ?? null,
    recommendedNextStep,
  };

  // campaignBrief = human-readable summary for the admin to read at a glance
  const briefText = trendSummary ?? recommendedAngle;
  // approvedCreativeNotes = full research blob for the strategy step to consume
  const researchJson = JSON.stringify(effectiveResearch);

  console.log("[trends callback] Resolved:", {
    hasBrief: !!briefText, hasTrendSummary: !!trendSummary,
    hasAngle: !!recommendedAngle, hasTrendIdeas: !!trendIdeas,
  });

  // ── DB update ──────────────────────────────────────────────────────────────
  try {
    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: cleanCampaignId } });

    if (!campaign) {
      const sample = await prisma.marketingCampaign.findMany({ select: { id: true, title: true }, take: 10 });
      return NextResponse.json({
        error: "Campaign not found",
        cleanCampaignId,
        availableCampaignIds: sample.map((c) => c.id),
      }, { status: 404 });
    }

    // ── Resolve the matching workflow run (triple fallback) ────────────────
    // Status and completedAt are updated FIRST in a separate write so that a
    // JSON serialization quirk on outputPayload can never block the critical
    // status transition. outputPayload is saved in a follow-up update.
    //
    // 1. Direct run ID echoed back from n8n — most reliable
    // 2. n8n execution ID stored on the run
    // 3. Latest RUNNING or PENDING TREND_RESEARCH run for this campaign

    const statusData = { status: AutomationRunStatus.COMPLETED, completedAt: new Date() };
    let runUpdated   = 0;
    let matchedRunId: string | null = null;

    if (cleanRunId) {
      const r = await prisma.automationWorkflowRun.updateMany({
        where: { id: cleanRunId, campaignId: cleanCampaignId },
        data:  statusData,
      });
      runUpdated = r.count;
      if (runUpdated > 0) matchedRunId = cleanRunId;
      console.log("[trend callback] updated run via workflowRunId", { cleanRunId, count: r.count, status: "COMPLETED" });
    }

    if (runUpdated === 0 && cleanExecutionId) {
      const r = await prisma.automationWorkflowRun.updateMany({
        where: { n8nExecutionId: cleanExecutionId },
        data:  statusData,
      });
      runUpdated = r.count;
      console.log("[trend callback] updated run via executionId", { cleanExecutionId, count: r.count, status: "COMPLETED" });
    }

    if (runUpdated === 0) {
      // Find the run ID first so we can save outputPayload afterwards
      const activeRun = await prisma.automationWorkflowRun.findFirst({
        where: {
          campaignId:   cleanCampaignId,
          workflowType: "TREND_RESEARCH",
          status:       { in: [AutomationRunStatus.RUNNING, AutomationRunStatus.PENDING] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (activeRun) {
        const r = await prisma.automationWorkflowRun.updateMany({
          where: { id: activeRun.id },
          data:  statusData,
        });
        runUpdated = r.count;
        matchedRunId = activeRun.id;
        console.log("[trend callback] updated run via fallback scan", { id: activeRun.id, count: r.count, status: "COMPLETED" });
      } else {
        console.warn("[trend callback] no RUNNING/PENDING TREND_RESEARCH run found for campaign", cleanCampaignId);
      }
    }

    // Save outputPayload on the matched run (non-critical; errors are logged but not fatal)
    if (matchedRunId) {
      try {
        await prisma.automationWorkflowRun.update({
          where: { id: matchedRunId },
          data:  { outputPayload: body as never },
        });
      } catch (e) {
        console.warn("[trend callback] outputPayload save failed (non-fatal)", e);
      }
    }

    console.log("[trend callback] run resolution summary:", { cleanRunId, cleanExecutionId, runUpdated, matchedRunId });

    // ── Update campaign + create notification ──────────────────────────────
    await Promise.all([
      prisma.marketingCampaign.update({
        where: { id: cleanCampaignId },
        data: {
          // Keep status at TREND_REVIEW so admin can review and trigger strategy
          status:                "TREND_REVIEW",
          campaignBrief:         briefText       ?? campaign.campaignBrief,
          approvedCreativeNotes: researchJson,
        },
      }),
      prisma.adminNotification.create({
        data: {
          type:      "TREND_RESEARCH_READY",
          title:     "Trend Research Ready",
          message:   `Trend research for "${campaign.title}" is complete. Review and generate strategy to proceed.`,
          actionUrl: "/admin/automation",
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      cleanCampaignId,
      runUpdated,
      fieldsSet: {
        trendResearch:    true,
        trendSummary:     !!trendSummary,
        recommendedAngle: !!recommendedAngle,
        trendIdeas:       !!trendIdeas,
      },
    });
  } catch (err) {
    console.error("[callback/trends] Prisma error:", err);
    return NextResponse.json({
      error:  "Database update failed",
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
