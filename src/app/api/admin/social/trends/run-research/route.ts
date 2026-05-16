import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runTrendResearch } from "@/lib/social/runTrendResearch";

export const dynamic = "force-dynamic";

// POST /api/admin/social/trends/run-research
export async function POST() {
  try {
    // Create a new research run record
    const run = await prisma.trendResearchRun.create({
      data: { status: "PENDING" },
    });

    // Run the research synchronously (placeholder is fast; real providers will be too)
    const result = await runTrendResearch(run.id);

    // Fetch final run state to return accurate data
    const finalRun = await prisma.trendResearchRun.findUnique({
      where: { id: run.id },
    });

    return NextResponse.json({
      runId:         run.id,
      status:        finalRun?.status ?? "COMPLETED",
      trendsFound:   result.trendsFound,
      sourcesChecked: result.sourcesChecked,
      skipped:       result.skipped,
      notes:         finalRun?.notes ?? null,
      error:         result.error ?? null,
    });
  } catch (err) {
    console.error("[POST /api/admin/social/trends/run-research]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
