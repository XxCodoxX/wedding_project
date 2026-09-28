import UserForm from "@/components/admin/UserForm";
import { createUser } from "@/lib/user-actions";
import { createServerClient } from "@/lib/supabase";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/admin/Breadcrumbs";

export default async function NewUserPage() {
  const profile = await getUserProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/admin/events");
  }

  const supabase = createServerClient();
  const { data: weddings } = await supabase
    .from("weddings")
    .select("id, groom_name, bride_name, venue_name, wedding_date")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <Breadcrumbs items={[
          { label: "Users", href: "/admin/users" },
          { label: "New User" }
        ]} />
        <h1 className="text-xl sm:text-2xl font-semibold text-admin-text">
          Add New User
        </h1>
        <p className="text-admin-text-muted text-sm mt-1">
          Create a new user account and assign their role
        </p>
      </div>

      <UserForm
        mode="create"
        weddings={weddings || []}
        onSubmit={createUser}
      />
    </div>
  );
}
