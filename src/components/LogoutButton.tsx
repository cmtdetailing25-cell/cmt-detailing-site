"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-gray-500 hover:text-red-400 text-xs transition-colors disabled:opacity-50 text-left"
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
