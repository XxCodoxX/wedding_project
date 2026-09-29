import { createServerClient } from "@/lib/supabase";
import { encryptGuestId } from "@/lib/crypto";
import type { Guest, Wedding } from "@/lib/supabase";
import Link from "next/link";
import Breadcrumbs from "@/components/admin/Breadcrumbs";
import DeleteGuestButton from "./DeleteGuestButton";
import CopyLinkButtonClient from "./CopyLinkButtonClient";
import ImportGuestsButton from "./ImportGuestsButton";
import SendQueueButton, { type QueueItem } from "./SendQueueButton";
import InviteStatusCell from "./InviteStatusCell";
import LiveGuestUpdates from "./LiveGuestUpdates";
import { getInviteStatus, parseInviteFilter, type InviteFilter } from "@/lib/invite-tracking";
import { notFound, redirect } from "next/navigation";
import { getUserProfile, canAccessWedding } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string | string[] }>;
}

// Group guests by group_id for display
interface GuestGroup {
  type: "individual" | "couple" | "family";
  label: string;
  primaryGuest: Guest;
  members: Guest[];
  inviteCode: string;
}

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

export default async function DashboardPage({ params, searchParams }: PageProps) {
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
  const guestGroups = groupGuests(guestList);

  // Stats
  const totalInvitations = guestGroups.length;
  const totalPeople = guestList.length;
  const attending = guestList.filter((g) => g.rsvp_status === "attending").length;
  const notAttending = guestList.filter((g) => g.rsvp_status === "not_attending").length;
  const pending = guestList.filter((g) => g.rsvp_status === "pending").length;

  // Delivery tracking (per invitation, stored on the primary guest)
  const filter = parseInviteFilter((await searchParams).filter);
  const statusOf = (g: GuestGroup) => getInviteStatus(g.primaryGuest);
  const deliveryCounts: Record<InviteFilter, number> = {
    all: guestGroups.length,
    not_sent: guestGroups.filter((g) => statusOf(g) === "not_sent").length,
    sent: guestGroups.filter((g) => statusOf(g) === "sent").length,
    opened: guestGroups.filter((g) => statusOf(g) === "opened").length,
  };
  const visibleGroups = filter === "all" ? guestGroups : guestGroups.filter((g) => statusOf(g) === filter);

  // Oldest first, so invitations go out in the order they were added.
  const sendQueue: QueueItem[] = guestGroups
    .filter((g) => statusOf(g) === "not_sent")
    .reverse()
    .map((g) => ({
      guestId: g.primaryGuest.id,
      label: g.label,
      type: g.type,
      members: g.members.map((m) => m.guest_name),
      phone: g.primaryGuest.phone ?? null,
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
            existingNames={guestGroups.map((g) => g.label)}
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

      {/* Delivery filter */}
      {guestGroups.length > 0 && (
        <nav aria-label="Filter by invitation delivery" className="flex flex-wrap gap-2 mb-6">
          {DELIVERY_TABS.map((tab) => {
            const active = filter === tab.value;
            return (
              <Link
                key={tab.value}
                href={tab.value === "all" ? `/admin/events/${weddingId}/dashboard` : `/admin/events/${weddingId}/dashboard?filter=${tab.value}`}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm border transition-all ${
                  active
                    ? "border-admin-accent bg-admin-accent/10 text-admin-accent"
                    : "border-admin-border text-admin-text-muted hover:text-admin-text hover:border-admin-accent/40"
                }`}
              >
                <span aria-hidden>{tab.icon}</span>
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-md text-xs ${active ? "bg-admin-accent/20" : "bg-admin-border/30"}`}>
                  {deliveryCounts[tab.value]}
                </span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-admin-danger/10 border border-admin-danger/20 text-admin-danger text-sm mb-6">
          Failed to load guests: {error.message}
        </div>
      )}

      {/* Guests Table */}
      {guestGroups.length === 0 ? (
        <div className="glass-dark rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">💌</div>
          <h3 className="text-lg font-medium text-admin-text mb-2">
            No guests yet
          </h3>
          <p className="text-admin-text-muted text-sm mb-6">
            Start by adding your first invitation — individual, couple, or family.
          </p>
          <Link
            href={`/admin/events/${weddingId}/guests/new`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent-light transition-all duration-200"
          >
            Add Your First Invitation
          </Link>
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="glass-dark rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3" aria-hidden>{filter === "not_sent" ? "🎉" : "🔍"}</div>
          <p className="text-admin-text-muted text-sm">
            {filter === "not_sent" ? "Every invitation has been sent." : "No invitations match this filter."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="glass-dark rounded-2xl overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-admin-border">
                    <th className="text-left text-xs font-medium text-admin-text-muted uppercase tracking-wider px-6 py-4">
                      Guest / Group
                    </th>
                    <th className="text-left text-xs font-medium text-admin-text-muted uppercase tracking-wider px-6 py-4">
                      Type
                    </th>
                    <th className="text-left text-xs font-medium text-admin-text-muted uppercase tracking-wider px-6 py-4">
                      RSVP Status
                    </th>
                    <th className="text-left text-xs font-medium text-admin-text-muted uppercase tracking-wider px-6 py-4">
                      Invite
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
                  {visibleGroups.map((group) => (
                    <tr
                      key={group.primaryGuest.id}
                      className="hover:bg-admin-border/10 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-admin-text">
                          {group.label}
                        </div>
                        {group.type !== "individual" && (
                          <div className="text-xs text-admin-text-muted mt-1 space-y-0.5">
                            {group.members.map((m) => (
                              <div key={m.id} className="flex items-center gap-1.5">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                                  m.rsvp_status === "attending"
                                    ? "bg-admin-success"
                                    : m.rsvp_status === "not_attending"
                                    ? "bg-admin-danger"
                                    : "bg-admin-warning"
                                }`} />
                                {m.guest_name}
                              </div>
                            ))}
                          </div>
                        )}
                        {group.primaryGuest.custom_message && group.type === "individual" && (
                          <div className="text-xs text-admin-text-muted truncate max-w-50">
                            {group.primaryGuest.custom_message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <TypeBadge type={group.type} count={group.members.length} />
                      </td>
                      <td className="px-6 py-4">
                        {group.type === "individual" ? (
                          <RsvpBadge status={group.primaryGuest.rsvp_status} />
                        ) : (
                          <GroupRsvpSummary members={group.members} />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <InviteStatusCell guest={group.primaryGuest} />
                      </td>
                      <td className="px-6 py-4">
                        <CopyLinkButton
                          code={group.inviteCode}
                          wedding={wedding}
                          guest={group.primaryGuest}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-admin-text-muted">
                        {new Date(group.primaryGuest.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/events/${weddingId}/guests/${group.primaryGuest.id}/edit`}
                            className="p-2 rounded-lg text-admin-text-muted hover:text-admin-accent hover:bg-admin-accent/10 transition-all"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </Link>
                          <DeleteGuestButton guestId={group.primaryGuest.id} guestName={group.label} weddingId={weddingId} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {visibleGroups.map((group) => (
              <div
                key={group.primaryGuest.id}
                className="glass-dark rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-medium text-admin-text truncate">
                        {group.label}
                      </div>
                      <TypeBadge type={group.type} count={group.members.length} />
                    </div>
                    {group.type !== "individual" && (
                      <div className="text-xs text-admin-text-muted space-y-0.5 mt-1">
                        {group.members.map((m) => (
                          <div key={m.id} className="flex items-center gap-1.5">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                              m.rsvp_status === "attending"
                                ? "bg-admin-success"
                                : m.rsvp_status === "not_attending"
                                ? "bg-admin-danger"
                                : "bg-admin-warning"
                            }`} />
                            {m.guest_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {group.type === "individual" ? (
                    <RsvpBadge status={group.primaryGuest.rsvp_status} />
                  ) : (
                    <GroupRsvpSummary members={group.members} />
                  )}
                </div>
                <div className="mb-3">
                  <InviteStatusCell guest={group.primaryGuest} />
                </div>
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-admin-border/50">
                  <div className="flex items-center gap-2">
                    <CopyLinkButton
                      code={group.inviteCode}
                      wedding={wedding}
                      guest={group.primaryGuest}
                    />
                    <span className="text-xs text-admin-text-muted">
                      {new Date(group.primaryGuest.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/events/${weddingId}/guests/${group.primaryGuest.id}/edit`}
                      className="p-2 rounded-lg text-admin-text-muted hover:text-admin-accent hover:bg-admin-accent/10 transition-all"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </Link>
                    <DeleteGuestButton guestId={group.primaryGuest.id} guestName={group.label} weddingId={weddingId} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const DELIVERY_TABS: { value: InviteFilter; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "💌" },
  { value: "not_sent", label: "Not sent", icon: "○" },
  { value: "sent", label: "Sent, not opened", icon: "📤" },
  { value: "opened", label: "Opened", icon: "👀" },
];

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

function TypeBadge({ type, count }: { type: string; count: number }) {
  const config: Record<string, { icon: string; label: string; classes: string }> = {
    individual: {
      icon: "👤",
      label: "Individual",
      classes: "bg-admin-accent/10 text-admin-accent border-admin-accent/20",
    },
    couple: {
      icon: "👫",
      label: "Couple",
      classes: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    family: {
      icon: "👨‍👩‍👧‍👦",
      label: `Family (${count})`,
      classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
  };

  const { icon, label, classes } = config[type] || config.individual;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-medium border ${classes}`}
    >
      <span className="text-xs">{icon}</span> {label}
    </span>
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

function GroupRsvpSummary({ members }: { members: Guest[] }) {
  const attending = members.filter((m) => m.rsvp_status === "attending").length;
  const total = members.length;
  const allPending = members.every((m) => m.rsvp_status === "pending");
  const allAttending = attending === total;

  if (allPending) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border bg-admin-warning/15 text-admin-warning border-admin-warning/25">
        Pending ({total})
      </span>
    );
  }

  if (allAttending) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border bg-admin-success/15 text-admin-success border-admin-success/25">
        All Attending ({total})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border bg-admin-accent/15 text-admin-accent border-admin-accent/25">
      {attending}/{total} Attending
    </span>
  );
}

function CopyLinkButton({
  code,
  wedding,
  guest,
}: {
  code: string;
  wedding?: Partial<Wedding> | null;
  guest?: Partial<Guest> | null;
}) {
  return <CopyLinkButtonClient code={code} wedding={wedding} guest={guest} />;
}
