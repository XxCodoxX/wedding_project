import GuestForm from "@/components/admin/GuestForm";
import { createGuest } from "@/lib/actions";
import { createServerClient } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import { getUserProfile, canAccessWedding } from "@/lib/auth";
import Link from "next/link";
import Breadcrumbs from "@/components/admin/Breadcrumbs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewGuestPage({ params }: PageProps) {
  const profile = await getUserProfile();
  if (!profile) {
    redirect("/admin/login");
  }

  const { id: weddingId } = await params;
  const hasAccess = await canAccessWedding(weddingId);
  if (!hasAccess) {
    redirect("/admin/events");
  }

  const supabase = createServerClient();
  const { data: wedding, error } = await supabase
    .from("weddings")
    .select("groom_name, bride_name")
    .eq("id", weddingId)
    .single();

  if (error || !wedding) {
    notFound();
  }

  return (
    <div>
      <div className="mb-4">
        <Breadcrumbs items={[
          { label: "Events", href: "/admin/events" },
          { label: `${wedding.groom_name} & ${wedding.bride_name}`, href: `/admin/events/${weddingId}/dashboard` },
          { label: "Add Invitation" }
        ]} />
      </div>
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-admin-text">
          Add Invitation
        </h1>
        <p className="text-admin-text-muted text-sm mt-1">
          Create an individual, couple, or family invitation with a personalized link
        </p>
      </div>

      {/* Form */}
      <GuestForm mode="create" onSubmit={createGuest} weddingId={weddingId} />
    </div>
  );
}
