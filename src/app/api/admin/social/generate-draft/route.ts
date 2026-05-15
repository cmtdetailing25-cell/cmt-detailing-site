import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateDraftContent,
  type ContentType,
  type ContentAngle,
  type CtaStyle,
} from "@/lib/social/generateDraftContent";

export async function POST(request: Request) {
  let body: {
    mediaIds?: unknown;
    contentType?: unknown;
    contentAngle?: unknown;
    ctaStyle?: unknown;
    notes?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { mediaIds, contentType, contentAngle, ctaStyle, notes } = body;

  if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
    return NextResponse.json(
      { error: "Select at least one photo" },
      { status: 400 }
    );
  }

  if (
    typeof contentType !== "string" ||
    typeof contentAngle !== "string" ||
    typeof ctaStyle !== "string"
  ) {
    return NextResponse.json(
      { error: "contentType, contentAngle, and ctaStyle are required" },
      { status: 400 }
    );
  }

  const [photos, settings] = await Promise.all([
    prisma.sitePhoto.findMany({
      where: { id: { in: mediaIds as string[] } },
      select: { id: true, serviceType: true, title: true },
    }),
    prisma.socialAgentSettings.findFirst(),
  ]);

  const generated = generateDraftContent({
    contentType: contentType as ContentType,
    contentAngle: contentAngle as ContentAngle,
    ctaStyle: ctaStyle as CtaStyle,
    notes: typeof notes === "string" ? notes : undefined,
    mediaCount: photos.length,
    serviceTypes: photos.map((p) => p.serviceType).filter(Boolean) as string[],
    settings,
  });

  const status =
    settings?.approvalRequired !== false ? "NEEDS_APPROVAL" : "DRAFT";

  const draft = await prisma.socialContentDraft.create({
    data: {
      type: contentType as ContentType,
      status,
      source: "MANUAL",
      title: generated.title,
      caption: generated.caption,
      hashtags: generated.hashtags,
      hook: generated.hook,
      notes: generated.notes,
      generatedAt: new Date(),
      media: {
        create: (mediaIds as string[]).map((id, idx) => ({
          sitePhotoId: id,
          sortOrder: idx,
        })),
      },
    },
    include: {
      media: {
        orderBy: { sortOrder: "asc" },
        include: {
          sitePhoto: { select: { imageUrl: true, title: true } },
        },
      },
    },
  });

  return NextResponse.json(draft, { status: 201 });
}
