import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; mediaId: string } }
) {
  try {
    const { role, sortOrder } = await req.json();
    const data: Record<string, unknown> = {};
    if (role      !== undefined) data.role      = String(role);
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

    const media = await prisma.campaignMedia.update({
      where:   { id: params.mediaId },
      data,
      include: {
        sitePhoto: {
          select: { id: true, imageUrl: true, title: true, category: true, label: true, fileType: true },
        },
      },
    });
    return NextResponse.json({ media });
  } catch (err) {
    console.error("[PATCH /campaigns/:id/media/:mediaId]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; mediaId: string } }
) {
  try {
    await prisma.campaignMedia.delete({ where: { id: params.mediaId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /campaigns/:id/media/:mediaId]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
