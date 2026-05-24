import type { Metadata } from "next";
import Link from "next/link";
import {
  getMetaConfig,
  fetchIgAccount,
  fetchIgAccountInsights,
  fetchIgMedia,
  type IgAccount,
  type IgAccountInsights,
  type IgPost,
} from "@/lib/meta";

export const metadata: Metadata = { title: "Social Insights — CMT Admin" };
export const revalidate = 300; // refresh every 5 minutes

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function engagement(p: IgPost) {
  return p.like_count + p.comments_count + (p.saved ?? 0);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "green" | "blue" | "purple" | "teal";
}) {
  const color = {
    green:  "text-green-400",
    blue:   "text-blue-400",
    purple: "text-purple-400",
    teal:   "text-[#94b2b6]",
  }[accent ?? "teal"];

  return (
    <div className="bg-[#1a2028] border border-[#2d3840] rounded-xl p-5">
      <p className="text-[10px] font-semibold text-[#434e56] uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
      {sub && <p className="text-[#708289] text-xs mt-1">{sub}</p>}
    </div>
  );
}

function MediaTypeBadge({ type }: { type: IgPost["media_type"] }) {
  const map: Record<string, string> = {
    IMAGE:          "bg-[#2d3840] text-[#708289]",
    VIDEO:          "bg-blue-900/40 text-blue-400",
    CAROUSEL_ALBUM: "bg-purple-900/40 text-purple-400",
    REEL:           "bg-gradient-to-r from-pink-900/40 to-purple-900/40 text-pink-400",
  };
  const label: Record<string, string> = {
    IMAGE: "Photo", VIDEO: "Video", CAROUSEL_ALBUM: "Carousel", REEL: "Reel",
  };
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${map[type] ?? "bg-[#2d3840] text-[#708289]"}`}>
      {label[type] ?? type}
    </span>
  );
}

function PostCard({ post }: { post: IgPost }) {
  const thumb = post.thumbnail_url ?? post.media_url;
  const caption = post.caption ?? "";

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[#1a2028] border border-[#2d3840] rounded-xl overflow-hidden hover:border-[#434e56] transition-colors group"
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-[#151b23] relative overflow-hidden">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={caption.slice(0, 60) || "Instagram post"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#434e56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <MediaTypeBadge type={post.media_type} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
          <span className="text-[10px] text-white font-medium">View on Instagram ↗</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        {/* Caption */}
        <p className="text-[#708289] text-[11px] leading-relaxed line-clamp-2 mb-2.5 min-h-[2.5rem]">
          {caption || <span className="italic text-[#434e56]">No caption</span>}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-1 text-center">
          <div>
            <p className="text-xs font-bold text-[#e9f0ef]">{fmt(post.like_count)}</p>
            <p className="text-[9px] text-[#434e56]">Likes</p>
          </div>
          <div>
            <p className="text-xs font-bold text-[#e9f0ef]">{fmt(post.comments_count)}</p>
            <p className="text-[9px] text-[#434e56]">Comments</p>
          </div>
          <div>
            <p className={`text-xs font-bold ${post.reach ? "text-[#94b2b6]" : "text-[#434e56]"}`}>
              {fmt(post.reach)}
            </p>
            <p className="text-[9px] text-[#434e56]">Reach</p>
          </div>
        </div>

        {/* Plays row for video/reel */}
        {post.plays != null && (
          <div className="mt-2 pt-2 border-t border-[#2d3840] flex justify-between">
            <span className="text-[9px] text-[#434e56]">Plays</span>
            <span className="text-[10px] font-semibold text-pink-400">{fmt(post.plays)}</span>
          </div>
        )}

        {/* Date */}
        <p className="text-[9px] text-[#434e56] mt-2">{fmtDate(post.timestamp)}</p>
      </div>
    </a>
  );
}

// ── Not-configured state ───────────────────────────────────────────────────────

function NotConfiguredCard() {
  const missing = [
    !process.env.META_PAGE_ACCESS_TOKEN && "META_PAGE_ACCESS_TOKEN",
    !process.env.META_IG_USER_ID        && "META_IG_USER_ID",
  ].filter(Boolean) as string[];

  return (
    <div className="bg-[#1a2028] border border-[#2d3840] rounded-2xl p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-2.5 h-2.5 rounded-full bg-[#434e56]" />
        <h2 className="text-[#e9f0ef] font-semibold text-base">Instagram not connected</h2>
      </div>

      <p className="text-[#708289] text-sm leading-relaxed mb-6">
        Add three environment variables to your Vercel project (or <code className="bg-[#151b23] px-1.5 py-0.5 rounded text-[#94b2b6] text-xs">.env</code> locally) to connect Instagram analytics.
      </p>

      <div className="space-y-2 mb-6">
        {(["META_PAGE_ACCESS_TOKEN", "META_IG_USER_ID", "META_FACEBOOK_PAGE_ID"] as const).map((v) => (
          <div key={v} className={`flex items-center gap-3 bg-[#151b23] rounded-lg px-4 py-2.5 ${missing.includes(v) ? "border border-red-900/40" : ""}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${missing.includes(v) ? "bg-red-500" : "bg-green-500"}`} />
            <code className="text-xs text-[#94b2b6] font-mono">{v}</code>
            {missing.includes(v) && <span className="ml-auto text-[10px] text-red-500">Missing</span>}
          </div>
        ))}
      </div>

      <div className="bg-[#151b23] border border-[#2d3840] rounded-xl p-5">
        <p className="text-[10px] font-semibold text-[#434e56] uppercase tracking-widest mb-3">How to get a token</p>
        <ol className="space-y-2 text-xs text-[#708289] leading-relaxed list-decimal list-inside">
          <li>Go to <span className="text-[#94b2b6]">Meta Business Suite → Settings → System Users</span></li>
          <li>Create a system user with <span className="text-[#94b2b6]">instagram_basic</span> + <span className="text-[#94b2b6]">instagram_manage_insights</span> permissions</li>
          <li>Generate a token and copy the Instagram User ID from the IG Graph API</li>
          <li>Add <code className="bg-[#1a2028] px-1 rounded">META_PAGE_ACCESS_TOKEN</code>, <code className="bg-[#1a2028] px-1 rounded">META_IG_USER_ID</code>, and <code className="bg-[#1a2028] px-1 rounded">META_FACEBOOK_PAGE_ID</code> to your environment</li>
        </ol>
      </div>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function ErrorCard({ error }: { error: string }) {
  return (
    <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-5 max-w-2xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <p className="text-red-400 font-semibold text-sm">Meta API error</p>
      </div>
      <p className="text-red-300/80 text-xs font-mono leading-relaxed">{error}</p>
      <p className="text-[#708289] text-xs mt-3">
        Token may be expired or missing required permissions.
        Check <span className="text-[#94b2b6]">instagram_basic</span> and <span className="text-[#94b2b6]">instagram_manage_insights</span> are granted.
      </p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function InsightsPage() {
  const cfg = getMetaConfig();

  // ── Not configured ─────────────────────────────────────────────────────────
  if (!cfg) {
    return (
      <div className="p-6 max-w-4xl">
        <PageHeader connected={false} />
        <NotConfiguredCard />
      </div>
    );
  }

  // ── Fetch all data in parallel; surface errors per section ─────────────────
  const [accountResult, insightsResult, postsResult] = await Promise.allSettled([
    fetchIgAccount(cfg),
    fetchIgAccountInsights(cfg, 28),
    fetchIgMedia(cfg, 20),
  ]);

  // If account fetch fails, token is invalid — surface the error
  if (accountResult.status === "rejected") {
    const err = accountResult.reason instanceof Error
      ? accountResult.reason.message
      : "Unknown error";
    return (
      <div className="p-6 max-w-4xl">
        <PageHeader connected={false} />
        <ErrorCard error={err} />
      </div>
    );
  }

  const account:  IgAccount         = accountResult.value;
  const insights: IgAccountInsights | null = insightsResult.status === "fulfilled" ? insightsResult.value : null;
  const posts:    IgPost[]          = postsResult.status === "fulfilled" ? postsResult.value : [];
  const insightsError = insightsResult.status === "rejected"
    ? (insightsResult.reason instanceof Error ? insightsResult.reason.message : "Unknown error")
    : null;

  // Top performers: posts sorted by engagement descending
  const topPosts = [...posts]
    .sort((a, b) => engagement(b) - engagement(a))
    .slice(0, 5);

  return (
    <div className="p-6 max-w-6xl space-y-8">

      <PageHeader connected={true} username={account.username} />

      {/* ── Account bar ───────────────────────────────────────────────────── */}
      <section>
        <div className="bg-[#1a2028] border border-[#2d3840] rounded-xl p-5 flex flex-wrap items-center gap-6">
          {/* Avatar placeholder / picture */}
          {account.profile_picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={account.profile_picture_url}
              alt={account.username}
              className="w-14 h-14 rounded-full object-cover shrink-0 ring-2 ring-[#2d3840]"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">
                {account.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-[#e9f0ef] font-bold text-lg">@{account.username}</p>
            {account.name && account.name !== account.username && (
              <p className="text-[#708289] text-sm">{account.name}</p>
            )}
            {account.biography && (
              <p className="text-[#434e56] text-xs mt-1 line-clamp-2 max-w-sm">{account.biography}</p>
            )}
          </div>

          <div className="flex gap-6 shrink-0">
            <div className="text-center">
              <p className="text-[#e9f0ef] font-extrabold text-2xl">{fmt(account.followers_count)}</p>
              <p className="text-[#434e56] text-[10px] uppercase tracking-widest">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-[#e9f0ef] font-extrabold text-2xl">{fmt(account.media_count)}</p>
              <p className="text-[#434e56] text-[10px] uppercase tracking-widest">Posts</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 28-day metrics ────────────────────────────────────────────────── */}
      <section>
        <SectionLabel>28-Day Performance</SectionLabel>
        {insightsError ? (
          <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4 text-xs text-amber-400">
            Account insights unavailable — {insightsError}. Check <span className="font-mono">instagram_manage_insights</span> permission.
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Followers"
              value={fmt(account.followers_count)}
              sub="Current count"
              accent="teal"
            />
            <MetricCard
              label="Impressions"
              value={fmt(insights?.impressions)}
              sub="Last 28 days"
              accent="blue"
            />
            <MetricCard
              label="Reach"
              value={fmt(insights?.reach)}
              sub="Unique accounts"
              accent="purple"
            />
            <MetricCard
              label="Profile Views"
              value={fmt(insights?.profile_views)}
              sub="Last 28 days"
              accent="green"
            />
          </div>
        )}
      </section>

      {/* ── Recent posts ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Recent Posts</SectionLabel>
          <p className="text-[10px] text-[#434e56]">{posts.length} fetched</p>
        </div>
        {posts.length === 0 ? (
          <EmptyPosts />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* ── Top performers ────────────────────────────────────────────────── */}
      {topPosts.length > 0 && (
        <section>
          <SectionLabel>Top Performers</SectionLabel>
          <div className="bg-[#1a2028] border border-[#2d3840] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#151b23] text-[#434e56] text-[10px] uppercase tracking-widest text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Post</th>
                  <th className="px-4 py-3 font-semibold text-center">Type</th>
                  <th className="px-4 py-3 font-semibold text-right">Likes</th>
                  <th className="px-4 py-3 font-semibold text-right">Comments</th>
                  <th className="px-4 py-3 font-semibold text-right">Reach</th>
                  <th className="px-4 py-3 font-semibold text-right">Saves</th>
                  <th className="px-4 py-3 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3840]">
                {topPosts.map((post, i) => {
                  const thumb = post.thumbnail_url ?? post.media_url;
                  return (
                    <tr key={post.id} className="hover:bg-[#1e2730] transition-colors">
                      <td className="px-4 py-3">
                        <a href={post.permalink} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 group">
                          <span className="text-[#434e56] text-xs font-bold w-4 shrink-0">#{i + 1}</span>
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-[#2d3840] shrink-0" />
                          )}
                          <span className="text-[#708289] text-xs line-clamp-1 group-hover:text-[#e9f0ef] transition-colors max-w-[180px]">
                            {post.caption ?? <span className="italic text-[#434e56]">No caption</span>}
                          </span>
                        </a>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <MediaTypeBadge type={post.media_type} />
                      </td>
                      <td className="px-4 py-3 text-right text-[#e9f0ef] font-semibold text-xs">{fmt(post.like_count)}</td>
                      <td className="px-4 py-3 text-right text-[#708289] text-xs">{fmt(post.comments_count)}</td>
                      <td className="px-4 py-3 text-right text-[#94b2b6] text-xs">{fmt(post.reach)}</td>
                      <td className="px-4 py-3 text-right text-[#708289] text-xs">{fmt(post.saved)}</td>
                      <td className="px-4 py-3 text-right text-[#434e56] text-xs">{fmtDate(post.timestamp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="h-10" />
    </div>
  );
}

// ── Shared inline components ──────────────────────────────────────────────────

function PageHeader({ connected, username }: { connected: boolean; username?: string }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-[#e9f0ef]">Social Insights</h1>
          {connected ? (
            <span className="flex items-center gap-1.5 bg-green-900/30 border border-green-800/40 text-green-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Connected
              {username && ` · @${username}`}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 bg-[#1a2028] border border-[#2d3840] text-[#708289] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-[#434e56]" />
              Not configured
            </span>
          )}
        </div>
        <p className="text-[#708289] text-sm">
          Instagram analytics · Read only
        </p>
      </div>
      <Link href="/admin/social" className="text-[#708289] hover:text-[#e9f0ef] text-xs transition-colors shrink-0">
        ← Social
      </Link>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-semibold text-[#708289] uppercase tracking-widest mb-3">{children}</h2>
  );
}

function EmptyPosts() {
  return (
    <div className="border border-dashed border-[#2d3840] rounded-xl px-6 py-12 flex flex-col items-center text-center gap-3">
      <svg className="w-10 h-10 text-[#434e56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-[#708289] text-sm font-medium">No posts found</p>
      <p className="text-[#434e56] text-xs max-w-xs">
        This account has no media, or the token lacks <span className="font-mono text-[#708289]">instagram_basic</span> permission.
      </p>
    </div>
  );
}
