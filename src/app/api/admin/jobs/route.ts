import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId   = searchParams.get("clientId")   || undefined;
  const vehicleId  = searchParams.get("vehicleId")  || undefined;
  const socialOnly = searchParams.get("socialOnly") === "true";

  const jobs = await prisma.detailJob.findMany({
    where: {
      ...(clientId  && { clientId }),
      ...(vehicleId && { vehicleId }),
      ...(socialOnly && { isSocialReady: true }),
    },
    orderBy: { jobDate: "desc" },
    include: {
      client:  { select: { id: true, fullName: true, isVip: true } },
      vehicle: { select: { id: true, year: true, make: true, model: true, color: true } },
      _count:  { select: { photos: true, socialDrafts: true } },
    },
  });
  return NextResponse.json(jobs);
}

export async function POST(request: Request) {
  const body = await request.json();

  const {
    clientId,
    vehicleId,
    title,
    serviceType,
    jobDate,
    location,
    description,
    internalNotes,
    socialSummary,
    isSocialReady,
    isFeatured,
  } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // Auto-generate slug from title + date
  const dateStr  = jobDate ? new Date(jobDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const baseSlug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const slug     = `${dateStr}-${baseSlug}`;

  const job = await prisma.detailJob.create({
    data: {
      clientId:      clientId  || null,
      vehicleId:     vehicleId || null,
      title:         title.trim(),
      slug,
      serviceType:   serviceType?.trim()   || null,
      jobDate:       jobDate ? new Date(jobDate) : null,
      location:      location?.trim()      || null,
      description:   description?.trim()   || null,
      internalNotes: internalNotes?.trim() || null,
      socialSummary: socialSummary?.trim() || null,
      isSocialReady: isSocialReady === true,
      isFeatured:    isFeatured    === true,
    },
    include: {
      client:  { select: { id: true, fullName: true } },
      vehicle: { select: { id: true, year: true, make: true, model: true, color: true } },
    },
  });

  return NextResponse.json(job, { status: 201 });
}
