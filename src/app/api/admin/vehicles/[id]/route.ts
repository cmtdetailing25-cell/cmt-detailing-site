import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { year, make, model, trim, color, plate, vin, nickname, notes, isPrimary } = body;

  const vehicle = await prisma.vehicle.findUnique({ where: { id: params.id } });
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isPrimary === true) {
    await prisma.vehicle.updateMany({
      where: { clientId: vehicle.clientId },
      data: { isPrimary: false },
    });
  }

  const data: Record<string, unknown> = {};
  if (year !== undefined) data.year = year.trim();
  if (make !== undefined) data.make = make.trim();
  if (model !== undefined) data.model = model.trim();
  if (trim !== undefined) data.trim = trim?.trim() || null;
  if (color !== undefined) data.color = color?.trim() || null;
  if (plate !== undefined) data.plate = plate?.trim() || null;
  if (vin !== undefined) data.vin = vin?.trim() || null;
  if (nickname !== undefined) data.nickname = nickname?.trim() || null;
  if (notes !== undefined) data.notes = notes?.trim() || null;
  if (isPrimary !== undefined) data.isPrimary = isPrimary === true;

  const updated = await prisma.vehicle.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.vehicle.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
