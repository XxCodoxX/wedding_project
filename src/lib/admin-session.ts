/**
 * Admin session limits, enforced by the app on top of Supabase Auth (which on its own keeps a
 * session alive forever as long as the refresh token keeps rotating):
 *
 * - Absolute cap: a session ends ADMIN_SESSION_MAX_AGE_S after the admin signed in, however
 *   active they are. The sign-in time comes from the JWT's `amr` claim, which Supabase signs and
 *   carries over unchanged on every refresh — so it can't be forged or reset by the browser.
 * - Idle cap: a session ends after ADMIN_IDLE_TIMEOUT_S without an admin page request. Tracked in
 *   an httpOnly cookie, HMAC-signed and bound to the Supabase session id, so it can't be forged,
 *   moved to another session, or dropped to dodge the check (a missing cookie counts as idle).
 *
 * Uses Web Crypto only, so it runs in the proxy, Route Handlers and Server Components alike.
 */

export const ADMIN_SESSION_MAX_AGE_S = 7 * 24 * 60 * 60; // 7 days
export const ADMIN_IDLE_TIMEOUT_S = 24 * 60 * 60; // 24 hours

export const LAST_ACTIVE_COOKIE = "admin_last_active";

export const lastActiveCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: ADMIN_IDLE_TIMEOUT_S,
};

export type SessionVerdict = "ok" | "expired" | "idle";

/** The subset of Supabase JWT claims the policy reads. */
export interface SessionClaims {
  session_id?: string;
  amr?: ({ method: string; timestamp: number } | string)[];
}

/** Earliest authentication time (unix seconds) in the `amr` claim, or null if it has none. */
export function signedInAt(claims: SessionClaims): number | null {
  const times = (claims.amr ?? [])
    .map((entry) => (typeof entry === "object" ? entry.timestamp : NaN))
    .filter((t) => Number.isFinite(t));
  return times.length > 0 ? Math.min(...times) : null;
}

// ---------- Signed last-activity cookie: "<unix seconds>.<base64url HMAC>" ----------

let keyPromise: Promise<CryptoKey> | null = null;

function getKey(): Promise<CryptoKey> {
  const secret = process.env.LINK_SECRET;
  if (!secret) throw new Error("LINK_SECRET is required to sign admin session cookies");
  keyPromise ??= crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return keyPromise;
}

// Prefixed so these signatures can never collide with other uses of LINK_SECRET (invite codes).
const payloadFor = (sessionId: string, at: number) => new TextEncoder().encode(`admin-last-active:v1:${sessionId}:${at}`);

const toBase64Url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function fromBase64Url(str: string): Uint8Array<ArrayBuffer> | null {
  try {
    const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

export async function createLastActiveCookie(sessionId: string, nowS = Math.floor(Date.now() / 1000)): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await getKey(), payloadFor(sessionId, nowS));
  return `${nowS}.${toBase64Url(sig)}`;
}

/** The last-activity time (unix seconds) if the cookie is genuine and belongs to this session, else null. */
export async function readLastActiveCookie(value: string | undefined, sessionId: string): Promise<number | null> {
  const match = value?.match(/^(\d{1,12})\.([A-Za-z0-9_-]+)$/);
  if (!match) return null;
  const at = Number(match[1]);
  const sig = fromBase64Url(match[2]);
  if (!sig) return null;
  // crypto.subtle.verify compares in constant time.
  const valid = await crypto.subtle.verify("HMAC", await getKey(), sig, payloadFor(sessionId, at));
  return valid ? at : null;
}

/**
 * Whether a verified session is still within both limits.
 *
 * If Supabase ever stops sending `amr` timestamps, the absolute cap is skipped (with a warning)
 * rather than locking every admin out — even a brand-new login would fail it. The idle cap still applies.
 */
export async function checkAdminSession(
  claims: SessionClaims,
  lastActiveCookie: string | undefined,
  nowS = Math.floor(Date.now() / 1000)
): Promise<SessionVerdict> {
  const startedAt = signedInAt(claims);
  if (startedAt === null) {
    console.warn("Admin session has no amr timestamp — absolute session cap not enforced");
  } else if (nowS - startedAt > ADMIN_SESSION_MAX_AGE_S) {
    return "expired";
  }

  if (!claims.session_id) return "idle";
  const lastActive = await readLastActiveCookie(lastActiveCookie, claims.session_id);
  if (lastActive === null || nowS - lastActive > ADMIN_IDLE_TIMEOUT_S) return "idle";

  return "ok";
}
