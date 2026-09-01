import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { guestId, guestName, rsvpStatus, message } = await request.json();

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
    const supabase = createServerClient();
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
