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

// GET /api/admin/social/trends — list insights, active-only by default
export async function GET(req: NextRequest) {
  const activeOnly = req.nextUrl.searchParams.get("activeOnly") !== "false";
  try {
    const trends = await prisma.trendInsight.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ confidenceScore: "desc" }, { popularityScore: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ trends });
  } catch (err) {
    console.error("[GET /api/admin/social/trends]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/social/trends — create a new TrendInsight
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      title, platform, source, category, trendType,
      summary, suggestedUse, exampleHook, exampleCaptionAngle,
      hashtags, confidenceScore, popularityScore, expiresAt,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!platform?.trim()) {
      return NextResponse.json({ error: "platform is required" }, { status: 400 });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (!VALID_TYPES.includes(trendType)) {
      return NextResponse.json({ error: "Invalid trendType" }, { status: 400 });
    }

    const clamp = (v: unknown, min = 0, max = 10) =>
      typeof v === "number" ? Math.max(min, Math.min(max, Math.round(v))) : 5;

    const trend = await prisma.trendInsight.create({
      data: {
        title:              String(title).trim(),
        platform:           String(platform).trim(),
        source:             source?.trim() || null,
        category:           category as TrendCategory,
        trendType:          trendType as TrendType,
        summary:            summary?.trim() || null,
        suggestedUse:       suggestedUse?.trim() || null,
        exampleHook:        exampleHook?.trim() || null,
        exampleCaptionAngle: exampleCaptionAngle?.trim() || null,
        hashtags:           hashtags?.trim() || null,
        confidenceScore:    clamp(confidenceScore),
        popularityScore:    clamp(popularityScore),
        expiresAt:          expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ trend }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/social/trends]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
