import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { ProspectStatus } from "@prisma/client";

export const metadata = { title: "Prospects — CMT Admin" };
export const dynamic = "force-dynamic";

// ─── Labels ───────────────────────────────────────────────────────────────────

const STATUS_META: Record<ProspectStatus, { label: string; cls: string }> = {
  STAGED:     { label: "Staged",      cls: "bg-yellow-900/40 text-yellow-400" },
  SENT:       { label: "Sent",        cls: "bg-blue-900/40 text-blue-400" },
  REPLIED:    { label: "Replied",     cls: "bg-purple-900/40 text-purple-400" },
  BOOKED:     { label: "Booked",      cls: "bg-green-900/40 text-green-400" },
  NO_RESPONSE:{ label: "No response", cls: "bg-gray-800 text-gray-500" },
  EXCLUDED:   { label: "Excluded",    cls: "bg-red-900/40 text-red-400" },
  WATCHLIST:  { label: "Watchlist",   cls: "bg-gray-800 text-gray-400" },
};

const TIER_CLS: Record<string, string> = {
  A: "bg-red-600/20 text-red-400",
  B: "bg-yellow-900/40 text-yellow-400",
  C: "bg-gray-800 text-gray-400",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function buildHref(base: Record<string, string | undefined>, over: Record<string, string | undefined>) {
  const merged = { ...base, ...over };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/admin/prospects?${qs}` : "/admin/prospects";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams?: { tier?: string; q?: string; view?: string };
}) {
  const tier = (searchParams?.tier ?? "all").toUpperCase();
  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const view = searchParams?.view ?? "prospects";

  const all = await prisma.prospect.findMany({ orderBy: { sortOrder: "asc" } });

  const prospects = all.filter((p) => p.status !== "EXCLUDED" && p.status !== "WATCHLIST");
  const excluded = all.filter((p) => p.status === "EXCLUDED" || p.status === "WATCHLIST");

  const tierCounts = { A: 0, B: 0, C: 0 };
  for (const p of prospects) {
    if (p.tier === "A" || p.tier === "B" || p.tier === "C") tierCounts[p.tier]++;
  }

  let rows = view === "excluded" ? excluded : view === "all" ? all : prospects;
  if (tier === "A" || tier === "B" || tier === "C") {
    rows = rows.filter((p) => p.tier === tier);
  }
  if (q) {
    rows = rows.filter((p) => p.handle.toLowerCase().includes(q));
  }

  const base = { tier: tier === "ALL" ? undefined : searchParams?.tier, q: searchParams?.q, view };
  const tabCls = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm transition-colors ${
      active ? "bg-red-600/20 text-red-400 font-medium" : "text-gray-400 hover:text-white hover:bg-gray-800"
    }`;

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
        <h1 className="text-white font-bold text-xl">Prospects</h1>
        <p className="text-gray-500 text-xs">
          {prospects.length} prospects · {tierCounts.A} A · {tierCounts.B} B · {tierCounts.C} C ·{" "}
          {excluded.length} excluded / watchlist
        </p>
      </div>
      <p className="text-gray-500 text-sm mb-5">
        Instagram collab pipeline for the May 1, 2027 restart. Cameron sends every DM himself from
        @cmt_detailing — this page only stores the list, the drafts, and the status. Nothing here
        sends or posts anything.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Link href={buildHref(base, { view: "prospects", tier: undefined })} className={tabCls(view === "prospects")}>
          Prospects ({prospects.length})
        </Link>
        <Link href={buildHref(base, { view: "excluded", tier: undefined })} className={tabCls(view === "excluded")}>
          Excluded &amp; watchlist ({excluded.length})
        </Link>
        <Link href={buildHref(base, { view: "all", tier: undefined })} className={tabCls(view === "all")}>
          All ({all.length})
        </Link>
        <span className="text-gray-700 mx-1">|</span>
        {(["A", "B", "C"] as const).map((t) => (
          <Link
            key={t}
            href={buildHref(base, { tier: tier === t ? undefined : t })}
            className={tabCls(tier === t)}
          >
            Tier {t} ({tierCounts[t]})
          </Link>
        ))}
        <form method="GET" action="/admin/prospects" className="ml-auto flex gap-2">
          {view !== "prospects" && <input type="hidden" name="view" value={view} />}
          {tier !== "ALL" && <input type="hidden" name="tier" value={tier} />}
          <input
            type="text"
            name="q"
            defaultValue={searchParams?.q ?? ""}
            placeholder="Search handle…"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#94b2b6]"
          />
          <button
            type="submit"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 hover:text-white"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-[#1a2028] border border-[#2d3840] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-[#434e56] border-b border-[#2d3840]">
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Handle</th>
              <th className="px-4 py-3 font-semibold">Tier</th>
              <th className="px-4 py-3 font-semibold">Followers</th>
              <th className="px-4 py-3 font-semibold">Local %</th>
              <th className="px-4 py-3 font-semibold">Town</th>
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Added</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.id} className="border-b border-[#2d3840]/60 hover:bg-[#20262e]">
                <td className="px-4 py-3 text-gray-500">{p.sortOrder || i + 1}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/prospects/${p.id}`} className="text-white font-medium hover:text-red-400">
                    {p.handle}
                  </Link>
                  {p.notes.includes("DO NOT SEND") && (
                    <span className="block text-[10px] font-semibold text-red-400 mt-0.5">
                      DO NOT SEND — brand-safety call pending
                    </span>
                  )}
                  {p.notes.includes("Month 1 pick") && (
                    <span className="block text-[10px] font-semibold text-green-400 mt-0.5">Month 1 pick</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.tier ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${TIER_CLS[p.tier] ?? "bg-gray-800 text-gray-400"}`}>
                      {p.tier}
                      {p.isProvisional ? " (prov.)" : ""}
                    </span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-300">{p.followers ?? "—"}</td>
                <td className="px-4 py-3 text-gray-300">{p.localPctEst ?? "—"}</td>
                <td className="px-4 py-3 text-gray-300">{p.town ?? "—"}</td>
                <td className="px-4 py-3 text-gray-300 font-mono text-xs">{p.mentionCode ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${STATUS_META[p.status].cls}`}>
                    {STATUS_META[p.status].label}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDate(p.dateAdded)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No prospects match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-gray-600 text-xs mt-4">
        Caps: 2× Tier A + 2× Tier B per month. Re-check every handle + follower count in the
        Instagram app before sending — counts move and tiers can change. Full Detail takes 3 hours;
        calendar slots are 2 hours — settle the slot fit before confirming any Tier A collab for May.
      </p>
    </div>
  );
}
