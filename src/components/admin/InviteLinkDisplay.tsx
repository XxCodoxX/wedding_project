"use client";

import { useState } from "react";
import type { Wedding, Guest } from "@/lib/supabase";
import { formatWhatsAppMessage, getWhatsAppShareUrl } from "@/lib/whatsapp";

interface InviteLinkDisplayProps {
  inviteCode: string;
  wedding?: Partial<Wedding> | null;
  guest?: Partial<Guest> | null;
  phoneNumber?: string;
}

export default function InviteLinkDisplay({
  inviteCode,
  wedding,
  guest,
  phoneNumber,
}: InviteLinkDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = `${baseUrl}/invite/${inviteCode}`;

  const messageText = formatWhatsAppMessage({
    template: wedding?.whatsapp_message_template,
    wedding,
    guest,
    inviteUrl: fullUrl,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = fullUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setMessageCopied(true);
      setTimeout(() => setMessageCopied(false), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = messageText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setMessageCopied(true);
      setTimeout(() => setMessageCopied(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    const waUrl = getWhatsAppShareUrl(messageText, phoneNumber);
    window.open(waUrl, "_blank");
  };

  return (
    <div className="rounded-2xl bg-admin-accent/5 border border-admin-accent/20 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-admin-accent-light flex items-center gap-1.5">
          <span>🔗</span> Invitation Link & WhatsApp
        </label>
        <button
          type="button"
          onClick={handleCopyMessage}
          className="text-xs font-medium text-admin-text-muted hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
          title="Copy formatted WhatsApp invitation message"
        >
          {messageCopied ? "✓ Message Copied!" : "📋 Copy WhatsApp Message"}
        </button>
      </div>

      {/* Link display */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          readOnly
          value={fullUrl}
          className="flex-1 px-4 py-2.5 rounded-xl bg-admin-bg border border-admin-border text-admin-text text-sm font-mono truncate focus:outline-none"
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
            copied
              ? "bg-admin-success/20 text-admin-success border border-admin-success/30"
              : "bg-admin-accent/10 text-admin-accent-light border border-admin-accent/20 hover:bg-admin-accent/20"
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              Copy Link
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600/15 text-green-400 border border-green-600/25 text-sm font-medium hover:bg-green-600/25 transition-all duration-200 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Share on WhatsApp
        </button>
      </div>
    </div>
  );
}
