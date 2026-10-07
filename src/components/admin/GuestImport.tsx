"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Wedding } from "@/lib/supabase";
import { importGuests, type ImportGuestsResult } from "@/lib/actions";
import {
  analyzeSheet,
  findDuplicates,
  IMPORT_LIMITS,
  type ExistingInvitation,
  type ImportInvitation,
  type SheetAnalysis,
} from "@/lib/guest-import";
import { ACCEPTED_EXTENSIONS, readSpreadsheet, toCsv } from "@/lib/guest-import-reader";
import { DEFAULT_COUNTRY_CODE } from "@/lib/phone";
import { defaultCategory, type GuestCategory } from "@/lib/guest-category";
import SectionLoadingOverlay from "@/components/common/SectionLoadingOverlay";
import CopyLinkButtonClient from "@/app/admin/events/[id]/dashboard/CopyLinkButtonClient";

interface GuestImportProps {
  weddingId: string;
  wedding: Partial<Wedding>;
  /** Invitations already in this event (name + phone), for duplicate warnings. */
  existing: ExistingInvitation[];
  /** Guest groups; the file's Group column must match one. Empty before migration 18. */
  categories: Pick<GuestCategory, "id" | "name" | "is_default">[];
  /** Called once invitations were created (e.g. to refresh the guest list behind a modal). */
  onImported?: () => void;
  /** Reports reading/importing so a parent modal can block closing mid-import. */
  onBusyChange?: (busy: boolean) => void;
  /** When rendered in a modal: replaces the "Go to Guest List" link with a Done button. */
  onClose?: () => void;
}

type Stage =
  | { kind: "idle" }
  | { kind: "preview"; fileName: string; analysis: SheetAnalysis }
  | { kind: "done"; result: Required<Pick<ImportGuestsResult, "created" | "skipped">> };

const TYPE_ICON: Record<ImportInvitation["type"], string> = {
  individual: "👤",
  couple: "👫",
  family: "👨‍👩‍👧‍👦",
};

export default function GuestImport({ weddingId, wedding, existing, categories, onImported, onBusyChange, onClose }: GuestImportProps) {
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  // Group for rows whose Group cell is blank.
  const [defaultCategoryId, setDefaultCategoryId] = useState(() => defaultCategory(categories)?.id ?? "");
  const defaultCategoryName = categories.find((c) => c.id === defaultCategoryId)?.name ?? null;
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onBusyChange?.(reading || importing);
  }, [reading, importing, onBusyChange]);

  // Row number → reason, for rows duplicating an existing invitation or an earlier row (by name or phone).
  const duplicateRows = useMemo(
    () => (stage.kind === "preview" ? findDuplicates(stage.analysis.valid, existing) : new Map<number, string>()),
    [stage, existing]
  );

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setError("");

    if (file.size > IMPORT_LIMITS.maxFileBytes) {
      setError(`File is too large (max ${IMPORT_LIMITS.maxFileBytes / 1024 / 1024} MB).`);
      return;
    }

    setReading(true);
    try {
      const rows = await readSpreadsheet(file);
      const analysis = analyzeSheet(rows, categories.map((c) => c.name));
      if (analysis.fatal) {
        setError(analysis.fatal);
        setStage({ kind: "idle" });
      } else if (analysis.valid.length > IMPORT_LIMITS.maxInvitations) {
        setError(`This file has ${analysis.valid.length} invitations. Please split it into files of ${IMPORT_LIMITS.maxInvitations} or fewer.`);
        setStage({ kind: "idle" });
      } else {
        setStage({ kind: "preview", fileName: file.name, analysis });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the file.");
      setStage({ kind: "idle" });
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = ""; // allow re-selecting the same file
    }
  }, [categories]);

  const handleImport = async () => {
    if (stage.kind !== "preview") return;
    setError("");
    setImporting(true);
    try {
      const result = await importGuests({
        weddingId,
        invitations: stage.analysis.valid,
        defaultCategoryId: defaultCategoryId || null,
      });
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      const created = result.created ?? [];
      const skipped = result.skipped ?? [];
      toast.success(`${created.length} invitation${created.length === 1 ? "" : "s"} created`);
      setStage({ kind: "done", result: { created, skipped } });
      if (created.length > 0) onImported?.();
    } catch {
      const msg = "An unexpected error occurred during import.";
      setError(msg);
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  const downloadLinks = () => {
    if (stage.kind !== "done") return;
    const origin = window.location.origin;
    const csv = toCsv([
      ["Type", "Name", "Members", "Phone", "Side", "Group", "Invite Link"],
      ...stage.result.created.map((c) => [c.type, c.name, c.members.join("; "), c.phone ?? "", c.side ?? "", c.group ?? "", `${origin}/invite/${c.code}`]),
    ]);
    // BOM so Excel opens UTF-8 names (Sinhala/Tamil etc.) correctly.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invite-links-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setStage({ kind: "idle" });
    setError("");
  };

  // ────────────────────────── Render ──────────────────────────

  return (
    <div className="max-w-5xl space-y-6">
      {error && (
        <div role="alert" className="p-4 rounded-xl bg-admin-danger/10 border border-admin-danger/20 text-admin-danger text-sm animate-scale-in">
          {error}
        </div>
      )}

      {stage.kind === "idle" && (
        <>
          <FormatGuide groupNames={categories.map((c) => c.name)} />

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
              dragOver ? "border-admin-accent bg-admin-accent/10" : "border-admin-border hover:border-admin-accent/50"
            }`}
          >
            <SectionLoadingOverlay isLoading={reading} message="Reading file..." theme="admin" rounded="2xl" />
            <div className="text-4xl mb-3" aria-hidden>📄</div>
            <p className="text-admin-text font-medium mb-1">Drag &amp; drop your guest list here</p>
            <p className="text-admin-text-muted text-sm mb-5">CSV or Excel (.xlsx), up to {IMPORT_LIMITS.maxInvitations} invitations</p>
            <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent-light transition-all cursor-pointer focus-within:ring-2 focus-within:ring-admin-accent/50">
              Choose File
              <input
                ref={inputRef}
                type="file"
                accept={`${ACCEPTED_EXTENSIONS.join(",")},text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`}
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
          </div>
        </>
      )}

      {stage.kind === "preview" && (
        <Preview
          fileName={stage.fileName}
          analysis={stage.analysis}
          duplicateRows={duplicateRows}
          categories={categories}
          defaultCategoryId={defaultCategoryId}
          defaultCategoryName={defaultCategoryName}
          onDefaultCategoryChange={setDefaultCategoryId}
          importing={importing}
          onImport={handleImport}
          onCancel={reset}
        />
      )}

      {stage.kind === "done" && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="glass-dark rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-admin-text mb-1">
              ✅ {stage.result.created.length} invitation{stage.result.created.length === 1 ? "" : "s"} created
            </h2>
            {stage.result.skipped.length > 0 && (
              <details className="text-sm text-admin-text-muted">
                <summary className="cursor-pointer hover:text-admin-text select-none">
                  {stage.result.skipped.length} skipped as duplicate{stage.result.skipped.length === 1 ? "" : "s"}
                </summary>
                <ul className="mt-2 space-y-1 text-xs max-h-40 overflow-y-auto">
                  {stage.result.skipped.map((s) => (
                    <li key={s.row}>
                      <strong className="text-admin-text">Row {s.row} · {s.name}</strong> — {s.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <div className="flex flex-col sm:flex-row gap-3 mt-5">
              {stage.result.created.length > 0 && (
                <button type="button" onClick={downloadLinks} className="px-5 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent-light transition-all cursor-pointer">
                  Download Invite Links (CSV)
                </button>
              )}
              {onClose ? (
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-admin-border text-admin-text text-sm font-medium text-center hover:bg-admin-border/20 transition-all cursor-pointer">
                  Done
                </button>
              ) : (
                <Link href={`/admin/events/${weddingId}/dashboard`} className="px-5 py-2.5 rounded-xl border border-admin-border text-admin-text text-sm font-medium text-center hover:bg-admin-border/20 transition-all">
                  Go to Guest List
                </Link>
              )}
              <button type="button" onClick={reset} className="px-5 py-2.5 rounded-xl text-admin-text-muted text-sm hover:text-admin-text transition-all cursor-pointer">
                Import another file
              </button>
            </div>
          </div>

          {stage.result.created.length > 0 && (
            <div className="glass-dark rounded-2xl overflow-hidden">
              <ul className="divide-y divide-admin-border/50">
                {stage.result.created.map((c) => (
                  <li key={c.code} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-admin-text truncate">
                        <span aria-hidden>{TYPE_ICON[c.type]}</span> {c.name}
                      </div>
                      {(c.members.length > 0 || c.phone || c.group) && (
                        <div className="text-xs text-admin-text-muted truncate">
                          {[c.members.join(", "), c.phone, c.group].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                    <CopyLinkButtonClient code={c.code} wedding={wedding} guest={{ id: c.guestId, guest_name: c.name, group_label: c.name, phone: c.phone }} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────── Sub-components ──────────────────────────

function FormatGuide({ groupNames }: { groupNames: string[] }) {
  return (
    <div className="glass-dark rounded-2xl p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-admin-text">File format</h2>
          <p className="text-sm text-admin-text-muted">One row per invitation. The first row must be the column headers.</p>
        </div>
        <a
          href="/templates/guest-import-template.csv"
          download
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-admin-accent border border-admin-accent/30 hover:bg-admin-accent/10 transition-all"
        >
          ⬇ Download Template
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-admin-text-muted border-b border-admin-border">
              <th className="py-2 pr-4">Column</th>
              <th className="py-2 pr-4">Required</th>
              <th className="py-2">What to put</th>
            </tr>
          </thead>
          <tbody className="text-admin-text divide-y divide-admin-border/40">
            <tr><td className="py-2 pr-4 font-mono">Type</td><td className="py-2 pr-4 text-admin-text-muted">No</td><td className="py-2"><code>individual</code>, <code>couple</code> or <code>family</code>. Leave blank to auto-detect from Members (0–1 → individual, 2 → couple, 3+ → family).</td></tr>
            <tr><td className="py-2 pr-4 font-mono">Name</td><td className="py-2 pr-4 text-admin-text-muted">Yes*</td><td className="py-2">Shown as &quot;Dear …&quot;. e.g. <em>Sarah Johnson</em>, <em>Mr. &amp; Mrs. Fernando</em>, <em>The Silva Family</em>. *Optional for couples — defaults to &quot;A &amp; B&quot;.</td></tr>
            <tr><td className="py-2 pr-4 font-mono">Members</td><td className="py-2 pr-4 text-admin-text-muted">Couple/Family</td><td className="py-2">Each person who can RSVP, separated by <code>;</code> (or one per line inside the cell). Couple = exactly 2, Family = 2 or more. Leave blank for individuals.</td></tr>
            <tr><td className="py-2 pr-4 font-mono">Phone</td><td className="py-2 pr-4 text-admin-text-muted">No</td><td className="py-2">WhatsApp number, e.g. <code>0771234567</code> or <code>+94771234567</code>. Numbers without a country code get <code>+{DEFAULT_COUNTRY_CODE}</code>. One number per invitation.</td></tr>
            <tr><td className="py-2 pr-4 font-mono">Side</td><td className="py-2 pr-4 text-admin-text-muted">No</td><td className="py-2"><code>groom</code> or <code>bride</code> — whose side invited them. Leave blank to decide later.</td></tr>
            {groupNames.length > 0 && (
              <tr>
                <td className="py-2 pr-4 font-mono">Group</td>
                <td className="py-2 pr-4 text-admin-text-muted">No</td>
                <td className="py-2">
                  One of your guest groups: {groupNames.map((n, i) => <span key={n}>{i > 0 && ", "}<code>{n}</code></span>)}.
                  Leave blank to use the default group you pick after uploading.
                </td>
              </tr>
            )}
            <tr><td className="py-2 pr-4 font-mono">Message</td><td className="py-2 pr-4 text-admin-text-muted">No</td><td className="py-2">Optional personal note on the invitation.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface PreviewProps {
  fileName: string;
  analysis: SheetAnalysis;
  duplicateRows: Map<number, string>;
  categories: Pick<GuestCategory, "id" | "name">[];
  defaultCategoryId: string;
  defaultCategoryName: string | null;
  onDefaultCategoryChange: (id: string) => void;
  importing: boolean;
  onImport: () => void;
  onCancel: () => void;
}

function Preview({
  fileName,
  analysis,
  duplicateRows,
  categories,
  defaultCategoryId,
  defaultCategoryName,
  onDefaultCategoryChange,
  importing,
  onImport,
  onCancel,
}: PreviewProps) {
  const { valid, invalid, ignoredColumns } = analysis;
  // Duplicates are never added — the table shows exactly what will be created.
  const toAdd = valid.filter((v) => !duplicateRows.has(v.row));
  const duplicates = valid.filter((v) => duplicateRows.has(v.row));
  const importCount = toAdd.length;
  const peopleCount = toAdd.reduce((n, v) => n + Math.max(1, v.members.length), 0);

  return (
    <div className="space-y-6 animate-fade-in-up relative">
      <SectionLoadingOverlay
        isLoading={importing}
        message="Importing invitations..."
        submessage="Creating guests & generating encrypted invite links"
        theme="admin"
        rounded="2xl"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="File" value={fileName} small />
        <Stat label="Will be added" value={String(importCount)} tone="success" />
        <Stat label="Errors" value={String(invalid.length)} tone={invalid.length ? "danger" : undefined} />
        <Stat label="Duplicates" value={String(duplicateRows.size)} tone={duplicateRows.size ? "warning" : undefined} />
      </div>

      {categories.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <label htmlFor="import-default-group" className="text-sm text-admin-text-muted">
            Guest group for rows without one
          </label>
          <select
            id="import-default-group"
            value={defaultCategoryId}
            onChange={(e) => onDefaultCategoryChange(e.target.value)}
            disabled={importing}
            className="px-3 py-2 rounded-xl bg-admin-bg border border-admin-border text-admin-text text-sm focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {ignoredColumns.length > 0 && (
        <p className="text-xs text-admin-text-muted">Ignored unknown columns: {ignoredColumns.join(", ")}</p>
      )}

      {invalid.length > 0 && (
        <div className="p-4 rounded-xl bg-admin-danger/10 border border-admin-danger/20">
          <p className="text-sm font-medium text-admin-danger mb-2">
            {invalid.length} row{invalid.length === 1 ? "" : "s"} will not be imported. Fix them in your file and re-upload, or continue without them.
          </p>
          <ul className="text-xs text-admin-danger/90 space-y-1 max-h-40 overflow-y-auto">
            {invalid.map((r) => (
              <li key={r.row}><strong>Row {r.row}:</strong> {r.errors.join("; ")}</li>
            ))}
          </ul>
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="p-4 rounded-xl bg-admin-warning/10 border border-admin-warning/20">
          <p className="text-sm font-medium text-admin-warning mb-2">
            {duplicates.length} duplicate row{duplicates.length === 1 ? "" : "s"} will not be added (same name or phone number as an existing invitation or an earlier row).
          </p>
          <ul className="text-xs text-admin-warning/90 space-y-1 max-h-40 overflow-y-auto">
            {duplicates.map((d) => (
              <li key={d.row}><strong>Row {d.row} · {d.name}:</strong> {duplicateRows.get(d.row)}</li>
            ))}
          </ul>
        </div>
      )}

      {toAdd.length > 0 && (
        <div className="glass-dark rounded-2xl overflow-hidden">
          <div className="overflow-x-auto max-h-112 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-admin-bg">
                <tr className="text-left text-xs uppercase tracking-wider text-admin-text-muted border-b border-admin-border">
                  <th className="px-4 py-3">Row</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Side</th>
                  {categories.length > 0 && <th className="px-4 py-3">Group</th>}
                  <th className="px-4 py-3">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/40">
                {toAdd.map((inv) => (
                  <tr key={inv.row}>
                    <td className="px-4 py-2.5 text-admin-text-muted">{inv.row}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-admin-text"><span aria-hidden>{TYPE_ICON[inv.type]}</span> {inv.type}</td>
                    <td className="px-4 py-2.5 text-admin-text">{inv.name}</td>
                    <td className="px-4 py-2.5 text-admin-text-muted">{inv.members.join(", ") || "—"}</td>
                    <td className="px-4 py-2.5 text-admin-text-muted whitespace-nowrap">{inv.phone || "—"}</td>
                    <td className="px-4 py-2.5 text-admin-text-muted whitespace-nowrap capitalize">{inv.side || "—"}</td>
                    {categories.length > 0 && (
                      <td className={`px-4 py-2.5 whitespace-nowrap ${inv.group ? "text-admin-text" : "text-admin-text-muted"}`}>
                        {inv.group ?? defaultCategoryName ?? "—"}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-admin-text-muted max-w-60 truncate">{inv.message || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {importCount === 0 && (
        <p className="text-sm text-admin-text-muted">Nothing new to add — every row is a duplicate or has an error.</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onImport}
          disabled={importing || importCount === 0}
          className="px-6 py-3 rounded-xl bg-admin-accent text-white font-medium hover:bg-admin-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          Import {importCount} invitation{importCount === 1 ? "" : "s"} ({peopleCount} people)
        </button>
        <button type="button" onClick={onCancel} disabled={importing} className="px-6 py-3 rounded-xl border border-admin-border text-admin-text-muted hover:text-admin-text transition-all cursor-pointer">
          Choose a different file
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone, small }: { label: string; value: string; tone?: "success" | "danger" | "warning"; small?: boolean }) {
  const color = tone === "success" ? "text-admin-success" : tone === "danger" ? "text-admin-danger" : tone === "warning" ? "text-admin-warning" : "text-admin-text";
  return (
    <div className="glass-dark rounded-xl p-4 min-w-0">
      <p className="text-xs text-admin-text-muted">{label}</p>
      <p className={`${small ? "text-sm truncate" : "text-2xl"} font-semibold ${color}`} title={value}>{value}</p>
    </div>
  );
}
