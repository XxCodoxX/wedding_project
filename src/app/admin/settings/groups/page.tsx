import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { getUserProfile } from "@/lib/auth";
import { fetchGuestCategories, CATEGORY_MIGRATION_ERROR } from "@/lib/guest-category";
import Breadcrumbs from "@/components/admin/Breadcrumbs";
import GuestGroupManager from "./GuestGroupManager";

export const dynamic = "force-dynamic";

export default async function GuestGroupsPage() {
  const profile = await getUserProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/admin/events");
  }

  const supabase = createServerClient();

  const { categories, error, notMigrated } = await fetchGuestCategories(supabase);

  // One head-count per group, in parallel (a handful of groups — cheaper than loading every guest row).
  const counts = await Promise.all(
    categories.map(async (c) => {
      const { count } = await supabase
        .from("guests")
        .select("id", { head: true, count: "exact" })
        .eq("category_id", c.id);
      return count ?? 0;
    })
  );
  const groups = categories.map((c, i) => ({ ...c, guestCount: counts[i] }));

  return (
    <div>
      <Breadcrumbs items={[{ label: "Settings" }, { label: "Guest Groups" }]} />

      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-admin-text">Guest Groups</h1>
        <p className="text-admin-text-muted text-sm mt-1">
          Sort guests into groups like Family, Friends or School friends. Groups are shared by every event.
        </p>
      </div>

      {notMigrated ? (
        <div role="alert" className="p-4 rounded-xl bg-admin-warning/10 border border-admin-warning/20 text-admin-warning text-sm">
          {CATEGORY_MIGRATION_ERROR}
        </div>
      ) : error ? (
        <div role="alert" className="p-4 rounded-xl bg-admin-danger/10 border border-admin-danger/20 text-admin-danger text-sm">
          Failed to load guest groups: {error}
        </div>
      ) : (
        <GuestGroupManager groups={groups} />
      )}
    </div>
  );
}
