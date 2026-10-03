import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";
import { decryptGuestId } from "@/lib/crypto";
import { RSVP_MESSAGE_MAX_LENGTH, isMissingRsvpMessageColumn, parseRsvpMessage } from "@/lib/rsvp-message";

type RsvpStatus = "attending" | "not_attending";

const statusSchema = z.enum(["attending", "not_attending"]);

// Every request carries the encrypted invite code from the URL. It is the guest's
// credential: responses are only accepted for guests on that invitation.
const baseSchema = z.object({
  code: z.string().min(1),
  message: z.string().optional(),
});

const batchSchema = baseSchema.extend({
  responses: z.array(z.object({ guestId: z.string().min(1), rsvpStatus: statusSchema })).min(1),
});

const singleSchema = baseSchema.extend({
  guestId: z.string().min(1),
  rsvpStatus: statusSchema,
});

const bodySchema = z.union([batchSchema, singleSchema]);

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid RSVP request" }, { status: 400 });
    }

    const body = parsed.data;
    const responses =
      "responses" in body ? body.responses : [{ guestId: body.guestId, rsvpStatus: body.rsvpStatus }];

    // One optional message per submission (a group RSVP shares it across members).
    const message = parseRsvpMessage(body.message);
    if (message && message.length > RSVP_MESSAGE_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Message is too long (max ${RSVP_MESSAGE_MAX_LENGTH} characters)` },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const allowedIds = await getInvitationGuestIds(
      supabase,
      body.code,
      responses.map((r) => r.guestId)
    );
    if (!allowedIds) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }
    if (responses.some((r) => !allowedIds.has(r.guestId))) {
      return NextResponse.json(
        { error: "This invitation can't respond for that guest" },
        { status: 403 }
      );
    }

    // One UPDATE per status (at most two queries), not one per member.
    const idsByStatus = new Map<RsvpStatus, string[]>();
    for (const item of responses) {
      idsByStatus.set(item.rsvpStatus, [...(idsByStatus.get(item.rsvpStatus) ?? []), item.guestId]);
    }

    const updateResults = await Promise.all(
      [...idsByStatus].map(([status, ids]) => saveRsvp(supabase, ids, status, message))
    );
    const failedUpdate = updateResults.find((r) => r.error);
    if (failedUpdate?.error) {
      console.error("RSVP update error:", failedUpdate.error);
      return NextResponse.json({ error: "Failed to save your RSVP" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

/**
 * The guest IDs an invite code may RSVP for: the invited guest plus, for a
 * couple/family, the rest of their group. Null when the code is invalid.
 */
async function getInvitationGuestIds(
  supabase: ReturnType<typeof createServerClient>,
  code: string,
  requestedIds: string[]
): Promise<Set<string> | null> {
  const inviteGuestId = decryptGuestId(code);
  if (!inviteGuestId) return null;

  const { data: invitee } = await supabase
    .from("guests")
    .select("id, group_id")
    .eq("id", inviteGuestId)
    .single();
  if (!invitee) return null;

  const allowed = new Set<string>([invitee.id]);

  // Only look up the group when the request names someone other than the invitee.
  if (invitee.group_id && requestedIds.some((id) => id !== invitee.id)) {
    const { data: members } = await supabase
      .from("guests")
      .select("id")
      .eq("group_id", invitee.group_id);
    for (const member of members ?? []) allowed.add(member.id);
  }

  return allowed;
}

/**
 * Save the RSVP status (and the message, when one was written) for the given guests.
 * A blank message leaves any earlier one in place, so changing the answer later
 * doesn't wipe the wishes. If migration 16 hasn't been run, the status still saves.
 */
async function saveRsvp(
  supabase: ReturnType<typeof createServerClient>,
  guestIds: string[],
  status: RsvpStatus,
  message: string | null
) {
  const update = (fields: Record<string, string>) =>
    supabase.from("guests").update(fields).in("id", guestIds);

  if (!message) return update({ rsvp_status: status });

  const result = await update({ rsvp_status: status, rsvp_message: message });
  if (isMissingRsvpMessageColumn(result.error)) {
    console.warn("rsvp_message column missing — run supabase/16_add_rsvp_message_to_guests.sql");
    return update({ rsvp_status: status });
  }
  return result;
}
