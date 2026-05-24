"use client";

import { useEffect, useState, useCallback } from "react";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

interface PushStatus {
  vapidConfigured:  boolean;
  resendConfigured: boolean;
  subscriptions:    { count: number; devices: { id: string; endpoint: string; userAgent: string | null; createdAt: string }[] };
  recentLogs:       { id: string; trigger: string; sent: number; failed: number; emailFallback: boolean; errors: string[]; createdAt: string }[];
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  const output  = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output.buffer as ArrayBuffer;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// ── Main banner: shows "Enable" prompt when not subscribed ────────────────────

export default function PushNotificationManager() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [loading,    setLoading   ] = useState(false);
  const [subscribed, setSubscribed ] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported"); return;
    }
    setPermission(Notification.permission as PermissionState);
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      reg.pushManager.getSubscription().then((sub) => { if (sub) setSubscribed(true); });
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (permission === "granted" && !subscribed) subscribe(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission, subscribed]);

  async function subscribe(requestPermission = true) {
    setLoading(true);
    try {
      const keyRes = await fetch("/api/admin/push/vapid-key");
      if (!keyRes.ok) { setLoading(false); return; }
      const { key } = await keyRes.json();
      const reg = await navigator.serviceWorker.ready;
      if (requestPermission && Notification.permission === "default") {
        const result = await Notification.requestPermission();
        setPermission(result as PermissionState);
        if (result !== "granted") { setLoading(false); return; }
      }
      if (Notification.permission !== "granted") { setLoading(false); return; }
      const sub  = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const saveRes = await fetch("/api/admin/push/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...json, userAgent: navigator.userAgent }),
      });
      if (!saveRes.ok) console.error("Failed to save subscription to DB");
      setSubscribed(true);
      setPermission("granted");
    } catch (err) { console.error("Push subscribe failed", err); }
    setLoading(false);
  }

  if (permission === "unsupported" || permission === "denied" || subscribed) return null;

  return (
    <div className="mx-6 mt-4 mb-0 rounded-lg bg-[#1a2028] border border-[#2d3840] p-3 flex items-center gap-3">
      <span className="w-2 h-2 rounded-full bg-[#434e56] shrink-0" />
      <p className="text-[11px] text-[#708289] flex-1">Enable push notifications to get alerted on new bookings</p>
      <button
        onClick={() => subscribe(true)}
        disabled={loading}
        className="text-[11px] font-semibold text-[#e9f0ef] bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded px-3 py-1 transition-colors shrink-0"
      >
        {loading ? "Enabling…" : "Enable"}
      </button>
    </div>
  );
}

// ── Debug panel: subscription count, test button, recent logs ─────────────────

export function PushDebugPanel() {
  const [status,      setStatus     ] = useState<PushStatus | null>(null);
  const [loading,     setLoading    ] = useState(true);
  const [testing,     setTesting    ] = useState(false);
  const [testResult,  setTestResult ] = useState<{ push: { sent: number; failed: number; errors: string[] }; email: { ok: boolean; error?: string } | null } | null>(null);
  const [subscribed,  setSubscribed ] = useState(false);
  const [expanded,    setExpanded   ] = useState(false);
  const [unsubLoading,setUnsubLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/push/status");
      const data = await res.json() as PushStatus;
      setStatus(data);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => { setSubscribed(!!sub); }),
    );
    fetchStatus();
  }, [fetchStatus]);

  async function sendTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res  = await fetch("/api/admin/push/test", { method: "POST" });
      const data = await res.json();
      setTestResult(data);
      await fetchStatus();
    } catch (err) { console.error(err); }
    setTesting(false);
  }

  async function unsubscribe() {
    setUnsubLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/admin/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      await fetchStatus();
    } catch (err) { console.error(err); }
    setUnsubLoading(false);
  }

  const lastLog = status?.recentLogs?.[0];

  return (
    <div className="mx-3 mb-1">
      {/* Header row */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#1a2028] transition-colors text-left"
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${subscribed ? "bg-green-400" : "bg-[#434e56]"}`} />
        <span className={`text-[10px] font-medium ${subscribed ? "text-green-400" : "text-[#708289]"}`}>
          {loading ? "…" : subscribed ? `Push On · ${status?.subscriptions.count ?? 0} device${(status?.subscriptions.count ?? 0) !== 1 ? "s" : ""}` : "Push Off"}
        </span>
        {lastLog && (
          <span className={`ml-auto text-[9px] ${lastLog.sent > 0 ? "text-green-500" : lastLog.failed > 0 ? "text-red-500" : "text-[#434e56]"}`}>
            {lastLog.sent > 0 ? "✓ sent" : lastLog.emailFallback ? "✉ email" : lastLog.failed > 0 ? "✗ failed" : "no subs"}
          </span>
        )}
        <span className="text-[9px] text-[#434e56] ml-1">{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="mt-1 rounded-lg bg-[#151b23] border border-[#2d3840] p-3 space-y-3">

          {/* Config status */}
          <div className="space-y-1">
            <p className="text-[9px] font-semibold text-[#434e56] uppercase tracking-widest">Config</p>
            <Row label="VAPID" ok={!!status?.vapidConfigured} />
            <Row label="Resend email" ok={!!status?.resendConfigured} />
          </div>

          {/* Subscriptions */}
          <div className="space-y-1">
            <p className="text-[9px] font-semibold text-[#434e56] uppercase tracking-widest">Subscriptions</p>
            {status?.subscriptions.count === 0
              ? <p className="text-[10px] text-[#708289]">No devices subscribed</p>
              : status?.subscriptions.devices.map((d) => (
                <div key={d.id} className="text-[9px] text-[#708289] leading-relaxed">
                  <span className="text-[#94b2b6]">{d.endpoint}</span><br />
                  <span className="text-[#434e56]">{d.userAgent?.split(" ").slice(-1)[0]} · {fmtDate(d.createdAt)}</span>
                </div>
              ))
            }
          </div>

          {/* Recent logs */}
          {status?.recentLogs && status.recentLogs.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] font-semibold text-[#434e56] uppercase tracking-widest">Recent Push Attempts</p>
              {status.recentLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="text-[9px] leading-relaxed">
                  <span className="text-[#708289]">{fmtDate(log.createdAt)}</span>
                  <span className="text-[#434e56]"> · {log.trigger} · </span>
                  <span className={log.sent > 0 ? "text-green-400" : "text-[#434e56]"}>✓{log.sent}</span>
                  {log.failed > 0 && <span className="text-red-400"> ✗{log.failed}</span>}
                  {log.emailFallback && <span className="text-blue-400"> ✉email</span>}
                  {log.errors.map((e, i) => (
                    <div key={i} className="text-red-400 text-[8px] ml-2 truncate">{e}</div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Test result */}
          {testResult && (
            <div className={`rounded p-2 text-[9px] ${testResult.push.sent > 0 ? "bg-green-900/20 border border-green-800/30 text-green-400" : "bg-amber-900/20 border border-amber-800/30 text-amber-400"}`}>
              Push: sent={testResult.push.sent} failed={testResult.push.failed}
              {testResult.email && <span> · Email: {testResult.email.ok ? "sent ✓" : `failed (${testResult.email.error})`}</span>}
              {testResult.push.errors.map((e, i) => <div key={i} className="text-red-400 mt-0.5 truncate">{e}</div>)}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={sendTest}
              disabled={testing}
              className="flex-1 text-[10px] font-semibold bg-[#1a2028] border border-[#2d3840] text-[#e9f0ef] hover:bg-[#2d3840] disabled:opacity-50 rounded px-2 py-1.5 transition-colors"
            >
              {testing ? "Sending…" : "Send Test Push"}
            </button>
            {subscribed && (
              <button
                onClick={unsubscribe}
                disabled={unsubLoading}
                className="text-[10px] text-red-500 hover:text-red-400 disabled:opacity-50 px-2 py-1.5"
              >
                {unsubLoading ? "…" : "Disable"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-green-400" : "bg-red-500"}`} />
      <span className="text-[10px] text-[#708289]">{label}</span>
      <span className={`ml-auto text-[9px] ${ok ? "text-green-500" : "text-red-500"}`}>{ok ? "OK" : "Missing"}</span>
    </div>
  );
}

// ── Small toggle for nav footer (kept for backward compat) ────────────────────

export function PushToggle() {
  return null; // replaced by PushDebugPanel in AdminNav
}
