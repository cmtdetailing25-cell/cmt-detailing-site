import { prisma } from "@/lib/prisma";
import Link from "next/link";

// Force this page to always fetch fresh data (no caching)
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalLeads, newLeads, bookedLeads, recentLeads] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.lead.count({ where: { status: "BOOKED" } }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const kpis = [
    { label: "Total Leads", value: totalLeads, color: "text-white" },
    { label: "New Leads", value: newLeads, color: "text-red-400" },
    { label: "Booked", value: bookedLeads, color: "text-green-400" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10 max-w-lg">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <p className="text-gray-400 text-sm mb-1">{kpi.label}</p>
            <p className={`text-4xl font-extrabold ${kpi.color}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent leads */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Leads</h2>
          <Link
            href="/admin/leads"
            className="text-red-400 hover:text-red-300 text-sm"
          >
            View all →
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <p className="text-gray-500 text-sm">No leads yet.</p>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-gray-400 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="text-gray-300 hover:bg-gray-800/50">
                    <td className="px-4 py-3">{lead.fullName}</td>
                    <td className="px-4 py-3">{lead.serviceRequested}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    NEW: "bg-blue-900/50 text-blue-300",
    CONTACTED: "bg-yellow-900/50 text-yellow-300",
    BOOKED: "bg-green-900/50 text-green-300",
    LOST: "bg-gray-800 text-gray-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}
