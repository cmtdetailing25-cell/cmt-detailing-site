import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const photos = await prisma.sitePhoto.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(photos);
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string | null) ?? "";
  const caption = (formData.get("caption") as string | null) ?? undefined;
  const category = (formData.get("category") as string | null) ?? "";
  const label = (formData.get("label") as string | null) ?? undefined;
  const isFeatured = formData.get("isFeatured") === "true";
  const displayOrder = parseInt((formData.get("displayOrder") as string) ?? "0", 10) || 0;

  if (!file || !title || !category) {
    return NextResponse.json({ error: "file, title, and category are required" }, { status: 400 });
  }

  const blob = await put(file.name, file, { access: "public" });

  const photo = await prisma.sitePhoto.create({
    data: {
      title,
      caption: caption || null,
      imageUrl: blob.url,
      category,
      label: label || null,
      isFeatured,
      displayOrder,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}
