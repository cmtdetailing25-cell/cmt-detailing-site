import { Suspense } from "react";
import MediaImportClient from "@/components/MediaImportClient";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">Loading…</div>}>
      <MediaImportClient />
    </Suspense>
  );
}
