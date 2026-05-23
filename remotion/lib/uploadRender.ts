/**
 * Core upload logic — shared between CLI scripts and the Express server.
 *
 * Uploads a rendered MP4 to Vercel Blob and returns the public videoUrl.
 * The caller is responsible for cleaning up the local file after upload.
 */

import { put } from "@vercel/blob";
import * as fs from "fs";

// ── Public types ──────────────────────────────────────────────────────────────

export interface UploadInput {
  campaignId:    string;
  workflowRunId: string;
  renderId:      string;
  videoPath:     string;
}

export interface UploadOutput {
  videoUrl:     string;
  thumbnailUrl: null; // thumbnail generation not yet implemented
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function uploadRender(
  input: UploadInput,
  token: string,
  logProgress = false,
): Promise<UploadOutput> {
  const { campaignId, renderId, videoPath } = input;

  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  const blobPathname = `automation/renders/${campaignId}/${renderId}.mp4`;
  const fileBuffer   = fs.readFileSync(videoPath);
  const fileSizeMb   = (fileBuffer.byteLength / 1_048_576).toFixed(2);

  if (logProgress) {
    console.log(`Uploading ${fileSizeMb} MB → Vercel Blob: ${blobPathname}`);
  }

  const blob = await put(blobPathname, fileBuffer, {
    access:          "public",
    contentType:     "video/mp4",
    addRandomSuffix: false, // renderId UUID already ensures uniqueness
    token,
  });

  if (logProgress) {
    console.log(`✓ Public URL: ${blob.url}\n`);
  }

  return {
    videoUrl:     blob.url,
    thumbnailUrl: null,
  };
}
