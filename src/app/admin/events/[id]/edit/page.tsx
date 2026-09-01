import WeddingForm from "@/components/admin/WeddingForm";
import { updateWedding } from "@/lib/actions";
import { createServerClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/admin/Breadcrumbs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: wedding, error } = await supabase
    .from("weddings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !wedding) {
    notFound();
  }

  const handleUpdate = async (formData: FormData) => {
    "use server";
    return updateWedding(id, formData);
  };

  return (
    <div>
      <div className="mb-8">
        <Breadcrumbs items={[
          { label: "Events", href: "/admin/events" },
          { label: `${wedding.groom_name} & ${wedding.bride_name}`, href: `/admin/events/${wedding.id}/dashboard` },
          { label: "Edit" }
        ]} />
        <h1 className="text-2xl font-semibold text-admin-text">
          Edit Event
        </h1>
        <p className="text-admin-text-muted text-sm mt-1">
          Update the details for {wedding.groom_name} & {wedding.bride_name}&apos;s wedding
        </p>
      </div>

      <WeddingForm
        mode="edit"
        weddingId={wedding.id}
        initialData={wedding}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
