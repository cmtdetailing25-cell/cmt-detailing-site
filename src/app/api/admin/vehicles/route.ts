import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();

  const { clientId, year, make, model, trim, color, plate, vin, nickname, notes, isPrimary } =
    body;

  if (!clientId || !year?.trim() || !make?.trim() || !model?.trim()) {
    return NextResponse.json(
      { error: "clientId, year, make, and model are required" },
      { status: 400 }
    );
  }

  if (isPrimary) {
    await prisma.vehicle.updateMany({
      where: { clientId },
      data: { isPrimary: false },
    });
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      clientId,
      year: year.trim(),
      make: make.trim(),
      model: model.trim(),
      trim: trim?.trim() || null,
      color: color?.trim() || null,
      plate: plate?.trim() || null,
      vin: vin?.trim() || null,
      nickname: nickname?.trim() || null,
      notes: notes?.trim() || null,
      isPrimary: isPrimary === true,
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}
