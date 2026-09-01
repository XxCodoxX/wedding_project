import { createServerClient } from "@/lib/supabase";
import { encryptGuestId } from "@/lib/crypto";
import type { Guest, Wedding } from "@/lib/supabase";
import Link from "next/link";
import Breadcrumbs from "@/components/admin/Breadcrumbs";
import DeleteGuestButton from "./DeleteGuestButton";
import CopyLinkButtonClient from "./CopyLinkButtonClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { id: weddingId } = await params;
  const supabase = createServerClient();

  // Fetch wedding to ensure it exists and get its details
  const { data: wedding, error: weddingError } = await supabase
    .from("weddings")
    .select("*")
    .eq("id", weddingId)
    .single();

  if (weddingError || !wedding) {
    notFound();
  }

  const { data: guests, error } = await supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false });

  const guestList: Guest[] = guests || [];

  // Stats
  const total = guestList.length;
  const attending = guestList.filter((g) => g.rsvp_status === "attending").length;
  const notAttending = guestList.filter((g) => g.rsvp_status === "not_attending").length;
  const pending = guestList.filter((g) => g.rsvp_status === "pending").length;

  return (
    <div>
      <div className="mb-4">
        <Breadcrumbs items={[
          { label: "Events", href: "/admin/events" },
          { label: `${wedding.groom_name} & ${wedding.bride_name}` }
        ]} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-admin-text">
            {wedding.groom_name} & {wedding.bride_name}&apos;s Wedding
          </h1>
          <p className="text-admin-text-muted text-sm mt-1">
            Manage guests and invitations for this event
          </p>
        </div>
        <Link
          href={`/admin/events/${weddingId}/guests/new`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent-light transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Guest
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Guests"
          value={total}
          icon="👥"
          color="text-admin-accent-light"
          bgColor="bg-admin-accent/10"
        />
        <StatCard
          label="Attending"
          value={attending}
          icon="✅"
          color="text-admin-success"
          bgColor="bg-admin-success/10"
        />
        <StatCard
          label="Not Attending"
          value={notAttending}
          icon="❌"
          color="text-admin-danger"
          bgColor="bg-admin-danger/10"
        />
        <StatCard
          label="Pending"
          value={pending}
          icon="⏳"
          color="text-admin-warning"
          bgColor="bg-admin-warning/10"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-admin-danger/10 border border-admin-danger/20 text-admin-danger text-sm mb-6">
          Failed to load guests: {error.message}
        </div>
      )}

      {/* Guests Table */}
      {guestList.length === 0 ? (
        <div className="glass-dark rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">💌</div>
          <h3 className="text-lg font-medium text-admin-text mb-2">
            No guests yet
          </h3>
          <p className="text-admin-text-muted text-sm mb-6">
            Start by adding your first guest to generate personalized invitation links.
          </p>
          <Link
            href={`/admin/events/${weddingId}/guests/new`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent-light transition-all duration-200"
          >
            Add Your First Guest
          </Link>
        </div>
      ) : (
        <div className="glass-dark rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="text-left text-xs font-medium text-admin-text-muted uppercase tracking-wider px-6 py-4">
                    Guest
                  </th>
                  <th className="text-left text-xs font-medium text-admin-text-muted uppercase tracking-wider px-6 py-4">
                    RSVP Status
                  </th>
                  <th className="text-left text-xs font-medium text-admin-text-muted uppercase tracking-wider px-6 py-4">
                    Invite Link
                  </th>
                  <th className="text-left text-xs font-medium text-admin-text-muted uppercase tracking-wider px-6 py-4">
                    Created
                  </th>
                  <th className="text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/50">
                {guestList.map((guest) => {
                  const inviteCode = encryptGuestId(guest.id);
                  return (
                    <tr
                      key={guest.id}
                      className="hover:bg-admin-border/10 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-admin-text">
                          {guest.guest_name}
                        </div>
                        {guest.custom_message && (
                          <div className="text-xs text-admin-text-muted truncate max-w-[200px]">
                            {guest.custom_message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <RsvpBadge status={guest.rsvp_status} />
                      </td>
                      <td className="px-6 py-4">
                        <CopyLinkButton code={inviteCode} />
                      </td>
                      <td className="px-6 py-4 text-sm text-admin-text-muted">
                        {new Date(guest.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/events/${weddingId}/guests/${guest.id}/edit`}
                            className="p-2 rounded-lg text-admin-text-muted hover:text-admin-accent hover:bg-admin-accent/10 transition-all"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </Link>
                          <DeleteGuestButton guestId={guest.id} guestName={guest.guest_name} weddingId={weddingId} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Sub-components ----------

function StatCard({
  label,
  value,
  icon,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="glass-dark rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center text-lg`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs text-admin-text-muted">{label}</p>
          <p className={`text-2xl font-semibold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function RsvpBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    pending: {
      label: "Pending",
      classes: "bg-admin-warning/15 text-admin-warning border-admin-warning/25",
    },
    attending: {
      label: "Attending",
      classes: "bg-admin-success/15 text-admin-success border-admin-success/25",
    },
    not_attending: {
      label: "Not Attending",
      classes: "bg-admin-danger/15 text-admin-danger border-admin-danger/25",
    },
  };

  const { label, classes } = config[status] || config.pending;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${classes}`}
    >
      {label}
    </span>
  );
}

function CopyLinkButton({ code }: { code: string }) {
  return <CopyLinkButtonClient code={code} />;
}
