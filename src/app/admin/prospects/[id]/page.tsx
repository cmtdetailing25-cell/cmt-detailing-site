import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ProspectStatus } from "@prisma/client";
import StatusSelect from "../StatusSelect";

export const dynamic = "force-dynamic";

const STATUS_META: Record<ProspectStatus, { label: string; cls: string }> = {
  STAGED:     { label: "Staged",      cls: "bg-yellow-900/40 text-yellow-400" },
  SENT:       { label: "Sent",        cls: "bg-blue-900/40 text-blue-400" },
  REPLIED:    { label: "Replied",     cls: "bg-purple-900/40 text-purple-400" },
  BOOKED:     { label: "Booked",      cls: "bg-green-900/40 text-green-400" },
  NO_RESPONSE:{ label: "No response", cls: "bg-gray-800 text-gray-500" },
  EXCLUDED:   { label: "Excluded",    cls: "bg-red-900/40 text-red-400" },
  WATCHLIST:  { label: "Watchlist",   cls: "bg-gray-800 text-gray-400" },
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-gray-500 mb-1">{label}</p>
      <p className="text-white text-sm">{children}</p>
    </div>
  );
}

export default async function ProspectDetailPage({ params }: { params: { id: string } }) {
  const p = await prisma.prospect.findUnique({ where: { id: params.id } });
  if (!p) notFound();

  const doNotSend = p.notes.includes("DO NOT SEND");
  const tierOffer =
    p.tier === "A"
      ? "Free Full Detail ($250–350 value), ~3 hrs at their driveway"
      : p.tier === "B"
        ? "Free Exterior Detail ($100–180) or 50% off a Full Detail"
        : p.tier === "C"
          ? "15% tracked mention code only — no freebie"
          : "No tier offer";

  return (
    <div className="p-6 max-w-4xl">
      <Link href="/admin/prospects" className="text-gray-500 hover:text-gray-300 text-sm">
        ← All prospects
      </Link>

      <div className="flex items-baseline gap-3 flex-wrap mt-3 mb-1">
        <h1 className="text-white font-bold text-xl">{p.handle}</h1>
        {p.tier && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-600/20 text-red-400">
            Tier {p.tier}
            {p.isProvisional ? " (provisional)" : ""}
          </span>
        )}
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${STATUS_META[p.status].cls}`}>
          {STATUS_META[p.status].label}
        </span>
      </div>
      <p className="text-gray-500 text-sm mb-5">
        {p.category} · {p.town ?? "No town on file"} · Added{" "}
        {p.dateAdded.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>

      {doNotSend && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 mb-5">
          <p className="text-red-300 text-sm font-semibold">Do not send yet — brand-safety call pending.</p>
          <p className="text-red-400/80 text-xs mt-0.5">
            Luca / Cameron must clear this prospect before any DM goes out.
          </p>
        </div>
      )}

      <div className="bg-[#1a2028] border border-[#2d3840] rounded-xl p-5 mb-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Followers">{p.followers ?? "—"}</Field>
          <Field label="Local audience (est.)">{p.localPctEst ?? "—"}</Field>
          <Field label="Mention code">
            {p.mentionCode ? <span className="font-mono text-xs">{p.mentionCode}</span> : "—"}
          </Field>
          <Field label="Offer">{tierOffer}</Field>
          <Field label="DM draft status">{p.dmDraftStatus ?? "—"}</Field>
          <Field label="Added">
            {p.dateAdded.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Notes">{p.notes}</Field>
        </div>
        <div className="mt-5 pt-4 border-t border-[#2d3840]">
          <StatusSelect id={p.id} current={p.status} />
        </div>
      </div>

      <div className="bg-[#1a2028] border border-[#2d3840] rounded-xl p-5">
        <h2 className="text-white font-semibold text-base mb-1">DM draft</h2>
        <p className="text-gray-500 text-xs mb-3">
          Staged draft for Cameron to send from @cmt_detailing. Fulfilled at the May 1, 2027 restart.
        </p>
        {p.dmDraft ? (
          <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{p.dmDraft}</p>
        ) : (
          <p className="text-gray-500 text-sm">
            No full DM draft — Tier C code-only prospect. Suggested opener: “Hey [name] — Cameron from
            CMT Detailing in Taunton. Loved your [specific post]. I&apos;m building a list of local car
            people for the summer — happy to give your followers 15% off a detail with code{" "}
            <span className="font-mono text-xs text-gray-300">{p.mentionCode}</span> (mention it when
            they book). If it brings bookings in, I&apos;ll upgrade you to a free detail — fair?”
          </p>
        )}
      </div>
    </div>
  );
}
