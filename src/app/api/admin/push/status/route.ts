import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { vapidConfigured } from "@/lib/webpush";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [subs, logs] = await Promise.all([
      prisma.pushSubscription.findMany({
        orderBy: { createdAt: "desc" },
        select:  { id: true, endpoint: true, userAgent: true, createdAt: true },
      }),
      prisma.pushLog.findMany({
        orderBy: { createdAt: "desc" },
        take:    10,
      }),
    ]);

    return NextResponse.json({
      vapidConfigured: vapidConfigured(),
      resendConfigured: !!(process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL),
      subscriptions: {
        count:   subs.length,
        devices: subs.map((s) => ({
          id:        s.id,
          endpoint:  s.endpoint.slice(0, 50) + "…",
          userAgent: s.userAgent,
          createdAt: s.createdAt,
        })),
      },
      recentLogs: logs,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
