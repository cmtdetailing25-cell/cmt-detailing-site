import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isRead } = await req.json();
    const notification = await prisma.adminNotification.update({
      where: { id: params.id },
      data: { isRead: isRead ?? true },
    });
    return NextResponse.json({ notification });
  } catch (err) {
    console.error("[PATCH /api/admin/notifications/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.adminNotification.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/notifications/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
