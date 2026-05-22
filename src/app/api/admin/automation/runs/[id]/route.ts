import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/admin/automation/runs/[id]
// Body: { action: "complete" | "cancel" }

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action } = await req.json();

    if (action !== "complete" && action !== "cancel") {
      return NextResponse.json({ error: 'action must be "complete" or "cancel"' }, { status: 400 });
    }

    const run = await prisma.automationWorkflowRun.findUnique({ where: { id: params.id } });
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

    const updated = await prisma.automationWorkflowRun.update({
      where: { id: params.id },
      data: {
        status:       action === "complete" ? "COMPLETED" : "FAILED",
        completedAt:  new Date(),
        errorMessage: action === "cancel" ? "Manually cancelled by admin" : null,
      },
    });

    return NextResponse.json({ ok: true, run: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/automation/runs/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
