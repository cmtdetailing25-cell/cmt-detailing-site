import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_RESEARCH_SETTINGS } from "@/lib/social/runTrendResearch";

export const dynamic = "force-dynamic";

// GET /api/admin/social/trends/research-settings
// Returns existing settings or creates with defaults (singleton)
export async function GET() {
  try {
    let settings = await prisma.trendResearchSettings.findFirst();
    if (!settings) {
      settings = await prisma.trendResearchSettings.create({ data: DEFAULT_RESEARCH_SETTINGS });
    }
    return NextResponse.json({ settings });
  } catch (err) {
    console.error("[GET /api/admin/social/trends/research-settings]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/social/trends/research-settings
export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    let settings = await prisma.trendResearchSettings.findFirst();
    if (!settings) {
      settings = await prisma.trendResearchSettings.create({ data: DEFAULT_RESEARCH_SETTINGS });
    }

    const data: Record<string, unknown> = {};

    if (typeof body.isEnabled         === "boolean") data.isEnabled         = body.isEnabled;
    if (typeof body.researchFrequency === "string")  data.researchFrequency = body.researchFrequency.trim();
    if (typeof body.minConfidenceScore === "number") {
      data.minConfidenceScore = Math.max(0, Math.min(10, Math.round(body.minConfidenceScore)));
    }

    // Array fields — accept arrays of strings only
    const arrayField = (key: string) => {
      if (Array.isArray(body[key])) {
        data[key] = (body[key] as unknown[])
          .filter((v) => typeof v === "string" && v.trim())
          .map((v) => (v as string).trim());
      }
    };
    arrayField("targetPlatforms");
    arrayField("targetHashtags");
    arrayField("competitorAccounts");
    arrayField("serviceCategories");
    arrayField("locationKeywords");

    const updated = await prisma.trendResearchSettings.update({
      where: { id: settings.id },
      data,
    });

    return NextResponse.json({ settings: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/social/trends/research-settings]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
