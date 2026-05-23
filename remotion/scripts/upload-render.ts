/**
 * CLI entrypoint for uploading a rendered MP4 to Vercel Blob.
 *
 * Usage:
 *   npm run upload:render -- ./out/mustang-detail-001.json
 *
 * Reads  : out/{campaignId}.json  (render result written by render-campaign.ts)
 * Uploads: MP4 → Vercel Blob at automation/renders/{campaignId}/{renderId}.mp4
 * Writes : updated out/{campaignId}.json with videoUrl + thumbnailUrl
 * Prints : final JSON to stdout (n8n can capture this for the next workflow step)
 *
 * Requires BLOB_READ_WRITE_TOKEN — loaded automatically from the parent
 * Next.js project's .env file if not already in the environment.
 */

import * as path from "path";
import * as fs   from "fs";
import { loadEnv, requireEnv } from "../lib/env";
import { uploadRender }        from "../lib/uploadRender";

loadEnv();

// ── CLI argument ──────────────────────────────────────────────────────────────

const REMOTION_ROOT = process.cwd();
const [, , resultArg] = process.argv;

if (!resultArg) {
  console.error("\nUsage: npm run upload:render -- <path-to-result.json>\n");
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

  if (status === "failed") {
    console.error(`\n✗ Render result has status "failed" — nothing to upload.\n`);
    console.error(`  Error: ${result.error ?? "(unknown)"}\n`);
    process.exit(1);
  }

  if (!videoPath) {
    console.error("\n✗ videoPath is missing from result JSON.\n");
    process.exit(1);
  }

  const token = requireEnv("BLOB_READ_WRITE_TOKEN");

  console.log(`
┌─ CMT Blob Upload ──────────────────────────────────────────────────────
│  Campaign  : ${campaignId}
│  Run ID    : ${workflowRunId}
│  Render ID : ${renderId}
│  File      : ${videoPath}
└────────────────────────────────────────────────────────────────────────
`);

  const { videoUrl, thumbnailUrl } = await uploadRender(
    { campaignId, workflowRunId, renderId, videoPath },
    token,
    true,
  );

  const updated: RenderResult = { ...result, videoUrl, thumbnailUrl };
  fs.writeFileSync(resultPath, JSON.stringify(updated, null, 2));
  console.log(`✓ Updated: ${resultPath}\n`);

  console.log("─── Result JSON (for n8n) ───────────────────────────────────────────────");
  console.log(JSON.stringify(updated, null, 2));
  console.log("─────────────────────────────────────────────────────────────────────────\n");
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\n✗ Upload failed: ${msg}\n`);
  process.exit(1);
});
