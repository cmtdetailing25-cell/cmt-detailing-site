"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ClientRef = {
  id: string;
  fullName: string;
  status: string;
  isVip: boolean;
};

type Lead = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  serviceRequested: string;
  town: string;
  preferredDate: string;
  preferredTime: string;
  status: string;
  createdAt: Date;
  client: ClientRef | null;
};

const STATUSES = ["NEW", "CONTACTED", "BOOKED", "LOST"] as const;

const statusColors: Record<string, string> = {
  NEW:       "bg-blue-900/50 text-blue-300",
  CONTACTED: "bg-yellow-900/50 text-yellow-300",
  BOOKED:    "bg-green-900/50 text-green-300",
  LOST:      "bg-gray-800 text-gray-500",
};

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [converting, setConverting] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function convertLead(id: string) {
    setConverting(id);
    try {
      const res = await fetch(`/api/leads/${id}/convert`, { method: "POST" });
      const data = await res.json();
      if (data.clientId) {
        router.push(`/admin/clients/${data.clientId}`);
      }
    } finally {
      setConverting(null);
    }
  }

  if (leads.length === 0) {
    return <p className="text-gray-500 text-sm">No leads yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-800 text-gray-400 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Service</th>
            <th className="px-4 py-3 font-medium">Vehicle</th>
            <th className="px-4 py-3 font-medium">Preferred Date</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Submitted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800 bg-gray-900">
          {leads.map((lead) => (
            <tr key={lead.id} className="text-gray-300 hover:bg-gray-800/40">
              <td className="px-4 py-3">
                <p className="font-medium text-white">{lead.fullName}</p>
                <p className="text-gray-500 text-xs">{lead.email}</p>
              </td>
              <td className="px-4 py-3">{lead.phone}</td>
              <td className="px-4 py-3">{lead.serviceRequested}</td>
              <td className="px-4 py-3 text-gray-400">
                {lead.vehicleYear} {lead.vehicleMake} {lead.vehicleModel}
              </td>
              <td className="px-4 py-3">
                {lead.preferredDate} @ {lead.preferredTime}
              </td>
              <td className="px-4 py-3">
                <select
                  value={lead.status}
                  onChange={(e) => updateStatus(lead.id, e.target.value)}
                  className={`text-xs font-medium rounded px-2 py-1 border-0 cursor-pointer focus:outline-none ${statusColors[lead.status]}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-gray-900 text-gray-200">
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                {lead.client ? (
                  <a
                    href={`/admin/clients/${lead.client.id}`}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    {lead.client.fullName} →
                  </a>
                ) : (
                  <button
                    onClick={() => convertLead(lead.id)}
                    disabled={converting === lead.id}
                    className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded px-2 py-1 transition-colors disabled:opacity-50"
                  >
                    {converting === lead.id ? "Creating…" : "Create Client"}
                  </button>
                )}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {new Date(lead.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
