/**
 * Shared env loader for both CLI scripts and the Express server.
 *
 * Looks for .env files in two locations:
 *   1. Parent Next.js project: ../(.env)
 *   2. Local remotion dir: ./.env
 *
 * Variables already set in the process environment are never overwritten,
 * so CI/Railway environment variables always win over file-based ones.
 */

import * as path from "path";
import * as fs   from "fs";

function parseAndApply(filePath: string): void {
  if (!fs.existsSync(filePath)) return;

  for (const raw of fs.readFileSync(filePath, "utf-8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

export function loadEnv(): void {
  const cwd = process.cwd();
  parseAndApply(path.join(cwd, "..", ".env")); // Next.js project root
  parseAndApply(path.join(cwd, ".env"));       // remotion-local override
}

export function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Required environment variable "${key}" is not set.`);
  return val;
}
