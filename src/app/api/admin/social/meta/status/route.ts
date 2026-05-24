import { NextResponse } from "next/server";
import { getMetaConfig, fetchIgAccount } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = getMetaConfig();

  if (!cfg) {
    return NextResponse.json({
      configured: false,
      valid:      false,
      missing:    [
        !process.env.META_PAGE_ACCESS_TOKEN && "META_PAGE_ACCESS_TOKEN",
        !process.env.META_IG_USER_ID        && "META_IG_USER_ID",
      ].filter(Boolean),
    });
  }

  try {
    const account = await fetchIgAccount(cfg);
    return NextResponse.json({
      configured:     true,
      valid:          true,
      username:       account.username,
      followersCount: account.followers_count,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Meta API error";
    return NextResponse.json({ configured: true, valid: false, error: message });
  }
}
