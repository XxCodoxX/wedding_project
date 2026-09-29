/**
 * Guest table search (pure — used by the dashboard Server Component).
 *
 * Matches an invitation when EVERY word of the query appears in its name, any member's
 * name, or its phone number. Case- and accent-insensitive; phone matching ignores
 * spaces/dashes and the local trunk "0", so "077 123" finds "+94771234567".
 */

export const MAX_SEARCH_LENGTH = 100;

export interface SearchableInvitation {
  label: string;
  memberNames: string[];
  phone: string | null | undefined;
}

const normalizeText = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export function parseSearchQuery(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return (v ?? "").slice(0, MAX_SEARCH_LENGTH).trim();
}

export function matchesSearch(inv: SearchableInvitation, query: string): boolean {
  const q = normalizeText(query);
  if (!q) return true;

  const phoneDigits = (inv.phone ?? "").replace(/\D/g, "");
  // Needs 3+ digits so "1" doesn't match everyone; drop the local trunk 0 ("077…" → "77…").
  const phoneMatch = (term: string) => {
    const digits = term.replace(/\D/g, "").replace(/^0+/, "");
    return digits.length >= 3 && phoneDigits.includes(digits);
  };

  // Whole query is a phone number typed with spaces/dashes ("077 123 4567", "+94 77…").
  if (/^[\d\s+\-()]+$/.test(q)) return phoneMatch(q);

  const haystack = normalizeText([inv.label, ...inv.memberNames].join(" "));
  return q.split(" ").every((term) => haystack.includes(term) || (/^[\d+\-()]+$/.test(term) && phoneMatch(term)));
}
