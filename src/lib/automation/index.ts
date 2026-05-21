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

export function getCallbackBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}
