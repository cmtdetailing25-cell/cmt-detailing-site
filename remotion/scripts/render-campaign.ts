/**
 * CLI entrypoint for rendering a campaign.
 *
 * Usage:
 *   npm run render:campaign -- ./input/sample-campaign.json
 *
 * Input:  JSON file matching the n8n campaign payload
 * Output: out/{campaignId}.mp4  (video)
 *         out/{campaignId}.json (render result — read by n8n next step)
 */

import * as path from "path";
import * as fs   from "fs";
import { loadEnv }        from "../lib/env";
import { renderCampaign } from "../lib/renderCampaign";
import type { CampaignInput, RenderOutput } from "../lib/renderCampaign";

loadEnv();

// ── CLI argument ──────────────────────────────────────────────────────────────

const REMOTION_ROOT = process.cwd();
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const OUT_DIR = path.join(REMOTION_ROOT, "out");

function writeResult(result: Omit<RenderOutput, "status"> & { status: "completed" | "failed"; videoPath: string | null; error?: string }): void {
  const resultFile = path.join(OUT_DIR, `${result.campaignId}.json`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
  console.log(`✓ Result: out/${result.campaignId}.json\n`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const input = JSON.parse(fs.readFileSync(inputPath, "utf-8")) as CampaignInput;

  const result = await renderCampaign(input, { logProgress: true });

  writeResult(result);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\n✗ Render failed: ${msg}\n`);

  try {
    const input = JSON.parse(fs.readFileSync(inputPath, "utf-8")) as Partial<CampaignInput>;
    const id    = input.campaignId;
    if (id) {
      const { randomUUID } = require("crypto") as typeof import("crypto");
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
