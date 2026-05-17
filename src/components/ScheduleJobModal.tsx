"use client";

import { useState } from "react";

interface Props {
  leadId: string;
  jobId:  string | null;
  jobTitle: string;
  defaultDate?: string;   // "2026-05-24"
  defaultTime?: string;   // "10:00 AM" or "10:00"
  onClose: () => void;
  onScheduled: () => void;
}

function toTimeInput(raw: string | undefined): string {
  if (!raw) return "09:00";
  const m = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return "09:00";
  let h = parseInt(m[1], 10);
  const min = m[2];
  const meridian = m[3]?.toUpperCase();
  if (meridian === "PM" && h !== 12) h += 12;
  if (meridian === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

export default function ScheduleJobModal({
  leadId,
  jobTitle,
  defaultDate,
  defaultTime,
  onClose,
  onScheduled,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [date,       setDate]       = useState(defaultDate ?? today);
  const [startTime,  setStartTime]  = useState(toTimeInput(defaultTime));
  const [endTime,    setEndTime]    = useState(() => {
    const [h, m] = toTimeInput(defaultTime).split(":").map(Number);
    const endH = (h + 2) % 24;
    return `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  });
  const [notes,      setNotes]      = useState("");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const scheduledStart = `${date}T${startTime}:00`;
    const scheduledEnd   = `${date}T${endTime}:00`;

    try {
      const res = await fetch(`/api/admin/bookings/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          scheduledStart,
          scheduledEnd,
          jobDate: date,
          scheduleNotes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to schedule"); setSaving(false); return; }
      onScheduled();
      onClose();
    } catch {
      setError("Network error — try again");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#151b23] border border-[#434e56] rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#434e56]">
          <div>
            <h2 className="text-white font-semibold text-sm">Schedule Job</h2>
            <p className="text-[#708289] text-xs mt-0.5 truncate max-w-xs">{jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#708289] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#434e56]/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-[11px] text-[#708289] uppercase tracking-wider font-semibold mb-1.5">Date</label>
            <input
              type="date"
              required
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#1e2730] border border-[#434e56] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#94b2b6] transition-colors"
            />
          </div>

          {/* Start / End time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#708289] uppercase tracking-wider font-semibold mb-1.5">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#1e2730] border border-[#434e56] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#94b2b6] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#708289] uppercase tracking-wider font-semibold mb-1.5">End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[#1e2730] border border-[#434e56] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#94b2b6] transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] text-[#708289] uppercase tracking-wider font-semibold mb-1.5">Schedule Notes <span className="text-[#434e56] normal-case tracking-normal font-normal">(optional)</span></label>
            <textarea
              rows={2}
              placeholder="e.g. Client will drop off at 9:50. Gate code: 4521."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#1e2730] border border-[#434e56] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#434e56] focus:outline-none focus:border-[#94b2b6] resize-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-[#434e56] disabled:text-[#708289] text-[#151b23] text-sm font-bold py-2.5 rounded-lg transition-colors"
            >
              {saving ? "Scheduling…" : "Confirm Schedule"}
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
      </div>
    </div>
  );
}
