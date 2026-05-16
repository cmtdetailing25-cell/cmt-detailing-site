"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { ClientStatus } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientRow {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: ClientStatus;
  isVip: boolean;
  createdAt: string;
  _count: { vehicles: number; detailJobs: number };
  detailJobs: { jobDate: string | null; serviceType: string | null; title: string }[];
  vehicles: { year: string; make: string; model: string; color: string | null }[];
}

const STATUS_LABELS: Record<ClientStatus, { label: string; cls: string }> = {
  LEAD:        { label: "Lead",        cls: "bg-blue-900/40 text-blue-400" },
  ACTIVE:      { label: "Active",      cls: "bg-green-900/40 text-green-400" },
  MAINTENANCE: { label: "Maintenance", cls: "bg-yellow-900/40 text-yellow-400" },
  INACTIVE:    { label: "Inactive",    cls: "bg-gray-800 text-gray-500" },
};

const SERVICE_TYPES = [
  "Full Detail",
  "Exterior Detail",
  "Interior Detail",
  "Ceramic Coating",
  "Paint Correction",
  "Maintenance Wash",
  "Window Tint",
  "PPF",
  "Other",
];

// ─── Create client modal ───────────────────────────────────────────────────────

function CreateClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: ClientRow) => void }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    city: "", state: "MA", leadSource: "", status: "LEAD" as ClientStatus, isVip: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); setSaving(false); return; }
      onCreated(data);
      onClose();
    } catch {
      setError("Network error");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-white font-semibold text-base mb-5">New Client</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">First Name *</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Last Name *</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">City</label>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">State</label>
              <input
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ClientStatus }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]"
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Lead Source</label>
              <input
                value={form.leadSource}
                onChange={(e) => setForm((f) => ({ ...f, leadSource: e.target.value }))}
                placeholder="Instagram, referral…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6] placeholder-gray-700"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isVip}
              onChange={(e) => setForm((f) => ({ ...f, isVip: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-gray-400">VIP client</span>
          </label>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-gray-700 text-[#151b23] text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
            >
              {saving ? "Saving…" : "Create Client"}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients]         = useState<ClientRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "ALL">("ALL");
  const [showCreate, setShowCreate]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/clients");
    const data = await res.json();
    setClients(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.fullName.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) || c.phone?.includes(q) || false;
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const vipCount    = clients.filter((c) => c.isVip).length;
  const activeCount = clients.filter((c) => c.status === "ACTIVE").length;
  const leadCount   = clients.filter((c) => c.status === "LEAD").length;

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Clients</h1>
          <p className="text-gray-400 text-sm">Client profiles, vehicles, and service history.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-[#94b2b6] hover:bg-[#7a9ea3] text-[#151b23] text-sm font-bold px-4 py-2.5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Clients", value: clients.length },
          { label: "Active",        value: activeCount, accent: "text-green-400" },
          { label: "Leads",         value: leadCount,   accent: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.accent ?? "text-white"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#94b2b6]"
          />
        </div>
        <div className="flex gap-1.5">
          {(["ALL", "LEAD", "ACTIVE", "MAINTENANCE", "INACTIVE"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-2 rounded-lg transition-colors ${
                statusFilter === s
                  ? "bg-[#94b2b6] text-[#151b23] font-bold"
                  : "bg-gray-900 border border-gray-800 text-gray-500 hover:text-white"
              }`}
            >
              {s === "ALL" ? "All" : STATUS_LABELS[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-gray-600 py-12 text-center">Loading clients…</div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-gray-800 rounded-xl px-6 py-16 flex flex-col items-center text-center gap-3">
          <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">
            {clients.length === 0 ? "No clients yet" : "No clients match your search"}
          </p>
          {clients.length === 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="text-xs text-[#94b2b6] hover:text-white transition-colors"
            >
              Create your first client →
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/60">
                <th className="text-left text-[10px] text-gray-600 uppercase tracking-widest font-semibold px-4 py-3">Client</th>
                <th className="text-left text-[10px] text-gray-600 uppercase tracking-widest font-semibold px-4 py-3 hidden sm:table-cell">Contact</th>
                <th className="text-left text-[10px] text-gray-600 uppercase tracking-widest font-semibold px-4 py-3 hidden md:table-cell">Primary Vehicle</th>
                <th className="text-left text-[10px] text-gray-600 uppercase tracking-widest font-semibold px-4 py-3 hidden lg:table-cell">Last Service</th>
                <th className="text-left text-[10px] text-gray-600 uppercase tracking-widest font-semibold px-4 py-3">Status</th>
                <th className="text-right text-[10px] text-gray-600 uppercase tracking-widest font-semibold px-4 py-3">Jobs</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client, idx) => {
                const primaryVehicle = client.vehicles[0];
                const lastJob        = client.detailJobs[0];
                const isEven         = idx % 2 === 0;

                return (
                  <tr
                    key={client.id}
                    className={`border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors ${isEven ? "bg-gray-900/20" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/admin/clients/${client.id}`} className="group">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-gray-400">
                              {client.firstName[0]}{client.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium group-hover:text-[#94b2b6] transition-colors flex items-center gap-1.5">
                              {client.fullName}
                              {client.isVip && (
                                <span className="text-[9px] bg-yellow-900/40 text-yellow-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">VIP</span>
                              )}
                            </p>
                            {client.city && (
                              <p className="text-[11px] text-gray-600">{client.city}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-xs text-gray-400">{client.email ?? "—"}</p>
                      <p className="text-xs text-gray-600">{client.phone ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {primaryVehicle ? (
                        <p className="text-xs text-gray-400">
                          {primaryVehicle.year} {primaryVehicle.make} {primaryVehicle.model}
                          {primaryVehicle.color && <span className="text-gray-600"> · {primaryVehicle.color}</span>}
                        </p>
                      ) : (
                        <span className="text-xs text-gray-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {lastJob ? (
                        <div>
                          <p className="text-xs text-gray-400">{lastJob.serviceType ?? lastJob.title}</p>
                          {lastJob.jobDate && (
                            <p className="text-[11px] text-gray-600">
                              {new Date(lastJob.jobDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-700">No jobs yet</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_LABELS[client.status].cls}`}>
                        {STATUS_LABELS[client.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <p className="text-sm font-semibold text-white">{client._count.detailJobs}</p>
                        <p className="text-[10px] text-gray-600">{client._count.vehicles} vehicle{client._count.vehicles !== 1 ? "s" : ""}</p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-700 mt-3">
          {filtered.length} of {clients.length} client{clients.length !== 1 ? "s" : ""}
          {vipCount > 0 && ` · ${vipCount} VIP`}
        </p>
      )}

      {showCreate && (
        <CreateClientModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => { setClients((prev) => [c, ...prev]); }}
        />
      )}
    </div>
  );
}
