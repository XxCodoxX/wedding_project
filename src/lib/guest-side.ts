/**
 * Guest side (bride's side / groom's side) helpers.
 *
 * Pure (no server/browser APIs) — shared by the guest form, CSV import, Server Actions
 * and the dashboard.
 */

export const GUEST_SIDES = ["groom", "bride"] as const;
export type GuestSide = (typeof GUEST_SIDES)[number];

export function isGuestSide(value: unknown): value is GuestSide {
  return typeof value === "string" && (GUEST_SIDES as readonly string[]).includes(value);
}

/** Form value → side. Empty / unknown means "not assigned". */
export function parseGuestSide(value: FormDataEntryValue | null | undefined): GuestSide | null {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  return isGuestSide(v) ? v : null;
}

/** "Kasun's side", falling back to "Groom's side" when the name is unknown. */
export function sideLabel(side: GuestSide, names?: { groom_name?: string; bride_name?: string } | null): string {
  const name = side === "groom" ? names?.groom_name : names?.bride_name;
  return name?.trim() ? `${name.trim()}'s side` : side === "groom" ? "Groom's side" : "Bride's side";
}

// ---------- Dashboard filter (?side=) ----------

export const SIDE_FILTERS = ["all", "groom", "bride", "unassigned"] as const;
export type SideFilter = (typeof SIDE_FILTERS)[number];

export function parseSideFilter(value: string | string[] | undefined): SideFilter {
  const v = Array.isArray(value) ? value[0] : value;
  return (SIDE_FILTERS as readonly string[]).includes(v ?? "") ? (v as SideFilter) : "all";
}

export function matchesSideFilter(side: GuestSide | null | undefined, filter: SideFilter): boolean {
  if (filter === "all") return true;
  if (filter === "unassigned") return !side;
  return side === filter;
}

// ---------- Migration fallback ----------

/** True when a Supabase/PostgREST error means the `guest_side` column doesn't exist yet (migration 14 not run). */
export function isMissingSideColumn(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (error.code === "PGRST204" || error.code === "42703") && !!error.message?.includes("guest_side");
}

export const SIDE_MIGRATION_ERROR =
  "Database column 'guest_side' is missing. Please run supabase/14_add_guest_side_to_guests.sql in your Supabase SQL Editor.";
