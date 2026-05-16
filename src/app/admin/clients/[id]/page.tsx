"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ClientStatus } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Vehicle {
  id: string; clientId: string; year: string; make: string; model: string;
  trim: string | null; color: string | null; plate: string | null;
  vin: string | null; nickname: string | null; notes: string | null;
  isPrimary: boolean; createdAt: string; updatedAt: string;
}

interface DetailJobSummary {
  id: string; title: string; serviceType: string | null; jobDate: string | null;
  price: number | null; isSocialReady: boolean; isFeatured: boolean; createdAt: string;
  vehicle: { year: string; make: string; model: string; color: string | null } | null;
  _count: { photos: number; socialDrafts: number };
}

interface Client {
  id: string; firstName: string; lastName: string; fullName: string;
  email: string | null; phone: string | null; city: string | null; state: string | null;
  notes: string | null; tags: string[]; leadSource: string | null;
  status: ClientStatus; isVip: boolean; createdAt: string; updatedAt: string;
  vehicles: Vehicle[];
  detailJobs: DetailJobSummary[];
}

const STATUS_LABELS: Record<ClientStatus, { label: string; cls: string }> = {
  LEAD:        { label: "Lead",        cls: "bg-blue-900/40 text-blue-400" },
  ACTIVE:      { label: "Active",      cls: "bg-green-900/40 text-green-400" },
  MAINTENANCE: { label: "Maintenance", cls: "bg-yellow-900/40 text-yellow-400" },
  INACTIVE:    { label: "Inactive",    cls: "bg-gray-800 text-gray-500" },
};

// ─── Add Vehicle Modal ────────────────────────────────────────────────────────

function AddVehicleModal({
  clientId,
  onClose,
  onAdded,
}: {
  clientId: string;
  onClose: () => void;
  onAdded: (v: Vehicle) => void;
}) {
  const [form, setForm] = useState({
    year: "", make: "", model: "", trim: "", color: "", plate: "", vin: "", nickname: "", notes: "", isPrimary: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, clientId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); setSaving(false); return; }
      onAdded(data);
      onClose();
    } catch { setError("Network error"); setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-white font-semibold text-base mb-5">Add Vehicle</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Year *</label>
              <input required value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                placeholder="2022" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Make *</label>
              <input required value={form.make} onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
                placeholder="BMW" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Model *</label>
              <input required value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                placeholder="X5" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Trim</label>
              <input value={form.trim} onChange={(e) => setForm((f) => ({ ...f, trim: e.target.value }))}
                placeholder="xDrive40i" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Color</label>
              <input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                placeholder="Carbon Black" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Plate</label>
              <input value={form.plate} onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Nickname</label>
              <input value={form.nickname} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
                placeholder="The Beast" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))} className="rounded" />
            <span className="text-sm text-gray-400">Mark as primary vehicle</span>
          </label>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-gray-700 text-[#151b23] text-sm font-bold px-5 py-2.5 rounded-lg transition-colors">
              {saving ? "Saving…" : "Add Vehicle"}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-white transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Job Modal ────────────────────────────────────────────────────────────

function AddJobModal({
  clientId,
  vehicles,
  onClose,
  onAdded,
}: {
  clientId: string;
  vehicles: Vehicle[];
  onClose: () => void;
  onAdded: (j: DetailJobSummary) => void;
}) {
  const primary = vehicles.find((v) => v.isPrimary) ?? vehicles[0];
  const [form, setForm] = useState({
    vehicleId: primary?.id ?? "",
    title: "", serviceType: "", jobDate: new Date().toISOString().slice(0, 10),
    location: "Taunton, MA", description: "", price: "", isSocialReady: false, isFeatured: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // Auto-fill title when vehicle + service type are chosen
  useEffect(() => {
    const v = vehicles.find((x) => x.id === form.vehicleId);
    if (v && form.serviceType && !form.title) {
      const color  = v.color ? `${v.color} ` : "";
      const date   = form.jobDate || new Date().toISOString().slice(0, 10);
      setForm((f) => ({
        ...f,
        title: `${date} ${color}${v.year} ${v.make} ${v.model} ${form.serviceType}`,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.vehicleId, form.serviceType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        clientId,
        price: form.price !== "" ? parseFloat(form.price) : null,
      };
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); setSaving(false); return; }
      onAdded(data);
      onClose();
    } catch { setError("Network error"); setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-white font-semibold text-base mb-5">New Detail Job</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Vehicle</label>
              <select value={form.vehicleId} onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value, title: "" }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]">
                <option value="">No vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.year} {v.make} {v.model}{v.color ? ` (${v.color})` : ""}
                    {v.isPrimary ? " ★" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Service Type</label>
              <select value={form.serviceType} onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value, title: "" }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]">
                <option value="">Select service…</option>
                {["Full Detail", "Exterior Detail", "Interior Detail", "Ceramic Coating",
                  "Paint Correction", "Maintenance Wash", "Window Tint", "PPF", "Other"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Job Title *</label>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Auto-filled or enter manually…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6] placeholder-gray-700" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Date</label>
              <input type="date" value={form.jobDate} onChange={(e) => setForm((f) => ({ ...f, jobDate: e.target.value, title: "" }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Location</label>
              <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6]" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Price ($)</label>
              <input type="number" min="0" step="0.01" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6] placeholder-gray-700" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Notes</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#94b2b6] resize-none" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isSocialReady} onChange={(e) => setForm((f) => ({ ...f, isSocialReady: e.target.checked }))} className="rounded" />
              <span className="text-sm text-gray-400">Social ready</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} className="rounded" />
              <span className="text-sm text-gray-400">Featured</span>
            </label>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-gray-700 text-[#151b23] text-sm font-bold px-5 py-2.5 rounded-lg transition-colors">
              {saving ? "Saving…" : "Create Job"}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-white transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [client, setClient]         = useState<Client | null>(null);
  const [loading, setLoading]       = useState(true);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);
  const [editMode, setEditMode]     = useState(false);
  const [editForm, setEditForm]     = useState<Partial<Client>>({});
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/admin/clients/${params.id}`);
    if (!res.ok) { router.push("/admin/clients"); return; }
    const data = await res.json();
    setClient(data);
    setEditForm(data);
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!client) return;
    setSaving(true);
    const res = await fetch(`/api/admin/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    setClient((prev) => prev ? { ...prev, ...data } : prev);
    setEditMode(false);
    setSaving(false);
  }

  async function handleDelete() {
    if (!client || !confirm(`Delete ${client.fullName}? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/clients/${client.id}`, { method: "DELETE" });
    router.push("/admin/clients");
  }

  if (loading) return (
    <div className="p-6 text-sm text-gray-600">Loading client…</div>
  );
  if (!client) return null;

  const totalPhotos  = client.detailJobs.reduce((s, j) => s + j._count.photos, 0);
  const totalDrafts  = client.detailJobs.reduce((s, j) => s + j._count.socialDrafts, 0);
  const totalRevenue = client.detailJobs.reduce((s, j) => s + (j.price ?? 0), 0);

  return (
    <div className="p-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-5">
        <Link href="/admin/clients" className="hover:text-gray-300 transition-colors">Clients</Link>
        <span>/</span>
        <span className="text-gray-400">{client.fullName}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
            <span className="text-base font-bold text-gray-400">
              {client.firstName[0]}{client.lastName[0]}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{client.fullName}</h1>
              {client.isVip && (
                <span className="text-[9px] bg-yellow-900/40 text-yellow-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">VIP</span>
              )}
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_LABELS[client.status].cls}`}>
                {STATUS_LABELS[client.status].label}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {[client.city, client.state].filter(Boolean).join(", ") || "Location unknown"}
              {client.leadSource && <span className="text-gray-600"> · via {client.leadSource}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditMode(!editMode)}
            className="text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-600 px-3 py-2 rounded-lg transition-colors">
            {editMode ? "Cancel" : "Edit"}
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="text-xs text-red-500 hover:text-red-400 border border-red-900/40 hover:border-red-800 px-3 py-2 rounded-lg transition-colors">
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {[
          { label: "Detail Jobs",    value: String(client.detailJobs.length) },
          { label: "Vehicles",       value: String(client.vehicles.length) },
          { label: "Photos",         value: String(totalPhotos) },
          { label: "Social Drafts",  value: String(totalDrafts) },
          { label: "Total Revenue",  value: totalRevenue > 0 ? `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "—" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: info + vehicles */}
        <div className="lg:col-span-1 space-y-5">

          {/* Contact info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3">Contact</p>
            {editMode ? (
              <div className="space-y-2.5">
                {[
                  { key: "email",  label: "Email",  type: "email" },
                  { key: "phone",  label: "Phone",  type: "text"  },
                  { key: "city",   label: "City",   type: "text"  },
                  { key: "state",  label: "State",  type: "text"  },
                  { key: "leadSource", label: "Lead Source", type: "text" },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block text-[10px] text-gray-600 mb-1">{label}</label>
                    <input type={type} value={(editForm as Record<string, string>)[key] ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#94b2b6]" />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] text-gray-600 mb-1">Status</label>
                  <select value={editForm.status ?? client.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as ClientStatus }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#94b2b6]">
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editForm.isVip ?? false}
                    onChange={(e) => setEditForm((f) => ({ ...f, isVip: e.target.checked }))} className="rounded" />
                  <span className="text-xs text-gray-400">VIP</span>
                </label>
                <div>
                  <label className="block text-[10px] text-gray-600 mb-1">Notes</label>
                  <textarea rows={3} value={editForm.notes ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#94b2b6] resize-none" />
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="w-full bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-gray-700 text-[#151b23] text-xs font-bold py-2 rounded-lg transition-colors">
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { label: "Email",       value: client.email },
                  { label: "Phone",       value: client.phone },
                  { label: "City",        value: client.city },
                  { label: "Lead Source", value: client.leadSource },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-xs text-gray-600">{label}</span>
                    <span className="text-xs text-gray-300 text-right">{value ?? "—"}</span>
                  </div>
                ))}
                {client.notes && (
                  <div className="pt-2 border-t border-gray-800">
                    <p className="text-[10px] text-gray-600 mb-1">Notes</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{client.notes}</p>
                  </div>
                )}
                <p className="text-[10px] text-gray-700 pt-1">
                  Client since {new Date(client.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              </div>
            )}
          </div>

          {/* Vehicles */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                Vehicles ({client.vehicles.length})
              </p>
              <button onClick={() => setShowAddVehicle(true)}
                className="text-xs text-[#94b2b6] hover:text-white transition-colors">
                + Add
              </button>
            </div>
            {client.vehicles.length === 0 ? (
              <p className="text-xs text-gray-700 italic">No vehicles added.</p>
            ) : (
              <div className="space-y-3">
                {client.vehicles.map((v) => (
                  <div key={v.id} className="border-b border-gray-800/50 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-sm text-white font-medium">
                        {v.year} {v.make} {v.model}
                        {v.nickname && <span className="text-gray-500"> "{v.nickname}"</span>}
                      </p>
                      {v.isPrimary && (
                        <span className="text-[9px] bg-[#94b2b6]/20 text-[#94b2b6] px-1.5 py-0.5 rounded font-bold">PRIMARY</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {[v.color, v.trim, v.plate].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: jobs timeline */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
              Detail Jobs ({client.detailJobs.length})
            </p>
            <div className="flex gap-2">
              <Link href={`/admin/media/import?clientId=${client.id}`}
                className="text-xs text-gray-500 hover:text-white border border-gray-800 px-3 py-1.5 rounded-lg transition-colors">
                Import Media
              </Link>
              <button onClick={() => setShowAddJob(true)}
                className="text-xs bg-[#94b2b6] hover:bg-[#7a9ea3] text-[#151b23] font-bold px-3 py-1.5 rounded-lg transition-colors">
                + New Job
              </button>
            </div>
          </div>

          {client.detailJobs.length === 0 ? (
            <div className="border border-dashed border-gray-800 rounded-xl p-10 flex flex-col items-center text-center gap-3">
              <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm font-medium text-gray-500">No jobs yet</p>
              <p className="text-xs text-gray-600">Create a detail job to start tracking service history and media.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {client.detailJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/admin/jobs/${job.id}`}
                  className="block bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {job.isSocialReady && (
                          <span className="text-[9px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Social ✓</span>
                        )}
                        {job.isFeatured && (
                          <span className="text-[9px] bg-yellow-900/40 text-yellow-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Featured</span>
                        )}
                      </div>
                      <p className="text-sm text-white font-medium group-hover:text-[#94b2b6] transition-colors truncate">
                        {job.title}
                      </p>
                      {job.vehicle && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                          {job.vehicle.color && <span className="text-gray-600"> · {job.vehicle.color}</span>}
                        </p>
                      )}
                      {job.serviceType && (
                        <p className="text-xs text-gray-600 mt-0.5">{job.serviceType}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {job.price != null && (
                        <p className="text-sm font-semibold text-[#94b2b6]">
                          ${job.price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      )}
                      {job.jobDate && (
                        <p className="text-xs text-gray-400">
                          {new Date(job.jobDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        {job._count.photos} photo{job._count.photos !== 1 ? "s" : ""}
                        {job._count.socialDrafts > 0 && ` · ${job._count.socialDrafts} draft${job._count.socialDrafts !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddVehicle && (
        <AddVehicleModal
          clientId={client.id}
          onClose={() => setShowAddVehicle(false)}
          onAdded={(v) => setClient((prev) => prev ? { ...prev, vehicles: [...prev.vehicles, v] } : prev)}
        />
      )}
      {showAddJob && (
        <AddJobModal
          clientId={client.id}
          vehicles={client.vehicles}
          onClose={() => setShowAddJob(false)}
          onAdded={(j) => setClient((prev) => prev ? { ...prev, detailJobs: [j, ...prev.detailJobs] } : prev)}
        />
      )}
    </div>
  );
}
