import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const draft = await prisma.socialContentDraft.findUnique({
    where: { id: params.id },
  });
  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.socialContentDraft.update({
    where: { id: params.id },
    data: { status: "ARCHIVED" },
  });

  return NextResponse.json(updated);
}
