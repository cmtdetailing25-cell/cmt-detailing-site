"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProspectStatus } from "@prisma/client";

const OPTIONS: { value: ProspectStatus; label: string }[] = [
  { value: "STAGED", label: "Staged" },
  { value: "SENT", label: "Sent" },
  { value: "REPLIED", label: "Replied" },
  { value: "BOOKED", label: "Booked" },
  { value: "NO_RESPONSE", label: "No response" },
  { value: "EXCLUDED", label: "Excluded" },
  { value: "WATCHLIST", label: "Watchlist" },
];

export default function StatusSelect({
  id,
  current,
}: {
  id: string;
  current: ProspectStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<ProspectStatus>(current);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: ProspectStatus) {
    if (next === value) return;
    const prev = value;
    setValue(next);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/prospects/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setValue(prev);
        setError(data?.error ?? "Failed to update status");
      } else {
        router.refresh();
      }
    } catch {
      setValue(prev);
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label className="block text-[11px] text-gray-500 mb-1">Status (updates only — nothing is sent)</label>
      <select
        value={value}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value as ProspectStatus)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6] disabled:opacity-60"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {saving && <span className="text-gray-500 text-xs ml-2">Saving…</span>}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
