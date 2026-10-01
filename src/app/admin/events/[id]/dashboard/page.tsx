import { createServerClient } from "@/lib/supabase";
import { encryptGuestId } from "@/lib/crypto";
import type { Guest } from "@/lib/supabase";
import Link from "next/link";
import Breadcrumbs from "@/components/admin/Breadcrumbs";
import ImportGuestsButton from "./ImportGuestsButton";
import SendQueueButton, { type QueueItem } from "./SendQueueButton";
import LiveGuestUpdates from "./LiveGuestUpdates";
import GuestTable, { type GuestGroup } from "./GuestTable";
import { getInviteStatus } from "@/lib/invite-tracking";
import { notFound, redirect } from "next/navigation";
import { getUserProfile, canAccessWedding } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Group guests by group_id for display
function groupGuests(guestList: Guest[]): GuestGroup[] {
  const groups: Map<string, GuestGroup> = new Map();
  const individuals: GuestGroup[] = [];

  for (const guest of guestList) {
    if (!guest.group_id) {
      // Individual guest
      individuals.push({
        type: "individual",
        label: guest.guest_name,
        primaryGuest: guest,
        members: [guest],
        inviteCode: encryptGuestId(guest.id),
      });
    } else {
      // Group member
      const existing = groups.get(guest.group_id);
      if (existing) {
        existing.members.push(guest);
        if (guest.is_primary) {
          existing.primaryGuest = guest;
          existing.inviteCode = encryptGuestId(guest.id);
          existing.label = guest.group_label || guest.guest_name;
          existing.type = (guest.invitation_type as "couple" | "family") || "family";
        }
      } else {
        groups.set(guest.group_id, {
          type: (guest.invitation_type as "couple" | "family") || "family",
          label: guest.group_label || guest.guest_name,
          primaryGuest: guest,
          members: [guest],
          inviteCode: encryptGuestId(guest.id),
        });
      }
    }
  }

  // Combine: groups first (sorted by creation), then individuals
  const allGroups = [...groups.values()];
  return [...allGroups, ...individuals];
}

export default async function DashboardPage({ params }: PageProps) {
  const { id: weddingId } = await params;
  const [profile, hasAccess] = await Promise.all([getUserProfile(), canAccessWedding(weddingId)]);
  if (!profile) {
    redirect("/admin/login");
  }
  if (!hasAccess) {
    redirect("/admin/events");
  }

  const supabase = createServerClient();

  // Wedding + guests in parallel. Filters (?filter=, ?side=, ?q=) are applied client-side in GuestTable.
  const [{ data: wedding, error: weddingError }, { data: guests, error }] = await Promise.all([
    supabase.from("weddings").select("*").eq("id", weddingId).single(),
    supabase.from("guests").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
  ]);

  if (weddingError || !wedding) {
    notFound();
  }

  const guestList: Guest[] = guests || [];
  const guestGroups = groupGuests(guestList);

  // Stats
  const totalInvitations = guestGroups.length;
  const totalPeople = guestList.length;
  const attending = guestList.filter((g) => g.rsvp_status === "attending").length;
  const notAttending = guestList.filter((g) => g.rsvp_status === "not_attending").length;
  const pending = guestList.filter((g) => g.rsvp_status === "pending").length;

  // Oldest first, so invitations go out in the order they were added.
  const sendQueue: QueueItem[] = guestGroups
    .filter((g) => getInviteStatus(g.primaryGuest) === "not_sent")
    .reverse()
    .map((g) => ({
      guestId: g.primaryGuest.id,
      label: g.label,
      type: g.type,
      members: g.members.map((m) => m.guest_name),
      phone: g.primaryGuest.phone ?? null,
      side: g.primaryGuest.guest_side ?? null,
      code: g.inviteCode,
    }));

  return (
    <div>
      <div className="mb-4">
        <Breadcrumbs items={[
          { label: "Events", href: "/admin/events" },
          { label: `${wedding.groom_name} & ${wedding.bride_name}` }
        ]} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-admin-text">
            {wedding.groom_name} & {wedding.bride_name}&apos;s Wedding
          </h1>
          <p className="text-admin-text-muted text-sm mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            Manage guests and invitations for this event
            <LiveGuestUpdates weddingId={weddingId} />
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <SendQueueButton wedding={wedding} items={sendQueue} />
          <ImportGuestsButton
            weddingId={weddingId}
            wedding={wedding}
            existing={guestGroups.map((g) => ({ name: g.label, phone: g.primaryGuest.phone ?? null }))}
          />
          <Link
            href={`/admin/events/${weddingId}/guests/new`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent-light transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Invitation
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Invitations"
          value={totalInvitations}
          icon="💌"
          color="text-admin-accent-light"
          bgColor="bg-admin-accent/10"
        />
        <StatCard
          label="Total People"
          value={totalPeople}
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

      {/* Filters + table run client-side, so switching filters needs no server round trip. */}
      <GuestTable weddingId={weddingId} wedding={wedding} groups={guestGroups} totalPeople={totalPeople} />
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
