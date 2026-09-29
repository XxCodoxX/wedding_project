import GuestForm from "@/components/admin/GuestForm";
import { updateGuest } from "@/lib/actions";
import { createServerClient } from "@/lib/supabase";
import { encryptGuestId } from "@/lib/crypto";
import { notFound, redirect } from "next/navigation";
import { getUserProfile, canAccessWedding } from "@/lib/auth";
import Link from "next/link";
import Breadcrumbs from "@/components/admin/Breadcrumbs";

interface PageProps {
  params: Promise<{ id: string; guestId: string }>;
}

export default async function EditGuestPage({ params }: PageProps) {
  const profile = await getUserProfile();
  if (!profile) {
    redirect("/admin/login");
  }

  const { id: weddingId, guestId } = await params;
  const hasAccess = await canAccessWedding(weddingId);
  if (!hasAccess) {
    redirect("/admin/events");
  }

  const supabase = createServerClient();

  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .select("*")
    .eq("id", guestId)
    .single();

  const { data: wedding, error: weddingError } = await supabase
    .from("weddings")
    .select("id, groom_name, bride_name, wedding_date, venue_name, whatsapp_message_template")
    .eq("id", weddingId)
    .single();

  if (guestError || !guest || weddingError || !wedding) {
    notFound();
  }

  // Fetch group members if this is a couple/family invitation
  let groupMembers: { id: string; name: string }[] = [];
  if (guest.group_id) {
    const { data: members } = await supabase
      .from("guests")
      .select("id, guest_name, is_primary")
      .eq("group_id", guest.group_id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    groupMembers = (members || []).map((m: any) => ({
      id: m.id,
      name: m.guest_name,
    }));
  }

  const inviteCode = encryptGuestId(guest.id);

  const handleUpdate = async (formData: FormData) => {
    "use server";
    return updateGuest(guest.id, formData);
  };

  const invitationType = guest.invitation_type || "individual";
  const typeLabel =
    invitationType === "couple"
      ? "Couple"
      : invitationType === "family"
      ? "Family"
      : "Guest";

  return (
    <div>
      <div className="mb-4">
        <Breadcrumbs items={[
          { label: "Events", href: "/admin/events" },
          { label: `${wedding.groom_name} & ${wedding.bride_name}`, href: `/admin/events/${weddingId}/dashboard` },
          { label: `Edit ${typeLabel}` }
        ]} />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-admin-text">Edit {typeLabel}</h1>
        <p className="text-admin-text-muted text-sm mt-1">
          Update {invitationType === "individual" ? "guest" : invitationType} details or manage the invitation
        </p>
      </div>

      {/* Form */}
      <GuestForm
        mode="edit"
        guestId={guest.id}
        weddingId={weddingId}
        wedding={wedding}
        guest={guest}
        initialData={{
          guest_name: guest.guest_name,
          custom_message: guest.custom_message,
          phone: guest.phone ?? null,
          invitation_type: invitationType,
          group_label: guest.group_label || null,
          members: groupMembers.length > 0 ? groupMembers : undefined,
        }}
        inviteCode={inviteCode}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
