"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Wedding } from "@/lib/supabase";
import { importGuests, type ImportGuestsResult } from "@/lib/actions";
import {
  analyzeSheet,
  duplicateKey,
  IMPORT_LIMITS,
  type ImportInvitation,
  type SheetAnalysis,
} from "@/lib/guest-import";
import { ACCEPTED_EXTENSIONS, readSpreadsheet, toCsv } from "@/lib/guest-import-reader";
import SectionLoadingOverlay from "@/components/common/SectionLoadingOverlay";
import CopyLinkButtonClient from "@/app/admin/events/[id]/dashboard/CopyLinkButtonClient";

interface GuestImportProps {
  weddingId: string;
  wedding: Partial<Wedding>;
  /** Labels of invitations that already exist for this event (for duplicate warnings). */
  existingNames: string[];
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

export default function GuestImport({ weddingId, wedding, existingNames }: GuestImportProps) {
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const existingKeys = useMemo(() => new Set(existingNames.map(duplicateKey)), [existingNames]);

  // Row numbers that duplicate an existing guest or an earlier row in the same file.
  const duplicateRows = useMemo(() => {
    const dupes = new Set<number>();
    if (stage.kind !== "preview") return dupes;
    const seen = new Set(existingKeys);
    for (const inv of stage.analysis.valid) {
      const key = duplicateKey(inv.name);
      if (seen.has(key)) dupes.add(inv.row);
      seen.add(key);
    }
    return dupes;
  }, [stage, existingKeys]);

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
      const analysis = analyzeSheet(rows);
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
  }, []);

  const handleImport = async () => {
    if (stage.kind !== "preview") return;
    setError("");
    setImporting(true);
    try {
      const result = await importGuests({
        weddingId,
        skipDuplicates,
        invitations: stage.analysis.valid,
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
      ["Type", "Name", "Members", "Invite Link"],
      ...stage.result.created.map((c) => [c.type, c.name, c.members.join("; "), `${origin}/invite/${c.code}`]),
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
          <FormatGuide />

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
          skipDuplicates={skipDuplicates}
          onSkipDuplicatesChange={setSkipDuplicates}
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
              <p className="text-sm text-admin-text-muted">
                {stage.result.skipped.length} skipped as duplicates: {stage.result.skipped.map((s) => s.name).join(", ")}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 mt-5">
              {stage.result.created.length > 0 && (
                <button type="button" onClick={downloadLinks} className="px-5 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent-light transition-all cursor-pointer">
                  Download Invite Links (CSV)
                </button>
              )}
              <Link href={`/admin/events/${weddingId}/dashboard`} className="px-5 py-2.5 rounded-xl border border-admin-border text-admin-text text-sm font-medium text-center hover:bg-admin-border/20 transition-all">
                Go to Guest List
              </Link>
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
                      {c.members.length > 0 && (
                        <div className="text-xs text-admin-text-muted truncate">{c.members.join(", ")}</div>
                      )}
                    </div>
                    <CopyLinkButtonClient code={c.code} wedding={wedding} guest={{ guest_name: c.name, group_label: c.name }} />
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

function FormatGuide() {
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
  duplicateRows: Set<number>;
  skipDuplicates: boolean;
  onSkipDuplicatesChange: (v: boolean) => void;
  importing: boolean;
  onImport: () => void;
  onCancel: () => void;
}

function Preview({ fileName, analysis, duplicateRows, skipDuplicates, onSkipDuplicatesChange, importing, onImport, onCancel }: PreviewProps) {
  const { valid, invalid, ignoredColumns } = analysis;
  const importCount = skipDuplicates ? valid.filter((v) => !duplicateRows.has(v.row)).length : valid.length;
  const peopleCount = valid
    .filter((v) => !skipDuplicates || !duplicateRows.has(v.row))
    .reduce((n, v) => n + Math.max(1, v.members.length), 0);

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
        <Stat label="Ready" value={String(valid.length)} tone="success" />
        <Stat label="Errors" value={String(invalid.length)} tone={invalid.length ? "danger" : undefined} />
        <Stat label="Duplicates" value={String(duplicateRows.size)} tone={duplicateRows.size ? "warning" : undefined} />
      </div>

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

      {valid.length > 0 && (
        <div className="glass-dark rounded-2xl overflow-hidden">
          <div className="overflow-x-auto max-h-112 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-admin-bg">
                <tr className="text-left text-xs uppercase tracking-wider text-admin-text-muted border-b border-admin-border">
                  <th className="px-4 py-3">Row</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/40">
                {valid.map((inv) => {
                  const dup = duplicateRows.has(inv.row);
                  return (
                    <tr key={inv.row} className={dup ? (skipDuplicates ? "opacity-50" : "bg-admin-warning/5") : undefined}>
                      <td className="px-4 py-2.5 text-admin-text-muted">{inv.row}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-admin-text"><span aria-hidden>{TYPE_ICON[inv.type]}</span> {inv.type}</td>
                      <td className="px-4 py-2.5 text-admin-text">
                        {inv.name}
                        {dup && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-admin-warning/15 text-admin-warning">duplicate</span>}
                      </td>
                      <td className="px-4 py-2.5 text-admin-text-muted">{inv.members.join(", ") || "—"}</td>
                      <td className="px-4 py-2.5 text-admin-text-muted max-w-60 truncate">{inv.message || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {duplicateRows.size > 0 && (
        <label className="flex items-center gap-2 text-sm text-admin-text cursor-pointer">
          <input
            type="checkbox"
            checked={skipDuplicates}
            onChange={(e) => onSkipDuplicatesChange(e.target.checked)}
            className="w-4 h-4 accent-admin-accent"
          />
          Skip duplicates (names already on the guest list or repeated in this file)
        </label>
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
