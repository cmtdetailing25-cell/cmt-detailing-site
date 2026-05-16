"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import imageCompression from "browser-image-compression";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "client" | "vehicle" | "job" | "upload";

interface ClientOption { id: string; fullName: string; isVip: boolean }
interface VehicleOption { id: string; year: string; make: string; model: string; color: string | null; isPrimary: boolean }
interface JobOption { id: string; title: string; serviceType: string | null; jobDate: string | null }

type UploadStatus = "queued" | "compressing" | "compressed" | "already-optimized" | "uploading" | "uploaded" | "failed";

interface FileEntry {
  id: string;
  file: File;
  preview: string;
  status: UploadStatus;
  compressed?: File;
  error?: string;
  result?: { id: string; imageUrl: string };
}

const SERVICE_TYPES = [
  "Full Detail", "Exterior Detail", "Interior Detail", "Ceramic Coating",
  "Paint Correction", "Maintenance Wash", "Window Tint", "PPF", "Other",
];

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepBar({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "client",  label: "Client"  },
    { key: "vehicle", label: "Vehicle" },
    { key: "job",     label: "Job"     },
    { key: "upload",  label: "Upload"  },
  ];
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            i < idx  ? "text-gray-500" :
            i === idx ? "bg-[#94b2b6]/20 text-[#94b2b6]" :
            "text-gray-700"
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              i < idx  ? "bg-gray-700 text-gray-500" :
              i === idx ? "bg-[#94b2b6] text-[#151b23]" :
              "bg-gray-800 text-gray-700"
            }`}>
              {i < idx ? "✓" : i + 1}
            </span>
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-6 ${i < idx ? "bg-gray-600" : "bg-gray-800"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep]             = useState<Step>("client");
  const [clients, setClients]       = useState<ClientOption[]>([]);
  const [vehicles, setVehicles]     = useState<VehicleOption[]>([]);
  const [jobs, setJobs]             = useState<JobOption[]>([]);

  // Selections
  const [selectedClientId, setSelectedClientId] = useState(searchParams.get("clientId") ?? "");
  const [isNewClient, setIsNewClient]           = useState(false);
  const [newClientForm, setNewClientForm]       = useState({ firstName: "", lastName: "", phone: "", email: "", city: "", state: "MA" });

  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [isNewVehicle, setIsNewVehicle]           = useState(false);
  const [newVehicleForm, setNewVehicleForm]       = useState({ year: "", make: "", model: "", color: "", trim: "", isPrimary: false });

  const [selectedJobId, setSelectedJobId] = useState(searchParams.get("jobId") ?? "");
  const [isNewJob, setIsNewJob]           = useState(false);
  const [newJobForm, setNewJobForm]       = useState({
    title: "", serviceType: "", jobDate: new Date().toISOString().slice(0, 10),
    location: "Taunton, MA", isSocialReady: false,
  });

  const [files, setFiles]           = useState<FileEntry[]>([]);
  const [uploading, setUploading]   = useState(false);
  const [allDone, setAllDone]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const fileInputRef                = useRef<HTMLInputElement>(null);

  // Load clients on mount
  useEffect(() => {
    fetch("/api/admin/clients").then((r) => r.json()).then(setClients);
    // If jobId passed in URL, skip straight to upload
    if (searchParams.get("jobId")) {
      setSelectedJobId(searchParams.get("jobId")!);
      setStep("upload");
    } else if (searchParams.get("clientId")) {
      setSelectedClientId(searchParams.get("clientId")!);
      setStep("vehicle");
    }
  }, [searchParams]);

  // Load vehicles when client is selected
  useEffect(() => {
    if (!selectedClientId) { setVehicles([]); return; }
    fetch(`/api/admin/clients/${selectedClientId}`)
      .then((r) => r.json())
      .then((data) => setVehicles(data.vehicles ?? []));
  }, [selectedClientId]);

  // Load jobs when vehicle or client is selected
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedClientId) params.set("clientId", selectedClientId);
    fetch(`/api/admin/jobs?${params}`).then((r) => r.json()).then(setJobs);
  }, [selectedClientId]);

  // Auto-fill job title when vehicle + service chosen
  useEffect(() => {
    const v = vehicles.find((x) => x.id === selectedVehicleId);
    if (v && newJobForm.serviceType && !newJobForm.title) {
      const color = v.color ? `${v.color} ` : "";
      setNewJobForm((f) => ({
        ...f,
        title: `${f.jobDate} ${color}${v.year} ${v.make} ${v.model} ${f.serviceType}`,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicleId, newJobForm.serviceType]);

  // ── Step handlers ──────────────────────────────────────────────────────────

  async function handleClientNext() {
    setError(null);
    setSaving(true);
    try {
      if (isNewClient) {
        const res = await fetch("/api/admin/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newClientForm, status: "ACTIVE" }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Failed to create client"); setSaving(false); return; }
        setSelectedClientId(data.id);
        setClients((prev) => [data, ...prev]);
      }
      setStep("vehicle");
    } finally { setSaving(false); }
  }

  async function handleVehicleNext() {
    setError(null);
    setSaving(true);
    try {
      if (isNewVehicle) {
        if (!newVehicleForm.year || !newVehicleForm.make || !newVehicleForm.model) {
          setError("Year, make, and model are required"); setSaving(false); return;
        }
        const res = await fetch("/api/admin/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newVehicleForm, clientId: selectedClientId }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Failed to create vehicle"); setSaving(false); return; }
        setSelectedVehicleId(data.id);
        setVehicles((prev) => [...prev, data]);
      }
      setStep("job");
    } finally { setSaving(false); }
  }

  async function handleJobNext() {
    setError(null);
    setSaving(true);
    try {
      if (isNewJob) {
        if (!newJobForm.title) { setError("Job title is required"); setSaving(false); return; }
        const res = await fetch("/api/admin/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newJobForm,
            clientId:  selectedClientId  || null,
            vehicleId: selectedVehicleId || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Failed to create job"); setSaving(false); return; }
        setSelectedJobId(data.id);
        setJobs((prev) => [data, ...prev]);
      }
      setStep("upload");
    } finally { setSaving(false); }
  }

  // ── File handling ──────────────────────────────────────────────────────────

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    const entries: FileEntry[] = picked.map((f) => ({
      id:      Math.random().toString(36).slice(2),
      file:    f,
      preview: URL.createObjectURL(f),
      status:  "queued",
    }));
    setFiles((prev) => [...prev, ...entries]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  async function handleUpload() {
    if (!selectedJobId) { setError("No job selected"); return; }
    setUploading(true);
    setError(null);

    // Compress phase
    const compress = files.filter((f) => f.status === "queued");
    for (const entry of compress) {
      setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "compressing" } : f));
      try {
        const opts = { maxWidthOrHeight: 2000, useWebWorker: true, fileType: "image/webp", initialQuality: 0.82 };
        const compressed = await imageCompression(entry.file, opts);
        const savings    = 1 - compressed.size / entry.file.size;
        setFiles((prev) => prev.map((f) =>
          f.id === entry.id
            ? { ...f, compressed, status: savings > 0.1 ? "compressed" : "already-optimized" }
            : f
        ));
      } catch {
        setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "failed", error: "Compression failed" } : f));
      }
    }

    // Upload phase
    const toUpload = files.filter((f) => ["compressed", "already-optimized", "queued"].includes(f.status));
    for (const entry of toUpload) {
      setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "uploading" } : f));
      try {
        const uploadFile = entry.compressed ?? entry.file;
        const formData   = new FormData();
        formData.append("file",        uploadFile);
        formData.append("title",       uploadFile.name.replace(/\.[^.]+$/, ""));
        formData.append("category",    "detail-job");
        formData.append("detailJobId", selectedJobId);

        const res  = await fetch("/api/admin/media", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "uploaded", result: data } : f));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "failed", error: msg } : f));
      }
    }

    setUploading(false);
    const uploaded = files.filter((f) => f.status === "uploaded").length + toUpload.filter(() => true).length;
    if (uploaded > 0) setAllDone(true);
  }

  const uploadedCount  = files.filter((f) => f.status === "uploaded").length;
  const failedCount    = files.filter((f) => f.status === "failed").length;
  const pendingCount   = files.filter((f) => !["uploaded", "failed"].includes(f.status)).length;
  const selectedJob    = jobs.find((j) => j.id === selectedJobId);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const selectedClient  = clients.find((c) => c.id === selectedClientId);

  // ── Upload step ────────────────────────────────────────────────────────────

  if (step === "upload") {
    const jobLabel = selectedJob?.title ?? (isNewJob ? newJobForm.title : "Unknown job");
    return (
      <div className="p-6 max-w-3xl">
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-5">
          <button onClick={() => router.push("/admin/media")} className="hover:text-gray-300 transition-colors">Media</button>
          <span>/</span>
          <span className="text-gray-400">Import</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Import Photos</h1>
        <p className="text-gray-400 text-sm mb-6">Upload photos — they'll be automatically assigned to the selected job.</p>

        <StepBar current="upload" />

        {/* Context summary */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-2">Uploading to</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {selectedClient && (
              <div>
                <span className="text-[10px] text-gray-600">Client · </span>
                <span className="text-xs text-white">{selectedClient.fullName}</span>
              </div>
            )}
            {selectedVehicle && (
              <div>
                <span className="text-[10px] text-gray-600">Vehicle · </span>
                <span className="text-xs text-white">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</span>
              </div>
            )}
            <div>
              <span className="text-[10px] text-gray-600">Job · </span>
              <span className="text-xs text-white">{jobLabel}</span>
            </div>
          </div>
        </div>

        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-gray-700 hover:border-[#94b2b6] rounded-xl p-8 text-center cursor-pointer transition-colors mb-4"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-gray-400 mb-1">Click to select photos</p>
          <p className="text-xs text-gray-600">JPG, PNG, WebP — auto-compressed and converted to WebP</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFilePick}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2 mb-5">
            {files.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.preview} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-gray-800" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{entry.file.name}</p>
                  <p className="text-[11px] text-gray-600">{(entry.file.size / 1024).toFixed(0)} KB</p>
                </div>
                <div className="shrink-0">
                  {entry.status === "queued"          && <span className="text-[11px] text-gray-600">Queued</span>}
                  {entry.status === "compressing"     && <span className="text-[11px] text-yellow-400">Compressing…</span>}
                  {entry.status === "compressed"      && <span className="text-[11px] text-blue-400">Compressed</span>}
                  {entry.status === "already-optimized" && <span className="text-[11px] text-gray-500">Optimized</span>}
                  {entry.status === "uploading"       && <span className="text-[11px] text-yellow-400">Uploading…</span>}
                  {entry.status === "uploaded"        && <span className="text-[11px] text-green-400">✓ Uploaded</span>}
                  {entry.status === "failed"          && <span className="text-[11px] text-red-400">{entry.error ?? "Failed"}</span>}
                </div>
                {!uploading && entry.status === "queued" && (
                  <button onClick={() => removeFile(entry.id)} className="text-gray-700 hover:text-gray-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-red-400 mb-4">{error}</p>}

        {allDone ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 bg-green-900/20 border border-green-800/40 rounded-xl px-5 py-4">
              <div className="w-2 h-2 rounded-full bg-green-400 shrink-0 mt-1.5" />
              <div>
                <p className="text-sm font-semibold text-green-400">Upload complete</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {uploadedCount} photo{uploadedCount !== 1 ? "s" : ""} added to {jobLabel}.
                  {failedCount > 0 && ` ${failedCount} failed.`}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {selectedJobId && (
                <button
                  onClick={() => router.push(`/admin/jobs/${selectedJobId}`)}
                  className="text-sm bg-[#94b2b6] hover:bg-[#7a9ea3] text-[#151b23] font-bold px-5 py-2.5 rounded-lg transition-colors"
                >
                  View Job
                </button>
              )}
              <button
                onClick={() => { setFiles([]); setAllDone(false); }}
                className="text-sm text-gray-500 hover:text-white transition-colors px-3 py-2.5"
              >
                Upload more
              </button>
              <button
                onClick={() => router.push("/admin/social#media-intelligence")}
                className="text-sm text-gray-500 hover:text-white transition-colors px-3 py-2.5"
              >
                Score media →
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || files.filter((f) => f.status === "queued").length === 0}
              className="bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-gray-700 disabled:text-gray-500 text-[#151b23] text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
            >
              {uploading
                ? `Uploading ${pendingCount} photo${pendingCount !== 1 ? "s" : ""}…`
                : `Upload ${files.filter((f) => f.status === "queued").length} Photo${files.filter((f) => f.status === "queued").length !== 1 ? "s" : ""}`}
            </button>
            <button
              onClick={() => setStep("job")}
              className="text-sm text-gray-600 hover:text-gray-400 transition-colors"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Steps 1-3 ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-5">
        <button onClick={() => router.push("/admin/media")} className="hover:text-gray-300 transition-colors">Media</button>
        <span>/</span>
        <span className="text-gray-400">Import</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-1">Import Photos</h1>
      <p className="text-gray-400 text-sm mb-6">
        Assign photos to a client, vehicle, and detail job before uploading.
      </p>

      <StepBar current={step} />

      {/* ── Step 1: Client ──────────────────────────────────────────── */}
      {step === "client" && (
        <div>
          <p className="text-sm text-gray-400 mb-4">Who is this detail for?</p>

          <div className="space-y-2 mb-4">
            <button
              onClick={() => { setIsNewClient(false); setSelectedClientId(""); }}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ${
                !isNewClient && !selectedClientId
                  ? "border-[#94b2b6] bg-[#94b2b6]/10 text-white"
                  : "border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700"
              }`}
            >
              Skip — no client
            </button>

            {clients.map((c) => (
              <button
                key={c.id}
                onClick={() => { setIsNewClient(false); setSelectedClientId(c.id); }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  selectedClientId === c.id && !isNewClient
                    ? "border-[#94b2b6] bg-[#94b2b6]/10"
                    : "border-gray-800 bg-gray-900 hover:border-gray-700"
                }`}
              >
                <p className="text-sm text-white flex items-center gap-1.5">
                  {c.fullName}
                  {c.isVip && <span className="text-[9px] bg-yellow-900/40 text-yellow-400 px-1.5 py-0.5 rounded font-bold">VIP</span>}
                </p>
              </button>
            ))}

            <button
              onClick={() => { setIsNewClient(true); setSelectedClientId(""); }}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                isNewClient
                  ? "border-[#94b2b6] bg-[#94b2b6]/10"
                  : "border-dashed border-gray-700 bg-gray-900 hover:border-gray-600 text-gray-500"
              }`}
            >
              <span className="text-sm">+ New client</span>
            </button>
          </div>

          {isNewClient && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">First Name *</label>
                  <input required value={newClientForm.firstName}
                    onChange={(e) => setNewClientForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-[#94b2b6]" />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Last Name *</label>
                  <input required value={newClientForm.lastName}
                    onChange={(e) => setNewClientForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-[#94b2b6]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Phone</label>
                  <input value={newClientForm.phone}
                    onChange={(e) => setNewClientForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-[#94b2b6]" />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">City</label>
                  <input value={newClientForm.city}
                    onChange={(e) => setNewClientForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-[#94b2b6]" />
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
          <button
            onClick={handleClientNext}
            disabled={saving}
            className="bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-gray-700 text-[#151b23] text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
          >
            {saving ? "Saving…" : "Next: Vehicle →"}
          </button>
        </div>
      )}

      {/* ── Step 2: Vehicle ─────────────────────────────────────────── */}
      {step === "vehicle" && (
        <div>
          <p className="text-sm text-gray-400 mb-4">Which vehicle was detailed?</p>

          <div className="space-y-2 mb-4">
            <button
              onClick={() => { setIsNewVehicle(false); setSelectedVehicleId(""); }}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ${
                !isNewVehicle && !selectedVehicleId
                  ? "border-[#94b2b6] bg-[#94b2b6]/10 text-white"
                  : "border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700"
              }`}
            >
              Skip — no vehicle
            </button>

            {vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => { setIsNewVehicle(false); setSelectedVehicleId(v.id); }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  selectedVehicleId === v.id && !isNewVehicle
                    ? "border-[#94b2b6] bg-[#94b2b6]/10"
                    : "border-gray-800 bg-gray-900 hover:border-gray-700"
                }`}
              >
                <p className="text-sm text-white">
                  {v.year} {v.make} {v.model}
                  {v.color && <span className="text-gray-500"> · {v.color}</span>}
                  {v.isPrimary && <span className="text-[#94b2b6] text-xs"> ★ Primary</span>}
                </p>
              </button>
            ))}

            <button
              onClick={() => { setIsNewVehicle(true); setSelectedVehicleId(""); }}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                isNewVehicle
                  ? "border-[#94b2b6] bg-[#94b2b6]/10"
                  : "border-dashed border-gray-700 bg-gray-900 hover:border-gray-600 text-gray-500"
              }`}
            >
              <span className="text-sm">+ New vehicle</span>
            </button>
          </div>

          {isNewVehicle && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "year",  label: "Year *",  ph: "2022" },
                  { key: "make",  label: "Make *",  ph: "BMW"  },
                  { key: "model", label: "Model *", ph: "X5"   },
                ].map(({ key, label, ph }) => (
                  <div key={key}>
                    <label className="block text-[11px] text-gray-500 mb-1">{label}</label>
                    <input
                      value={(newVehicleForm as Record<string, unknown>)[key] as string}
                      onChange={(e) => setNewVehicleForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={ph}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-[#94b2b6]"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Color</label>
                  <input value={newVehicleForm.color}
                    onChange={(e) => setNewVehicleForm((f) => ({ ...f, color: e.target.value }))}
                    placeholder="Carbon Black"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-[#94b2b6]" />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Trim</label>
                  <input value={newVehicleForm.trim}
                    onChange={(e) => setNewVehicleForm((f) => ({ ...f, trim: e.target.value }))}
                    placeholder="xDrive40i"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-[#94b2b6]" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newVehicleForm.isPrimary}
                  onChange={(e) => setNewVehicleForm((f) => ({ ...f, isPrimary: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-400">Primary vehicle</span>
              </label>
            </div>
          )}

          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
          <div className="flex items-center gap-3">
            <button onClick={handleVehicleNext} disabled={saving}
              className="bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-gray-700 text-[#151b23] text-sm font-bold px-5 py-2.5 rounded-lg transition-colors">
              {saving ? "Saving…" : "Next: Job →"}
            </button>
            <button onClick={() => setStep("client")} className="text-sm text-gray-600 hover:text-gray-400 transition-colors">← Back</button>
          </div>
        </div>
      )}

      {/* ── Step 3: Job ─────────────────────────────────────────────── */}
      {step === "job" && (
        <div>
          <p className="text-sm text-gray-400 mb-4">Which detailing session is this?</p>

          <div className="space-y-2 mb-4">
            {jobs.map((j) => (
              <button
                key={j.id}
                onClick={() => { setIsNewJob(false); setSelectedJobId(j.id); }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  selectedJobId === j.id && !isNewJob
                    ? "border-[#94b2b6] bg-[#94b2b6]/10"
                    : "border-gray-800 bg-gray-900 hover:border-gray-700"
                }`}
              >
                <p className="text-sm text-white truncate">{j.title}</p>
                <p className="text-xs text-gray-600">
                  {j.serviceType ?? ""}
                  {j.jobDate && ` · ${new Date(j.jobDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                </p>
              </button>
            ))}

            <button
              onClick={() => { setIsNewJob(true); setSelectedJobId(""); }}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                isNewJob
                  ? "border-[#94b2b6] bg-[#94b2b6]/10"
                  : "border-dashed border-gray-700 bg-gray-900 hover:border-gray-600 text-gray-500"
              }`}
            >
              <span className="text-sm">+ New detail job</span>
            </button>
          </div>

          {isNewJob && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Service Type</label>
                  <select value={newJobForm.serviceType}
                    onChange={(e) => setNewJobForm((f) => ({ ...f, serviceType: e.target.value, title: "" }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-[#94b2b6]">
                    <option value="">Select…</option>
                    {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Date</label>
                  <input type="date" value={newJobForm.jobDate}
                    onChange={(e) => setNewJobForm((f) => ({ ...f, jobDate: e.target.value, title: "" }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-[#94b2b6]" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Job Title *</label>
                <input required value={newJobForm.title}
                  onChange={(e) => setNewJobForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Auto-filled or enter manually…"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-[#94b2b6] placeholder-gray-700" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newJobForm.isSocialReady}
                  onChange={(e) => setNewJobForm((f) => ({ ...f, isSocialReady: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-400">Social ready</span>
              </label>
            </div>
          )}

          {!isNewJob && !selectedJobId && (
            <p className="text-xs text-yellow-400 mb-3">Select a job or create a new one to continue.</p>
          )}
          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={handleJobNext}
              disabled={saving || (!isNewJob && !selectedJobId)}
              className="bg-[#94b2b6] hover:bg-[#7a9ea3] disabled:bg-gray-700 disabled:text-gray-500 text-[#151b23] text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
            >
              {saving ? "Saving…" : "Next: Upload →"}
            </button>
            <button onClick={() => setStep("vehicle")} className="text-sm text-gray-600 hover:text-gray-400 transition-colors">← Back</button>
          </div>
        </div>
      )}
    </div>
  );
}
