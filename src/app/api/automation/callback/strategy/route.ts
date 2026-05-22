import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCallbackSecret } from "@/lib/automation";

// n8n calls this when Claude strategy is ready.
// Body: { campaignId, workflowRunId?, executionId?, strategy, caption?, hashtags?, creativeNotes? }
// strategy may arrive as an object, a JSON string, or the broken "[object Object]".

export const dynamic = "force-dynamic";

function parseStrategy(raw: unknown): Record<string, unknown> | null {
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
  if (Array.isArray(val))       return val.join(" ").trim() || null;
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

  console.log("[strategy callback body]", body);

  const {
    campaignId,
    workflowRunId: rawWorkflowRunId,
    executionId:   rawExecutionId,
    strategy:      rawStrategy,
    caption:       rawCaption,
    hashtags:      rawHashtags,
    creativeNotes: rawCreativeNotes,
  } = body;

  // ── Validate campaignId ────────────────────────────────────────────────────
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required", received: campaignId }, { status: 400 });
  }
  const cleanCampaignId  = String(campaignId).trim();
  const cleanRunId       = typeof rawWorkflowRunId === "string" ? rawWorkflowRunId.trim() : null;
  const cleanExecutionId = typeof rawExecutionId   === "string" ? rawExecutionId.trim()   : null;

  console.log("[strategy callback] IDs:", { cleanCampaignId, cleanRunId, cleanExecutionId });

  // ── Guard against n8n's "[object Object]" bug ──────────────────────────────
  if (rawStrategy === "[object Object]") {
    return NextResponse.json({
      error:    'strategy arrived as "[object Object]"',
      guidance: "Add a Code node in n8n that calls JSON.stringify() on the Claude response before the HTTP Request node.",
    }, { status: 400 });
  }

  // ── Parse strategy and extract fields ─────────────────────────────────────
  const strategy = parseStrategy(rawStrategy);
  const effectiveStrategy: Record<string, unknown> | null =
    strategy ?? (rawCaption || rawHashtags || rawCreativeNotes
      ? { caption: rawCaption, hashtags: rawHashtags, notes: rawCreativeNotes }
      : null);

  const caption       = str(rawCaption)      ?? str(strategy?.caption);
  const hashtags      = str(rawHashtags)     ?? str(strategy?.hashtags);
  const creativeNotes =
    str(rawCreativeNotes) ??
    str(strategy?.hook)   ??
    str(strategy?.adminNotes) ??
    null;

  const strategyToStore =
    effectiveStrategy
      ? JSON.stringify(effectiveStrategy)
      : typeof rawStrategy === "string" && rawStrategy.trim()
        ? rawStrategy
        : null;

  console.log("[strategy callback] Resolved:", {
    hasStrategy: !!strategyToStore, hasCaption: !!caption,
    hasHashtags: !!hashtags, hasCreativeNotes: !!creativeNotes,
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
    // 1. Direct run ID we sent in the payload — most reliable
    // 2. n8n execution ID stored on the run
    // 3. Latest RUNNING or PENDING CLAUDE_STRATEGY run for this campaign

    let runUpdated = 0;
    const runData = { status: "COMPLETED" as const, outputPayload: body as never, completedAt: new Date() };

    if (cleanRunId) {
      const r = await prisma.automationWorkflowRun.updateMany({
        where: { id: cleanRunId, campaignId: cleanCampaignId },
        data:  runData,
      });
      runUpdated = r.count;
    }

    if (runUpdated === 0 && cleanExecutionId) {
      const r = await prisma.automationWorkflowRun.updateMany({
        where: { n8nExecutionId: cleanExecutionId },
        data:  runData,
      });
      runUpdated = r.count;
    }

    if (runUpdated === 0) {
      // Fallback: mark the most recent active CLAUDE_STRATEGY run for this campaign
      const r = await prisma.automationWorkflowRun.updateMany({
        where: {
          campaignId:   cleanCampaignId,
          workflowType: "CLAUDE_STRATEGY",
          status:       { in: ["RUNNING", "PENDING"] },
        },
        data: runData,
      });
      runUpdated = r.count;
    }

    console.log("[strategy callback] Run update:", { cleanRunId, cleanExecutionId, runUpdated });

    // ── Update campaign ────────────────────────────────────────────────────
    await Promise.all([
      prisma.marketingCampaign.update({
        where: { id: cleanCampaignId },
        data: {
          status:                "STRATEGY_PENDING_APPROVAL",
          approvedStrategy:      strategyToStore,
          approvedCaption:       caption,
          approvedHashtags:      hashtags,
          approvedCreativeNotes: creativeNotes,
        },
      }),
      prisma.adminNotification.create({
        data: {
          type:      "STRATEGY_READY",
          title:     "Strategy Ready for Review",
          message:   `AI strategy for "${campaign.title}" is ready. Review and approve to proceed.`,
          actionUrl: "/admin/automation",
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      cleanCampaignId,
      runUpdated,
      fieldsSet: {
        strategy:      !!strategyToStore,
        caption:       !!caption,
        hashtags:      !!hashtags,
        creativeNotes: !!creativeNotes,
      },
    });
  } catch (err) {
    console.error("[callback/strategy] Prisma error:", err);
    return NextResponse.json({
      error:  "Database update failed",
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
