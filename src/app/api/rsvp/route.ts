import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

interface SingleRsvp {
  guestId: string;
  guestName?: string;
  rsvpStatus: "attending" | "not_attending";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    // Check if it's a batch request
    const isBatch = Boolean(body.responses && Array.isArray(body.responses));

    if (isBatch) {
      const responses: SingleRsvp[] = body.responses;
      const message = (body.message as string) || "";

      if (!responses || responses.length === 0) {
        return NextResponse.json(
          { error: "No responses provided" },
          { status: 400 }
        );
      }

      // Validate all items
      for (const item of responses) {
        if (!item.guestId || !item.rsvpStatus) {
          return NextResponse.json(
            { error: "Missing required fields in group RSVP" },
            { status: 400 }
          );
        }
        if (!["attending", "not_attending"].includes(item.rsvpStatus)) {
          return NextResponse.json(
            { error: `Invalid RSVP status: ${item.rsvpStatus}` },
            { status: 400 }
          );
        }
      }

      // Update each guest in parallel
      const updatePromises = responses.map((item) =>
        supabase
          .from("guests")
          .update({ rsvp_status: item.rsvpStatus })
          .eq("id", item.guestId)
      );

      const updateResults = await Promise.all(updatePromises);
      const failedUpdate = updateResults.find((r) => r.error);
      if (failedUpdate?.error) {
        console.error("Batch RSVP update error:", failedUpdate.error);
        return NextResponse.json(
          { error: "Failed to update RSVP for all members" },
          { status: 500 }
        );
      }

      // POST to Make.com webhook (fire-and-forget)
      const webhookUrl = process.env.MAKE_WEBHOOK_URL;
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              is_group: true,
              responses: responses.map((r) => ({
                guest_id: r.guestId,
                guest_name: r.guestName || "",
                rsvp_status: r.rsvpStatus,
              })),
              message,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (webhookError) {
          console.error("Webhook error:", webhookError);
        }
      }

      return NextResponse.json({ success: true });
    }

    // ---------- Single RSVP ----------
    const { guestId, guestName, rsvpStatus, message } = body;

    if (!guestId || !rsvpStatus) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["attending", "not_attending"].includes(rsvpStatus)) {
      return NextResponse.json(
        { error: "Invalid RSVP status" },
        { status: 400 }
      );
    }

    // Update guest RSVP status in Supabase
    const { error: updateError } = await supabase
      .from("guests")
      .update({ rsvp_status: rsvpStatus })
      .eq("id", guestId);

    if (updateError) {
      console.error("RSVP update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update RSVP" },
        { status: 500 }
      );
    }

    // POST to Make.com webhook (fire-and-forget, don't block the response)
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guest_id: guestId,
            guest_name: guestName,
            rsvp_status: rsvpStatus,
            message: message || "",
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (webhookError) {
        // Log but don't fail the RSVP — the DB update already succeeded
        console.error("Webhook error:", webhookError);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
