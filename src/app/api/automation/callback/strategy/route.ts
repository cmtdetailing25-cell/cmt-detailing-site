import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCallbackSecret } from "@/lib/automation";

// n8n calls this when Claude strategy is ready.
// Body: { campaignId, executionId?, strategy, caption?, hashtags?, creativeNotes? }
// strategy may arrive as an object, a JSON string, or the broken "[object Object]".

export const dynamic = "force-dynamic";

// Attempt to normalise `raw` into a plain object.
// Returns null only when the value is genuinely absent or un-parseable.
function parseStrategy(raw: unknown): Record<string, unknown> | null {
  if (raw === null || raw === undefined) return null;

  // Already an object — most common when n8n uses the HTTP Request node correctly
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }

  if (typeof raw === "string") {
    // Attempt JSON parse first
    try {
      const parsed = JSON.parse(raw);
      if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Not valid JSON — treat the raw string as a plain-text summary
      return { summary: raw };
    }
  }

  return null;
}

// Safely convert any value to a trimmed string (or null if empty).
function str(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "string")  return val.trim() || null;
  if (Array.isArray(val))       return val.join(" ").trim() || null;
  return String(val).trim() || null;
}

export async function POST(req: NextRequest) {
  // ── Secret validation (unchanged) ─────────────────────────────────────────
  if (!await validateCallbackSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log("[strategy callback body]", body);

  const {
    campaignId,
    executionId,
    strategy:     rawStrategy,
    caption:      rawCaption,
    hashtags:     rawHashtags,
    creativeNotes:rawCreativeNotes,
  } = body;

  // ── Validate campaignId ────────────────────────────────────────────────────
  if (!campaignId || typeof campaignId !== "string") {
    return NextResponse.json(
      { error: "campaignId is required and must be a string", received: campaignId },
      { status: 400 }
    );
  }

  // ── Guard against n8n's "[object Object]" bug ──────────────────────────────
  if (rawStrategy === "[object Object]") {
    return NextResponse.json(
      {
        error:    'strategy arrived as "[object Object]"',
        guidance: "n8n did not serialise the Claude output correctly. " +
                  "In the n8n workflow, add a Code or Set node that calls " +
                  "JSON.stringify() on the Claude response before sending it here.",
      },
      { status: 400 }
    );
  }

  // ── Parse strategy ─────────────────────────────────────────────────────────
  const strategy = parseStrategy(rawStrategy);

  // If strategy is absent, fall back to building a minimal object from body fields
  const effectiveStrategy: Record<string, unknown> | null =
    strategy ?? (
      rawCaption || rawHashtags || rawCreativeNotes
        ? { caption: rawCaption, hashtags: rawHashtags, notes: rawCreativeNotes }
        : null
    );

  // ── Extract individual fields ───────────────────────────────────────────────
  // Explicit top-level field wins; fall back to strategy sub-fields
  const caption      = str(rawCaption)      ?? str(strategy?.caption);
  const hashtags     = str(rawHashtags)     ?? str(strategy?.hashtags);
  const creativeNotes =
    str(rawCreativeNotes)     ??
    str(strategy?.hook)       ??
    str(strategy?.adminNotes) ??
    null;

  // Store strategy as a JSON string so it survives the String? column
  const strategyToStore =
    effectiveStrategy
      ? JSON.stringify(effectiveStrategy)
      : typeof rawStrategy === "string" && rawStrategy.trim()
        ? rawStrategy
        : null;

  console.log("[strategy callback] Resolved fields:", {
    campaignId,
    executionId,
    hasStrategy:      !!strategyToStore,
    hasCaption:       !!caption,
    hasHashtags:      !!hashtags,
    hasCreativeNotes: !!creativeNotes,
  });

  // ── DB update ──────────────────────────────────────────────────────────────
  try {
    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found", campaignId },
        { status: 404 }
      );
    }

    await Promise.all([
      prisma.marketingCampaign.update({
        where: { id: campaignId },
        data: {
          status:                "STRATEGY_PENDING_APPROVAL",
          approvedStrategy:      strategyToStore,
          approvedCaption:       caption,
          approvedHashtags:      hashtags,
          approvedCreativeNotes: creativeNotes,
        },
      }),

      typeof executionId === "string" && executionId
        ? prisma.automationWorkflowRun.updateMany({
            where: { n8nExecutionId: executionId },
            data:  { status: "COMPLETED", outputPayload: body as never, completedAt: new Date() },
          })
        : Promise.resolve(),

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
      ok:          true,
      campaignId,
      fieldsSet: {
        strategy:      !!strategyToStore,
        caption:       !!caption,
        hashtags:      !!hashtags,
        creativeNotes: !!creativeNotes,
      },
    });
  } catch (err) {
    console.error("[callback/strategy] Prisma error:", err);
    return NextResponse.json(
      {
        error:  "Database update failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
