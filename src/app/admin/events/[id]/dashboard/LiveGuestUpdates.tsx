"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Guest } from "@/lib/supabase";
import { createAuthBrowserClient } from "@/lib/supabase-auth-browser";

type LiveStatus = "connecting" | "live" | "offline";

/** Shape sent by realtime.broadcast_changes() (see supabase/13_realtime_guest_updates.sql). */
interface GuestChangePayload {
  operation: "INSERT" | "UPDATE" | "DELETE";
  record: Partial<Guest> | null;
  old_record: Partial<Guest> | null;
}

/** Coalesce bursts (e.g. a 300-row import) into a single refresh. */
const REFRESH_DEBOUNCE_MS = 600;

/**
 * Keeps the (server-rendered) guest table live: subscribes to the wedding's private
 * Realtime channel and re-fetches the page data whenever a guest changes.
 */
export default function LiveGuestUpdates({ weddingId }: { weddingId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingWhileHiddenRef = useRef(false);

  useEffect(() => {
    const supabase = createAuthBrowserClient();
    let cancelled = false;
    let hasConnectedBefore = false;

    const refresh = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        // Don't re-render a background tab; catch up when the admin comes back.
        if (document.hidden) {
          pendingWhileHiddenRef.current = true;
          return;
        }
        router.refresh();
      }, REFRESH_DEBOUNCE_MS);
    };

    const onVisible = () => {
      if (!document.hidden && pendingWhileHiddenRef.current) {
        pendingWhileHiddenRef.current = false;
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    const channel = supabase.channel(`wedding:${weddingId}:guests`, { config: { private: true } });

    channel.on("broadcast", { event: "*" }, ({ payload }) => {
      notify(payload as GuestChangePayload);
      refresh();
    });

    // Private channels are authorised with the user's JWT (RLS on realtime.messages).
    supabase.realtime.setAuth().then(() => {
      if (cancelled) return;
      channel.subscribe((state, err) => {
        if (state === "SUBSCRIBED") {
          setStatus("live");
          // After a reconnect we may have missed events — resync once.
          if (hasConnectedBefore) refresh();
          hasConnectedBefore = true;
        } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
          setStatus("offline");
          if (err) console.warn("Live guest updates unavailable:", err.message);
        } else if (state === "CLOSED" && !cancelled) {
          setStatus("offline");
        }
      });
    });

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [weddingId, router]);

  return <LiveIndicator status={status} />;
}

/** Toasts only for things guests do (RSVPs, first opens) — not for the admin's own edits. */
function notify({ operation, record, old_record }: GuestChangePayload) {
  if (operation !== "UPDATE" || !record) return;
  const name = record.guest_name || "A guest";

  if (record.rsvp_status && record.rsvp_status !== old_record?.rsvp_status) {
    if (record.rsvp_status === "attending") toast.success(`${name} is attending 🎉`);
    else if (record.rsvp_status === "not_attending") toast(`${name} can't attend`, { icon: "💌" });
  }

  if (record.invite_first_opened_at && !old_record?.invite_first_opened_at) {
    toast(`${record.group_label || name} opened their invitation`, { icon: "👀" });
  }
}

function LiveIndicator({ status }: { status: LiveStatus }) {
  const config = {
    live: { dot: "bg-admin-success", label: "Live", title: "Guest list updates automatically" },
    connecting: { dot: "bg-admin-warning", label: "Connecting…", title: "Connecting to live updates" },
    offline: {
      dot: "bg-admin-text-muted",
      label: "Live updates off",
      title: "Couldn't connect to live updates — refresh the page to see new changes. (If this persists, run supabase/13_realtime_guest_updates.sql.)",
    },
  }[status];

  return (
    <span role="status" title={config.title} className="inline-flex items-center gap-1.5 text-xs text-admin-text-muted">
      <span className="relative flex w-2 h-2" aria-hidden>
        {status === "live" && <span className={`absolute inset-0 rounded-full ${config.dot} opacity-60 animate-ping`} />}
        <span className={`relative inline-flex w-2 h-2 rounded-full ${config.dot}`} />
      </span>
      {config.label}
    </span>
  );
}
