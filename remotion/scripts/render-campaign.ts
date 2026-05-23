/**
 * Scriptable Remotion render entry point — intended for n8n automation.
 *
 * Usage:
 *   npm run render:campaign -- ./input/campaign.json
 *
 * Input:  JSON file matching the n8n campaign payload
 * Output: out/{campaignId}.mp4  (video)
 *         out/{campaignId}.json (render result — read by n8n next step)
 */

import { bundle }                        from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import * as path                          from "path";
import * as fs                            from "fs";
import { randomUUID }                     from "crypto";
import type { CMTReelProps }              from "../src/types";

// ── Paths ─────────────────────────────────────────────────────────────────────
// npm run scripts set CWD to the directory containing package.json (remotion/)

const REMOTION_ROOT = process.cwd();
const ENTRY_POINT   = path.join(REMOTION_ROOT, "src", "index.ts");
const OUT_DIR       = path.join(REMOTION_ROOT, "out");

// ── CLI argument ──────────────────────────────────────────────────────────────

const [, , inputArg] = process.argv;

if (!inputArg) {
  console.error("\nUsage: npm run render:campaign -- <path-to-input.json>\n");
  process.exit(1);
}

const inputPath = path.resolve(REMOTION_ROOT, inputArg);

if (!fs.existsSync(inputPath)) {
  console.error(`\nInput file not found: ${inputPath}\n`);
  process.exit(1);
}

// ── Payload types (mirrors n8n output) ───────────────────────────────────────

interface InputMedia {
  url:  string;
  type: "image" | "video";
}

interface CampaignInput {
  campaignId:             string;
  workflowRunId?:         string;
  campaignTitle?:         string;
  approvedStrategy?:      unknown;
  approvedCaption?:       string;
  approvedHashtags?:      string;
  approvedCreativeNotes?: string;
  media?: {
    before?:    InputMedia[];
    process?:   InputMedia[];
    after?:     InputMedia[];
    thumbnail?: InputMedia[];
  };
  outputCallbackUrl?: string;
}

interface RenderResult {
  campaignId:    string;
  workflowRunId: string;
  videoPath:     string | null;
  duration:      number;
  renderId:      string;
  status:        "completed" | "failed";
  error?:        string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function firstSentence(text: string, maxLen = 80): string {
  return text.split(/[.!?\n]/)[0].trim().slice(0, maxLen);
}

function writeResult(result: RenderResult): void {
  const resultFile = path.join(OUT_DIR, `${result.campaignId}.json`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const input = JSON.parse(fs.readFileSync(inputPath, "utf-8")) as CampaignInput;

  const {
    campaignId,
    workflowRunId          = "local",
    campaignTitle          = "CMT Campaign",
    approvedCaption        = "",
    approvedCreativeNotes  = "",
    media                  = {},
  } = input;

  if (!campaignId) throw new Error("campaignId is required in input JSON");

  const renderId   = randomUUID();
  const outputFile = path.join(OUT_DIR, `${campaignId}.mp4`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // ── Map n8n payload → CMTReelProps ──────────────────────────────────────────

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

  const beforeCt  = props.media.before.length;
  const processCt = props.media.process.length;
  const afterCt   = props.media.after.length;
  const hasMedia  = beforeCt + processCt + afterCt > 0;

  console.log(`
┌─ CMT Remotion Render ─────────────────────────────────────────────────
│  Campaign  : ${campaignTitle}
│  ID        : ${campaignId}
│  Run ID    : ${workflowRunId}
│  Render ID : ${renderId}
│  Hook      : "${hook}"
│  CTA       : "${cta}"
│  Media     : before=${beforeCt}  process=${processCt}  after=${afterCt}${
  !hasMedia ? "\n│  ⚠ No media attached — placeholder panels will render" : ""
}
│  Output    : ${outputFile}
└───────────────────────────────────────────────────────────────────────
`);

  const t0 = Date.now();

  // ── 1. Bundle ────────────────────────────────────────────────────────────────

  console.log("[1/3] Bundling React components...");
  const bundleUrl = await bundle({
    entryPoint:    ENTRY_POINT,
    enableCaching: true,
  });
  console.log(`      ✓ bundled (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`);

  // ── 2. Select composition ─────────────────────────────────────────────────────

  console.log("[2/3] Loading composition...");
  const composition = await selectComposition({
    serveUrl:   bundleUrl,
    id:         "CMTBeforeAfterReel",
    inputProps: props as Record<string, unknown>,
  });
  console.log(
    `      ✓ ${composition.durationInFrames} frames @ ${composition.fps}fps` +
    ` (${(composition.durationInFrames / composition.fps).toFixed(1)}s)\n`
  );

  // ── 3. Render ─────────────────────────────────────────────────────────────────

  console.log("[3/3] Rendering...");

  let lastPct = -1;
  await renderMedia({
    composition,
    serveUrl:       bundleUrl,
    codec:          "h264",
    outputLocation: outputFile,
    inputProps:     props as Record<string, unknown>,
    concurrency:    2,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 100);
      if (pct % 25 === 0 && pct !== lastPct) {
        lastPct = pct;
        const frame = Math.round(progress * composition.durationInFrames);
        console.log(`      ${String(pct).padStart(3)}%  frame ${frame}/${composition.durationInFrames}`);
      }
    },
  });

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const sizeMb  = (fs.statSync(outputFile).size / 1_048_576).toFixed(2);

  console.log(`\n✓ Rendered in ${elapsed}s — ${sizeMb} MB`);

  // ── 4. Write result JSON ───────────────────────────────────────────────────────

  const result: RenderResult = {
    campaignId,
    workflowRunId,
    videoPath: outputFile,
    duration:  15,
    renderId,
    status:    "completed",
  };

  writeResult(result);
  console.log(`✓ Result: out/${campaignId}.json\n`);
}

// ── Error handler ─────────────────────────────────────────────────────────────
// Always write a result JSON so n8n can detect and route failures.

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\n✗ Render failed: ${msg}\n`);

  try {
    const input = JSON.parse(fs.readFileSync(inputPath, "utf-8")) as Partial<CampaignInput>;
    const id    = input.campaignId;
    if (id) {
      writeResult({
        campaignId:    id,
        workflowRunId: input.workflowRunId ?? "local",
        videoPath:     null,
        duration:      15,
        renderId:      randomUUID(),
        status:        "failed",
        error:         msg,
      });
    }
  } catch {
    // best-effort
  }

  process.exit(1);
});
