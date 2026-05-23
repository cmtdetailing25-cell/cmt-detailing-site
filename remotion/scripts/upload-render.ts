/**
 * Upload a rendered MP4 to Vercel Blob and update the result JSON.
 *
 * Usage:
 *   cd remotion
 *   npm run render:campaign -- ./input/sample-campaign.json
 *   npm run upload:render   -- ./out/mustang-detail-001.json
 *
 * Reads  : out/{campaignId}.json  (render result written by render-campaign.ts)
 * Uploads: MP4 → Vercel Blob at automation/renders/{campaignId}/{renderId}.mp4
 * Writes : updated out/{campaignId}.json with videoUrl + thumbnailUrl
 * Prints : final JSON to stdout (n8n can capture this for the next workflow step)
 *
 * Requires BLOB_READ_WRITE_TOKEN — loaded automatically from the parent
 * Next.js project's .env file if not already in the environment.
 */

import { put }        from "@vercel/blob";
import * as path      from "path";
import * as fs        from "fs";

// ── Env loading ───────────────────────────────────────────────────────────────
// The remotion/ directory lives inside the Next.js project, so the parent's
// .env is at ../. Load it before any @vercel/blob calls so the token is set.

function loadParentEnv(): void {
  const envFile = path.join(process.cwd(), "..", ".env");
  if (!fs.existsSync(envFile)) return;

  for (const raw of fs.readFileSync(envFile, "utf-8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    // Strip surrounding quotes (single or double)
    const val = line.slice(eq + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

loadParentEnv();

// ── CLI argument ──────────────────────────────────────────────────────────────

const REMOTION_ROOT = process.cwd();
const [, , resultArg] = process.argv;

if (!resultArg) {
  console.error("\nUsage: npm run upload:render -- <path-to-result.json>\n");
  console.error("Example: npm run upload:render -- ./out/mustang-detail-001.json\n");
  process.exit(1);
}

const resultPath = path.resolve(REMOTION_ROOT, resultArg);

if (!fs.existsSync(resultPath)) {
  console.error(`\nResult file not found: ${resultPath}\n`);
  process.exit(1);
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface RenderResult {
  campaignId:    string;
  workflowRunId: string;
  videoPath:     string | null;
  videoUrl?:     string | null;
  thumbnailUrl?: string | null;
  duration:      number;
  renderId:      string;
  status:        "completed" | "failed";
  error?:        string;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const result = JSON.parse(fs.readFileSync(resultPath, "utf-8")) as RenderResult;
  const { campaignId, workflowRunId, renderId, videoPath, status } = result;

  // ── Validate inputs ────────────────────────────────────────────────────────

  if (status === "failed") {
    console.error(`\n✗ Render result has status "failed" — nothing to upload.\n`);
    console.error(`  Error: ${result.error ?? "(unknown)"}\n`);
    process.exit(1);
  }

  if (!videoPath) {
    console.error("\n✗ videoPath is missing from result JSON.\n");
    process.exit(1);
  }

  if (!fs.existsSync(videoPath)) {
    console.error(`\n✗ Video file not found at: ${videoPath}\n`);
    process.exit(1);
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error(
      "\n✗ BLOB_READ_WRITE_TOKEN is not set.\n" +
      "  Add it to the parent project's .env file or export it before running.\n"
    );
    process.exit(1);
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  const blobPathname = `automation/renders/${campaignId}/${renderId}.mp4`;
  const fileBuffer   = fs.readFileSync(videoPath);
  const fileSizeMb   = (fileBuffer.byteLength / 1_048_576).toFixed(2);

  console.log(`
┌─ CMT Blob Upload ──────────────────────────────────────────────────────
│  Campaign  : ${campaignId}
│  Run ID    : ${workflowRunId}
│  Render ID : ${renderId}
│  File      : ${videoPath}
│  Size      : ${fileSizeMb} MB
│  Blob path : ${blobPathname}
└────────────────────────────────────────────────────────────────────────
`);

  process.stdout.write("Uploading to Vercel Blob...");

  const blob = await put(blobPathname, fileBuffer, {
    access:            "public",
    contentType:       "video/mp4",
    addRandomSuffix:   false,   // renderId UUID already ensures uniqueness
    token,
  });

  console.log(` done.\n`);
  console.log(`✓ Public URL: ${blob.url}\n`);

  // ── Update result JSON ─────────────────────────────────────────────────────

  const updated: RenderResult = {
    ...result,
    videoUrl:     blob.url,
    thumbnailUrl: null,   // thumbnail generation not yet implemented
  };

  fs.writeFileSync(resultPath, JSON.stringify(updated, null, 2));
  console.log(`✓ Updated:   ${resultPath}\n`);

  // ── Print final JSON to stdout for n8n ─────────────────────────────────────
  console.log("─── Result JSON (for n8n) ───────────────────────────────────────────────");
  console.log(JSON.stringify(updated, null, 2));
  console.log("─────────────────────────────────────────────────────────────────────────\n");
}

// ── Error handler ─────────────────────────────────────────────────────────────

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\n✗ Upload failed: ${msg}\n`);
  process.exit(1);
});
