import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? fullName.trim();
  const lastName  = parts.slice(1).join(" ") || "";
  return { firstName, lastName };
}

// ─── POST /api/leads ── called by the public booking form ────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      fullName,
      phone,
      email,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      serviceRequested,
      town,
      preferredDate,
      preferredTime,
    } = body;

    const required = [
      fullName, phone, email,
      vehicleYear, vehicleMake, vehicleModel,
      serviceRequested, town, preferredDate, preferredTime,
    ];
    if (required.some((v) => !v || String(v).trim() === "")) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const { firstName, lastName } = parseName(String(fullName));

    // ── 1. Create the Lead ──────────────────────────────────────────────────

    const lead = await prisma.lead.create({
      data: {
        fullName:         String(fullName).trim(),
        phone:            String(phone).trim(),
        email:            normalizedEmail,
        vehicleYear:      String(vehicleYear).trim(),
        vehicleMake:      String(vehicleMake).trim(),
        vehicleModel:     String(vehicleModel).trim(),
        serviceRequested: String(serviceRequested).trim(),
        town:             String(town).trim(),
        preferredDate:    String(preferredDate).trim(),
        preferredTime:    String(preferredTime).trim(),
      },
    });

    // ── 2. Upsert Client (match on email) ───────────────────────────────────

    let client = await prisma.client.findFirst({
      where: { email: normalizedEmail },
    });

    if (client) {
      // Existing client — fill in any blanks but don't overwrite existing data
      const updates: Record<string, string | boolean> = {};
      if (!client.phone    && phone)    updates.phone    = String(phone).trim();
      if (!client.city     && town)     updates.city     = String(town).trim();
      // Move from LEAD → ACTIVE only if they were still a lead
      if (client.status === "LEAD")     updates.status   = "ACTIVE";

      if (Object.keys(updates).length > 0) {
        client = await prisma.client.update({ where: { id: client.id }, data: updates });
      }
    } else {
      // New client — create from lead data
      client = await prisma.client.create({
        data: {
          firstName,
          lastName,
          fullName:    String(fullName).trim(),
          email:       normalizedEmail,
          phone:       String(phone).trim(),
          city:        String(town).trim(),
          state:       "MA",
          leadSource:  "Booking Form",
          status:      "LEAD",
        },
      });
    }

    // ── 3. Upsert Vehicle on this client ────────────────────────────────────

    const year  = String(vehicleYear).trim();
    const make  = String(vehicleMake).trim();
    const model = String(vehicleModel).trim();

    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        clientId: client.id,
        year,
        make,
        model,
      },
    });

    if (!existingVehicle) {
      const isFirst = (await prisma.vehicle.count({ where: { clientId: client.id } })) === 0;
      await prisma.vehicle.create({
        data: {
          clientId:  client.id,
          year,
          make,
          model,
          isPrimary: isFirst,
        },
      });
    }

    // ── 4. Link lead → client ───────────────────────────────────────────────

    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data:  { clientId: client.id },
    });

    return NextResponse.json({ lead: updatedLead, clientId: client.id }, { status: 201 });

  } catch (err) {
    console.error("[POST /api/leads]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── GET /api/leads ── used by admin ─────────────────────────────────────────

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, fullName: true, status: true, isVip: true } },
      },
    });
    return NextResponse.json({ leads });
  } catch (err) {
    console.error("[GET /api/leads]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
