import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/social/trends/research-runs
// Returns recent trend research runs (newest first)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Math.min(Number(searchParams.get("take") ?? 20), 50);

    const runs = await prisma.trendResearchRun.findMany({
      orderBy: { createdAt: "desc" },
      take,
    });

    return NextResponse.json({ runs });
  } catch (err) {
    console.error("[GET /api/admin/social/trends/research-runs]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
