import { prisma } from "@/lib/prisma";
import type { TrendCategory, TrendType } from "@prisma/client";
import { placeholderProvider } from "./trendProviders/placeholderProvider";
import { instagramGraphProvider } from "./trendProviders/instagramGraphProvider";
import { publicWebProvider } from "./trendProviders/publicWebProvider";
import type { TrendResearchContext, TrendCandidate } from "./trendProviders/trendProviderTypes";

// ─── Default settings (used when no DB record exists) ────────────────────────

export const DEFAULT_RESEARCH_SETTINGS = {
  isEnabled:          false,
  researchFrequency:  "manual",
  targetPlatforms:    ["Instagram"],
  targetHashtags:     [
    "autodetailing", "cardetailing", "mobiledetailing", "detailingworld",
    "ceramiccoating", "paintcorrection", "interiordetailing", "exteriordetailing",
    "beforeandafter", "carcare",
  ],
  competitorAccounts: [] as string[],
  serviceCategories:  ["Interior Detail", "Exterior Detail", "Full Detail", "Ceramic Coating", "Paint Correction"],
  locationKeywords:   ["Taunton MA", "Massachusetts detailing", "South Shore MA", "Bristol County", "Raynham", "Easton", "Bridgewater", "Norton"],
  minConfidenceScore: 6,
};

// ─── All registered providers (priority order) ────────────────────────────────

const ALL_PROVIDERS = [
  placeholderProvider,
  instagramGraphProvider,
  publicWebProvider,
];

// ─── Deduplication by title (case-insensitive) ────────────────────────────────

function deduplicateCandidates(candidates: TrendCandidate[]): TrendCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((c) => {
    const key = c.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Main engine ──────────────────────────────────────────────────────────────

export async function runTrendResearch(runId: string): Promise<{
  trendsFound: number;
  sourcesChecked: number;
  skipped: number;
  error?: string;
}> {
  await prisma.trendResearchRun.update({
    where: { id: runId },
    data:  { status: "RUNNING", startedAt: new Date() },
  });

  try {
    // Load settings (create with defaults if missing)
    let settings = await prisma.trendResearchSettings.findFirst();
    if (!settings) {
      settings = await prisma.trendResearchSettings.create({ data: DEFAULT_RESEARCH_SETTINGS });
    }

    const context: TrendResearchContext = {
      targetHashtags:     settings.targetHashtags,
      serviceCategories:  settings.serviceCategories,
      locationKeywords:   settings.locationKeywords,
      competitorAccounts: settings.competitorAccounts,
      targetPlatforms:    settings.targetPlatforms,
    };

    // Run all available providers
    const allCandidates: TrendCandidate[] = [];
    let sourcesChecked = 0;

    for (const provider of ALL_PROVIDERS) {
      if (!provider.isAvailable()) continue;
      sourcesChecked++;
      try {
        const results = await provider.research(context);
        allCandidates.push(...results);
      } catch (err) {
        console.error(`[runTrendResearch] Provider "${provider.name}" failed:`, err);
      }
    }

    // Deduplicate and filter by minConfidenceScore
    const candidates = deduplicateCandidates(allCandidates).filter(
      (c) => c.confidenceScore >= settings!.minConfidenceScore
    );

    // Save each candidate as TrendInsight (skip if title already exists)
    let trendsFound = 0;
    let skipped     = 0;

    for (const c of candidates) {
      const exists = await prisma.trendInsight.findFirst({
        where: { title: { equals: c.title, mode: "insensitive" } },
      });
      if (exists) { skipped++; continue; }

      await prisma.trendInsight.create({
        data: {
          title:               c.title,
          platform:            c.platform,
          source:              c.source,
          category:            c.category as TrendCategory,
          trendType:           c.trendType as TrendType,
          summary:             c.summary             ?? null,
          suggestedUse:        c.suggestedUse        ?? null,
          exampleHook:         c.exampleHook         ?? null,
          exampleCaptionAngle: c.exampleCaptionAngle ?? null,
          hashtags:            c.hashtags            ?? null,
          confidenceScore:     Math.max(0, Math.min(10, Math.round(c.confidenceScore))),
          popularityScore:     Math.max(0, Math.min(10, Math.round(c.popularityScore))),
          isActive:            true,
          expiresAt:           c.expiresAt ?? null,
        },
      });
      trendsFound++;
    }

    const notes =
      `${sourcesChecked} provider(s) checked. ` +
      `${trendsFound} new trend(s) created. ` +
      `${skipped} duplicate(s) skipped.`;

    await prisma.trendResearchRun.update({
      where: { id: runId },
      data:  {
        status:        "COMPLETED",
        completedAt:   new Date(),
        trendsFound,
        sourcesChecked,
        notes,
      },
    });

    return { trendsFound, sourcesChecked, skipped };

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.trendResearchRun.update({
      where: { id: runId },
      data:  { status: "FAILED", completedAt: new Date(), errorMessage: message },
    });
    return { trendsFound: 0, sourcesChecked: 0, skipped: 0, error: message };
  }
}
