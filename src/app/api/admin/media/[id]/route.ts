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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const photo = await prisma.sitePhoto.findUnique({ where: { id: params.id } });
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();

  const updated = await prisma.sitePhoto.update({
    where: { id: params.id },
    data: {
      title:
        typeof body.title === "string" && body.title.trim()
          ? body.title.trim()
          : photo.title,
      caption:
        body.caption !== undefined
          ? (typeof body.caption === "string" && body.caption.trim()) || null
          : photo.caption,
      category:
        typeof body.category === "string" && body.category
          ? body.category
          : photo.category,
      label:
        body.label !== undefined
          ? (typeof body.label === "string" && body.label) || null
          : photo.label,
      isFeatured:
        typeof body.isFeatured === "boolean" ? body.isFeatured : photo.isFeatured,
      displayOrder:
        typeof body.displayOrder === "number"
          ? body.displayOrder
          : photo.displayOrder,
    },
  });

  return NextResponse.json(updated);
}
