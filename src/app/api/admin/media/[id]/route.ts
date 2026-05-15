import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const photo = await prisma.sitePhoto.findUnique({ where: { id: params.id } });
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await del(photo.imageUrl);
  await prisma.sitePhoto.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
