import UserForm from "@/components/admin/UserForm";
import { updateUser } from "@/lib/user-actions";
import { createServerClient } from "@/lib/supabase";
import { getUserProfile } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Breadcrumbs from "@/components/admin/Breadcrumbs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: PageProps) {
  const profile = await getUserProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/admin/events");
  }

  const { id } = await params;
  const supabase = createServerClient();

  // Fetch user profile
  const { data: userProfile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !userProfile) {
    notFound();
  }

  // Fetch weddings for assignment dropdown
  const { data: weddings } = await supabase
    .from("weddings")
    .select("id, groom_name, bride_name, venue_name, wedding_date")
    .order("created_at", { ascending: false });

  const handleUpdate = async (formData: FormData) => {
    "use server";
    return updateUser(id, formData);
  };

  return (
    <div>
      <div className="mb-8">
        <Breadcrumbs items={[
          { label: "Users", href: "/admin/users" },
          { label: userProfile.full_name || "User" },
          { label: "Edit" }
        ]} />
        <h1 className="text-xl sm:text-2xl font-semibold text-admin-text">
          Edit User
        </h1>
        <p className="text-admin-text-muted text-sm mt-1">
          Update {userProfile.full_name}&apos;s account settings
        </p>
      </div>

      <UserForm
        mode="edit"
        profileId={userProfile.id}
        initialData={{
          email: userProfile.email,
          full_name: userProfile.full_name,
          role: userProfile.role,
          assigned_wedding_id: userProfile.assigned_wedding_id,
        }}
        weddings={weddings || []}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
