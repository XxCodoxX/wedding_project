"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Guest } from "@/lib/supabase";
import { markInviteSent } from "@/lib/actions";
import { getInviteStatus } from "@/lib/invite-tracking";

type TrackedGuest = Pick<
  Guest,
  "id" | "invite_sent_at" | "invite_first_opened_at" | "invite_last_opened_at" | "invite_open_count"
>;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Shows Not sent / Sent / Opened, with a one-click "mark sent" / undo. */
export default function InviteStatusCell({ guest }: { guest: TrackedGuest }) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const status = getInviteStatus(guest);

  const setSent = async (sent: boolean) => {
    setSaving(true);
    const result = await markInviteSent(guest.id, sent);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  };

  if (status === "opened") {
    const count = guest.invite_open_count ?? 1;
    return (
      <span
        suppressHydrationWarning
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border bg-sky-500/10 text-sky-400 border-sky-500/20"
        title={`First opened ${fmtDateTime(guest.invite_first_opened_at!)}${
          guest.invite_last_opened_at ? ` · last opened ${fmtDateTime(guest.invite_last_opened_at)}` : ""
        }${guest.invite_sent_at ? ` · sent ${fmtDateTime(guest.invite_sent_at)}` : ""}`}
      >
        👀 Opened{count > 1 ? ` ${count}×` : ""} · {fmtDate(guest.invite_first_opened_at!)}
      </span>
    );
  }

  if (status === "sent") {
    return (
      <span className="inline-flex items-center gap-1">
        <span
          suppressHydrationWarning
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          title={`Sent ${fmtDateTime(guest.invite_sent_at!)} — not opened yet`}
        >
          📤 Sent · {fmtDate(guest.invite_sent_at!)}
        </span>
        <button
          type="button"
          onClick={() => setSent(false)}
          disabled={saving}
          className="p-1 rounded-md text-admin-text-muted/60 hover:text-admin-text hover:bg-admin-border/20 disabled:opacity-50 cursor-pointer"
          title="Undo — mark as not sent"
          aria-label="Mark as not sent"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setSent(true)}
      disabled={saving}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-dashed border-admin-border text-admin-text-muted hover:text-admin-text hover:border-admin-accent/50 disabled:opacity-50 transition-all cursor-pointer"
      title="Not sent yet — click to mark as sent"
    >
      {saving ? "Saving…" : "○ Not sent"}
    </button>
  );
}
