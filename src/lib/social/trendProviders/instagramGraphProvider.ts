/**
 * Instagram Graph API Trend Provider — STUB (not yet implemented)
 *
 * Future implementation will use the official Meta/Instagram Graph API to:
 * - Fetch hashtag media counts and trending posts
 * - Pull account insights for connected business accounts
 * - Retrieve media engagement metrics
 *
 * Required environment variables (not required yet — stub only):
 *   META_APP_ID                    — Meta developer app ID
 *   META_APP_SECRET                — Meta developer app secret
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID  — Instagram Business Account ID
 *   META_ACCESS_TOKEN              — Long-lived user access token with permissions:
 *                                    instagram_basic, pages_read_engagement,
 *                                    instagram_manage_insights, ads_read
 *
 * Important: Do NOT use unofficial scraping or private API endpoints.
 * Only use officially documented Graph API v18+ endpoints.
 *
 * Reference: https://developers.facebook.com/docs/instagram-api
 */

import type { TrendProvider, TrendCandidate, TrendResearchContext } from "./trendProviderTypes";

export const instagramGraphProvider: TrendProvider = {
  name: "Instagram Graph API",

  isAvailable(): boolean {
    return !!(
      process.env.META_APP_ID &&
      process.env.META_APP_SECRET &&
      process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID &&
      process.env.META_ACCESS_TOKEN
    );
  },

  async research(_context: TrendResearchContext): Promise<TrendCandidate[]> {
    if (!this.isAvailable()) {
      console.log("[InstagramGraphProvider] Skipped — credentials not configured.");
      return [];
    }

    // TODO: implement when credentials are ready
    // Planned endpoints:
    //   GET /{ig-hashtag-id}/top_media — top posts for a target hashtag
    //   GET /{ig-hashtag-id}/recent_media — recent posts
    //   GET /{ig-user-id}/media — own account media for engagement analysis
    //   GET /{ig-user-id}/insights — account-level reach/impressions

    console.log("[InstagramGraphProvider] Stub — not yet implemented.");
    return [];
  },
};
