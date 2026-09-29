"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import InviteLinkDisplay from "./InviteLinkDisplay";
import SectionLoadingOverlay from "@/components/common/SectionLoadingOverlay";

import type { Wedding, Guest } from "@/lib/supabase";
import { normalizePhone } from "@/lib/phone";

type InvitationType = "individual" | "couple" | "family";

interface MemberEntry {
  id?: string;
  name: string;
}

interface GuestFormProps {
  mode: "create" | "edit";
  guestId?: string;
  weddingId: string;
  wedding?: Partial<Wedding> | null;
  guest?: Partial<Guest> | null;
  initialData?: {
    guest_name: string;
    custom_message: string | null;
    phone?: string | null;
    invitation_type?: InvitationType;
    group_label?: string | null;
    members?: MemberEntry[];
  };
  inviteCode?: string;
  onSubmit: (formData: FormData) => Promise<{ success?: boolean; error?: string; guestId?: string }>;
}

export default function GuestForm({
  mode,
  guestId,
  weddingId,
  wedding,
  guest,
  initialData,
  inviteCode,
  onSubmit,
}: GuestFormProps) {
  const [invitationType, setInvitationType] = useState<InvitationType>(
    initialData?.invitation_type || "individual"
  );
  const [guestName, setGuestName] = useState(initialData?.guest_name || "");
  const [groupLabel, setGroupLabel] = useState(initialData?.group_label || "");
  const [members, setMembers] = useState<MemberEntry[]>(
    initialData?.members || [{ name: "" }, { name: "" }]
  );
  const [customMessage, setCustomMessage] = useState(
    initialData?.custom_message || ""
  );
  const [phone, setPhone] = useState(initialData?.phone || "");
  const phoneCheck = normalizePhone(phone);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedInviteCode, setSavedInviteCode] = useState(inviteCode || "");
  const router = useRouter();

  const handleTypeChange = (type: InvitationType) => {
    setInvitationType(type);
    if (type === "individual") {
      // Keep guestName as-is
    } else if (type === "couple") {
      // Ensure exactly 2 members
      setMembers((prev) => {
        if (prev.length === 2) return prev;
        if (prev.length < 2) return [...prev, ...Array(2 - prev.length).fill(null).map(() => ({ name: "" }))];
        return prev.slice(0, 2);
      });
    } else if (type === "family") {
      // Ensure at least 2 members
      setMembers((prev) => {
        if (prev.length >= 2) return prev;
        return [...prev, ...Array(2 - prev.length).fill(null).map(() => ({ name: "" }))];
      });
    }
  };

  const updateMember = (index: number, name: string) => {
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, name } : m)));
  };

  const addMember = () => {
    setMembers((prev) => [...prev, { name: "" }]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 2) return; // Minimum 2 for family
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("wedding_id", weddingId);
      formData.set("invitation_type", invitationType);
      formData.set("custom_message", customMessage);
      formData.set("phone", phone);

      if (invitationType === "individual") {
        formData.set("guest_name", guestName);
      } else {
        // Couple or Family
        const effectiveLabel = groupLabel.trim() || members[0]?.name?.trim() || "";
        formData.set("guest_name", effectiveLabel);
        formData.set("group_label", effectiveLabel);

        if (mode === "create") {
          formData.set("members", JSON.stringify(members.map((m) => m.name)));
        } else {
          formData.set("members", JSON.stringify(members.map((m) => ({ id: m.id, name: m.name }))));
        }
      }

      const result = await onSubmit(formData);

      if (result.error) {
        toast.error(result.error);
        setError(result.error);
      } else if (result.success) {
        toast.success(
          mode === "create"
            ? "Invitation created successfully!"
            : "Invitation updated successfully!"
        );
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

  const typeOptions: { value: InvitationType; icon: string; label: string; desc: string }[] = [
    { value: "individual", icon: "👤", label: "Individual", desc: "Single person" },
    { value: "couple", icon: "👫", label: "Couple", desc: "Two people" },
    { value: "family", icon: "👨‍👩‍👧‍👦", label: "Family", desc: "3+ members" },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Invite Link (shown on edit) */}
      {savedInviteCode && (
        <div className="animate-fade-in-up">
          <InviteLinkDisplay
            inviteCode={savedInviteCode}
            wedding={wedding}
            guest={guest}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-admin-danger/10 border border-admin-danger/20 text-admin-danger text-sm animate-scale-in">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 relative overflow-hidden rounded-2xl">
        <SectionLoadingOverlay
          isLoading={loading}
          message={mode === "create" ? "Creating Invitation..." : "Saving Changes..."}
          submessage={
            mode === "create"
              ? "Generating encrypted invite link & saving members"
              : "Synchronizing household and member details"
          }
          theme="admin"
          rounded="2xl"
        />
        {/* ── Invitation Type Selector ── */}
        <div>
          <label className="block text-sm font-medium text-admin-text-muted mb-3">
            Invitation Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTypeChange(opt.value)}
                className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                  invitationType === opt.value
                    ? "border-admin-accent bg-admin-accent/10 shadow-sm shadow-admin-accent/20"
                    : "border-admin-border hover:border-admin-accent/40 hover:bg-admin-border/10"
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className={`text-sm font-semibold ${
                  invitationType === opt.value ? "text-admin-accent" : "text-admin-text"
                }`}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-admin-text-muted">
                  {opt.desc}
                </span>
                {invitationType === opt.value && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-admin-accent flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Individual: Simple name field ── */}
        {invitationType === "individual" && (
          <div className="animate-fade-in-up">
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
              placeholder='e.g. "Sarah Johnson"'
              className="w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all"
            />
            <p className="mt-1.5 text-xs text-admin-text-muted/60">
              Appears as &quot;Dear {guestName || "..."}&quot; on the invitation
            </p>
          </div>
        )}

        {/* ── Couple / Family: Group label + members ── */}
        {(invitationType === "couple" || invitationType === "family") && (
          <div className="space-y-5 animate-fade-in-up">
            {/* Group Label */}
            <div>
              <label
                htmlFor="group_label"
                className="block text-sm font-medium text-admin-text-muted mb-2"
              >
                {invitationType === "couple" ? "Couple Name" : "Family / Group Name"}{" "}
                <span className="text-admin-danger">*</span>
              </label>
              <input
                id="group_label"
                type="text"
                value={groupLabel}
                onChange={(e) => setGroupLabel(e.target.value)}
                required
                placeholder={
                  invitationType === "couple"
                    ? 'e.g. "Mr. & Mrs. Fernando"'
                    : 'e.g. "The Silva Family"'
                }
                className="w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all"
              />
              <p className="mt-1.5 text-xs text-admin-text-muted/60">
                Appears as &quot;Dear {groupLabel || "..."}&quot; on the invitation
              </p>
            </div>

            {/* Members List */}
            <div>
              <label className="block text-sm font-medium text-admin-text-muted mb-2">
                {invitationType === "couple" ? "Two Members" : "Family Members"}{" "}
                <span className="text-admin-danger">*</span>
              </label>
              <div className="space-y-2.5">
                {members.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-2 group">
                    <div className="w-7 h-7 rounded-lg bg-admin-accent/15 flex items-center justify-center text-xs font-bold text-admin-accent shrink-0">
                      {idx + 1}
                    </div>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateMember(idx, e.target.value)}
                      required
                      placeholder={
                        invitationType === "couple"
                          ? idx === 0
                            ? "First person name"
                            : "Second person name"
                          : `Member ${idx + 1} name`
                      }
                      className="flex-1 px-4 py-2.5 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all text-sm"
                    />
                    {/* Remove button — only for family with 3+ members, and never on first two */}
                    {invitationType === "family" && members.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeMember(idx)}
                        className="p-2 rounded-lg text-admin-text-muted/40 hover:text-admin-danger hover:bg-admin-danger/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Remove member"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Member (only for Family) */}
              {invitationType === "family" && (
                <button
                  type="button"
                  onClick={addMember}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-admin-accent hover:bg-admin-accent/10 border border-dashed border-admin-accent/30 hover:border-admin-accent/60 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Member
                </button>
              )}

              <p className="mt-2 text-xs text-admin-text-muted/60">
                {invitationType === "couple"
                  ? "Both names will appear in the RSVP section. Each person can respond independently."
                  : "Each member will appear in the RSVP section and can respond independently."}
              </p>
            </div>
          </div>
        )}

        {/* ── WhatsApp Number ── */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-admin-text-muted mb-2"
          >
            WhatsApp Number{" "}
            <span className="text-admin-text-muted/40">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder='e.g. "0771234567" or "+94771234567"'
            aria-invalid={!phoneCheck.ok}
            aria-describedby="phone-hint"
            className={`w-full px-4 py-3 rounded-xl bg-admin-bg border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all ${
              phoneCheck.ok ? "border-admin-border" : "border-admin-danger"
            }`}
          />
          <p id="phone-hint" className={`mt-1.5 text-xs ${phoneCheck.ok ? "text-admin-text-muted/60" : "text-admin-danger"}`}>
            {!phoneCheck.ok
              ? phoneCheck.error
              : phoneCheck.value
                ? `WhatsApp will open a chat with ${phoneCheck.value}`
                : invitationType === "individual"
                  ? "Lets the WhatsApp button open this guest's chat directly"
                  : "One number for the whole invitation — the WhatsApp button opens this chat directly"}
          </p>
        </div>

        {/* ── Custom Message ── */}
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

        {/* ── Info Banner ── */}
        {invitationType !== "individual" && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-admin-accent/5 border border-admin-accent/15 animate-fade-in-up">
            <svg className="w-5 h-5 text-admin-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div className="text-xs text-admin-text-muted leading-relaxed">
              <strong className="text-admin-text">One invite link</strong> will be generated for this{" "}
              {invitationType === "couple" ? "couple" : "family"}. All members share the same link,
              but each person can RSVP individually for accurate headcount.
            </div>
          </div>
        )}

        {/* ── Submit ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
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
              "Create Invitation & Generate Link"
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
