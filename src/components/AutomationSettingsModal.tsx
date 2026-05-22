"use client";

import { useState, useEffect } from "react";

// Shape returned by GET /api/admin/automation/settings
// webhookSecret is always redacted server-side — only webhookSecretIsSet is exposed
export interface LiveAutomationSettings {
  id: string;
  isEnabled: boolean;
  n8nBaseUrl: string | null;
  socialWorkflowWebhookUrl: string | null;
  trendWorkflowWebhookUrl: string | null;
  canvaWorkflowWebhookUrl: string | null;
  remotionWorkflowWebhookUrl: string | null;
  metaAdsWorkflowWebhookUrl: string | null;
  webhookSecretIsSet: boolean;
}

interface FormState {
  isEnabled: boolean;
  n8nBaseUrl: string;
  socialWorkflowWebhookUrl: string;
  trendWorkflowWebhookUrl: string;
  canvaWorkflowWebhookUrl: string;
  remotionWorkflowWebhookUrl: string;
  metaAdsWorkflowWebhookUrl: string;
  webhookSecret: string; // always blank on load — only set when user types a new secret
}

interface Props {
  onClose: () => void;
  onSaved: (updated: LiveAutomationSettings) => void;
}

const EMPTY_FORM: FormState = {
  isEnabled: false,
  n8nBaseUrl: "",
  socialWorkflowWebhookUrl: "",
  trendWorkflowWebhookUrl: "",
  canvaWorkflowWebhookUrl: "",
  remotionWorkflowWebhookUrl: "",
  metaAdsWorkflowWebhookUrl: "",
  webhookSecret: "",
};

function settingsToForm(s: LiveAutomationSettings): FormState {
  return {
    isEnabled:                  s.isEnabled,
    n8nBaseUrl:                 s.n8nBaseUrl                 ?? "",
    socialWorkflowWebhookUrl:   s.socialWorkflowWebhookUrl   ?? "",
    trendWorkflowWebhookUrl:    s.trendWorkflowWebhookUrl    ?? "",
    canvaWorkflowWebhookUrl:    s.canvaWorkflowWebhookUrl    ?? "",
    remotionWorkflowWebhookUrl: s.remotionWorkflowWebhookUrl ?? "",
    metaAdsWorkflowWebhookUrl:  s.metaAdsWorkflowWebhookUrl  ?? "",
    webhookSecret: "", // never pre-fill — blank means "keep existing"
  };
}

const WEBHOOK_FIELDS: { key: keyof Omit<FormState, "isEnabled" | "webhookSecret">; label: string; ph: string }[] = [
  { key: "socialWorkflowWebhookUrl",   label: "Social / Strategy Workflow", ph: "https://…/webhook/social"   },
  { key: "trendWorkflowWebhookUrl",    label: "Trend Research Workflow",    ph: "https://…/webhook/trends"   },
  { key: "canvaWorkflowWebhookUrl",    label: "Canva Assets Workflow",      ph: "https://…/webhook/canva"    },
  { key: "remotionWorkflowWebhookUrl", label: "Remotion Video Workflow",    ph: "https://…/webhook/remotion" },
  { key: "metaAdsWorkflowWebhookUrl",  label: "Meta Ads Workflow",          ph: "https://…/webhook/meta-ads" },
];

export default function AutomationSettingsModal({ onClose, onSaved }: Props) {
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [secretIsSet,setSecretIsSet]= useState(false);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Fetch fresh settings every time the modal mounts ─────────────────────────
  useEffect(() => {
    setLoading(true);
    setFetchError(null);

    fetch("/api/admin/automation/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          console.log("[AutomationSettings] Loaded from DB:", {
            ...data.settings,
            webhookSecret: "[REDACTED]",
          });
          setForm(settingsToForm(data.settings));
          setSecretIsSet(Boolean(data.settings.webhookSecretIsSet));
        } else {
          setFetchError(data.error ?? "Failed to load settings");
        }
      })
      .catch((err) => {
        console.error("[AutomationSettings] Load error:", err);
        setFetchError("Network error loading settings — check console");
      })
      .finally(() => setLoading(false));
  }, []); // empty dep array — runs once per modal mount

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    // Build the payload — omit webhookSecret entirely if blank (preserve existing)
    const payload: Record<string, unknown> = {
      isEnabled:                  form.isEnabled,
      n8nBaseUrl:                 form.n8nBaseUrl                 || null,
      socialWorkflowWebhookUrl:   form.socialWorkflowWebhookUrl   || null,
      trendWorkflowWebhookUrl:    form.trendWorkflowWebhookUrl    || null,
      canvaWorkflowWebhookUrl:    form.canvaWorkflowWebhookUrl    || null,
      remotionWorkflowWebhookUrl: form.remotionWorkflowWebhookUrl || null,
      metaAdsWorkflowWebhookUrl:  form.metaAdsWorkflowWebhookUrl  || null,
    };
    if (form.webhookSecret) {
      payload.webhookSecret = form.webhookSecret;
    }

    console.log("[AutomationSettings] Submitting payload:", {
      ...payload,
      ...(form.webhookSecret ? { webhookSecret: "[REDACTED]" } : {}),
    });

    try {
      const res  = await fetch("/api/admin/automation/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      console.log("[AutomationSettings] API response:", {
        ok:       res.ok,
        status:   res.status,
        settings: data.settings ? { ...data.settings, webhookSecret: "[REDACTED]" } : null,
        error:    data.error,
      });

      if (res.ok && data.settings) {
        // Re-hydrate form from the server's returned values (source of truth)
        setForm(settingsToForm(data.settings));
        setSecretIsSet(Boolean(data.settings.webhookSecretIsSet));
        setToast({ type: "success", text: "Automation settings saved" });
        setSaving(false);
        // Give user a moment to see the toast, then notify parent
        setTimeout(() => onSaved(data.settings), 1200);
      } else {
        setToast({ type: "error", text: data.error ?? "Failed to save automation settings" });
        setSaving(false);
      }
    } catch (err) {
      console.error("[AutomationSettings] Save error:", err);
      setToast({ type: "error", text: "Network error — try again" });
      setSaving(false);
    }
  }

  const inputCls =
    "w-full bg-[#1e2730] border border-[#434e56] rounded-lg px-3 py-2.5 text-sm text-[#e9f0ef] placeholder-[#434e56] focus:outline-none focus:border-[#94b2b6] font-mono transition-colors";
  const labelCls =
    "block text-[10px] text-[#708289] uppercase tracking-wider font-semibold mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#151b23] border border-[#434e56] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2d3840] shrink-0">
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

        {/* Toast banner */}
        {toast && (
          <div className={`mx-6 mt-4 shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-900/40 border border-green-700/50 text-green-300"
              : "bg-red-900/40 border border-red-700/50 text-red-300"
          }`}>
            {toast.type === "success" ? (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
            )}
            {toast.text}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="px-6 py-12 text-center">
              <p className="text-xs text-[#708289]">Loading settings…</p>
            </div>
          )}

          {!loading && fetchError && (
            <div className="p-6">
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
                {fetchError}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-xs text-[#708289] hover:text-white transition-colors"
              >
                Reload page
              </button>
            </div>
          )}

          {!loading && !fetchError && (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Enable toggle */}
              <div className="flex items-center justify-between bg-[#1e2730] border border-[#434e56] rounded-xl px-4 py-3">
                <div>
                  <p className="text-[#e9f0ef] text-sm font-medium">Enable Automation</p>
                  <p className="text-[#434e56] text-xs">Master switch — disabling prevents all n8n calls</p>
                </div>
                <button
                  type="button"
                  onClick={() => setField("isEnabled", !form.isEnabled)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.isEnabled ? "bg-green-600" : "bg-[#434e56]"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {/* n8n Base URL */}
              <div>
                <label className={labelCls}>n8n Base URL</label>
                <input
                  type="url"
                  value={form.n8nBaseUrl}
                  onChange={(e) => setField("n8nBaseUrl", e.target.value)}
                  placeholder="https://your-n8n.app.n8n.cloud"
                  className={inputCls}
                />
              </div>

              {/* Webhook URLs */}
              <div className="space-y-3">
                <p className="text-[10px] text-[#708289] uppercase tracking-wider font-semibold">Workflow Webhook URLs</p>
                {WEBHOOK_FIELDS.map(({ key, label, ph }) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <input
                      type="url"
                      value={form[key]}
                      onChange={(e) => setField(key, e.target.value)}
                      placeholder={ph}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>

              {/* Webhook secret */}
              <div>
                <label className={labelCls}>
                  Callback Webhook Secret
                  {secretIsSet && (
                    <span className="ml-1.5 text-green-400 normal-case tracking-normal font-normal">(currently set)</span>
                  )}
                </label>
                <input
                  type="password"
                  value={form.webhookSecret}
                  onChange={(e) => setField("webhookSecret", e.target.value)}
                  placeholder={secretIsSet ? "Leave blank to keep existing secret" : "Set a strong random secret"}
                  className={inputCls}
                />
                <p className="text-[#434e56] text-[10px] mt-1">
                  n8n must send this as <code className="text-[#708289]">X-Webhook-Secret</code> header in callback requests
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-[#434e56] disabled:text-[#708289] text-[#151b23] text-sm font-bold py-2.5 rounded-lg transition-colors"
                >
                  {saving ? "Saving…" : "Save Settings"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm text-[#708289] hover:text-white transition-colors px-3 py-2.5"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
