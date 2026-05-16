import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? fullName.trim();
  const lastName  = parts.slice(1).join(" ") || "";
  return { firstName, lastName };
}

// POST /api/leads/:id/convert — manually convert a historical lead to a Client+Vehicle
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Already linked — just return the client id
    if (lead.clientId) {
      return NextResponse.json({ clientId: lead.clientId, alreadyLinked: true });
    }

    const normalizedEmail = lead.email.trim().toLowerCase();
    const { firstName, lastName } = parseName(lead.fullName);

    // ── Upsert Client ──────────────────────────────────────────────────────────

    let client = await prisma.client.findFirst({ where: { email: normalizedEmail } });

    if (client) {
      const updates: Record<string, string> = {};
      if (!client.phone && lead.phone) updates.phone = lead.phone.trim();
      if (!client.city  && lead.town)  updates.city  = lead.town.trim();

      if (Object.keys(updates).length > 0) {
        client = await prisma.client.update({ where: { id: client.id }, data: updates });
      }
    } else {
      client = await prisma.client.create({
        data: {
          firstName,
          lastName,
          fullName:   lead.fullName.trim(),
          email:      normalizedEmail,
          phone:      lead.phone.trim(),
          city:       lead.town.trim(),
          state:      "MA",
          leadSource: "Booking Form",
          status:     "LEAD",
        },
      });
    }

    // ── Upsert Vehicle ─────────────────────────────────────────────────────────

    const existing = await prisma.vehicle.findFirst({
      where: {
        clientId: client.id,
        year:     lead.vehicleYear.trim(),
        make:     lead.vehicleMake.trim(),
        model:    lead.vehicleModel.trim(),
      },
    });

    if (!existing) {
      const isFirst = (await prisma.vehicle.count({ where: { clientId: client.id } })) === 0;
      await prisma.vehicle.create({
        data: {
          clientId:  client.id,
          year:      lead.vehicleYear.trim(),
          make:      lead.vehicleMake.trim(),
          model:     lead.vehicleModel.trim(),
          isPrimary: isFirst,
        },
      });
    }

    // ── Link lead → client ─────────────────────────────────────────────────────

    await prisma.lead.update({ where: { id: lead.id }, data: { clientId: client.id } });

    return NextResponse.json({ clientId: client.id, alreadyLinked: false });
  } catch (err) {
    console.error("[POST /api/leads/:id/convert]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
