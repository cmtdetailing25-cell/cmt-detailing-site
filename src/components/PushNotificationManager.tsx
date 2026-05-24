"use client";

import { useEffect, useState } from "react";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  const output  = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output.buffer as ArrayBuffer;
}

export default function PushNotificationManager() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [loading,    setLoading   ] = useState(false);
  const [subscribed, setSubscribed ] = useState(false);

  // On mount: register SW and detect current permission state
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission as PermissionState);

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // If already subscribed, mark as done
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setSubscribed(true);
      });
    }).catch(console.error);
  }, []);

  // Auto-subscribe silently if permission already granted but not yet subscribed
  useEffect(() => {
    if (permission === "granted" && !subscribed) {
      subscribe(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission, subscribed]);

  async function subscribe(requestPermission = true) {
    setLoading(true);
    try {
      // Get VAPID public key from server
      const keyRes = await fetch("/api/admin/push/vapid-key");
      if (!keyRes.ok) { setLoading(false); return; }
      const { key } = await keyRes.json();

      const reg = await navigator.serviceWorker.ready;

      // Request permission if needed
      if (requestPermission && Notification.permission === "default") {
        const result = await Notification.requestPermission();
        setPermission(result as PermissionState);
        if (result !== "granted") { setLoading(false); return; }
      }

      if (Notification.permission !== "granted") { setLoading(false); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };

      await fetch("/api/admin/push/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...json, userAgent: navigator.userAgent }),
      });

      setSubscribed(true);
      setPermission("granted");
    } catch (err) {
      console.error("Push subscribe failed", err);
    }
    setLoading(false);
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/admin/push/subscribe", {
          method:  "DELETE",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe failed", err);
    }
    setLoading(false);
  }

  // Nothing to show if unsupported or already subscribed
  if (permission === "unsupported" || permission === "denied" || subscribed) return null;

  return (
    <div className="mx-3 mb-2 rounded-lg bg-[#1a2028] border border-[#2d3840] p-3">
      <p className="text-[10px] text-[#708289] mb-2 leading-snug">
        Get notified when bookings arrive
      </p>
      <button
        onClick={() => subscribe(true)}
        disabled={loading}
        className="w-full text-xs font-semibold text-[#e9f0ef] bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-md px-3 py-1.5 transition-colors"
      >
        {loading ? "Enabling…" : "Enable Notifications"}
      </button>
    </div>
  );
}

// Smaller toggle for use in settings or nav footer
export function PushToggle() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [subscribed, setSubscribed ] = useState(false);
  const [loading,    setLoading   ] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported"); return;
    }
    setPermission(Notification.permission as PermissionState);
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => { if (sub) setSubscribed(true); }),
    );
  }, []);

  if (permission === "unsupported") return null;

  const label = subscribed
    ? "Push: On"
    : permission === "denied"
    ? "Push: Blocked"
    : "Push: Off";

  const color = subscribed
    ? "text-green-400"
    : permission === "denied"
    ? "text-red-500"
    : "text-[#708289]";

  return (
    <button
      onClick={subscribed ? handleUnsubscribe : handleSubscribe}
      disabled={loading || permission === "denied"}
      className={`text-[10px] font-medium ${color} hover:opacity-80 transition-opacity disabled:opacity-40`}
    >
      {loading ? "…" : label}
    </button>
  );

  async function handleSubscribe() {
    setLoading(true);
    try {
      const keyRes = await fetch("/api/admin/push/vapid-key");
      if (!keyRes.ok) { setLoading(false); return; }
      const { key } = await keyRes.json();
      const reg     = await navigator.serviceWorker.ready;
      const result  = await Notification.requestPermission();
      setPermission(result as PermissionState);
      if (result !== "granted") { setLoading(false); return; }
      const sub  = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await fetch("/api/admin/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...json, userAgent: navigator.userAgent }) });
      setSubscribed(true);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleUnsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/admin/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch { /* ignore */ }
    setLoading(false);
  }
}
