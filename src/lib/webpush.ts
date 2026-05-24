/**
 * Web Push helper — SERVER ONLY.
 * Logs every step to console (visible in Vercel function logs) and writes a PushLog to DB.
 */

import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export interface PushPayload {
  title: string;
  body:  string;
  url?:  string;
  tag?:  string;
  requireInteraction?: boolean;
}

export interface PushResult {
  sent:           number;
  failed:         number;
  subscriberCount: number;
  emailFallback:  boolean;
  errors:         string[];
  vapidMissing:   boolean;
}

function initVapid(): boolean {
  const pub   = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv  = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL ?? "mailto:admin@cmtdetailing.com";

  if (!pub) {
    console.error("[webpush] MISSING env var: NEXT_PUBLIC_VAPID_PUBLIC_KEY");
    return false;
  }
  if (!priv) {
    console.error("[webpush] MISSING env var: VAPID_PRIVATE_KEY");
    return false;
  }

  try {
    webpush.setVapidDetails(email, pub, priv);
    return true;
  } catch (err) {
    console.error("[webpush] setVapidDetails failed:", err);
    return false;
  }
}

export async function sendPushToAll(
  payload: PushPayload,
  trigger: string = "unknown",
): Promise<PushResult> {
  const vapidOk = initVapid();
  const errors: string[] = [];

  if (!vapidOk) {
    await writePushLog({ trigger, subscriberCount: 0, sent: 0, failed: 0, emailFallback: false, errors: ["VAPID not configured"] });
    return { sent: 0, failed: 0, subscriberCount: 0, emailFallback: false, errors: ["VAPID not configured"], vapidMissing: true };
  }

  const subs = await prisma.pushSubscription.findMany();
  console.log(`[webpush] trigger="${trigger}" subscribers=${subs.length}`);

  if (subs.length === 0) {
    await writePushLog({ trigger, subscriberCount: 0, sent: 0, failed: 0, emailFallback: false, errors: [] });
    return { sent: 0, failed: 0, subscriberCount: 0, emailFallback: false, errors: [], vapidMissing: false };
  }

  const message = JSON.stringify(payload);
  let sent = 0, failed = 0;

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message,
        );
        sent++;
        console.log(`[webpush] sent ok → ${sub.endpoint.slice(0, 60)}…`);
      } catch (err: unknown) {
        failed++;
        const status  = (err as { statusCode?: number }).statusCode;
        const body    = (err as { body?: string }).body ?? "";
        const errMsg  = `HTTP ${status ?? "?"}: ${body.slice(0, 120)}`;
        errors.push(errMsg);
        console.error(`[webpush] send failed (${errMsg}) → ${sub.endpoint.slice(0, 60)}…`);

        if (status === 410 || status === 404) {
          console.log(`[webpush] removing expired subscription ${sub.id}`);
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }),
  );

  console.log(`[webpush] done: sent=${sent} failed=${failed}`);
  await writePushLog({ trigger, subscriberCount: subs.length, sent, failed, emailFallback: false, errors });
  return { sent, failed, subscriberCount: subs.length, emailFallback: false, errors, vapidMissing: false };
}

async function writePushLog(data: {
  trigger: string; subscriberCount: number; sent: number;
  failed: number; emailFallback: boolean; errors: string[];
}) {
  await prisma.pushLog.create({ data }).catch((err) =>
    console.error("[webpush] failed to write PushLog:", err),
  );
}

export async function markEmailFallback(trigger: string) {
  const last = await prisma.pushLog.findFirst({
    where:   { trigger },
    orderBy: { createdAt: "desc" },
  });
  if (last) {
    await prisma.pushLog.update({
      where: { id: last.id },
      data:  { emailFallback: true },
    }).catch(() => {});
  }
}

export function vapidConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}
