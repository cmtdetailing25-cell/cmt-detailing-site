import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly   = searchParams.get("unreadOnly") === "true";
    const includeArchived = searchParams.get("includeArchived") === "true";
    const take = Math.min(parseInt(searchParams.get("take") ?? "30", 10), 100);

    const notifications = await prisma.adminNotification.findMany({
      where: {
        ...(unreadOnly ? { isRead: false } : {}),
        ...(!includeArchived ? { isArchived: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    const unreadCount = await prisma.adminNotification.count({
      where: { isRead: false, isArchived: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("[GET /api/admin/notifications]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Mark all as read
export async function PATCH() {
  try {
    await prisma.adminNotification.updateMany({
      where: { isRead: false, isArchived: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/admin/notifications]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
