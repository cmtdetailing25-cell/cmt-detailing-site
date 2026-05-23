import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerWorkflow } from "@/lib/automation/triggerWorkflow";
import { getCallbackBaseUrl } from "@/lib/automation";

// POST /api/admin/automation/campaigns/[id]/approve
// Body: { stage: "strategy" | "creative" | "video" | "archive" | "complete" }
//
// creative: CREATIVE_PENDING_APPROVAL → VIDEO_RENDER_PENDING + auto-trigger Remotion
// video:    VIDEO_READY_REVIEW → APPROVED_TO_PUBLISH

export const dynamic = "force-dynamic";

const STAGE_TRANSITIONS: Record<string, { from: string[]; to: string }> = {
  strategy:  { from: ["STRATEGY_PENDING_APPROVAL"],    to: "CREATIVE_PENDING"    },
  creative:  { from: ["CREATIVE_PENDING_APPROVAL"],    to: "VIDEO_RENDER_PENDING" },
  video:     { from: ["VIDEO_READY_REVIEW"],            to: "APPROVED_TO_PUBLISH"  },
  archive:   { from: ["IDEA", "TREND_REVIEW", "STRATEGY_PENDING_APPROVAL", "CREATIVE_PENDING",
                       "CREATIVE_PENDING_APPROVAL", "VIDEO_RENDER_PENDING", "VIDEO_READY_REVIEW",
                       "APPROVED_TO_PUBLISH", "FAILED"], to: "ARCHIVED" },
  complete:  { from: ["PUBLISHED", "ACTIVE_AD"],        to: "COMPLETED"            },
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { stage } = await req.json();
    const transition = STAGE_TRANSITIONS[stage];
    if (!transition) {
      return NextResponse.json({ error: "Invalid approval stage" }, { status: 400 });
    }

    const campaign = await prisma.marketingCampaign.findUnique({ where: { id: params.id } });
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!transition.from.includes(campaign.status)) {
      return NextResponse.json(
        { error: `Campaign in status ${campaign.status} cannot be approved at stage "${stage}"` },
        { status: 409 }
      );
    }

    // ── Standard status transition ─────────────────────────────────────────
    const updated = await prisma.marketingCampaign.update({
      where: { id: params.id },
      data:  { status: transition.to as never },
    });

    await prisma.adminNotification.create({
      data: {
        type:      "CAMPAIGN_APPROVED",
        title:     "Campaign Approved",
        message:   `"${campaign.title}" approved at ${stage} stage → ${transition.to.replace(/_/g, " ")}`,
        actionUrl: "/admin/automation",
      },
    });

    // ── Creative approval: auto-trigger Remotion render ────────────────────
    // Campaign is now VIDEO_RENDER_PENDING. Kick off the Remotion workflow so
    // the admin doesn't need a second click. If automation isn't configured the
    // campaign stays at VIDEO_RENDER_PENDING and the card shows a "Render Video"
    // button as a manual fallback.
    let renderTriggered = false;
    let renderError: string | null = null;

    if (stage === "creative") {
      try {
        const callbackBase = getCallbackBaseUrl();
        const renderRes = await triggerWorkflow({
          campaignId:   params.id,
          workflowType: "REMOTION_VIDEO_CREATION",
          webhookUrlKey: "remotionWorkflowWebhookUrl",
          // newCampaignStatus intentionally omitted — already set to VIDEO_RENDER_PENDING above
          buildPayload: (c, base) => {
            const media = (c.campaignMedia ?? []).map((cm) => ({
              id:       cm.sitePhoto.id,
              url:      cm.sitePhoto.imageUrl,
              type:     cm.sitePhoto.fileType ?? "image",
              role:     cm.role,
              filename: cm.sitePhoto.title,
              width:    cm.sitePhoto.width    ?? null,
              height:   cm.sitePhoto.height   ?? null,
              duration: cm.sitePhoto.duration ?? null,
            }));
            return {
              campaignId:           c.id,
              campaignTitle:        c.title,
              videoType:            c.type === "REEL" ? "REEL" : "VIDEO_AD",
              format:               "9:16",
              durationSeconds:      15,
              isTestRender:         media.length === 0,
              brand:                "CMT Detailing",
              style:                "premium automotive, dark cinematic, clean luxury",
              approvedStrategy:     c.approvedStrategy      ?? c.campaignBrief ?? "",
              approvedCaption:      c.approvedCaption       ?? "",
              approvedHashtags:     c.approvedHashtags      ?? "",
              approvedCreativeNotes:c.approvedCreativeNotes ?? "",
              cta:                  c.goal     ?? "Book your detail today",
              platform:             c.platform ?? "Instagram",
              media,
              reelStructure: {
                hook:    media.filter((m) => m.role === "general").slice(0, 1),
                before:  media.filter((m) => m.role === "before"),
                process: media.filter((m) => m.role === "process"),
                after:   media.filter((m) => m.role === "after" || m.role === "reveal"),
                logo:    media.filter((m) => m.role === "logo"),
              },
              outputCallbackUrl: `${base}/api/automation/callback/remotion-video`,
            };
          },
        });
        // triggerWorkflow returns NextResponse; treat any 2xx as success
        renderTriggered = renderRes.status < 400;
        if (!renderTriggered) {
          const resBody = await renderRes.json().catch(() => ({}));
          renderError   = (resBody as { error?: string }).error ?? `HTTP ${renderRes.status}`;
          console.warn("[approve/creative] Remotion auto-trigger failed:", renderError);
        }
        // Suppress the unused variable — getCallbackBaseUrl is only used via triggerWorkflow's buildPayload
        void callbackBase;
      } catch (e) {
        renderError = e instanceof Error ? e.message : String(e);
        console.error("[approve/creative] Remotion auto-trigger threw:", renderError);
      }
    }

    return NextResponse.json({
      campaign: updated,
      ...(stage === "creative" && { renderTriggered, renderError }),
    });
  } catch (err) {
    console.error("[POST /api/admin/automation/campaigns/:id/approve]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
