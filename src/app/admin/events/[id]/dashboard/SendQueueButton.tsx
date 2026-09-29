"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Wedding } from "@/lib/supabase";
import { markInviteSent } from "@/lib/actions";
import { buildWhatsAppInvite } from "@/lib/whatsapp";
import AdminModal from "@/components/admin/AdminModal";

export interface QueueItem {
  guestId: string;
  label: string;
  type: "individual" | "couple" | "family";
  members: string[];
  phone: string | null;
  code: string;
}

interface SendQueueButtonProps {
  wedding: Partial<Wedding>;
  /** Invitations not sent yet (and not opened), in dashboard order. */
  items: QueueItem[];
}

export default function SendQueueButton({ wedding, items }: SendQueueButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const close = () => {
    setOpen(false);
    router.refresh(); // pull the new "Sent" statuses into the table
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={items.length === 0}
        aria-haspopup="dialog"
        title={items.length === 0 ? "Every invitation has been sent" : undefined}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
      >
        <WhatsAppIcon className="w-4 h-4" />
        Send Invitations{items.length > 0 ? ` (${items.length})` : ""}
      </button>

      <AdminModal
        open={open}
        onClose={close}
        busy={busy}
        maxWidth="max-w-xl"
        title="Send Invitations on WhatsApp"
        description="Go through each unsent invitation: open WhatsApp, press send, then confirm here."
      >
        <SendQueue wedding={wedding} items={items} onBusyChange={setBusy} onDone={close} />
      </AdminModal>
    </>
  );
}

// ────────────────────────── Queue ──────────────────────────

function SendQueue({
  wedding,
  items,
  onBusyChange,
  onDone,
}: {
  wedding: Partial<Wedding>;
  items: QueueItem[];
  onBusyChange: (busy: boolean) => void;
  onDone: () => void;
}) {
  // Snapshot on open: the list must not shift under the admin when the dashboard refreshes.
  // Guests with a number first — those open straight into the right chat.
  const [queue] = useState(() => [...items].sort((a, b) => Number(!a.phone) - Number(!b.phone)));
  const [index, setIndex] = useState(0);
  const [whatsAppOpened, setWhatsAppOpened] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(0);
  const [skipped, setSkipped] = useState(0);

  const current = queue[index];
  const invite = current
    ? buildWhatsAppInvite({
        code: current.code,
        wedding,
        guest: { guest_name: current.label, group_label: current.label, phone: current.phone },
      })
    : null;

  const next = () => {
    setWhatsAppOpened(false);
    setIndex((i) => i + 1);
  };

  const openWhatsApp = () => {
    if (!invite) return;
    window.open(invite.waUrl, "_blank");
    setWhatsAppOpened(true);
  };

  const confirmSent = async () => {
    if (!current) return;
    setSaving(true);
    onBusyChange(true);
    const result = await markInviteSent(current.guestId, true);
    setSaving(false);
    onBusyChange(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setSent((n) => n + 1);
    next();
  };

  const skip = () => {
    setSkipped((n) => n + 1);
    next();
  };

  // ── Finished ──
  if (!current) {
    return (
      <div className="text-center py-6 space-y-3 animate-fade-in-up">
        <div className="text-5xl" aria-hidden>🎉</div>
        <h3 className="text-lg font-semibold text-admin-text">All done!</h3>
        <p className="text-sm text-admin-text-muted">
          {sent} sent{skipped > 0 ? ` · ${skipped} skipped (still marked "Not sent")` : ""}
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-2 px-6 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent-light transition-all cursor-pointer"
        >
          Back to Guest List
        </button>
      </div>
    );
  }

  // ── Current guest ──
  return (
    <div className="space-y-5">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-admin-text-muted mb-1.5">
          <span>
            Invitation {index + 1} of {queue.length}
          </span>
          <span>
            {sent} sent{skipped > 0 ? ` · ${skipped} skipped` : ""}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-admin-border/40 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={index}>
          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(index / queue.length) * 100}%` }} />
        </div>
      </div>

      {/* Guest card */}
      <div key={current.guestId} className="glass-dark rounded-2xl p-5 space-y-3 animate-fade-in-up">
        <div>
          <p className="text-xs uppercase tracking-wider text-admin-text-muted">{current.type}</p>
          <h3 className="text-xl font-semibold text-admin-text">{current.label}</h3>
          {current.members.length > 1 && (
            <p className="text-sm text-admin-text-muted mt-0.5">{current.members.join(", ")}</p>
          )}
        </div>

        {current.phone ? (
          <p className="text-sm text-emerald-400">📱 {current.phone}</p>
        ) : (
          <p className="text-sm text-admin-warning">
            No phone number — WhatsApp will ask you to choose the contact.
          </p>
        )}

        <details className="text-sm">
          <summary className="cursor-pointer text-admin-text-muted hover:text-admin-text select-none">Preview message</summary>
          <pre className="mt-2 p-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text-muted text-xs whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
            {invite?.message}
          </pre>
        </details>
      </div>

      {/* Actions */}
      {!whatsAppOpened ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={openWhatsApp}
            autoFocus
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-all cursor-pointer"
          >
            <WhatsAppIcon className="w-5 h-5" />
            Open WhatsApp
          </button>
          <button type="button" onClick={skip} className="px-6 py-3 rounded-xl border border-admin-border text-admin-text-muted hover:text-admin-text transition-all cursor-pointer">
            Skip
          </button>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in-up">
          <p className="text-sm text-admin-text text-center">Did you send it to <strong>{current.label}</strong>?</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={confirmSent}
              disabled={saving}
              autoFocus
              className="flex-1 px-6 py-3 rounded-xl bg-admin-success text-white font-medium hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? "Saving…" : "✓ Yes, sent — next"}
            </button>
            <button
              type="button"
              onClick={openWhatsApp}
              disabled={saving}
              className="px-6 py-3 rounded-xl border border-admin-border text-admin-text hover:bg-admin-border/20 transition-all cursor-pointer"
            >
              Open again
            </button>
            <button type="button" onClick={skip} disabled={saving} className="px-6 py-3 rounded-xl text-admin-text-muted hover:text-admin-text transition-all cursor-pointer">
              Not sent — skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}
