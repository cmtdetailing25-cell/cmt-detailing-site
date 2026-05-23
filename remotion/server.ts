/**
 * Hosted Remotion render service — Express server for Railway deployment.
 *
 * POST /render  — accepts n8n campaign payload, renders MP4, uploads to Vercel Blob
 * GET  /health  — liveness check
 *
 * Environment variables (required in production):
 *   BLOB_READ_WRITE_TOKEN   — Vercel Blob write token
 *   RENDER_SERVICE_SECRET   — shared secret validated in x-render-secret header
 *   PORT                    — HTTP port (default 3001)
 */

import express, { Request, Response, NextFunction } from "express";
import * as path from "path";
import * as fs   from "fs";

import { loadEnv, requireEnv } from "./lib/env";
import { renderCampaign }      from "./lib/renderCampaign";
import { uploadRender }        from "./lib/uploadRender";
import type { CampaignInput }  from "./lib/renderCampaign";

loadEnv();

// ── Config ────────────────────────────────────────────────────────────────────

const PORT   = parseInt(process.env.PORT ?? "3001", 10);
const SECRET = process.env.RENDER_SERVICE_SECRET ?? "";

const TEMP_DIR = path.join(process.cwd(), "temp", "out");
fs.mkdirSync(TEMP_DIR, { recursive: true });

// ── Concurrency guard ─────────────────────────────────────────────────────────
// Remotion renders are CPU/memory heavy. Reject a second request while one
// is already running rather than letting Railway OOM.

let renderInProgress = false;

// ── App ───────────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: "1mb" }));

// ── GET /health ───────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, renderInProgress });
});

// ── POST /render ──────────────────────────────────────────────────────────────

app.post("/render", async (req: Request, res: Response) => {
  // ── Auth ──────────────────────────────────────────────────────────────────

  const incomingSecret = req.headers["x-render-secret"];
  if (!SECRET) {
    console.warn("[WARN] RENDER_SERVICE_SECRET is not set — all requests accepted");
  } else if (incomingSecret !== SECRET) {
    res.status(401).json({ ok: false, error: "Invalid render secret" });
    return;
  }

  // ── Concurrency ───────────────────────────────────────────────────────────

  if (renderInProgress) {
    res.status(503).json({
      ok:         false,
      error:      "A render is already in progress. Retry after the current job completes.",
      retryAfter: 60,
    });
    return;
  }

  // ── Validate body ─────────────────────────────────────────────────────────

  const input = req.body as CampaignInput;

  if (!input?.campaignId) {
    res.status(400).json({ ok: false, error: "campaignId is required" });
    return;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  renderInProgress = true;
  let tempFile: string | null = null;

  try {
    const token = requireEnv("BLOB_READ_WRITE_TOKEN");

    const { campaignId, workflowRunId = "server" } = input;
    console.log(`[render] START  campaign=${campaignId}  run=${workflowRunId}`);

    // Use a temp path so the server dir stays clean
    const renderResult = await renderCampaign(input, {
      outputFile:  path.join(TEMP_DIR, `${campaignId}-pending.mp4`),
      logProgress: true,
    });

    tempFile = renderResult.videoPath;

    // Rename to include renderId (avoids clobbering if two campaigns share an ID
    // across sequential requests while the file is being uploaded)
    const finalTemp = path.join(TEMP_DIR, `${campaignId}-${renderResult.renderId}.mp4`);
    fs.renameSync(tempFile, finalTemp);
    tempFile = finalTemp;

    console.log(`[render] UPLOAD campaign=${campaignId}  renderId=${renderResult.renderId}`);

    const { videoUrl, thumbnailUrl } = await uploadRender(
      {
        campaignId,
        workflowRunId: renderResult.workflowRunId,
        renderId:      renderResult.renderId,
        videoPath:     tempFile,
      },
      token,
      true,
    );

    const response = {
      ok:            true,
      campaignId,
      workflowRunId: renderResult.workflowRunId,
      renderId:      renderResult.renderId,
      videoUrl,
      thumbnailUrl,
      duration:      renderResult.duration,
    };

    console.log(`[render] DONE   campaign=${campaignId}  url=${videoUrl}`);
    res.json(response);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[render] ERROR  ${msg}`);
    res.status(500).json({ ok: false, error: msg });

  } finally {
    // Clean up temp file regardless of success or failure
    if (tempFile) {
      try { fs.unlinkSync(tempFile); } catch { /* best-effort */ }
    }
    renderInProgress = false;
  }
});

// ── 404 handler ───────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

// ── Error handler ─────────────────────────────────────────────────────────────

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[unhandled] ${msg}`);
  res.status(500).json({ ok: false, error: msg });
});

// ── Start ─────────────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`
┌─ CMT Render Service ──────────────────────────────────────────────────
│  Listening on port  : ${PORT}
│  Secret configured  : ${SECRET ? "yes" : "NO — set RENDER_SERVICE_SECRET"}
│  Health check       : GET  /health
│  Render endpoint    : POST /render
└───────────────────────────────────────────────────────────────────────
`);
});

// Give renders plenty of time before Railway kills the connection (5 min)
server.timeout = 300_000;
