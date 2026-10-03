/**
 * RSVP message (guest wishes) helpers.
 *
 * Pure (no server/browser APIs) — shared by the RSVP form, the RSVP route and the dashboard.
 */

/** Matches the CHECK constraint in supabase/16_add_rsvp_message_to_guests.sql. */
export const RSVP_MESSAGE_MAX_LENGTH = 1000;

/** Request value → trimmed message, or null when absent/blank. */
export function parseRsvpMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** True when the rsvp_message column doesn't exist yet (migration 16 not run). */
export function isMissingRsvpMessageColumn(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (error.code === "PGRST204" || error.code === "42703") && !!error.message?.includes("rsvp_message");
}
