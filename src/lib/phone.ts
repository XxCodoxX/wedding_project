/**
 * Phone number normalisation for WhatsApp links.
 *
 * Accepts what people actually type or paste from Excel and returns E.164 ("+94771234567"):
 *   "+94 77 123 4567", "0094771234567", "94771234567"  → international, kept as-is
 *   "077-123-4567", "0771234567"                        → local, trunk "0" replaced by country code
 *   771234567                                           → Excel dropped the leading 0 → treated as local
 *
 * Pure (no server/browser APIs) — shared by forms, CSV import and Server Actions.
 */

/** Country code used for local numbers (no + / 00 prefix). Configure via env for other countries. */
export const DEFAULT_COUNTRY_CODE = (process.env.NEXT_PUBLIC_DEFAULT_PHONE_COUNTRY_CODE || "94").replace(/\D/g, "");

const E164 = /^\+[1-9]\d{7,14}$/;

export type PhoneResult = { ok: true; value: string | null } | { ok: false; error: string };

export function normalizePhone(raw: string | null | undefined, countryCode = DEFAULT_COUNTRY_CODE): PhoneResult {
  const input = (raw ?? "").trim();
  if (!input) return { ok: true, value: null };

  if (/[a-z]/i.test(input)) {
    return { ok: false, error: `Invalid phone number "${input}"` };
  }

  const digits = input.replace(/\D/g, "");
  let international: string;

  if (input.startsWith("+")) {
    international = digits;
  } else if (digits.startsWith("00")) {
    international = digits.slice(2);
  } else if (digits.startsWith("0")) {
    international = countryCode + digits.slice(1);
  } else if (digits.startsWith(countryCode) && digits.length > countryCode.length + 8) {
    international = digits; // already has the country code, just no "+"
  } else {
    international = countryCode + digits; // local number whose leading 0 was dropped (Excel)
  }

  const value = `+${international}`;
  if (!E164.test(value)) {
    return { ok: false, error: `Invalid phone number "${input}" — use e.g. 0771234567 or +94771234567` };
  }
  return { ok: true, value };
}

/** True when a Supabase/PostgREST error means the `phone` column doesn't exist yet (migration 11 not run). */
export function isMissingPhoneColumn(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (error.code === "PGRST204" || error.code === "42703") && !!error.message?.includes("phone");
}

export const PHONE_MIGRATION_ERROR =
  "Database column 'phone' is missing. Please run supabase/11_add_phone_to_guests.sql in your Supabase SQL Editor.";
