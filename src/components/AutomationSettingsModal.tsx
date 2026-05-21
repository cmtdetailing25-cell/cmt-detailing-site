"use client";

import { useState } from "react";

interface AutomationSettingsData {
  id:                        string;
  n8nBaseUrl:                string | null;
  socialWorkflowWebhookUrl:  string | null;
  trendWorkflowWebhookUrl:   string | null;
  canvaWorkflowWebhookUrl:   string | null;
  remotionWorkflowWebhookUrl:string | null;
  metaAdsWorkflowWebhookUrl: string | null;
  webhookSecret:             string | null;
  webhookSecretIsSet:        boolean;
  isEnabled:                 boolean;
}

interface Props {
  initialSettings: AutomationSettingsData | null;
  onClose:   () => void;
  onSaved:   () => void;
}

export default function AutomationSettingsModal({ initialSettings, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    n8nBaseUrl:                initialSettings?.n8nBaseUrl                ?? "",
    socialWorkflowWebhookUrl:  initialSettings?.socialWorkflowWebhookUrl  ?? "",
    trendWorkflowWebhookUrl:   initialSettings?.trendWorkflowWebhookUrl   ?? "",
    canvaWorkflowWebhookUrl:   initialSettings?.canvaWorkflowWebhookUrl   ?? "",
    remotionWorkflowWebhookUrl:initialSettings?.remotionWorkflowWebhookUrl ?? "",
    metaAdsWorkflowWebhookUrl: initialSettings?.metaAdsWorkflowWebhookUrl  ?? "",
    webhookSecret:             "",
    isEnabled: initialSettings?.isEnabled ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [saved,  setSaved]  = useState(false);

  function set(k: string, v: string | boolean) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { ...form };
      if (!form.webhookSecret) delete body.webhookSecret;
      const res  = await fetch("/api/admin/automation/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); setSaving(false); return; }
      setSaved(true);
      setTimeout(() => { onSaved(); onClose(); }, 800);
    } catch {
      setError("Network error — try again");
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-[#1e2730] border border-[#434e56] rounded-lg px-3 py-2.5 text-sm text-[#e9f0ef] placeholder-[#434e56] focus:outline-none focus:border-[#94b2b6] font-mono transition-colors";
  const labelClass = "block text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#151b23] border border-[#434e56] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2d3840]">
          <div>
            <h2 className="text-[#e9f0ef] font-semibold text-sm">Automation Settings</h2>
            <p className="text-[#708289] text-xs mt-0.5">n8n webhook URLs — server-side only, never exposed publicly</p>
          </div>
          <button onClick={onClose} className="text-[#708289] hover:text-white transition-colors p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Enable toggle */}
          <div className="flex items-center justify-between bg-[#1e2730] border border-[#434e56] rounded-xl px-4 py-3">
            <div>
              <p className="text-[#e9f0ef] text-sm font-medium">Enable Automation</p>
              <p className="text-[#434e56] text-xs">Master switch — disabling prevents all n8n calls</p>
            </div>
            <button
              type="button"
              onClick={() => set("isEnabled", !form.isEnabled)}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.isEnabled ? "bg-green-600" : "bg-[#434e56]"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* n8n Base URL */}
          <div>
            <label className={labelClass}>n8n Base URL</label>
            <input type="url" value={form.n8nBaseUrl} onChange={(e) => set("n8nBaseUrl", e.target.value)}
              placeholder="https://your-n8n.app.n8n.cloud" className={inputClass} />
          </div>

          {/* Webhook URLs */}
          <div className="space-y-3">
            <p className="text-[10px] text-[#708289] uppercase tracking-wider font-semibold">Workflow Webhook URLs</p>
            {[
              { key: "socialWorkflowWebhookUrl",   label: "Social / Strategy Workflow",  ph: "https://…/webhook/social" },
              { key: "trendWorkflowWebhookUrl",     label: "Trend Research Workflow",     ph: "https://…/webhook/trends" },
              { key: "canvaWorkflowWebhookUrl",     label: "Canva Assets Workflow",       ph: "https://…/webhook/canva" },
              { key: "remotionWorkflowWebhookUrl",  label: "Remotion Video Workflow",     ph: "https://…/webhook/remotion" },
              { key: "metaAdsWorkflowWebhookUrl",   label: "Meta Ads Workflow",           ph: "https://…/webhook/meta-ads" },
            ].map(({ key, label, ph }) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input type="url" value={((form as unknown) as Record<string, string>)[key] ?? ""}
                  onChange={(e) => set(key, e.target.value)} placeholder={ph} className={inputClass} />
              </div>
            ))}
          </div>

          {/* Webhook secret */}
          <div>
            <label className={labelClass}>
              Callback Webhook Secret
              {initialSettings?.webhookSecretIsSet && <span className="ml-1 text-green-400 normal-case tracking-normal font-normal">(currently set)</span>}
            </label>
            <input
              type="password"
              value={form.webhookSecret}
              onChange={(e) => set("webhookSecret", e.target.value)}
              placeholder={initialSettings?.webhookSecretIsSet ? "Leave blank to keep existing secret" : "Set a strong random secret"}
              className={inputClass}
            />
            <p className="text-[#434e56] text-[10px] mt-1">n8n must send this as X-Webhook-Secret header in callback requests</p>
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">{error}</p>
          )}
          {saved && (
            <p className="text-green-400 text-xs text-center">Settings saved ✓</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-[#434e56] disabled:text-[#708289] text-[#151b23] text-sm font-bold py-2.5 rounded-lg transition-colors">
              {saving ? "Saving…" : "Save Settings"}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-[#708289] hover:text-white transition-colors px-3 py-2.5">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
