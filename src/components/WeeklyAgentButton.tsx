"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Response shapes ──────────────────────────────────────────────────────────

interface PreviewData {
  preview: true;
  estimatedPosts: number;
  estimatedReels: number;
  availableMedia: number;
  socialReadyMedia: number;
  postTarget: number;
  reelTarget: number;
  weekStart: string;
  weekEnd: string;
}

interface RunData {
  success: true;
  runId: string;
  postsCreated: number;
  reelsCreated: number;
  mediaUsed: number;
  weekStart: string;
  weekEnd: string;
}

type Phase =
  | "idle"
  | "previewing"
  | "confirming"
  | "running"
  | "done"
  | "error";

// ─── Dot spinner ─────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-bounce"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WeeklyAgentButton() {
  const router = useRouter();
  const [phase, setPhase]           = useState<Phase>("idle");
  const [preview, setPreview]       = useState<PreviewData | null>(null);
  const [runData, setRunData]       = useState<RunData | null>(null);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [weekConflict, setWeekConflict] = useState(false);

  // Step 1: fetch preview (media count / estimates) before committing to a run
  async function handlePreview() {
    setPhase("previewing");
    try {
      const res = await fetch("/api/admin/social/run-weekly-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview: true }),
      });
      const data = await res.json();
      setPreview(data as PreviewData);
      setPhase("confirming");
    } catch {
      setErrorMsg("Failed to check media. Please try again.");
      setPhase("error");
    }
  }

  // Step 2: actually execute the run
  async function handleRun(force = false) {
    setPhase("running");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/social/run-weekly-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();

      if (res.status === 409 && data.weekConflict) {
        setWeekConflict(true);
        setErrorMsg("A completed run already exists for this week.");
        setPhase("error");
        return;
      }
      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? "Agent run failed.");
        setPhase("error");
        return;
      }
      setRunData(data as RunData);
      setPhase("done");
      router.refresh();
    } catch {
      setErrorMsg("Network error. Please try again.");
      setPhase("error");
    }
  }

  function reset() {
    setPhase("idle");
    setPreview(null);
    setRunData(null);
    setErrorMsg(null);
    setWeekConflict(false);
  }

  // ── Done ──────────────────────────────────────────────────────────────────

  if (phase === "done" && runData) {
    const total = runData.postsCreated + runData.reelsCreated;
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 bg-green-900/20 border border-green-800/40 rounded-xl px-5 py-4 max-w-lg">
          <div className="w-2 h-2 rounded-full bg-green-400 shrink-0 mt-1.5" />
          <div>
            <p className="text-sm font-semibold text-green-400 mb-1">
              Agent run complete
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Generated{" "}
              <span className="text-white font-medium">
                {runData.postsCreated} post{runData.postsCreated !== 1 ? "s" : ""}
              </span>{" "}
              and{" "}
              <span className="text-white font-medium">
                {runData.reelsCreated} reel{runData.reelsCreated !== 1 ? "s" : ""}
              </span>{" "}
              using {runData.mediaUsed} photo{runData.mediaUsed !== 1 ? "s" : ""}.{" "}
              {total > 0 && (
                <>
                  All {total} draft{total !== 1 ? "s" : ""} are waiting for your approval below.
                </>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={reset}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          Run again
        </button>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (phase === "error") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 bg-red-900/20 border border-red-800/40 rounded-xl px-5 py-4 max-w-lg">
          <div className="w-2 h-2 rounded-full bg-red-400 shrink-0 mt-1.5" />
          <div>
            <p className="text-sm font-semibold text-red-400 mb-1">
              {weekConflict ? "Run already exists for this week" : "Agent run failed"}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Dismiss
          </button>
          {weekConflict && (
            <button
              onClick={() => {
                setWeekConflict(false);
                setErrorMsg(null);
                handleRun(true);
              }}
              className="text-xs text-[#94b2b6] hover:text-white transition-colors"
            >
              Override and run again this week
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Running ───────────────────────────────────────────────────────────────

  if (phase === "running") {
    return (
      <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 max-w-lg">
        <Spinner />
        <p className="text-sm text-gray-400">
          Running weekly agent — selecting media and generating drafts…
        </p>
      </div>
    );
  }

  // ── Confirming (preview shown, awaiting final approval) ───────────────────

  if (phase === "confirming" && preview) {
    const weekStart = new Date(preview.weekStart).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const weekEnd = new Date(preview.weekEnd).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const noMedia = preview.availableMedia === 0;

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 max-w-lg">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-4">
          Week of {weekStart} – {weekEnd}
        </p>

        {noMedia ? (
          <div className="mb-5 flex items-start gap-2.5 bg-yellow-900/20 border border-yellow-800/30 rounded-lg px-4 py-3">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0 mt-1.5" />
            <p className="text-xs text-yellow-300 leading-relaxed">
              No media in your library. Upload photos via the{" "}
              <a href="/admin/media" className="underline hover:text-white transition-colors">
                Media Manager
              </a>{" "}
              before running the agent.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Est. posts",         value: preview.estimatedPosts },
                { label: "Est. reels",          value: preview.estimatedReels },
                { label: "Social-ready photos", value: preview.socialReadyMedia },
              ].map((item) => (
                <div key={item.label} className="bg-gray-800/60 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-white">{item.value}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5 leading-snug">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-5">
              Drafts will be saved as{" "}
              <span className="text-yellow-400 font-medium">Needs Approval</span>.
              Nothing goes live without your explicit approval.
            </p>
          </>
        )}

        <div className="flex items-center gap-2">
          {!noMedia && (
            <button
              onClick={() => handleRun(false)}
              className="bg-[#94b2b6] hover:bg-[#7a9ea3] text-[#151b23] text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
            >
              Generate Drafts
            </button>
          )}
          <button
            onClick={reset}
            className="text-sm text-gray-500 hover:text-white px-3 py-2.5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Idle / Previewing ─────────────────────────────────────────────────────

  return (
    <div>
      <button
        onClick={handlePreview}
        disabled={phase === "previewing"}
        className="flex items-center gap-2.5 bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-gray-700 disabled:text-gray-500 text-[#151b23] text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
      >
        {phase === "previewing" ? (
          <>
            <span className="inline-block w-3.5 h-3.5 border-2 border-[#151b23]/30 border-t-[#151b23] rounded-full animate-spin" />
            Checking media…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Run Weekly Agent
          </>
        )}
      </button>
      <p className="text-[11px] text-gray-600 mt-1.5">
        Generate this week&apos;s social media drafts from your highest-rated media.
      </p>
    </div>
  );
}
