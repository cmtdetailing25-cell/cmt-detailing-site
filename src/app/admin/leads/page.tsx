import { prisma } from "@/lib/prisma";
import LeadsTable from "@/components/LeadsTable";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">All Leads</h1>
      <LeadsTable leads={leads} />
    </div>
  );
}
