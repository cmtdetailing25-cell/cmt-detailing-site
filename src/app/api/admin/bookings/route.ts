import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // "pending" | "scheduled" | "declined" | "all"

    const whereStatus = (() => {
      if (status === "pending")   return { status: { in: ["NEW" as const, "CONTACTED" as const] } };
      if (status === "scheduled") return { status: "BOOKED" as const };
      if (status === "declined")  return { status: "LOST" as const };
      return undefined;
    })();

    const leads = await prisma.lead.findMany({
      where: whereStatus,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: { id: true, fullName: true, status: true, isVip: true, phone: true },
        },
        detailJobs: {
          select: {
            id: true,
            title: true,
            scheduleStatus: true,
            jobDate: true,
            scheduledStart: true,
            scheduledEnd: true,
            location: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return NextResponse.json({ leads });
  } catch (err) {
    console.error("[GET /api/admin/bookings]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
