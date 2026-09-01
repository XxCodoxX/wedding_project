import GuestForm from "@/components/admin/GuestForm";
import { updateGuest } from "@/lib/actions";
import { createServerClient } from "@/lib/supabase";
import { encryptGuestId } from "@/lib/crypto";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/admin/Breadcrumbs";

interface PageProps {
  params: Promise<{ id: string; guestId: string }>;
}

export default async function EditGuestPage({ params }: PageProps) {
  const { id: weddingId, guestId } = await params;
  const supabase = createServerClient();

  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .select("*")
    .eq("id", guestId)
    .single();

  const { data: wedding, error: weddingError } = await supabase
    .from("weddings")
    .select("groom_name, bride_name")
    .eq("id", weddingId)
    .single();

  if (guestError || !guest || weddingError || !wedding) {
    notFound();
  }

  const inviteCode = encryptGuestId(guest.id);

  const handleUpdate = async (formData: FormData) => {
    "use server";
    return updateGuest(guest.id, formData);
  };

  return (
    <div>
      <div className="mb-4">
        <Breadcrumbs items={[
          { label: "Events", href: "/admin/events" },
          { label: `${wedding.groom_name} & ${wedding.bride_name}`, href: `/admin/events/${weddingId}/dashboard` },
          { label: "Edit Guest" }
        ]} />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-admin-text">Edit Guest</h1>
        <p className="text-admin-text-muted text-sm mt-1">
          Update guest details or generate a new invitation link
        </p>
      </div>

      {/* Form */}
      <GuestForm
        mode="edit"
        guestId={guest.id}
        weddingId={weddingId}
        initialData={guest}
        inviteCode={inviteCode}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
