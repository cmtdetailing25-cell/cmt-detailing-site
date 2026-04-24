import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CMT Admin",
};

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/bookings", label: "Bookings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col p-6 gap-2 shrink-0">
        <p className="text-white font-bold text-lg mb-6">
          CMT <span className="text-red-500">Admin</span>
        </p>
        {adminLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-2 text-sm transition-colors"
          >
            {l.label}
          </Link>
        ))}
        <div className="mt-auto">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-300 text-xs"
          >
            ← Public site
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
