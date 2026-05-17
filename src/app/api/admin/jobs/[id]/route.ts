import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const job = await prisma.detailJob.findUnique({
    where: { id: params.id },
    include: {
      client:  { select: { id: true, fullName: true, phone: true, email: true, isVip: true } },
      vehicle: true,
      photos:  {
        select: {
          id: true, imageUrl: true, title: true, isSocialReady: true,
          isPostCandidate: true, isReelCandidate: true, isBeforeAfterCandidate: true,
          marketingScore: true, qualityScore: true,
        },
      },
      socialDrafts: {
        where: { status: { not: "ARCHIVED" } },
        orderBy: { createdAt: "desc" },
        select: { id: true, type: true, status: true, title: true, generatedAt: true },
      },
    },
  });

  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const {
    clientId, vehicleId, title, serviceType, jobDate,
    scheduledStart, scheduledEnd, scheduleStatus,
    location, description, internalNotes, socialSummary,
    isSocialReady, isFeatured, price,
  } = body;

  const data: Record<string, unknown> = {};
  if (clientId       !== undefined) data.clientId       = clientId       || null;
  if (vehicleId      !== undefined) data.vehicleId      = vehicleId      || null;
  if (title          !== undefined) data.title          = title.trim();
  if (serviceType    !== undefined) data.serviceType    = serviceType?.trim()    || null;
  if (jobDate        !== undefined) data.jobDate        = jobDate ? new Date(jobDate) : null;
  if (scheduledStart !== undefined) data.scheduledStart = scheduledStart ? new Date(scheduledStart) : null;
  if (scheduledEnd   !== undefined) data.scheduledEnd   = scheduledEnd   ? new Date(scheduledEnd)   : null;
  if (scheduleStatus !== undefined) data.scheduleStatus = scheduleStatus || null;
  if (location       !== undefined) data.location       = location?.trim()       || null;
  if (description    !== undefined) data.description    = description?.trim()    || null;
  if (internalNotes  !== undefined) data.internalNotes  = internalNotes?.trim()  || null;
  if (socialSummary  !== undefined) data.socialSummary  = socialSummary?.trim()  || null;
  if (isSocialReady  !== undefined) data.isSocialReady  = isSocialReady  === true;
  if (isFeatured     !== undefined) data.isFeatured     = isFeatured     === true;
  if (price          !== undefined) data.price          = typeof price === "number" ? price : null;

  const job = await prisma.detailJob.update({ where: { id: params.id }, data });
  return NextResponse.json(job);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.detailJob.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
