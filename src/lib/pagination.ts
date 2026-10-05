/**
 * Dashboard guest table pagination (?page=, ?per=).
 *
 * Pure (no server/browser APIs) — used by the guest table.
 */

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 25;

export function parsePageSize(value: string | null | undefined): PageSize {
  const n = Number(value);
  return (PAGE_SIZES as readonly number[]).includes(n) ? (n as PageSize) : DEFAULT_PAGE_SIZE;
}

/** 1-based. Anything missing or invalid is page 1; the upper bound is applied by `paginate`. */
export function parsePage(value: string | null | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export interface PageWindow {
  /** The requested page, clamped to the pages that exist (e.g. after a live update removed guests). */
  page: number;
  totalPages: number;
  /** Slice bounds: items[start, end). */
  start: number;
  end: number;
}

export function paginate(total: number, page: number, size: number): PageWindow {
  const totalPages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * size;
  return { page: current, totalPages, start, end: Math.min(start + size, total) };
}

/**
 * Page numbers to show as buttons, with "gap" where a run is skipped:
 * first, last, and the current page ±1 — e.g. 1 … 4 5 6 … 12.
 * A gap that would hide a single page shows that page instead.
 */
export function pageList(current: number, totalPages: number): (number | "gap")[] {
  const pages = new Set([1, totalPages, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const out: (number | "gap")[] = [];
  for (const p of sorted) {
    const prev = out[out.length - 1];
    if (typeof prev === "number" && p - prev === 2) out.push(prev + 1);
    else if (typeof prev === "number" && p - prev > 2) out.push("gap");
    out.push(p);
  }
  return out;
}
