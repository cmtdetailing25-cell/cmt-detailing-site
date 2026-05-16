import type { Metadata } from "next";
import AdminNav from "@/components/AdminNav";

export const metadata: Metadata = {
  title: "CMT Admin",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 flex">
      <AdminNav />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
