import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ProspectStatus } from "@prisma/client";

const VALID_STATUSES: ProspectStatus[] = [
  "STAGED",
  "SENT",
  "REPLIED",
  "BOOKED",
  "NO_RESPONSE",
  "EXCLUDED",
  "WATCHLIST",
];

// Status updates only. No send, no post, no DM functionality — Cameron sends all
// DMs himself from @cmt_detailing. Auth is enforced by middleware (/api/admin/*
// returns 401 JSON when the admin HMAC cookie is missing or invalid).
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  const status = body?.status;

  if (typeof status !== "string" || !VALID_STATUSES.includes(status as ProspectStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const prospect = await prisma.prospect.findUnique({ where: { id: params.id } });
  if (!prospect) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const updated = await prisma.prospect.update({
    where: { id: params.id },
    data: { status: status as ProspectStatus },
  });

  return NextResponse.json(updated);
}
