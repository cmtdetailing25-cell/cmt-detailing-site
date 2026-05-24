import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST — register a push subscription
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { endpoint, keys, userAgent } = body as {
      endpoint:  string;
      keys:      { p256dh: string; auth: string };
      userAgent?: string;
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ ok: false, error: "Invalid subscription" }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where:  { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth, userAgent: userAgent ?? null },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent: userAgent ?? null },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/admin/push/subscribe]", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

// DELETE — remove a push subscription
export async function DELETE(req: Request) {
  try {
    const { endpoint } = await req.json() as { endpoint: string };
    if (!endpoint) return NextResponse.json({ ok: false, error: "Missing endpoint" }, { status: 400 });

    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/push/subscribe]", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
