"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { PushToggle } from "@/components/PushNotificationManager";

const navLinks: Array<{ href: string; label: string; exact?: boolean; indent?: boolean }> = [
  { href: "/admin/dashboard",         label: "Dashboard" },
  { href: "/admin/bookings",          label: "Bookings"  },
  { href: "/admin/clients",           label: "Clients"   },
  { href: "/admin/jobs",              label: "Jobs"      },
  { href: "/admin/media",             label: "Media"     },
  { href: "/admin/social",            label: "Social",   exact: true },
  { href: "/admin/social/insights",   label: "Insights", indent: true },
];

export default function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (href === "/admin/dashboard") return pathname === "/admin/dashboard" || pathname === "/admin";
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col p-6 gap-1 shrink-0">
      <p className="text-white font-bold text-lg mb-6">
        CMT <span className="text-red-500">Admin</span>
      </p>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded-lg px-3 py-2 text-sm transition-colors ${link.indent ? "ml-3 text-xs" : ""} ${
            isActive(link.href, link.exact)
              ? "bg-red-600/20 text-red-400 font-medium"
              : link.indent
                ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
          }`}
        >
          {link.indent && <span className="mr-1 text-gray-700">↳</span>}
          {link.label}
        </Link>
      ))}
      <div className="mt-auto flex flex-col gap-3">
        <PushToggle />
        <Link href="/" className="text-gray-500 hover:text-gray-300 text-xs">
          ← Public site
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
