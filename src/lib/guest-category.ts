/**
 * Guest groups (Family, Friends, School friends, ...) — stored as `guest_categories` / `guests.category_id`
 * because `group_id` already means "the couple/family sharing one invite link".
 *
 * No server/browser APIs (the fetch helper takes the client as an argument), so the guest form,
 * CSV import, Server Actions and the dashboard all share these rules.
 */
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface GuestCategory {
  id: string;
  name: string;
  /** The "Other" group: can't be deleted, used when no group is chosen. */
  is_default: boolean;
  created_at: string;
}

export const CATEGORY_NAME_MAX = 60;

export const categoryNameSchema = z
  .string()
  .transform((s) => s.replace(/\s+/g, " ").trim())
  .pipe(
    z
      .string()
      .min(1, "Group name is required")
      .max(CATEGORY_NAME_MAX, `Group name must be ${CATEGORY_NAME_MAX} characters or less`)
  );

/** Case/space-insensitive key, matching the database's unique index on lower(btrim(name)). */
export const categoryKey = (name: string) => name.replace(/\s+/g, " ").trim().toLowerCase();

/** Finds a group by name, ignoring case and extra spaces. */
export function findCategoryByName<T extends Pick<GuestCategory, "name">>(categories: T[], name: string): T | undefined {
  const key = categoryKey(name);
  return categories.find((c) => categoryKey(c.name) === key);
}

/** The default ("Other") group, falling back to the first one. */
export function defaultCategory<T extends Pick<GuestCategory, "is_default">>(categories: T[]): T | undefined {
  return categories.find((c) => c.is_default) ?? categories[0];
}

/**
 * Loads every group, default first, then alphabetically.
 * Returns [] before migration 18 is run, so screens keep working without the feature.
 */
export async function fetchGuestCategories(
  supabase: SupabaseClient
): Promise<{ categories: GuestCategory[]; error?: string; notMigrated?: boolean }> {
  const { data, error } = await supabase
    .from("guest_categories")
    .select("id, name, is_default, created_at")
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (isMissingCategoryTable(error)) return { categories: [], notMigrated: true };
  if (error) return { categories: [], error: error.message };
  return { categories: (data ?? []) as GuestCategory[] };
}

// ---------- Migration fallback ----------

/** True when the `guest_categories` table doesn't exist yet (migration 18 not run). */
export function isMissingCategoryTable(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (error.code === "PGRST205" || error.code === "42P01") && !!error.message?.includes("guest_categories");
}

/** True when the `guests.category_id` column doesn't exist yet (migration 18 not run). */
export function isMissingCategoryColumn(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (error.code === "PGRST204" || error.code === "42703") && !!error.message?.includes("category_id");
}

export const CATEGORY_MIGRATION_ERROR =
  "Guest groups are not set up yet. Please run supabase/18_add_guest_categories.sql in your Supabase SQL Editor.";
