/**
 * Dashboard RSVP filter (?rsvp=).
 *
 * Pure (no server/browser APIs) — used by the guest table.
 */

import type { Guest } from "@/lib/supabase";

export const RSVP_FILTERS = ["all", "attending", "not_attending", "pending"] as const;
export type RsvpFilter = (typeof RSVP_FILTERS)[number];

export function parseRsvpFilter(value: string | string[] | undefined): RsvpFilter {
  const v = Array.isArray(value) ? value[0] : value;
  return (RSVP_FILTERS as readonly string[]).includes(v ?? "") ? (v as RsvpFilter) : "all";
}

/**
 * An invitation matches when ANY member has the status, so a family with one
 * decline still shows under "Attending", and "Pending" lists every invitation
 * someone still needs to answer.
 */
export function matchesRsvpFilter(members: Pick<Guest, "rsvp_status">[], filter: RsvpFilter): boolean {
  if (filter === "all") return true;
  return members.some((m) => m.rsvp_status === filter);
}
