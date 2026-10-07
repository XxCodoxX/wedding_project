"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";
import { getUserProfile } from "@/lib/auth";
import { categoryNameSchema, isMissingCategoryTable, CATEGORY_MIGRATION_ERROR } from "@/lib/guest-category";

const SETTINGS_PATH = "/admin/settings/groups";
const idSchema = z.uuid("Invalid group ID");

type ActionResult = { success: true } | { error: string };

async function requireAdmin(): Promise<string | null> {
  const profile = await getUserProfile();
  return profile?.role === "admin" ? null : "Unauthorized: Only admins can manage guest groups";
}

/** Postgres errors → messages an admin can act on. */
function describeError(error: { code?: string; message?: string }): string {
  if (isMissingCategoryTable(error)) return CATEGORY_MIGRATION_ERROR;
  if (error.code === "23505") return "A group with this name already exists";
  return error.message || "Database error";
}

// Guest pages and dashboards show group names, so refresh them all.
function revalidateGroupScreens() {
  revalidatePath(SETTINGS_PATH);
  revalidatePath("/admin/events", "layout");
}

// ---------- Create ----------
export async function createGuestCategory(name: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const parsed = categoryNameSchema.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("guest_categories").insert({ name: parsed.data });
    if (error) return { error: describeError(error) };

    revalidateGroupScreens();
    return { success: true };
  } catch (e) {
    console.error("createGuestCategory failed:", e);
    return { error: "An unexpected error occurred" };
  }
}

// ---------- Rename ----------
export async function updateGuestCategory(id: string, name: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const parsedId = idSchema.safeParse(id);
  const parsedName = categoryNameSchema.safeParse(name);
  if (!parsedId.success) return { error: parsedId.error.issues[0].message };
  if (!parsedName.success) return { error: parsedName.error.issues[0].message };

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("guest_categories")
      .update({ name: parsedName.data })
      .eq("id", parsedId.data)
      .select("id");
    if (error) return { error: describeError(error) };
    if (!data || data.length === 0) return { error: "Group not found" };

    revalidateGroupScreens();
    return { success: true };
  } catch (e) {
    console.error("updateGuestCategory failed:", e);
    return { error: "An unexpected error occurred" };
  }
}

// ---------- Delete ----------
/** Deletes a group after moving its guests to the default ("Other") group, which can't be deleted. */
export async function deleteGuestCategory(id: string): Promise<ActionResult & { moved?: number }> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: parsedId.error.issues[0].message };

  try {
    const supabase = createServerClient();
    const { data: groups, error: fetchError } = await supabase
      .from("guest_categories")
      .select("id, is_default")
      .or(`id.eq.${parsedId.data},is_default.eq.true`);
    if (fetchError) return { error: describeError(fetchError) };

    const target = groups?.find((g) => g.id === parsedId.data);
    const fallback = groups?.find((g) => g.is_default);
    if (!target) return { error: "Group not found" };
    if (target.is_default) return { error: "The default group can't be deleted" };
    if (!fallback) return { error: "No default group found. Please re-run supabase/18_add_guest_categories.sql." };

    // Move guests first: if this fails, nothing is deleted.
    const { count, error: moveError } = await supabase
      .from("guests")
      .update({ category_id: fallback.id }, { count: "exact" })
      .eq("category_id", target.id);
    if (moveError) return { error: `Failed to move guests to the default group: ${moveError.message}` };

    const { error: deleteError } = await supabase.from("guest_categories").delete().eq("id", target.id);
    if (deleteError) return { error: describeError(deleteError) };

    revalidateGroupScreens();
    return { success: true, moved: count ?? 0 };
  } catch (e) {
    console.error("deleteGuestCategory failed:", e);
    return { error: "An unexpected error occurred" };
  }
}
