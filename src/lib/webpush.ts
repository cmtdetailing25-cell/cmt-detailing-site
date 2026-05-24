/**
 * Web Push helper — SERVER ONLY.
 * Sends push notifications to all stored device subscriptions.
 * Silently no-ops if VAPID keys are not configured.
 */

import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let initialised = false;

function init() {
  if (initialised) return true;
  const pub   = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv  = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL ?? "mailto:admin@cmtdetailing.com";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(email, pub, priv);
  initialised = true;
  return true;
}

export interface PushPayload {
  title: string;
  body:  string;
  url?:  string;
  tag?:  string;
  requireInteraction?: boolean;
}

export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; failed: number }> {
  if (!init()) return { sent: 0, failed: 0 };

  const subs = await prisma.pushSubscription.findMany();
  if (subs.length === 0) return { sent: 0, failed: 0 };

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
      } catch (err: unknown) {
        failed++;
        // Remove expired/invalid subscriptions (410 Gone or 404)
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }),
  );

  return { sent, failed };
}
