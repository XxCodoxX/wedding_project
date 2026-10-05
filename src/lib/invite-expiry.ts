/**
 * Invite links close a couple of days after the wedding: guests can still open the invitation and
 * RSVP through the end of the INVITE_GRACE_DAYS-th day after the wedding date, then the link shows
 * an "invitation has ended" page and the RSVP API refuses it.
 *
 * The expiry is derived from the wedding date, not stored in the invite code — so links already
 * sent keep their URL and close on their own, and moving the wedding date moves the expiry with it.
 *
 * Pure (no server/browser APIs).
 */

export const INVITE_GRACE_DAYS = 2;

/**
 * The wedding date column has no time zone, so "end of the day" is measured in this one.
 * Defaults to Sri Lanka (matching the default phone country code); set WEDDING_TIME_ZONE to an
 * IANA name (e.g. "Europe/London") for weddings elsewhere.
 */
export const WEDDING_TIME_ZONE = process.env.WEDDING_TIME_ZONE || "Asia/Colombo";

/** Offset of `timeZone` from UTC at instant `utcMs`, in ms (e.g. +5:30 → 19_800_000). */
function zoneOffsetMs(utcMs: number, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(utcMs)
      .map((p) => [p.type, Number(p.value)])
  );
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** The instant local midnight starts on the given calendar day in `timeZone` (day may overflow the month). */
function zonedMidnight(year: number, month: number, day: number, timeZone: string): Date {
  const wallClock = Date.UTC(year, month - 1, day);
  let instant = wallClock - zoneOffsetMs(wallClock, timeZone);
  // Re-check once in case a DST change sits between the guess and the answer.
  const corrected = wallClock - zoneOffsetMs(instant, timeZone);
  if (corrected !== instant) instant = corrected;
  return new Date(instant);
}

/**
 * When invite links for a wedding on `weddingDate` ("YYYY-MM-DD") stop working: midnight at the
 * start of the day after the grace period. A wedding on 10 Dec → links work until 12 Dec 23:59:59.
 * Null if the date can't be read — an unreadable date must never lock guests out.
 */
export function inviteExpiresAt(weddingDate: string | null | undefined, timeZone = WEDDING_TIME_ZONE): Date | null {
  const match = weddingDate?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  return zonedMidnight(y, m, d + INVITE_GRACE_DAYS + 1, timeZone);
}

export function isInviteExpired(weddingDate: string | null | undefined, now: Date = new Date()): boolean {
  const expiresAt = inviteExpiresAt(weddingDate);
  return expiresAt !== null && now >= expiresAt;
}
