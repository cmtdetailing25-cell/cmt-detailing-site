import { NextResponse } from "next/server";
import { getMetaConfig, fetchIgMedia } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cfg = getMetaConfig();
  if (!cfg) {
    return NextResponse.json({ ok: false, error: "Meta not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);

  try {
    const posts = await fetchIgMedia(cfg, limit);
    return NextResponse.json({ ok: true, posts, count: posts.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Meta API error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
