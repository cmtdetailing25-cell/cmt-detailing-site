import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ClientStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { vehicles: true, detailJobs: true } },
      vehicles: { where: { isPrimary: true }, take: 1 },
      detailJobs: {
        orderBy: { jobDate: "desc" },
        take: 1,
        select: { jobDate: true, serviceType: true, title: true },
      },
    },
  });
  return NextResponse.json(clients);
}

export async function POST(request: Request) {
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

  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json(
      { error: "firstName and lastName are required" },
      { status: 400 }
    );
  }

  const fullName = `${firstName.trim()} ${lastName.trim()}`;

  const client = await prisma.client.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      notes: notes?.trim() || null,
      tags: Array.isArray(tags) ? tags : [],
      leadSource: leadSource?.trim() || null,
      status: (status as ClientStatus) || "LEAD",
      isVip: isVip === true,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
