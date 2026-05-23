import { prisma } from "@/lib/prisma";

// ── Settings singleton ────────────────────────────────────────────────────────

export async function getAutomationSettings() {
  let settings = await prisma.automationSettings.findFirst();
  if (!settings) {
    settings = await prisma.automationSettings.create({ data: {} });
  }
  return settings;
}

// ── n8n webhook caller ────────────────────────────────────────────────────────

export async function callN8nWebhook(
  url: string,
  payload: Record<string, unknown>,
  secret: string
): Promise<{ ok: boolean; status: number; data: unknown }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": secret,
      },
      body: JSON.stringify(payload),
    });
    let data: unknown = null;
    try { data = await res.json(); } catch { /* not JSON */ }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error("[callN8nWebhook] fetch error:", err);
    return { ok: false, status: 0, data: null };
  }
}

// ── Callback secret validation ────────────────────────────────────────────────

export async function validateCallbackSecret(req: Request): Promise<boolean> {
  const incoming = req.headers.get("X-Webhook-Secret");
  if (!incoming) return false;
  const settings = await prisma.automationSettings.findFirst();
  if (!settings?.webhookSecret) return false;
  return incoming === settings.webhookSecret;
}

// ── Build callback base URL ───────────────────────────────────────────────────
// Priority: NEXT_PUBLIC_APP_URL → APP_URL → production hard-coded domain → localhost
// VERCEL_URL is intentionally ignored: it resolves to the preview deployment URL, not
// the production domain, which would break n8n callbacks on non-prod deployments.

export function getCallbackBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.NODE_ENV === "production") return "https://cmtdetailing.com";
  return "http://localhost:3000";
}
