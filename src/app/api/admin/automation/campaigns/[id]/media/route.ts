import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PHOTO_SELECT = {
  id: true, imageUrl: true, title: true, category: true,
  label: true, fileType: true, width: true, height: true, duration: true,
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const media = await prisma.campaignMedia.findMany({
      where:   { campaignId: params.id },
      include: { sitePhoto: { select: PHOTO_SELECT } },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ media });
  } catch (err) {
    console.error("[GET /api/admin/automation/campaigns/:id/media]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { role = "general" } = body;

    // ── Bulk assignment ───────────────────────────────────────────────────────
    if (Array.isArray(body.sitePhotoIds)) {
      let attached = 0;
      let skipped  = 0;
      for (const sitePhotoId of body.sitePhotoIds as string[]) {
        try {
          await prisma.campaignMedia.upsert({
            where:  { campaignId_sitePhotoId: { campaignId: params.id, sitePhotoId } },
            create: { campaignId: params.id, sitePhotoId, role },
            update: {},
          });
          attached++;
        } catch {
          skipped++;
        }
      }
      return NextResponse.json({ ok: true, attached, skipped });
    }

    // ── Single attachment ─────────────────────────────────────────────────────
    const { sitePhotoId, sortOrder } = body;
    if (!sitePhotoId) {
      return NextResponse.json({ error: "sitePhotoId is required" }, { status: 400 });
    }

    const media = await prisma.campaignMedia.upsert({
      where:  { campaignId_sitePhotoId: { campaignId: params.id, sitePhotoId } },
      create: { campaignId: params.id, sitePhotoId, role, sortOrder: sortOrder ?? 0 },
      update: { role, ...(sortOrder !== undefined ? { sortOrder } : {}) },
      include: { sitePhoto: { select: PHOTO_SELECT } },
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/automation/campaigns/:id/media]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
