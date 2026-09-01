import WeddingForm from "@/components/admin/WeddingForm";
import { createWedding } from "@/lib/actions";
import { createServerClient } from "@/lib/supabase";
import Link from "next/link";
import Breadcrumbs from "@/components/admin/Breadcrumbs";

export default async function NewEventPage() {

  return (
    <div>
      <div className="mb-8">
        <Breadcrumbs items={[
          { label: "Events", href: "/admin/events" },
          { label: "New Event" }
        ]} />
        <h1 className="text-2xl font-semibold text-admin-text">
          Create New Event
        </h1>
        <p className="text-admin-text-muted text-sm mt-1">
          Add a new wedding to start managing its guests and invitations
        </p>
      </div>

      <WeddingForm mode="create" onSubmit={createWedding} />
    </div>
  );
}
