import { NextResponse } from "next/server";
import { getMetaConfig, fetchIgAccount, fetchIgAccountInsights } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cfg = getMetaConfig();
  if (!cfg) {
    return NextResponse.json({ ok: false, error: "Meta not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(Number(searchParams.get("days") ?? "28"), 90);

  try {
    const [account, insights] = await Promise.all([
      fetchIgAccount(cfg),
      fetchIgAccountInsights(cfg, days),
    ]);
    return NextResponse.json({
      ok: true,
      account: {
        username:        account.username,
        followersCount:  account.followers_count,
        mediaCount:      account.media_count,
      },
      insights,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Meta API error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
