import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const draft = await prisma.socialContentDraft.findUnique({
    where: { id: params.id },
  });
  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();

  const updated = await prisma.socialContentDraft.update({
    where: { id: params.id },
    data: {
      ...(typeof body.title === "string" && body.title.trim() && {
        title: body.title.trim(),
      }),
      ...(body.caption !== undefined && {
        caption: body.caption || null,
      }),
      ...(body.hashtags !== undefined && {
        hashtags: body.hashtags || null,
      }),
      ...(body.hook !== undefined && {
        hook: body.hook || null,
      }),
      ...(body.notes !== undefined && {
        notes: body.notes || null,
      }),
    },
  });

  return NextResponse.json(updated);
}
