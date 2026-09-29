"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Wedding, Guest } from "@/lib/supabase";
import { buildWhatsAppInvite } from "@/lib/whatsapp";
import { markInviteSent } from "@/lib/actions";

interface CopyLinkButtonClientProps {
  code: string;
  wedding?: Partial<Wedding> | null;
  guest?: Partial<Guest> | null;
}

export default function CopyLinkButtonClient({
  code,
  wedding,
  guest,
}: CopyLinkButtonClientProps) {
  const [copied, setCopied] = useState(false);
  // WhatsApp can't report whether the message was really sent, so we ask once the admin is back.
  const [askSent, setAskSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const url = typeof window !== "undefined" ? `${window.location.origin}/invite/${code}` : `/invite/${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Opens the guest's chat directly when a number is saved; otherwise WhatsApp asks for a contact.
    const { waUrl } = buildWhatsAppInvite({ code, wedding, guest });
    window.open(waUrl, "_blank");
    if (guest?.id && !guest.invite_sent_at) setAskSent(true);
  };

  const confirmSent = async () => {
    if (!guest?.id) return;
    setSaving(true);
    const result = await markInviteSent(guest.id, true);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setAskSent(false);
    toast.success(`Marked as sent to ${guest.group_label || guest.guest_name}`);
    router.refresh();
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        onClick={handleCopy}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
          copied
            ? "bg-admin-success/15 text-admin-success"
            : "bg-admin-accent/10 text-admin-accent-light hover:bg-admin-accent/20"
        }`}
        title="Copy invite link"
      >
        {copied ? (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>Copied!</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-1.682a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.25 8.006" />
            </svg>
            <span>Copy Link</span>
          </>
        )}
      </button>

      <button
        onClick={handleWhatsApp}
        className="inline-flex items-center justify-center p-1.5 rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all duration-200 cursor-pointer"
        title={guest?.phone ? `Send invitation on WhatsApp to ${guest.phone}` : "Share invitation on WhatsApp"}
        aria-label={guest?.phone ? `Send on WhatsApp to ${guest.phone}` : "Share on WhatsApp"}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      </button>
      {askSent && (
        <span role="group" aria-label="Did you send the WhatsApp message?" className="inline-flex items-center gap-1 pl-1 text-xs text-admin-text-muted animate-fade-in-up">
          Sent?
          <button
            type="button"
            onClick={confirmSent}
            disabled={saving}
            className="px-2 py-1 rounded-md bg-admin-success/15 text-admin-success hover:bg-admin-success/25 disabled:opacity-50 cursor-pointer"
            aria-label="Yes, mark as sent"
          >
            {saving ? "…" : "Yes"}
          </button>
          <button
            type="button"
            onClick={() => setAskSent(false)}
            disabled={saving}
            className="px-2 py-1 rounded-md text-admin-text-muted hover:bg-admin-border/20 cursor-pointer"
            aria-label="No, not sent"
          >
            No
          </button>
        </span>
      )}
    </div>
  );
}
