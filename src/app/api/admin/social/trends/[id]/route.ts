import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { TrendCategory, TrendType } from "@prisma/client";

const VALID_CATEGORIES: TrendCategory[] = [
  "MOBILE_DETAILING", "CERAMIC_COATING", "PAINT_CORRECTION",
  "INTERIOR_DETAILING", "EXTERIOR_DETAILING", "BEFORE_AFTER_TRANSFORMATIONS",
  "SEASONAL_PROTECTION", "CUSTOMER_EDUCATION", "LUXURY_CAR_CARE", "LOCAL_BUSINESS_MARKETING",
];

const VALID_TYPES: TrendType[] = [
  "HASHTAG", "CONTENT_FORMAT", "CAPTION_STYLE", "REEL_STRUCTURE",
  "AUDIO_IDEA", "SEASONAL_TOPIC", "LOCAL_TREND", "COMPETITOR_INSPIRATION",
];

// PATCH /api/admin/social/trends/:id — update fields or archive (isActive: false)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.trendInsight.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const clamp = (v: unknown, min = 0, max = 10) =>
      typeof v === "number" ? Math.max(min, Math.min(max, Math.round(v))) : undefined;

    const data: Record<string, unknown> = {};

    if (typeof body.title              === "string") data.title              = body.title.trim();
    if (typeof body.platform           === "string") data.platform           = body.platform.trim();
    if (typeof body.source             === "string") data.source             = body.source.trim() || null;
    if (typeof body.summary            === "string") data.summary            = body.summary.trim() || null;
    if (typeof body.suggestedUse       === "string") data.suggestedUse       = body.suggestedUse.trim() || null;
    if (typeof body.exampleHook        === "string") data.exampleHook        = body.exampleHook.trim() || null;
    if (typeof body.exampleCaptionAngle === "string") data.exampleCaptionAngle = body.exampleCaptionAngle.trim() || null;
    if (typeof body.hashtags           === "string") data.hashtags           = body.hashtags.trim() || null;
    if (typeof body.isActive           === "boolean") data.isActive          = body.isActive;
    if (body.expiresAt === null)                     data.expiresAt          = null;
    if (typeof body.expiresAt          === "string") data.expiresAt          = new Date(body.expiresAt);

    if (VALID_CATEGORIES.includes(body.category))  data.category  = body.category as TrendCategory;
    if (VALID_TYPES.includes(body.trendType))       data.trendType = body.trendType as TrendType;

    const cs = clamp(body.confidenceScore);
    const ps = clamp(body.popularityScore);
    if (cs !== undefined) data.confidenceScore = cs;
    if (ps !== undefined) data.popularityScore = ps;

    const trend = await prisma.trendInsight.update({ where: { id: params.id }, data });
    return NextResponse.json({ trend });
  } catch (err) {
    console.error("[PATCH /api/admin/social/trends/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/social/trends/:id — hard delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.trendInsight.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.trendInsight.delete({ where: { id: params.id } });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/admin/social/trends/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
