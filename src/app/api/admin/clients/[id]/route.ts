import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ClientStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      vehicles: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      detailJobs: {
        orderBy: { jobDate: "desc" },
        include: {
          vehicle: { select: { year: true, make: true, model: true, color: true } },
          _count: { select: { photos: true, socialDrafts: true } },
        },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(client);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const {
    firstName,
    lastName,
    email,
    phone,
    city,
    state,
    notes,
    tags,
    leadSource,
    status,
    isVip,
  } = body;

  const data: Record<string, unknown> = {};
  if (firstName !== undefined) data.firstName = firstName.trim();
  if (lastName !== undefined) data.lastName = lastName.trim();
  if (firstName !== undefined || lastName !== undefined) {
    const existing = await prisma.client.findUnique({ where: { id: params.id } });
    if (existing) {
      const fn = (firstName?.trim() ?? existing.firstName);
      const ln = (lastName?.trim() ?? existing.lastName);
      data.fullName = `${fn} ${ln}`;
    }
  }
  if (email !== undefined) data.email = email?.trim() || null;
  if (phone !== undefined) data.phone = phone?.trim() || null;
  if (city !== undefined) data.city = city?.trim() || null;
  if (state !== undefined) data.state = state?.trim() || null;
  if (notes !== undefined) data.notes = notes?.trim() || null;
  if (tags !== undefined) data.tags = Array.isArray(tags) ? tags : [];
  if (leadSource !== undefined) data.leadSource = leadSource?.trim() || null;
  if (status !== undefined) data.status = status as ClientStatus;
  if (isVip !== undefined) data.isVip = isVip === true;

  const client = await prisma.client.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(client);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
