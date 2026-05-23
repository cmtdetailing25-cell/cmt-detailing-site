import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCallbackSecret } from "@/lib/automation";
import { AutomationRunStatus, AssetType, AssetProvider, AssetStatus } from "@prisma/client";

// n8n calls this when Canva/Meta assets are ready (or an asset plan is produced).
// Body shapes supported:
//   { campaignId, workflowRunId?, executionId?, assets: array | JSON-string }
//   { campaignId, workflowRunId?, executionId?, assetPlan: object | JSON-string }

export const dynamic = "force-dynamic";

// ── Type/provider coercers ─────────────────────────────────────────────────────

const ASSET_TYPE_MAP: Record<string, AssetType> = {
  image:          AssetType.IMAGE,
  IMAGE:          AssetType.IMAGE,
  canva:          AssetType.CANVA_DESIGN,
  canva_design:   AssetType.CANVA_DESIGN,
  CANVA_DESIGN:   AssetType.CANVA_DESIGN,
  remotion:       AssetType.REMOTION_VIDEO,
  remotion_video: AssetType.REMOTION_VIDEO,
  REMOTION_VIDEO: AssetType.REMOTION_VIDEO,
  video:          AssetType.REMOTION_VIDEO,
  final_video:    AssetType.FINAL_VIDEO,
  FINAL_VIDEO:    AssetType.FINAL_VIDEO,
  final_image:    AssetType.FINAL_IMAGE,
  FINAL_IMAGE:    AssetType.FINAL_IMAGE,
  copy:           AssetType.COPY_DOC,
  copy_doc:       AssetType.COPY_DOC,
  COPY_DOC:       AssetType.COPY_DOC,
};

const ASSET_PROVIDER_MAP: Record<string, AssetProvider> = {
  canva:       AssetProvider.CANVA,
  CANVA:       AssetProvider.CANVA,
  remotion:    AssetProvider.REMOTION,
  REMOTION:    AssetProvider.REMOTION,
  meta:        AssetProvider.META,
  META:        AssetProvider.META,
  n8n:         AssetProvider.N8N,
  N8N:         AssetProvider.N8N,
  vercel_blob: AssetProvider.VERCEL_BLOB,
  VERCEL_BLOB: AssetProvider.VERCEL_BLOB,
};

function coerceType(raw: unknown): AssetType {
  if (typeof raw === "string" && ASSET_TYPE_MAP[raw]) return ASSET_TYPE_MAP[raw];
  return AssetType.IMAGE;
}

function coerceProvider(raw: unknown): AssetProvider {
  if (typeof raw === "string" && ASSET_PROVIDER_MAP[raw]) return ASSET_PROVIDER_MAP[raw];
  return AssetProvider.N8N;
}

// ── Asset list parser ──────────────────────────────────────────────────────────

function parseAssetList(raw: unknown): Record<string, unknown>[] | null {
  if (raw === null || raw === undefined) return null;
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (typeof raw === "string") {
    if (raw === "[object Object]") return null;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
      // Might be a single asset object or a wrapper
      if (parsed && typeof parsed === "object") {
        // { assets: [...] } or { assetPlan: [...] } wrapper
        const inner = (parsed as Record<string, unknown>).assets
          ?? (parsed as Record<string, unknown>).assetPlan
          ?? (parsed as Record<string, unknown>).items;
        if (Array.isArray(inner)) return inner as Record<string, unknown>[];
        return [parsed as Record<string, unknown>];
      }
    } catch {
      return null;
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    // Single asset object
    return [raw as Record<string, unknown>];
  }
  return null;
}

function str(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") return val.trim() || null;
  return String(val).trim() || null;
}

// ── Route ──────────────────────────────────────────────────────────────────────

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

  console.log("[assets callback body]", body);

  const {
    campaignId,
    workflowRunId: rawWorkflowRunId,
    executionId:   rawExecutionId,
  } = body;

  // Support both `assets` and `assetPlan` field names
  const rawAssets = body.assets ?? body.assetPlan;

  // ── Validate campaignId ────────────────────────────────────────────────────
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required", received: campaignId }, { status: 400 });
  }

  // Guard against n8n "[object Object]" serialization bug
  if (rawAssets === "[object Object]") {
    return NextResponse.json({
      error:    'assets arrived as "[object Object]"',
      guidance: "Add a Code node in n8n that calls JSON.stringify() on the asset plan before the HTTP Request node.",
    }, { status: 400 });
  }

  const cleanCampaignId  = String(campaignId).trim();
  const cleanRunId       = typeof rawWorkflowRunId === "string" ? rawWorkflowRunId.trim() : null;
  const cleanExecutionId = typeof rawExecutionId   === "string" ? rawExecutionId.trim()   : null;

  console.log("[assets callback] IDs:", { cleanCampaignId, cleanRunId, cleanExecutionId });

  // ── Parse asset list ───────────────────────────────────────────────────────
  const assetList = parseAssetList(rawAssets);
  console.log("[assets callback] parsed asset list:", {
    rawType: typeof rawAssets,
    isArray: Array.isArray(rawAssets),
    count:   assetList?.length ?? 0,
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

    // ── Resolve workflow run (triple fallback) ─────────────────────────────
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
      console.log("[assets callback] updated run via workflowRunId", { cleanRunId, count: r.count });
    }

    if (runUpdated === 0 && cleanExecutionId) {
      const r = await prisma.automationWorkflowRun.updateMany({
        where: { n8nExecutionId: cleanExecutionId },
        data:  statusData,
      });
      runUpdated = r.count;
      console.log("[assets callback] updated run via executionId", { cleanExecutionId, count: r.count });
    }

    if (runUpdated === 0) {
      const activeRun = await prisma.automationWorkflowRun.findFirst({
        where: {
          campaignId:   cleanCampaignId,
          workflowType: { in: ["CANVA_ASSET_CREATION", "REMOTION_VIDEO_CREATION"] },
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
        console.log("[assets callback] updated run via fallback scan", { id: activeRun.id, count: r.count });
      } else {
        console.warn("[assets callback] no active asset workflow run found for campaign", cleanCampaignId);
      }
    }

    // Save outputPayload on matched run (non-critical)
    if (matchedRunId) {
      try {
        await prisma.automationWorkflowRun.update({
          where: { id: matchedRunId },
          data:  { outputPayload: body as never },
        });
      } catch (e) {
        console.warn("[assets callback] outputPayload save failed (non-fatal)", e);
      }
    }

    console.log("[assets callback] run resolution:", { runUpdated, matchedRunId });

    // ── Create asset records ───────────────────────────────────────────────
    let assetsCreated = 0;

    if (assetList && assetList.length > 0) {
      // Build valid Prisma records, coercing enum values
      const assetRows = assetList.map((a) => ({
        campaignId:   cleanCampaignId,
        type:         coerceType(a.type),
        provider:     coerceProvider(a.provider),
        url:          str(a.url),
        thumbnailUrl: str(a.thumbnailUrl) ?? str(a.thumbnail),
        title:        str(a.title) ?? str(a.name) ?? "Generated Asset",
        notes:        str(a.notes) ?? str(a.description) ?? null,
        status:       a.url ? AssetStatus.READY : AssetStatus.PENDING,
      }));

      await prisma.marketingAsset.createMany({ data: assetRows });
      assetsCreated = assetRows.length;
      console.log("[assets callback] created asset records:", assetsCreated);
    } else {
      // No structured asset list — store raw plan in approvedCreativeNotes as fallback
      const planStr = rawAssets ? JSON.stringify(rawAssets) : null;
      if (planStr) {
        await prisma.marketingCampaign.update({
          where: { id: cleanCampaignId },
          data:  { approvedCreativeNotes: planStr },
        });
        console.log("[assets callback] no structured asset list; stored raw plan in approvedCreativeNotes");
      }
    }

    // ── Update campaign status + notification ──────────────────────────────
    await Promise.all([
      prisma.marketingCampaign.update({
        where: { id: cleanCampaignId },
        data:  { status: "CREATIVE_PENDING_APPROVAL" },
      }),
      prisma.adminNotification.create({
        data: {
          type:      "ASSETS_READY",
          title:     "Creative Assets Ready",
          message:   `${assetsCreated > 0 ? `${assetsCreated} asset(s)` : "Asset plan"} generated for "${campaign.title}". Review and approve to continue.`,
          actionUrl: "/admin/automation",
        },
      }),
    ]);

    return NextResponse.json({
      ok:              true,
      cleanCampaignId,
      assetsParsed:    true,
      assetsCreated,
      runUpdatedCount: runUpdated,
    });
  } catch (err) {
    console.error("[callback/assets] Prisma error:", err);
    return NextResponse.json({
      error:  "Database update failed",
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
