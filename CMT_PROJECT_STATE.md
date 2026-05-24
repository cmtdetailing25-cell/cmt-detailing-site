# CMT Detailing — Full Project State
_Last updated: 2026-05-24_

---

## Project Basics

| Field | Value |
|-------|-------|
| **Project root** | `C:\Projects\CMT Project\CMT Project` |
| **GitHub** | `cmtdetailing25-cell/cmt-detailing-site`, branch `main` |
| **Deployed** | Vercel (auto-deploys on push to `main`) |
| **Database** | Neon PostgreSQL (`DATABASE_URL` env var) |
| **File storage** | Vercel Blob (`BLOB_READ_WRITE_TOKEN`) |
| **Framework** | Next.js 14.2.35, App Router, TypeScript, Tailwind CSS v3 |
| **ORM** | Prisma 5.x — always use `npx prisma db push` (NOT `migrate dev`) |

**Brand palette:** `#151b23` bg, `#e9f0ef` text, `#708289` muted, `#434e56` subtle, `#94b2b6` teal accent. Admin accent: `red-600`.

**Auth:** Middleware at `src/middleware.ts` protects `/admin/*` via HMAC SHA-256 cookie (`cmt_admin`). API routes at `/api/admin/*` are NOT middleware-protected — they rely on admin UI being sole caller.

---

## Admin Navigation (AdminNav.tsx)

```
Dashboard         /admin/dashboard
Bookings          /admin/bookings
Clients           /admin/clients
Jobs              /admin/jobs
Media             /admin/media
Social            /admin/social        (exact match)
  ↳ Insights      /admin/social/insights
```

---

## All Admin Pages

| Route | Description |
|-------|-------------|
| `/admin/dashboard` | KPI cards, recent leads, social planning summary |
| `/admin/bookings` | Lead/booking list |
| `/admin/clients` | Searchable client list, create modal, status filters |
| `/admin/clients/[id]` | Vehicles panel, jobs timeline, edit/delete |
| `/admin/jobs` | Job list with service/social-ready filters |
| `/admin/jobs/[id]` | Photo grid, client/vehicle info, drafts panel, edit |
| `/admin/media` | Media library (SitePhoto grid) |
| `/admin/media/import` | 4-step guided upload: client → vehicle → job → upload |
| `/admin/social` | Social planning hub — draft generator, draft cards, agent runs |
| `/admin/social/insights` | **Read-only** Instagram analytics dashboard (Meta Graph API) |

---

## All API Routes

### Leads / Bookings
- `GET/POST /api/leads` — public booking form submissions
- `GET/PATCH/DELETE /api/leads/[id]`

### Clients
- `GET/POST /api/admin/clients`
- `GET/PATCH/DELETE /api/admin/clients/[id]`

### Vehicles
- `POST /api/admin/vehicles`
- `PATCH/DELETE /api/admin/vehicles/[id]`

### Jobs
- `GET/POST /api/admin/jobs`
- `GET/PATCH/DELETE /api/admin/jobs/[id]`
- `PATCH /api/admin/jobs/[id]/assign-photos`

### Social Agent
- `POST /api/admin/social/run-weekly-agent` — generates weekly content batch
- `POST /api/admin/social/generate-draft` — single draft from media picker
- `GET /api/admin/social/drafts` — list drafts
- `PATCH /api/admin/social/drafts/[id]`
- `POST /api/admin/social/drafts/[id]/approve`
- `POST /api/admin/social/drafts/[id]/archive`
- `PATCH /api/admin/social/media-intelligence/[id]` — update photo intelligence fields

### Meta / Instagram (read-only)
- `GET /api/admin/social/meta/status` — connection status, username, follower count
- `GET /api/admin/social/meta/posts?limit=20` — recent posts with per-post metrics
- `GET /api/admin/social/meta/insights?days=28` — 28-day account totals

### Auth
- `POST /api/admin/login`
- `POST /api/admin/logout`

---

## Prisma Models Summary

### Client → Vehicle → DetailJob hierarchy
- **Client** — firstName, lastName, email, phone, city, state, tags[], status (LEAD/ACTIVE/MAINTENANCE/INACTIVE), isVip
- **Vehicle** — clientId, year, make, model, trim, color, plate, vin, isPrimary. Cascades on client delete.
- **DetailJob** — clientId?, vehicleId?, title, serviceType, jobDate, price, isSocialReady, isFeatured. Links to photos and social drafts.

### Media
- **SitePhoto** — imageUrl, category, 17 intelligence fields (contentScore, qualityScore, marketingScore, isSocialReady, isReelCandidate, isBeforeAfterCandidate, contentTags[], etc.), detailJobId?

### Social Agent
- **SocialContentDraft** — type, status, caption, hashtags, hook, agentRunId?, detailJobId?, trendInsightId?
- **SocialAgentRun** — status, weekStartDate, draftsCreated, postsGenerated
- **SocialAgentSettings** — weeklyPostTarget, weeklyReelTarget, brandVoice, approvalRequired
- **SocialContentMedia** — join table: draft ↔ SitePhoto

### Trend Intelligence
- **TrendInsight** — title, platform, category (TrendCategory enum), trendType, exampleHook, hashtags, confidenceScore
- **TrendSource** — named origin for trends
- **TrendResearchSettings / TrendResearchRun** — settings and run history for trend research

### Marketing Automation (DB exists, UI removed/hidden)
- **MarketingCampaign**, **MarketingAsset**, **AutomationWorkflowRun**, **MarketingPerformanceStat**, **CampaignMedia**, **AutomationSettings** — all still in DB/schema, pipeline UI was removed from admin nav to simplify the product. Data is safe.

### Other
- **Lead** — public booking form submissions, linked to Client optionally
- **AdminNotification** — system notifications

---

## Key Source Files

| File | Purpose |
|------|---------|
| `src/lib/meta.ts` | **Server-only** Meta Graph API helpers. Never import in client components. |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/social/generateDraftContent.ts` | Template-based draft generator (no AI yet) |
| `src/lib/social/runWeeklyAgent.ts` | Weekly agent logic — scores DetailJobs, creates drafts |
| `src/middleware.ts` | Admin auth middleware |
| `src/components/AdminNav.tsx` | Admin sidebar nav |
| `src/components/MediaIntelligencePanel.tsx` | Photo intelligence edit UI |
| `src/components/DraftGenerator.tsx` | Media picker + draft generation UI |
| `src/components/DraftSection.tsx` | Draft cards with approve/edit/archive |

---

## Meta / Instagram Insights Dashboard

### Environment Variables Required
```
META_PAGE_ACCESS_TOKEN=   # System User token from Meta Business Manager (never expires if set to "Never")
META_FACEBOOK_PAGE_ID=429356560260907   # CMT Detailing Facebook Page ID
META_IG_USER_ID=17841469661771362       # CMT Instagram Business Account ID
```

### How to get/renew the token
1. business.facebook.com → Settings → Users → System users → "cam"
2. Generate token → select "CMT Automation" app → expiry: Never
3. Permissions: `instagram_basic`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`

### What the dashboard shows
- Account bar: profile pic, @username, follower count, post count
- 28-day metrics: Followers, Accounts Engaged, Reach, Profile Views
- Recent posts grid: thumbnail, media type badge, caption, likes, comments, accounts reached, views (video/reel), profile visits
- Top 5 performers table sorted by engagement

### `src/lib/meta.ts` — API calls made
- `GET /{igUserId}?fields=id,username,name,biography,followers_count,media_count,profile_picture_url,website`
- `GET /{igUserId}/insights?metric=accounts_engaged,reach,profile_views&metric_type=total_value&period=day&since=&until=`
- `GET /{igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=50`
- Per post: `GET /{mediaId}/insights?metric=reach,saved,profile_visits` (IMAGE/CAROUSEL)
- Per post video: `GET /{mediaId}/insights?metric=reach,saved` then separate `GET /{mediaId}/insights?metric=plays` with fallback to `metric=video_views`

### Known Issues (as of 2026-05-24)
1. **Video views not showing** — Regular feed VIDEO posts may not support `plays` metric (Reels do). The code tries `plays` then falls back to `video_views` in a separate call. If both fail, Views row is hidden. This is a Meta API limitation for older video post types.
2. **Post count mismatch** — API fetches up to 50 posts but account `media_count` shows 17. Discrepancy may be archived/hidden posts counted differently by Meta. Posts with expired CDN image URLs show as broken thumbnails but are still fetched.

### Page caching
`export const dynamic = "force-dynamic"` — always re-fetches from Meta on every page load (no caching). Change to `export const revalidate = 300` for production to avoid N+1 Meta API calls on every visit.

---

## Social Agent — Current State

### What's built
- **Draft Generator** — media picker with intelligence filters, content type/angle/CTA selectors. Template-based (no AI).
- **Weekly Batch** — "Generate Weekly Batch" button runs agent that scores DetailJobs (isSocialReady +40, isFeatured +20, photo count +6 each, before/after pair +15, recency bonus, recently-used penalty -80). Falls back to unassigned photos.
- **Draft Cards** — approve / edit / archive flow
- **Media Intelligence** — per-photo scoring and tagging UI
- **Trend Intelligence** — manual trend entry, used to inform draft angles

### What's NOT built yet
- Real AI generation (OpenAI / Claude API)
- Instagram posting (read-only Meta integration only)
- Cron-triggered automated weekly runs
- Agent Settings editor UI
- Trend research automation (manual entry only)

---

## Remotion Render Service (Railway — separate deployment)

Located in `/remotion` subdirectory (separate from Next.js app).

- Express server (`remotion/server.ts`) — `POST /render`, `GET /health`
- Auth: `x-render-secret` header (`RENDER_SERVICE_SECRET` env var)
- Uploads renders to Vercel Blob (`BLOB_READ_WRITE_TOKEN`)
- Dockerfile: `node:20-bookworm-slim` with Chromium deps + ffmpeg
- CMD: `./node_modules/.bin/remotion browser ensure && ./node_modules/.bin/tsx server.ts`
- **Known issue:** Railway build context may use repo root instead of `/remotion`. If deploy fails, verify Railway "Root Directory" setting = `remotion`.

---

## Recent Git History

```
c1e79a5 feat(insights): add read-only Meta/Instagram analytics dashboard
459b3ef feat(admin): simplify dashboard to business command center
de58073 fix(remotion): move browser ensure to startup, add package.json diagnostic
f399627 fix(remotion): use direct binary path for remotion browser ensure
4e37267 fix(remotion): use full npm install in Dockerfile
007d2ed fix(remotion): fix Docker build — add ffmpeg, move tsx to dependencies
fce65cf feat(remotion): add hosted render service for Railway deployment
563a6af chore(deps): upgrade next.js 14.2.3 → 14.2.35 (security)
```

---

## Working Notes for Next Session

- **Video views**: If the user wants to debug further, add `console.log` to `fetchPostInsights` in `src/lib/meta.ts` to see exactly what the Meta API returns for VIDEO type posts. The metric name might differ for older feed videos vs Reels.
- **Revalidate**: The insights page is set to `force-dynamic` for dev testing. For production, change back to `export const revalidate = 300` to avoid hammering Meta's API on every page visit.
- **Vercel env vars**: The three `META_*` vars need to be added to Vercel project settings (not just `.env.local`) for the production dashboard to connect.
- **Token expiry**: The system user token was generated with "Never" expiry, so it shouldn't need refreshing. If the dashboard shows an error, regenerate the token from Business Manager → System users → cam.
