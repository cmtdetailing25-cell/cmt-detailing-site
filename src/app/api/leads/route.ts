import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/leads — called by the booking form
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

    // Basic required-field check
    const required = [
      fullName, phone, email,
      vehicleYear, vehicleMake, vehicleModel,
      serviceRequested, town, preferredDate, preferredTime,
    ];
    if (required.some((v) => !v || String(v).trim() === "")) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        fullName: String(fullName).trim(),
        phone: String(phone).trim(),
        email: String(email).trim().toLowerCase(),
        vehicleYear: String(vehicleYear).trim(),
        vehicleMake: String(vehicleMake).trim(),
        vehicleModel: String(vehicleModel).trim(),
        serviceRequested: String(serviceRequested).trim(),
        town: String(town).trim(),
        preferredDate: String(preferredDate).trim(),
        preferredTime: String(preferredTime).trim(),
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/leads]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/leads — used by admin pages
export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ leads });
  } catch (err) {
    console.error("[GET /api/leads]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
