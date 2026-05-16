/**
 * Public Web / RSS Trend Provider — STUB (not yet implemented)
 *
 * Future implementation will fetch trend signals from public sources where
 * terms of service explicitly permit automated access:
 * - RSS feeds from industry publications (DetailingWorld, AutoGeek, etc.)
 * - Public APIs from platforms like Later, Metricool, or Hootsuite
 * - Approved hashtag trend APIs
 *
 * Important: Do NOT scrape websites that prohibit crawling in their ToS.
 * Do NOT use browser automation (Puppeteer, Playwright) for scraping.
 * Only fetch from sources with public APIs or explicit RSS/Atom feeds.
 */

import type { TrendProvider, TrendCandidate, TrendResearchContext } from "./trendProviderTypes";

export const publicWebProvider: TrendProvider = {
  name: "Public Web / RSS Sources",

  isAvailable(): boolean {
    // No credentials needed — but not implemented yet
    return false;
  },

  async research(_context: TrendResearchContext): Promise<TrendCandidate[]> {
    if (!this.isAvailable()) {
      console.log("[PublicWebProvider] Skipped — not yet implemented.");
      return [];
    }

    // TODO: implement with approved public sources
    // Planned sources:
    //   - DetailingWorld forum RSS
    //   - Later blog RSS (trend reports)
    //   - Google Trends API (public endpoint for keyword trends)

    return [];
  },
};
