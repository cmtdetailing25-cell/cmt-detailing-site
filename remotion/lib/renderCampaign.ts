/**
 * Core render logic — shared between CLI scripts and the Express server.
 *
 * Key design decisions:
 *   - Bundle is cached as a lazy singleton Promise. Building takes ~10s; subsequent
 *     renders reuse the same bundle URL without re-processing React components.
 *   - gl: "swangle" forces software WebGL rendering for Linux/Docker environments
 *     that have no GPU drivers (Railway, most CI). Harmless on local macOS/Windows.
 *   - On bundle failure the cached promise is cleared so the next request retries.
 */

import { bundle }                         from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import * as path                          from "path";
import * as fs                            from "fs";
import { randomUUID }                     from "crypto";
import type { CMTReelProps }              from "../src/types";

// ── Paths ─────────────────────────────────────────────────────────────────────

const REMOTION_ROOT = process.cwd();
const ENTRY_POINT   = path.join(REMOTION_ROOT, "src", "index.ts");

// ── Bundle cache ──────────────────────────────────────────────────────────────

let bundlePromise: Promise<string> | null = null;

function getBundleUrl(): Promise<string> {
  if (!bundlePromise) {
    bundlePromise = bundle({ entryPoint: ENTRY_POINT, enableCaching: true })
      .catch((err) => {
        bundlePromise = null; // allow retry on next request
        throw err;
      });
  }
  return bundlePromise;
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface InputMedia {
  url:  string;
  type: "image" | "video";
}

export interface CampaignInput {
  campaignId:             string;
  workflowRunId?:         string;
  campaignTitle?:         string;
  approvedCaption?:       string;
  approvedCreativeNotes?: string;
  media?: {
    before?:    InputMedia[];
    process?:   InputMedia[];
    after?:     InputMedia[];
    thumbnail?: InputMedia[];
  };
}

export interface RenderOutput {
  campaignId:    string;
  workflowRunId: string;
  renderId:      string;
  videoPath:     string;
  duration:      number;
  status:        "completed";
}

export interface RenderOptions {
  outputFile?: string; // defaults to out/{campaignId}.mp4
  logProgress?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function firstSentence(text: string, maxLen = 80): string {
  return text.split(/[.!?\n]/)[0].trim().slice(0, maxLen);
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function renderCampaign(
  input: CampaignInput,
  options: RenderOptions = {},
): Promise<RenderOutput> {
  const {
    campaignId,
    workflowRunId         = "local",
    campaignTitle         = "CMT Campaign",
    approvedCaption       = "",
    approvedCreativeNotes = "",
    media                 = {},
  } = input;

  if (!campaignId) throw new Error("campaignId is required");

  const renderId   = randomUUID();
  const outputFile = options.outputFile
    ?? path.join(REMOTION_ROOT, "out", `${campaignId}.mp4`);

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });

  const hook = approvedCaption
    ? firstSentence(approvedCaption)
    : `See the ${campaignTitle} transformation`;

  const cta = approvedCreativeNotes.slice(0, 80) || "Book your mobile detail";

  const props: CMTReelProps = {
    campaignId,
    title:   campaignTitle,
    hook,
    caption: approvedCaption,
    cta,
    media: {
      before:    media.before    ?? [],
      process:   media.process   ?? [],
      after:     media.after     ?? [],
      thumbnail: media.thumbnail ?? [],
    },
  };

  if (options.logProgress) {
    const b = props.media.before.length;
    const p = props.media.process.length;
    const a = props.media.after.length;
    console.log(`
┌─ CMT Remotion Render ─────────────────────────────────────────────────
│  Campaign  : ${campaignTitle}
│  ID        : ${campaignId}
│  Run ID    : ${workflowRunId}
│  Render ID : ${renderId}
│  Hook      : "${hook}"
│  CTA       : "${cta}"
│  Media     : before=${b}  process=${p}  after=${a}${
      b + p + a === 0 ? "\n│  ⚠ No media — placeholder panels will render" : ""
    }
│  Output    : ${outputFile}
└───────────────────────────────────────────────────────────────────────
`);
  }

  const t0 = Date.now();

  // ── 1. Bundle ─────────────────────────────────────────────────────────────────

  if (options.logProgress) process.stdout.write("[1/3] Bundling... ");
  const bundleUrl = await getBundleUrl();
  if (options.logProgress) console.log(`done (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`);

  // ── 2. Select composition ──────────────────────────────────────────────────────

  if (options.logProgress) process.stdout.write("[2/3] Loading composition... ");
  const composition = await selectComposition({
    serveUrl:   bundleUrl,
    id:         "CMTBeforeAfterReel",
    inputProps: props as Record<string, unknown>,
  });
  if (options.logProgress) {
    console.log(
      `${composition.durationInFrames} frames @ ${composition.fps}fps` +
      ` (${(composition.durationInFrames / composition.fps).toFixed(1)}s)\n`,
    );
  }

  // ── 3. Render ─────────────────────────────────────────────────────────────────

  if (options.logProgress) console.log("[3/3] Rendering...");

  let lastPct = -1;
  await renderMedia({
    composition,
    serveUrl:        bundleUrl,
    codec:           "h264",
    outputLocation:  outputFile,
    inputProps:      props as Record<string, unknown>,
    concurrency:     2,
    chromiumOptions: { gl: "swangle" },
    onProgress: ({ progress }) => {
      if (!options.logProgress) return;
      const pct = Math.floor(progress * 100);
      if (pct % 25 === 0 && pct !== lastPct) {
        lastPct = pct;
        const frame = Math.round(progress * composition.durationInFrames);
        console.log(`      ${String(pct).padStart(3)}%  frame ${frame}/${composition.durationInFrames}`);
      }
    },
  });

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  if (options.logProgress) {
    const sizeMb = (fs.statSync(outputFile).size / 1_048_576).toFixed(2);
    console.log(`\n✓ Rendered in ${elapsed}s — ${sizeMb} MB\n`);
  }

  return {
    campaignId,
    workflowRunId,
    renderId,
    videoPath: outputFile,
    duration:  15,
    status:    "completed",
  };
}
