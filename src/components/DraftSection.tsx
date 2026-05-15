"use client";

import { useState, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type DraftStatus =
  | "IDEA"
  | "DRAFT"
  | "NEEDS_APPROVAL"
  | "APPROVED"
  | "SCHEDULED"
  | "POSTED"
  | "ARCHIVED";

export interface SerializedDraft {
  id: string;
  type: "POST" | "REEL" | "STORY";
  status: DraftStatus;
  source: "AUTO_AGENT" | "MANUAL";
  title: string;
  caption: string | null;
  hashtags: string | null;
  hook: string | null;
  notes: string | null;
  generatedAt: string | null;
  createdAt: string;
  media: {
    id: string;
    sitePhoto: { imageUrl: string; title: string } | null;
  }[];
}

interface EditForm {
  title: string;
  hook: string;
  caption: string;
  hashtags: string;
  notes: string;
}

// ─── Badges ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DraftStatus }) {
  const map: Record<DraftStatus, { label: string; cls: string }> = {
    IDEA:           { label: "Idea",           cls: "bg-gray-800 text-gray-500" },
    DRAFT:          { label: "Draft",          cls: "bg-gray-800 text-gray-400" },
    NEEDS_APPROVAL: { label: "Needs Approval", cls: "bg-yellow-900/40 text-yellow-400" },
    APPROVED:       { label: "Approved",       cls: "bg-green-900/40 text-green-400" },
    SCHEDULED:      { label: "Scheduled",      cls: "bg-blue-900/30 text-blue-400" },
    POSTED:         { label: "Posted",         cls: "bg-green-900/60 text-green-300" },
    ARCHIVED:       { label: "Archived",       cls: "bg-gray-900 text-gray-600" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${cls}`}>
      {label}
    </span>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  draft,
  form,
  setForm,
  saving,
  onSave,
  onClose,
}: {
  draft: SerializedDraft;
  form: EditForm;
  setForm: React.Dispatch<React.SetStateAction<EditForm>>;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  function set<K extends keyof EditForm>(k: K, v: EditForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const inputCls =
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <p className="text-white font-semibold text-sm">Edit Draft</p>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
            />
          </div>

          {(draft.type === "REEL" || draft.type === "STORY") && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Hook</label>
              <input
                type="text"
                value={form.hook}
                onChange={(e) => set("hook", e.target.value)}
                placeholder="Opening hook for reel / story..."
                className={inputCls}
              />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Caption</label>
            <textarea
              value={form.caption}
              onChange={(e) => set("caption", e.target.value)}
              rows={5}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Hashtags</label>
            <textarea
              value={form.hashtags}
              onChange={(e) => set("hashtags", e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Internal notes..."
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800 shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Draft Card ───────────────────────────────────────────────────────────────

function DraftCard({
  draft,
  onApprove,
  onArchive,
  onEdit,
}: {
  draft: SerializedDraft;
  onApprove: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onEdit: (draft: SerializedDraft) => void;
}) {
  const [busy, setBusy] = useState<"approve" | "archive" | null>(null);

  const thumbnails = draft.media
    .filter((m) => m.sitePhoto)
    .slice(0, 3);

  async function approve() {
    setBusy("approve");
    await onApprove(draft.id);
    setBusy(null);
  }

  async function archive() {
    setBusy("archive");
    await onArchive(draft.id);
    setBusy(null);
  }

  const isApproved = draft.status === "APPROVED" || draft.status === "POSTED";
  const isArchived = draft.status === "ARCHIVED";

  return (
    <div className="border-b border-gray-800/50 last:border-0">
      <div className="flex gap-3.5 px-4 py-4 hover:bg-gray-800/20 transition-colors">
        {/* Thumbnails */}
        <div className="flex gap-1 shrink-0">
          {thumbnails.length > 0 ? (
            thumbnails.map((m) => (
              <div
                key={m.id}
                className="w-11 h-11 rounded-lg overflow-hidden bg-gray-800 shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.sitePhoto!.imageUrl}
                  alt={m.sitePhoto!.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ))
          ) : (
            <div className="w-11 h-11 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row: badges + date */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusBadge status={draft.status} />
              <span className="text-[10px] text-gray-600">
                {draft.source === "AUTO_AGENT" ? "Agent" : "Manual"}
              </span>
              {draft.media.length > 0 && (
                <span className="text-[10px] text-gray-700">
                  {draft.media.length} photo{draft.media.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-600 shrink-0 tabular-nums">
              {new Date(draft.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Title */}
          <p className="text-white text-sm font-medium leading-snug mb-1 truncate">
            {draft.title}
          </p>

          {/* Hook */}
          {draft.hook && (
            <p className="text-xs text-gray-500 italic mb-1.5 truncate">
              &ldquo;{draft.hook}&rdquo;
            </p>
          )}

          {/* Caption preview */}
          {draft.caption && (
            <p className="text-xs text-gray-600 mb-2 leading-relaxed line-clamp-2">
              {draft.caption}
            </p>
          )}

          {/* Hashtags preview */}
          {draft.hashtags && (
            <p className="text-[10px] text-gray-700 truncate mb-3">
              {draft.hashtags}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isApproved && !isArchived && (
              <button
                onClick={approve}
                disabled={busy !== null}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-900/50 disabled:opacity-50 transition-colors"
              >
                {busy === "approve" ? "Approving…" : "Approve"}
              </button>
            )}
            {isApproved && (
              <span className="text-[11px] text-green-400 font-semibold">
                ✓ Approved
              </span>
            )}
            <button
              onClick={() => onEdit(draft)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              Edit
            </button>
            {!isArchived && (
              <button
                onClick={archive}
                disabled={busy !== null}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-gray-800 text-gray-600 hover:text-red-400 disabled:opacity-50 transition-colors"
              >
                {busy === "archive" ? "Archiving…" : "Archive"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DraftSection({
  type,
  initialDrafts,
}: {
  type: "POST" | "REEL";
  initialDrafts: SerializedDraft[];
}) {
  const [drafts, setDrafts] = useState<SerializedDraft[]>(initialDrafts);
  const [editingDraft, setEditingDraft] = useState<SerializedDraft | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    setDrafts(initialDrafts);
  }, [initialDrafts]);

  const typeDrafts = drafts.filter((d) => d.type === type);

  async function handleApprove(id: string) {
    const res = await fetch(`/api/admin/social/drafts/${id}/approve`, {
      method: "POST",
    });
    if (!res.ok) return;
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "APPROVED" as DraftStatus } : d))
    );
  }

  async function handleArchive(id: string) {
    const res = await fetch(`/api/admin/social/drafts/${id}/archive`, {
      method: "POST",
    });
    if (!res.ok) return;
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  function openEdit(draft: SerializedDraft) {
    setEditingDraft(draft);
    setEditForm({
      title:    draft.title,
      hook:     draft.hook ?? "",
      caption:  draft.caption ?? "",
      hashtags: draft.hashtags ?? "",
      notes:    draft.notes ?? "",
    });
  }

  function closeEdit() {
    setEditingDraft(null);
    setEditForm(null);
  }

  async function handleEditSave() {
    if (!editingDraft || !editForm) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/social/drafts/${editingDraft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:    editForm.title,
          hook:     editForm.hook || null,
          caption:  editForm.caption || null,
          hashtags: editForm.hashtags || null,
          notes:    editForm.notes || null,
        }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setDrafts((prev) =>
        prev.map((d) => (d.id === editingDraft.id ? { ...d, ...updated } : d))
      );
      closeEdit();
    } finally {
      setSavingEdit(false);
    }
  }

  if (typeDrafts.length === 0) {
    return (
      <div className="border border-dashed border-gray-800 rounded-xl px-6 py-12 flex flex-col items-center text-center gap-3">
        <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {type === "REEL" ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          )}
        </svg>
        <p className="text-sm font-medium text-gray-500">
          No draft {type === "REEL" ? "reels" : "posts"} yet
        </p>
        <p className="text-xs text-gray-600 max-w-xs leading-relaxed">
          Use the{" "}
          <a href="#draft-generator" className="text-gray-500 hover:text-white transition-colors underline underline-offset-2">
            Draft Generator
          </a>{" "}
          above to create your first {type === "REEL" ? "reel" : "post"}, or wait for the weekly agent run.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {typeDrafts.map((draft) => (
          <DraftCard
            key={draft.id}
            draft={draft}
            onApprove={handleApprove}
            onArchive={handleArchive}
            onEdit={openEdit}
          />
        ))}
      </div>

      {editingDraft && editForm && (
        <EditModal
          draft={editingDraft}
          form={editForm}
          setForm={setEditForm as React.Dispatch<React.SetStateAction<EditForm>>}
          saving={savingEdit}
          onSave={handleEditSave}
          onClose={closeEdit}
        />
      )}
    </>
  );
}
