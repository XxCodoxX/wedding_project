/**
 * Invitation delivery tracking helpers (pure — safe on server and client).
 */
import type { Guest } from "@/lib/supabase";

export type InviteStatus = "not_sent" | "sent" | "opened";

/** Opened wins over sent: an open proves the guest received it, however it was sent. */
export function getInviteStatus(guest: Pick<Guest, "invite_sent_at" | "invite_first_opened_at">): InviteStatus {
  if (guest.invite_first_opened_at) return "opened";
  if (guest.invite_sent_at) return "sent";
  return "not_sent";
}

export const INVITE_FILTERS = ["all", "not_sent", "sent", "opened"] as const;
export type InviteFilter = (typeof INVITE_FILTERS)[number];

export function parseInviteFilter(value: string | string[] | undefined): InviteFilter {
  const v = Array.isArray(value) ? value[0] : value;
  return (INVITE_FILTERS as readonly string[]).includes(v ?? "") ? (v as InviteFilter) : "all";
}

/**
 * Link-preview crawlers (WhatsApp, Facebook, iMessage, Telegram…) fetch the invite page to
 * build the preview card. Counting them would mark every invite "opened" the moment it's sent.
 */
const BOT_UA =
  /bot|crawler|spider|preview|facebookexternalhit|facebot|whatsapp|telegram|slack|discord|skype|viber|linkedin|embedly|quora|pinterest|vkshare|w3c_validator|headless|lighthouse|curl|wget|python-requests|axios|node-fetch/i;

export function isLinkPreviewBot(userAgent: string | null): boolean {
  // Real browsers always send a UA; an empty one is a script.
  return !userAgent || BOT_UA.test(userAgent);
}

export function isPrefetchRequest(headers: Headers): boolean {
  return (
    headers.get("purpose") === "prefetch" ||
    headers.get("sec-purpose")?.includes("prefetch") === true ||
    headers.get("next-router-prefetch") === "1"
  );
}

/** Same heuristic as src/proxy.ts: a Supabase auth cookie means an admin is testing the link. */
export function hasAdminSessionCookie(cookieNames: string[]): boolean {
  return cookieNames.some((n) => n.includes("-auth-token") || n.startsWith("sb-"));
}

export const TRACKING_MIGRATION_ERROR =
  "Invite tracking columns are missing. Please run supabase/12_add_invite_tracking_to_guests.sql in your Supabase SQL Editor.";

export function isMissingTrackingColumn(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (error.code === "PGRST204" || error.code === "42703") && !!error.message?.includes("invite_");
}
