import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/bookings/[id]
// Actions: "review" | "decline" | "schedule"
// id = Lead.id

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { action, scheduledStart, scheduledEnd, jobDate, scheduleNotes } = body;

    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: { detailJobs: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!lead) {
      return NextResponse.json({ error: "Booking request not found" }, { status: 404 });
    }

    const job = lead.detailJobs[0] ?? null;

    if (action === "review") {
      // Mark as reviewed — move job to NEEDS_SCHEDULING
      await Promise.all([
        prisma.lead.update({ where: { id: lead.id }, data: { status: "CONTACTED" } }),
        job
          ? prisma.detailJob.update({
              where: { id: job.id },
              data: { scheduleStatus: "NEEDS_SCHEDULING" },
            })
          : Promise.resolve(),
      ]);

      return NextResponse.json({ ok: true, action: "review" });
    }

    if (action === "decline") {
      await Promise.all([
        prisma.lead.update({ where: { id: lead.id }, data: { status: "LOST" } }),
        job
          ? prisma.detailJob.update({
              where: { id: job.id },
              data: { scheduleStatus: "CANCELLED" },
            })
          : Promise.resolve(),
      ]);

      return NextResponse.json({ ok: true, action: "decline" });
    }

    if (action === "schedule") {
      if (!scheduledStart) {
        return NextResponse.json({ error: "scheduledStart is required" }, { status: 400 });
      }

      const startDt = new Date(scheduledStart);
      const endDt   = scheduledEnd ? new Date(scheduledEnd) : null;
      const dateDt  = jobDate      ? new Date(jobDate)      : startDt;

      const [updatedJob] = await Promise.all([
        job
          ? prisma.detailJob.update({
              where: { id: job.id },
              data: {
                scheduleStatus: "SCHEDULED",
                scheduledStart:  startDt,
                scheduledEnd:    endDt,
                jobDate:         dateDt,
                ...(scheduleNotes
                  ? { internalNotes: `Scheduled — ${scheduleNotes}` }
                  : {}),
              },
            })
          : Promise.resolve(null),
        prisma.lead.update({ where: { id: lead.id }, data: { status: "BOOKED" } }),
        // Create scheduling notification
        prisma.adminNotification.create({
          data: {
            type:             "JOB_SCHEDULED",
            title:            "Job Scheduled",
            message:          `${job?.title ?? "Job"} scheduled for ${startDt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}${endDt ? " · " + endDt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : ""}`,
            actionUrl:        job ? `/admin/jobs/${job.id}` : "/admin/jobs",
            relatedBookingId: lead.id,
            relatedClientId:  lead.clientId ?? undefined,
            relatedJobId:     job?.id ?? undefined,
          },
        }),
      ]);

      return NextResponse.json({ ok: true, action: "schedule", job: updatedJob });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[PATCH /api/admin/bookings/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
