import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH: set detailJobId on a batch of SitePhoto records
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { photoIds } = await request.json();

  if (!Array.isArray(photoIds) || photoIds.length === 0) {
    return NextResponse.json({ error: "photoIds array required" }, { status: 400 });
  }

  const result = await prisma.sitePhoto.updateMany({
    where: { id: { in: photoIds } },
    data:  { detailJobId: params.id },
  });

  return NextResponse.json({ updated: result.count });
}
