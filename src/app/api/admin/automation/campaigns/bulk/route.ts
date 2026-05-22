import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/admin/automation/campaigns/bulk
// Body: { action: "archive" | "delete" | "reset" | "cancel" | "clearTest", ids?: string[] }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ids } = body as { action: string; ids?: string[] };

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    switch (action) {
      // ── Archive ───────────────────────────────────────────────────────────
      case "archive": {
        if (!ids?.length) return NextResponse.json({ error: "ids required" }, { status: 400 });
        const result = await prisma.marketingCampaign.updateMany({
          where: { id: { in: ids } },
          data:  { status: "ARCHIVED" },
        });
        return NextResponse.json({ ok: true, count: result.count });
      }

      // ── Reset to IDEA ─────────────────────────────────────────────────────
      case "reset": {
        if (!ids?.length) return NextResponse.json({ error: "ids required" }, { status: 400 });
        const result = await prisma.marketingCampaign.updateMany({
          where: { id: { in: ids } },
          data:  { status: "IDEA" },
        });
        return NextResponse.json({ ok: true, count: result.count });
      }

      // ── Cancel processing (reset to IDEA + fail running runs) ─────────────
      case "cancel": {
        if (!ids?.length) return NextResponse.json({ error: "ids required" }, { status: 400 });
        const [campaigns, runs] = await Promise.all([
          prisma.marketingCampaign.updateMany({
            where: { id: { in: ids } },
            data:  { status: "IDEA" },
          }),
          prisma.automationWorkflowRun.updateMany({
            where: {
              campaignId: { in: ids },
              status:     { in: ["RUNNING", "PENDING"] },
            },
            data: {
              status:       "FAILED",
              errorMessage: "Cancelled by admin",
              completedAt:  new Date(),
            },
          }),
        ]);
        return NextResponse.json({ ok: true, campaigns: campaigns.count, runs: runs.count });
      }

      // ── Delete (cascade handled by schema) ────────────────────────────────
      case "delete": {
        if (!ids?.length) return NextResponse.json({ error: "ids required" }, { status: 400 });
        const result = await prisma.marketingCampaign.deleteMany({
          where: { id: { in: ids } },
        });
        return NextResponse.json({ ok: true, count: result.count });
      }

      // ── Clear test campaigns (archive isTest=true or title contains "test") ─
      case "clearTest": {
        const testCampaigns = await prisma.marketingCampaign.findMany({
          where: {
            OR: [
              { isTest: true },
              { title: { contains: "test", mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });
        if (testCampaigns.length === 0) {
          return NextResponse.json({ ok: true, count: 0 });
        }
        const testIds = testCampaigns.map((c) => c.id);
        const result  = await prisma.marketingCampaign.updateMany({
          where: { id: { in: testIds } },
          data:  { status: "ARCHIVED" },
        });
        return NextResponse.json({ ok: true, count: result.count });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error("[POST /api/admin/automation/campaigns/bulk]", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
