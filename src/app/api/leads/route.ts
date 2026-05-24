import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseName(fullName: string): { firstName: string; lastName: string } {
  const parts     = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? fullName.trim();
  const lastName  = parts.slice(1).join(" ") || "";
  return { firstName, lastName };
}

function buildJobSlug(title: string, date: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${date}-${base}`.slice(0, 120);
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
      vehicleCondition,
      notes,
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
    const isNewClient = !(await prisma.client.findFirst({ where: { email: normalizedEmail } }));

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
        vehicleCondition: vehicleCondition ? String(vehicleCondition).trim() : null,
        notes:            notes ? String(notes).trim() : null,
      },
    });

    // ── 2. Upsert Client (match on email) ───────────────────────────────────

    let client = await prisma.client.findFirst({ where: { email: normalizedEmail } });

    if (client) {
      const updates: Record<string, string | boolean> = {};
      if (!client.phone && phone)  updates.phone  = String(phone).trim();
      if (!client.city  && town)   updates.city   = String(town).trim();
      if (client.status === "LEAD") updates.status = "ACTIVE";
      if (Object.keys(updates).length > 0) {
        client = await prisma.client.update({ where: { id: client.id }, data: updates });
      }
    } else {
      client = await prisma.client.create({
        data: {
          firstName,
          lastName,
          fullName:   String(fullName).trim(),
          email:      normalizedEmail,
          phone:      String(phone).trim(),
          city:       String(town).trim(),
          state:      "MA",
          leadSource: "Booking Form",
          status:     "LEAD",
        },
      });
    }

    // ── 3. Upsert Vehicle ───────────────────────────────────────────────────

    const year  = String(vehicleYear).trim();
    const make  = String(vehicleMake).trim();
    const model = String(vehicleModel).trim();

    let vehicle = await prisma.vehicle.findFirst({
      where: { clientId: client.id, year, make, model },
    });

    if (!vehicle) {
      const isFirst = (await prisma.vehicle.count({ where: { clientId: client.id } })) === 0;
      vehicle = await prisma.vehicle.create({
        data: { clientId: client.id, year, make, model, isPrimary: isFirst },
      });
    }

    // ── 4. Link lead → client ───────────────────────────────────────────────

    await prisma.lead.update({ where: { id: lead.id }, data: { clientId: client.id } });

    // ── 5. Create DetailJob (unscheduled intake job) ────────────────────────

    const jobTitle    = `${serviceRequested} — ${year} ${make} ${model}`;
    const dateStr     = preferredDate || new Date().toISOString().slice(0, 10);
    const slug        = buildJobSlug(jobTitle, dateStr);
    const description = [
      `Requested: ${preferredDate} at ${preferredTime}`,
      `Town: ${town}`,
      vehicleCondition ? `Condition: ${vehicleCondition}` : null,
      notes ? `Notes: ${notes}` : null,
    ].filter(Boolean).join("\n");

    // Parse preferredDate as jobDate for calendar display
    let jobDate: Date | null = null;
    try { jobDate = new Date(preferredDate); if (isNaN(jobDate.getTime())) jobDate = null; } catch { jobDate = null; }

    const detailJob = await prisma.detailJob.create({
      data: {
        clientId:      client.id,
        vehicleId:     vehicle.id,
        leadId:        lead.id,
        title:         jobTitle,
        slug,
        serviceType:   String(serviceRequested).trim(),
        jobDate,
        scheduleStatus: "PENDING_REVIEW",
        location:      String(town).trim(),
        description,
        internalNotes: `Booking request — Lead ID: ${lead.id}`,
      },
    });

    // ── 6. Create AdminNotifications ────────────────────────────────────────

    await prisma.adminNotification.createMany({
      data: [
        {
          type:             "NEW_BOOKING",
          title:            "New Booking Request",
          message:          `${String(fullName).trim()} requested ${String(serviceRequested).trim()} — ${year} ${make} ${model} on ${preferredDate}`,
          actionUrl:        "/admin/bookings",
          relatedBookingId: lead.id,
          relatedClientId:  client.id,
          relatedJobId:     detailJob.id,
        },
        {
          type:             "PENDING_REVIEW",
          title:            "Request Awaiting Review",
          message:          `${jobTitle} — preferred ${preferredDate} at ${preferredTime}. Review and schedule when ready.`,
          actionUrl:        "/admin/bookings",
          relatedBookingId: lead.id,
          relatedClientId:  client.id,
          relatedJobId:     detailJob.id,
        },
        ...(isNewClient ? [{
          type:            "NEW_CLIENT",
          title:           "New Client Added",
          message:         `${String(fullName).trim()} (${normalizedEmail}) joined as a new client from their booking request.`,
          actionUrl:       `/admin/clients/${client.id}`,
          relatedClientId: client.id,
          relatedJobId:    detailJob.id,
        }] : []),
      ],
    });

    // ── 7. SMS notification ─────────────────────────────────────────────────

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cmt-detailing.vercel.app";
    const smsBody = [
      `New booking request — CMT Detailing`,
      `${String(fullName).trim()} · ${String(phone).trim()}`,
      `${String(serviceRequested).trim()} · ${year} ${make} ${model}`,
      `${String(preferredDate).trim()} at ${String(preferredTime).trim()} · ${String(town).trim()}`,
      notes ? `Note: ${String(notes).trim().slice(0, 80)}` : null,
      `${appUrl}/admin/bookings`,
    ].filter(Boolean).join("\n");

    sendSms(smsBody).catch(() => {}); // fire-and-forget — never block the response

    return NextResponse.json({ lead, clientId: client.id, jobId: detailJob.id }, { status: 201 });

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
