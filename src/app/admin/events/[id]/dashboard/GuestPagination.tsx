"use client";

import type { MouseEvent, ReactNode } from "react";
import { PAGE_SIZES, pageList, type PageSize, type PageWindow } from "@/lib/pagination";

interface GuestPaginationProps {
  window: PageWindow;
  total: number;
  pageSize: PageSize;
  /** Real href for a page, so ctrl/cmd-click still opens it in a new tab. */
  hrefForPage: (page: number) => string;
  onNavigate: (e: MouseEvent<HTMLAnchorElement>) => void;
  onPageSizeChange: (size: PageSize) => void;
}

const baseButton =
  "inline-flex items-center justify-center min-w-9 h-9 px-2.5 rounded-xl text-sm border transition-all";
const idleButton =
  "border-admin-border text-admin-text-muted hover:text-admin-text hover:border-admin-accent/40";
const disabledButton = "border-admin-border/50 text-admin-text-muted/40 pointer-events-none";

/** "Showing 26–50 of 120", page links and a page-size picker, under the guest table. */
export default function GuestPagination({
  window: { page, totalPages, start, end },
  total,
  pageSize,
  hrefForPage,
  onNavigate,
  onPageSizeChange,
}: GuestPaginationProps) {
  const pageLink = (target: number, label: ReactNode, ariaLabel: string, disabled: boolean) =>
    disabled ? (
      <span aria-disabled="true" aria-label={ariaLabel} className={`${baseButton} ${disabledButton}`}>
        {label}
      </span>
    ) : (
      <a href={hrefForPage(target)} onClick={onNavigate} aria-label={ariaLabel} className={`${baseButton} ${idleButton}`}>
        {label}
      </a>
    );

  return (
    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-sm text-admin-text-muted">
        <p aria-live="polite">
          Showing <span className="text-admin-text font-medium">{start + 1}–{end}</span> of{" "}
          <span className="text-admin-text font-medium">{total}</span>
        </p>
        <label className="flex items-center gap-2">
          <span className="sr-only sm:not-sr-only">Per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)}
            aria-label="Invitations per page"
            className="pl-2.5 pr-7 py-1.5 rounded-xl bg-admin-bg border border-admin-border text-sm text-admin-text cursor-pointer focus:outline-none focus:ring-2 focus:ring-admin-accent/50"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s} className="bg-admin-card text-admin-text">
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {totalPages > 1 && (
        <nav aria-label="Guest table pages" className="flex flex-wrap items-center gap-1.5">
          {pageLink(page - 1, <Chevron dir="left" />, "Previous page", page === 1)}
          {pageList(page, totalPages).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} aria-hidden className="px-1 text-admin-text-muted">
                …
              </span>
            ) : p === page ? (
              <span
                key={p}
                aria-current="page"
                aria-label={`Page ${p}`}
                className={`${baseButton} border-admin-accent bg-admin-accent/10 text-admin-accent`}
              >
                {p}
              </span>
            ) : (
              <a
                key={p}
                href={hrefForPage(p)}
                onClick={onNavigate}
                aria-label={`Page ${p}`}
                className={`${baseButton} ${idleButton}`}
              >
                {p}
              </a>
            )
          )}
          {pageLink(page + 1, <Chevron dir="right" />, "Next page", page === totalPages)}
        </nav>
      )}
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={dir === "left" ? "M15.75 19.5L8.25 12l7.5-7.5" : "M8.25 4.5l7.5 7.5-7.5 7.5"} />
    </svg>
  );
}
