/**
 * Meta Graph API helpers — SERVER ONLY.
 * This file reads env vars and makes authenticated API calls.
 * Never import this from client components.
 */

const GRAPH = "https://graph.facebook.com/v21.0";

// ── Config ────────────────────────────────────────────────────────────────────

export interface MetaConfig {
  token:    string;
  igUserId: string;
  fbPageId: string;
}

export function getMetaConfig(): MetaConfig | null {
  const token    = process.env.META_PAGE_ACCESS_TOKEN;
  const igUserId = process.env.META_IG_USER_ID;
  if (!token || !igUserId) return null;
  return { token, igUserId, fbPageId: process.env.META_FACEBOOK_PAGE_ID ?? "" };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IgAccount {
  id:                  string;
  username:            string;
  name:                string;
  biography:           string;
  followers_count:     number;
  media_count:         number;
  profile_picture_url: string | null;
  website:             string | null;
}

export interface IgAccountInsights {
  impressions:   number;
  reach:         number;
  profile_views: number;
  periodDays:    number;
}

export type IgMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REEL";

export interface IgPost {
  id:             string;
  caption:        string | null;
  media_type:     IgMediaType;
  media_url:      string | null;
  thumbnail_url:  string | null;
  permalink:      string;
  timestamp:      string;
  like_count:     number;
  comments_count: number;
  // Per-post insights (null if unavailable)
  reach:          number | null;
  saved:          number | null;
  plays:          number | null;
  impressions:    number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function metricValue(data: Array<{ name: string; value?: number; values?: Array<{ value: number }> }>, name: string): number | null {
  const item = data.find((d) => d.name === name);
  if (!item) return null;
  if (typeof item.value === "number") return item.value;
  if (item.values?.[0]?.value !== undefined) return item.values[0].value;
  return null;
}

// ── Account ───────────────────────────────────────────────────────────────────

export async function fetchIgAccount(cfg: MetaConfig): Promise<IgAccount> {
  const fields = "id,username,name,biography,followers_count,media_count,profile_picture_url,website";
  const res = await fetch(
    `${GRAPH}/${cfg.igUserId}?fields=${fields}&access_token=${cfg.token}`,
    { cache: "no-store" },
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data as IgAccount;
}

// ── Account insights (period totals) ──────────────────────────────────────────

export async function fetchIgAccountInsights(cfg: MetaConfig, days = 28): Promise<IgAccountInsights> {
  const until = Math.floor(Date.now() / 1000);
  const since = until - days * 86400;

  const params = new URLSearchParams({
    metric:       "impressions,reach,profile_views",
    period:       "day",
    since:        String(since),
    until:        String(until),
    access_token: cfg.token,
  });

  const res = await fetch(`${GRAPH}/${cfg.igUserId}/insights?${params}`, { cache: "no-store" });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  type MetricData = { name: string; values: Array<{ value: number }> };
  const metrics: MetricData[] = data.data ?? [];

  function sum(name: string) {
    const m = metrics.find((m) => m.name === name);
    return m ? m.values.reduce((acc, v) => acc + (v.value ?? 0), 0) : 0;
  }

  return {
    impressions:   sum("impressions"),
    reach:         sum("reach"),
    profile_views: sum("profile_views"),
    periodDays:    days,
  };
}

// ── Media (posts + per-post insights) ─────────────────────────────────────────

export async function fetchIgMedia(cfg: MetaConfig, limit = 20): Promise<IgPost[]> {
  // Basic media fields — like_count and comments_count are on the media object itself
  const fields = [
    "id", "caption", "media_type", "media_url",
    "thumbnail_url", "permalink", "timestamp",
    "like_count", "comments_count",
  ].join(",");

  const res = await fetch(
    `${GRAPH}/${cfg.igUserId}/media?fields=${fields}&limit=${limit}&access_token=${cfg.token}`,
    { cache: "no-store" },
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  type RawMedia = {
    id: string; caption?: string; media_type: string;
    media_url?: string; thumbnail_url?: string;
    permalink: string; timestamp: string;
    like_count?: number; comments_count?: number;
  };

  const list: RawMedia[] = data.data ?? [];

  // Fetch per-post insights in parallel; individual failures are silenced
  const insightsResults = await Promise.allSettled(
    list.map((m) => fetchPostInsights(cfg, m.id, m.media_type as IgMediaType)),
  );

  return list.map((m, i): IgPost => {
    const ins = insightsResults[i].status === "fulfilled" ? insightsResults[i].value : null;
    return {
      id:             m.id,
      caption:        m.caption ?? null,
      media_type:     m.media_type as IgMediaType,
      media_url:      m.media_url ?? null,
      thumbnail_url:  m.thumbnail_url ?? null,
      permalink:      m.permalink,
      timestamp:      m.timestamp,
      like_count:     m.like_count ?? 0,
      comments_count: m.comments_count ?? 0,
      reach:          ins?.reach        ?? null,
      saved:          ins?.saved        ?? null,
      plays:          ins?.plays        ?? null,
      impressions:    ins?.impressions  ?? null,
    };
  });
}

// ── Per-post insights ─────────────────────────────────────────────────────────

interface PostInsights {
  reach?:       number | null;
  impressions?: number | null;
  saved?:       number | null;
  plays?:       number | null;
}

async function fetchPostInsights(cfg: MetaConfig, mediaId: string, mediaType: IgMediaType): Promise<PostInsights> {
  // Metrics vary by media type — REELs don't support "impressions", only "plays"
  const metric = mediaType === "REEL"
    ? "reach,saved,plays,shares"
    : "impressions,reach,saved";

  const res = await fetch(
    `${GRAPH}/${mediaId}/insights?metric=${metric}&access_token=${cfg.token}`,
    { cache: "no-store" },
  );
  const data = await res.json();
  if (data.error) return {};

  type InsightItem = { name: string; value?: number; values?: Array<{ value: number }> };
  const items: InsightItem[] = data.data ?? [];

  return {
    reach:       metricValue(items, "reach"),
    impressions: metricValue(items, "impressions"),
    saved:       metricValue(items, "saved"),
    plays:       metricValue(items, "plays") ?? metricValue(items, "video_views"),
  };
}
