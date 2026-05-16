import type { TrendCategory, TrendType } from "@prisma/client";

// ─── Shared types used by all trend providers ─────────────────────────────────

export interface TrendCandidate {
  title:               string;
  platform:            string;
  category:            TrendCategory;
  trendType:           TrendType;
  summary?:            string;
  suggestedUse?:       string;
  exampleHook?:        string;
  exampleCaptionAngle?: string;
  hashtags?:           string;
  confidenceScore:     number;
  popularityScore:     number;
  expiresAt?:          Date;
  source:              string;
}

export interface TrendResearchContext {
  targetHashtags:     string[];
  serviceCategories:  string[];
  locationKeywords:   string[];
  competitorAccounts: string[];
  targetPlatforms:    string[];
}

export interface TrendProvider {
  readonly name: string;
  isAvailable(): boolean;
  research(context: TrendResearchContext): Promise<TrendCandidate[]>;
}
