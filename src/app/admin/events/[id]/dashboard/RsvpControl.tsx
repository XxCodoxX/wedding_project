"use client";

import { useEffect, useId, useOptimistic, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Guest } from "@/lib/supabase";
import { setRsvpStatus } from "@/lib/actions";

type RsvpStatus = Guest["rsvp_status"];
type Member = Pick<Guest, "id" | "guest_name" | "rsvp_status">;

const OPTIONS: { value: RsvpStatus; label: string; short: string; icon: string; active: string }[] = [
  { value: "attending", label: "Attending", short: "Yes", icon: "✓", active: "bg-admin-success/20 text-admin-success border-admin-success/40" },
  { value: "not_attending", label: "Not attending", short: "No", icon: "✕", active: "bg-admin-danger/20 text-admin-danger border-admin-danger/40" },
  { value: "pending", label: "Pending", short: "?", icon: "↺", active: "bg-admin-warning/20 text-admin-warning border-admin-warning/40" },
];

/**
 * RSVP badge that opens a menu to set the status manually — for one guest, every member
 * of a couple/family at once, or each member individually. Updates show instantly (optimistic)
 * and roll back with a toast if the save fails.
 */
export default function RsvpControl({ members, isGroup }: { members: Member[]; isGroup: boolean }) {
  const router = useRouter();
  const popoverId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [statuses, applyOptimistic] = useOptimistic(
    Object.fromEntries(members.map((m) => [m.id, m.rsvp_status])) as Record<string, RsvpStatus>,
    (current, update: { ids: string[]; status: RsvpStatus }) => ({
      ...current,
      ...Object.fromEntries(update.ids.map((id) => [id, update.status])),
    })
  );

  const update = (ids: string[], status: RsvpStatus) => {
    if (ids.every((id) => statuses[id] === status)) return;
    startTransition(async () => {
      applyOptimistic({ ids, status });
      const result = await setRsvpStatus(ids, status);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh(); // inside the transition, so the badge never flickers back
    });
  };

  // The popover lives in the top layer (escapes the table's overflow clipping); place it under the badge.
  useEffect(() => {
    const popover = popoverRef.current;
    const button = buttonRef.current;
    if (!popover || !button) return;

    const close = () => popover.hidePopover();
    const onToggle = (e: Event) => {
      if ((e as ToggleEvent).newState !== "open") {
        window.removeEventListener("scroll", close, true);
        window.removeEventListener("resize", close);
        return;
      }
      const rect = button.getBoundingClientRect();
      const width = popover.offsetWidth;
      const height = popover.offsetHeight;
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
      const below = rect.bottom + 6;
      const top = below + height > window.innerHeight - 8 ? Math.max(8, rect.top - height - 6) : below;
      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;
      // A fixed popover would drift away from its badge — close it instead.
      window.addEventListener("scroll", close, true);
      window.addEventListener("resize", close);
    };

    popover.addEventListener("toggle", onToggle);
    return () => {
      popover.removeEventListener("toggle", onToggle);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, []);

  const current = members.map((m) => ({ ...m, rsvp_status: statuses[m.id] }));
  const allIds = members.map((m) => m.id);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={popoverId}
        aria-haspopup="menu"
        title="Change RSVP"
        className={`group inline-flex items-center gap-1 rounded-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent/50 ${
          isPending ? "opacity-60" : ""
        }`}
      >
        {isGroup ? <GroupRsvpSummary members={current} /> : <RsvpBadge status={current[0].rsvp_status} />}
        <svg
          className="w-3 h-3 text-admin-text-muted/50 group-hover:text-admin-text transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <div
        ref={popoverRef}
        id={popoverId}
        popover="auto"
        role="menu"
        aria-label="Set RSVP status"
        className="fixed inset-auto m-0 w-72 max-w-[calc(100vw-16px)] p-3 rounded-xl border border-admin-border bg-admin-bg text-admin-text shadow-2xl"
      >
        <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wider mb-2">Set RSVP</p>

        {isGroup && (
          <div className="mb-3 pb-3 border-b border-admin-border/60">
            <p className="text-xs text-admin-text-muted mb-1.5">Everyone ({members.length})</p>
            <div className="grid grid-cols-3 gap-1.5">
              {OPTIONS.map((o) => {
                const active = current.every((m) => m.rsvp_status === o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => update(allIds, o.value)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      active ? o.active : "border-admin-border text-admin-text-muted hover:text-admin-text hover:border-admin-accent/40"
                    }`}
                  >
                    <span aria-hidden>{o.icon}</span> {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {current.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2">
              <span className="text-sm truncate min-w-0" title={m.guest_name}>
                {m.guest_name}
              </span>
              <div role="group" aria-label={`RSVP for ${m.guest_name}`} className="flex shrink-0 gap-1">
                {OPTIONS.map((o) => {
                  const active = m.rsvp_status === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      aria-label={`${m.guest_name}: ${o.label}`}
                      title={o.label}
                      onClick={() => update([m.id], o.value)}
                      className={`min-w-9 px-1.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                        active ? o.active : "border-admin-border text-admin-text-muted hover:text-admin-text hover:border-admin-accent/40"
                      }`}
                    >
                      {o.short}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function RsvpBadge({ status }: { status: RsvpStatus }) {
  const config: Record<RsvpStatus, { label: string; classes: string }> = {
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
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${classes}`}>
      {label}
    </span>
  );
}

function GroupRsvpSummary({ members }: { members: Member[] }) {
  const attending = members.filter((m) => m.rsvp_status === "attending").length;
  const notAttending = members.filter((m) => m.rsvp_status === "not_attending").length;
  const total = members.length;

  if (attending === total) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border bg-admin-success/15 text-admin-success border-admin-success/25 whitespace-nowrap">
        All Attending ({total})
      </span>
    );
  }

  if (notAttending === total) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border bg-admin-danger/15 text-admin-danger border-admin-danger/25 whitespace-nowrap">
        None Attending ({total})
      </span>
    );
  }

  if (attending === 0 && notAttending === 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border bg-admin-warning/15 text-admin-warning border-admin-warning/25 whitespace-nowrap">
        Pending ({total})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border bg-admin-accent/15 text-admin-accent border-admin-accent/25 whitespace-nowrap">
      {attending}/{total} Attending
    </span>
  );
}
