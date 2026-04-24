import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/leads/:id — update the status of a lead
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json();
    const validStatuses = ["NEW", "CONTACTED", "BOOKED", "LOST"];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ lead });
  } catch (err) {
    console.error("[PATCH /api/leads/:id]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
