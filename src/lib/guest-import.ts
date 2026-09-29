/**
 * Bulk guest import — shared parsing & validation.
 *
 * Pure (no server/browser APIs) so the exact same rules run in the browser for
 * the live preview AND in the Server Action as the source of truth.
 *
 * File format: one row per INVITATION (one invite link), with a header row.
 *   Type     | individual / couple / family  (optional — inferred from Members)
 *   Name     | Name shown as "Dear …"        (required for individual & family)
 *   Members  | People in a couple/family, separated by ; | , or new line
 *   Message  | Optional personal note
 */
import { z } from "zod";

export const IMPORT_LIMITS = {
  maxInvitations: 500,
  maxMembersPerInvitation: 30,
  maxNameLength: 120,
  maxMessageLength: 1000,
  maxFileBytes: 2 * 1024 * 1024,
} as const;

export const INVITATION_TYPES = ["individual", "couple", "family"] as const;
export type InvitationType = (typeof INVITATION_TYPES)[number];

// ---------- Validated shape (sent to the Server Action) ----------

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(IMPORT_LIMITS.maxNameLength, `Name must be ${IMPORT_LIMITS.maxNameLength} characters or less`);

export const importInvitationSchema = z
  .object({
    row: z.number().int().positive(),
    type: z.enum(INVITATION_TYPES),
    name: nameSchema,
    members: z.array(nameSchema).max(IMPORT_LIMITS.maxMembersPerInvitation),
    message: z.string().trim().max(IMPORT_LIMITS.maxMessageLength).nullable(),
  })
  .superRefine((inv, ctx) => {
    if (inv.type === "individual" && inv.members.length > 0) {
      ctx.addIssue({ code: "custom", message: "Individual invitations must not have members" });
    }
    if (inv.type === "couple" && inv.members.length !== 2) {
      ctx.addIssue({ code: "custom", message: `Couple needs exactly 2 members (found ${inv.members.length})` });
    }
    if (inv.type === "family" && inv.members.length < 2) {
      ctx.addIssue({ code: "custom", message: `Family needs at least 2 members (found ${inv.members.length})` });
    }
  });

export type ImportInvitation = z.infer<typeof importInvitationSchema>;

export const importPayloadSchema = z.object({
  weddingId: z.uuid("Invalid event ID"),
  skipDuplicates: z.boolean(),
  invitations: z
    .array(importInvitationSchema)
    .min(1, "No invitations to import")
    .max(IMPORT_LIMITS.maxInvitations, `You can import at most ${IMPORT_LIMITS.maxInvitations} invitations at once`),
});

export type ImportPayload = z.infer<typeof importPayloadSchema>;

// ---------- Header mapping ----------

type Field = "type" | "name" | "members" | "message";

/** Accepted header spellings (compared after lowercasing & stripping non-letters). */
const HEADER_ALIASES: Record<Field, string[]> = {
  type: ["type", "invitationtype", "invitetype", "category"],
  name: ["name", "guestname", "groupname", "familyname", "invitationname", "label", "displayname"],
  members: ["members", "membernames", "people", "guests", "persons"],
  message: ["message", "custommessage", "note", "notes", "personalmessage"],
};

const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");

export type ColumnMap = Partial<Record<Field, number>>;

export function mapHeaders(headerRow: string[]): { columns: ColumnMap; ignored: string[] } {
  const columns: ColumnMap = {};
  const ignored: string[] = [];

  headerRow.forEach((raw, idx) => {
    const key = normalizeHeader(raw);
    if (!key) return;
    const field = (Object.keys(HEADER_ALIASES) as Field[]).find((f) => HEADER_ALIASES[f].includes(key));
    if (field && columns[field] === undefined) columns[field] = idx;
    else ignored.push(raw.trim());
  });

  return { columns, ignored };
}

// ---------- Row normalization ----------

/** Split "A; B | C" or multi-line Excel cells (Alt+Enter) into names. */
export function splitMembers(raw: string): string[] {
  return raw
    .split(/[;|,\r\n]+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

const cleanText = (v: string | undefined) => (v ?? "").replace(/\s+/g, " ").trim();

function parseType(raw: string): InvitationType | "invalid" | null {
  const t = raw.toLowerCase().trim();
  if (!t) return null;
  if (["individual", "single", "person", "guest", "1"].includes(t)) return "individual";
  if (["couple", "pair", "2"].includes(t)) return "couple";
  if (["family", "group", "household"].includes(t)) return "family";
  return "invalid";
}

export type RowResult =
  | { ok: true; invitation: ImportInvitation }
  | { ok: false; row: number; errors: string[] };

/**
 * Turn one raw spreadsheet row into a validated invitation.
 * `rowNumber` is the 1-based line number in the file (for user-facing errors).
 */
export function normalizeRow(cells: string[], columns: ColumnMap, rowNumber: number): RowResult {
  const get = (f: Field) => (columns[f] === undefined ? "" : (cells[columns[f]!] ?? ""));

  let name = cleanText(get("name"));
  let members = splitMembers(get("members"));
  const message = (get("message") ?? "").trim() || null;
  const parsedType = parseType(get("type"));

  if (parsedType === "invalid") {
    return { ok: false, row: rowNumber, errors: [`Unknown type "${get("type").trim()}" — use individual, couple or family`] };
  }

  // Infer type from member count when the Type column is blank.
  const type: InvitationType = parsedType ?? (members.length >= 3 ? "family" : members.length === 2 ? "couple" : "individual");

  // "Individual" with a single entry in Members is a common spreadsheet habit — treat it as the name.
  if (type === "individual" && members.length === 1) {
    name ||= members[0];
    members = [];
  }

  // Sensible default label for couples: "Kamal & Nimali".
  if (type === "couple" && !name && members.length === 2) {
    name = `${members[0]} & ${members[1]}`;
  }

  if (type === "family" && !name) {
    return { ok: false, row: rowNumber, errors: ['Family needs a Name, e.g. "The Silva Family"'] };
  }

  const parsed = importInvitationSchema.safeParse({ row: rowNumber, type, name, members, message });
  if (!parsed.success) {
    return { ok: false, row: rowNumber, errors: [...new Set(parsed.error.issues.map((i) => i.message))] };
  }
  return { ok: true, invitation: parsed.data };
}

/** Case/space-insensitive key used for duplicate detection. */
export const duplicateKey = (name: string) => name.toLowerCase().replace(/\s+/g, " ").trim();

// ---------- Whole-sheet processing ----------

export interface SheetAnalysis {
  fatal: string | null;
  valid: ImportInvitation[];
  invalid: { row: number; errors: string[] }[];
  ignoredColumns: string[];
}

/** `rows` = raw sheet including header row, every cell already stringified. */
export function analyzeSheet(rows: string[][]): SheetAnalysis {
  const empty: SheetAnalysis = { fatal: null, valid: [], invalid: [], ignoredColumns: [] };

  const headerIdx = rows.findIndex((r) => r.some((c) => c.trim()));
  if (headerIdx === -1) return { ...empty, fatal: "The file is empty." };

  const { columns, ignored } = mapHeaders(rows[headerIdx]);
  if (columns.name === undefined && columns.members === undefined) {
    return {
      ...empty,
      fatal: 'Could not find a "Name" or "Members" column. Make sure the first row contains the column headers — download the template to see the expected format.',
    };
  }

  const valid: ImportInvitation[] = [];
  const invalid: SheetAnalysis["invalid"] = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const cells = rows[i];
    if (!cells.some((c) => c.trim())) continue; // skip blank lines
    const res = normalizeRow(cells, columns, i + 1);
    if (res.ok) valid.push(res.invitation);
    else invalid.push({ row: res.row, errors: res.errors });
  }

  if (valid.length + invalid.length === 0) {
    return { ...empty, ignoredColumns: ignored, fatal: "No guest rows found below the header row." };
  }

  return { fatal: null, valid, invalid, ignoredColumns: ignored };
}
