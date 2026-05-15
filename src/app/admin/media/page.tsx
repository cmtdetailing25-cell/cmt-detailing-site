"use client";

import { useEffect, useRef, useState } from "react";

interface SitePhoto {
  id: string;
  title: string;
  caption: string | null;
  imageUrl: string;
  category: string;
  label: string | null;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
}

const CATEGORIES = [
  "interior",
  "exterior",
  "full-detail",
  "paint-enhancement",
  "paint-correction",
  "ceramic-coating",
  "other",
];

export default function MediaPage() {
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const labelRef = useRef<HTMLInputElement>(null);
  const isFeaturedRef = useRef<HTMLInputElement>(null);
  const displayOrderRef = useRef<HTMLInputElement>(null);

  async function fetchPhotos() {
    setLoading(true);
    const res = await fetch("/api/admin/media");
    const data = await res.json();
    setPhotos(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchPhotos();
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) { setPreview(null); return; }
    setPreview(URL.createObjectURL(file));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Please select an image file."); return; }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", titleRef.current?.value ?? "");
    formData.append("caption", captionRef.current?.value ?? "");
    formData.append("category", categoryRef.current?.value ?? "");
    formData.append("label", labelRef.current?.value ?? "");
    formData.append("isFeatured", isFeaturedRef.current?.checked ? "true" : "false");
    formData.append("displayOrder", displayOrderRef.current?.value ?? "0");

    setUploading(true);
    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Upload failed.");
      } else {
        // reset form
        if (fileRef.current) fileRef.current.value = "";
        if (titleRef.current) titleRef.current.value = "";
        if (captionRef.current) captionRef.current.value = "";
        if (labelRef.current) labelRef.current.value = "";
        if (isFeaturedRef.current) isFeaturedRef.current.checked = false;
        if (displayOrderRef.current) displayOrderRef.current.value = "0";
        setPreview(null);
        await fetchPhotos();
      }
    } catch {
      setError("Network error during upload.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert("Failed to delete photo.");
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Media Manager</h1>

      {/* Upload form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-10 max-w-2xl">
        <h2 className="text-lg font-semibold text-white mb-5">Upload Photo</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          {/* File picker + preview */}
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Image file *</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                required
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-red-600 file:text-white hover:file:bg-red-500 cursor-pointer"
              />
            </div>
            {preview && (
              <img
                src={preview}
                alt="preview"
                className="w-20 h-20 object-cover rounded-lg border border-gray-700 shrink-0"
              />
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title *</label>
            <input
              ref={titleRef}
              type="text"
              required
              placeholder="e.g. Black BMW M3 Ceramic Coat"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Caption</label>
            <input
              ref={captionRef}
              type="text"
              placeholder="Optional caption"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Category + Label row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Category *</label>
              <select
                ref={categoryRef}
                required
                defaultValue="exterior"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1).replace("-", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Label</label>
              <input
                ref={labelRef}
                type="text"
                placeholder="e.g. Before / After"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Display order + Featured row */}
          <div className="flex items-center gap-6">
            <div className="w-32">
              <label className="block text-xs text-gray-400 mb-1">Display order</label>
              <input
                ref={displayOrderRef}
                type="number"
                defaultValue={0}
                min={0}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
              <input
                ref={isFeaturedRef}
                type="checkbox"
                className="w-4 h-4 accent-red-500"
              />
              <span className="text-sm text-gray-300">Featured</span>
            </label>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={uploading}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
      </div>

      {/* Photos grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Library{!loading && ` · ${photos.length} photo${photos.length !== 1 ? "s" : ""}`}
        </h2>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : photos.length === 0 ? (
          <p className="text-gray-500 text-sm">No photos yet. Upload one above.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group"
              >
                {/* Image */}
                <div className="relative aspect-square">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover"
                  />
                  {photo.isFeatured && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      FEATURED
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(photo.id, photo.title)}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Delete
                  </button>
                </div>

                {/* Metadata */}
                <div className="p-3 space-y-1">
                  <p className="text-white text-sm font-medium truncate" title={photo.title}>
                    {photo.title}
                  </p>
                  {photo.caption && (
                    <p className="text-gray-400 text-xs truncate" title={photo.caption}>
                      {photo.caption}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <span className="bg-gray-800 text-gray-300 text-[10px] px-1.5 py-0.5 rounded">
                      {photo.category}
                    </span>
                    {photo.label && (
                      <span className="bg-gray-800 text-gray-300 text-[10px] px-1.5 py-0.5 rounded">
                        {photo.label}
                      </span>
                    )}
                    <span className="bg-gray-800 text-gray-500 text-[10px] px-1.5 py-0.5 rounded">
                      #{photo.displayOrder}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
