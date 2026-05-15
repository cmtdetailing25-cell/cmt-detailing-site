import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const photo = await prisma.sitePhoto.findUnique({ where: { id: params.id } });
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();

  const updated = await prisma.sitePhoto.update({
    where: { id: params.id },
    data: {
      ...(body.socialTitle !== undefined && {
        socialTitle: body.socialTitle || null,
      }),
      ...(body.socialNotes !== undefined && {
        socialNotes: body.socialNotes || null,
      }),
      ...(typeof body.contentScore === "number" && {
        contentScore: Math.max(0, Math.min(10, body.contentScore)),
      }),
      ...(typeof body.qualityScore === "number" && {
        qualityScore: Math.max(0, Math.min(10, body.qualityScore)),
      }),
      ...(typeof body.marketingScore === "number" && {
        marketingScore: Math.max(0, Math.min(10, body.marketingScore)),
      }),
      ...(typeof body.isSocialReady === "boolean" && {
        isSocialReady: body.isSocialReady,
      }),
      ...(typeof body.isReelCandidate === "boolean" && {
        isReelCandidate: body.isReelCandidate,
      }),
      ...(typeof body.isPostCandidate === "boolean" && {
        isPostCandidate: body.isPostCandidate,
      }),
      ...(typeof body.isBeforeAfterCandidate === "boolean" && {
        isBeforeAfterCandidate: body.isBeforeAfterCandidate,
      }),
      ...(typeof body.isFavoriteForSocial === "boolean" && {
        isFavoriteForSocial: body.isFavoriteForSocial,
      }),
      ...(Array.isArray(body.contentTags) && {
        contentTags: body.contentTags.filter(
          (t: unknown) => typeof t === "string"
        ),
      }),
      ...(body.serviceType !== undefined && {
        serviceType: body.serviceType || null,
      }),
      ...(body.visualCategory !== undefined && {
        visualCategory: body.visualCategory || null,
      }),
      ...(body.contentAngle !== undefined && {
        contentAngle: body.contentAngle || null,
      }),
      ...(body.seasonalRelevance !== undefined && {
        seasonalRelevance: body.seasonalRelevance || null,
      }),
      lastReviewedForSocial: new Date(),
    },
  });

  return NextResponse.json(updated);
}
