"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import InviteLinkDisplay from "./InviteLinkDisplay";

interface GuestFormProps {
  mode: "create" | "edit";
  guestId?: string;
  weddingId: string;
  initialData?: {
    guest_name: string;
    custom_message: string | null;
  };
  inviteCode?: string;
  onSubmit: (formData: FormData) => Promise<{ success?: boolean; error?: string; guestId?: string }>;
}

export default function GuestForm({
  mode,
  guestId,
  weddingId,
  initialData,
  inviteCode,
  onSubmit,
}: GuestFormProps) {
  const [guestName, setGuestName] = useState(initialData?.guest_name || "");
  const [customMessage, setCustomMessage] = useState(
    initialData?.custom_message || ""
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedInviteCode, setSavedInviteCode] = useState(inviteCode || "");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("guest_name", guestName);
      formData.set("custom_message", customMessage);
      formData.set("wedding_id", weddingId);

      const result = await onSubmit(formData);

      if (result.error) {
        toast.error(result.error);
        setError(result.error);
      } else if (result.success) {
        toast.success(mode === "create" ? "Guest created successfully!" : "Guest updated successfully!");
        if (weddingId) {
          router.push(`/admin/events/${weddingId}/dashboard`);
        } else {
          router.push("/admin/guests");
        }
      }
    } catch {
      const errorMsg = "An unexpected error occurred";
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Invite Link (shown on edit) */}
      {savedInviteCode && (
        <div className="animate-fade-in-up">
          <InviteLinkDisplay inviteCode={savedInviteCode} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-admin-danger/10 border border-admin-danger/20 text-admin-danger text-sm animate-scale-in">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Guest Name */}
        <div>
          <label
            htmlFor="guest_name"
            className="block text-sm font-medium text-admin-text-muted mb-2"
          >
            Guest Name <span className="text-admin-danger">*</span>
          </label>
          <input
            id="guest_name"
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            required
            placeholder='e.g. "John & Family" or "Sarah Johnson"'
            className="w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all"
          />
          <p className="mt-1.5 text-xs text-admin-text-muted/60">
            This will appear as &quot;Dear {guestName || "..."}&quot; on the invitation
          </p>
        </div>

        {/* Custom Message */}
        <div>
          <label
            htmlFor="custom_message"
            className="block text-sm font-medium text-admin-text-muted mb-2"
          >
            Custom Message{" "}
            <span className="text-admin-text-muted/40">(optional)</span>
          </label>
          <textarea
            id="custom_message"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={3}
            placeholder="A personal note for this guest..."
            className="w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-admin-accent text-white font-medium hover:bg-admin-accent-light focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:ring-offset-2 focus:ring-offset-admin-bg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </span>
            ) : mode === "create" ? (
              "Create Guest & Generate Link"
            ) : (
              "Save Changes"
            )}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/admin/events/${weddingId}/dashboard`)}
            className="px-6 py-3 rounded-xl text-admin-text-muted hover:text-admin-text hover:bg-admin-border/20 transition-all duration-200 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
