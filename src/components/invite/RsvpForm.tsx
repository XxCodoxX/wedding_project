"use client";

import { useState } from "react";
import SectionLoadingOverlay from "@/components/common/SectionLoadingOverlay";

interface RsvpMember {
  id: string;
  name: string;
  currentStatus: "pending" | "attending" | "not_attending";
}

interface RsvpFormProps {
  guestId: string;
  guestName: string;
  currentStatus: "pending" | "attending" | "not_attending";
  /** For couple/family invitations — each member gets their own RSVP row */
  groupMembers?: RsvpMember[];
}

export default function RsvpForm({
  guestId,
  guestName,
  currentStatus,
  groupMembers,
}: RsvpFormProps) {
  const isGroup = groupMembers && groupMembers.length > 1;

  if (isGroup) {
    return <GroupRsvpForm groupMembers={groupMembers} />;
  }

  return (
    <SingleRsvpForm
      guestId={guestId}
      guestName={guestName}
      currentStatus={currentStatus}
    />
  );
}

// ────────────────────────────────────────
// Single Guest RSVP (existing behavior)
// ────────────────────────────────────────

function SingleRsvpForm({
  guestId,
  guestName,
  currentStatus,
}: {
  guestId: string;
  guestName: string;
  currentStatus: "pending" | "attending" | "not_attending";
}) {
  const [status, setStatus] = useState<"attending" | "not_attending" | null>(
    currentStatus !== "pending" ? currentStatus : null
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(currentStatus !== "pending");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!status) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId,
          guestName,
          rsvpStatus: status,
          message: message.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit RSVP");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 px-6 bg-cream" id="rsvp">
      <div className="max-w-lg mx-auto text-center">
        {/* Section Title */}
        <p className="font-outfit text-xs sm:text-sm uppercase tracking-[0.25em] text-gold mb-2 font-medium">
          Celebrate With Us
        </p>
        <h2 className="font-cormorant text-3xl sm:text-4xl font-light text-navy mb-2">
          Will You Join Our Special Day?
        </h2>
        <p className="font-outfit text-sm text-navy/60 mb-8 sm:mb-10">
          Please confirm your attendance to help us prepare for the celebration
        </p>

        {submitted ? (
          /* Success State */
          <div className="glass rounded-2xl p-8 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center mx-auto mb-4">
              {status === "attending" ? (
                <svg className="w-8 h-8 text-sage-dark" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-rose" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </div>

            <h3 className="font-cormorant text-2xl sm:text-3xl text-navy mb-2 font-medium">
              {status === "attending"
                ? "We're Delighted You Can Make It!"
                : "You Will Be Dearly Missed!"}
            </h3>
            <p className="font-outfit text-sm text-navy/70 leading-relaxed max-w-sm mx-auto">
              {status === "attending"
                ? `Thank you for confirming, ${guestName || "cherished guest"}. We cannot wait to share this magical day and celebrate our love together!`
                : `Thank you for letting us know, ${guestName || "cherished guest"}. Your heartfelt love and blessings will be in our hearts on our special day.`}
            </p>

            {/* Change response button */}
            <button
              onClick={() => {
                setSubmitted(false);
                setStatus(null);
              }}
              className="mt-6 font-outfit text-xs text-gold/80 hover:text-gold underline underline-offset-4 transition-colors cursor-pointer"
            >
              Update my response
            </button>
          </div>
        ) : (
          /* Form */
          <div className="glass rounded-2xl p-5 sm:p-8 space-y-6 relative overflow-hidden">
            <SectionLoadingOverlay
              isLoading={loading}
              message="Confirming Attendance..."
              submessage="Saving your response and notifying the couple"
              theme="wedding"
              rounded="2xl"
            />
            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-burgundy/10 border border-burgundy/20 text-burgundy text-sm animate-scale-in">
                {error}
              </div>
            )}

            {/* Status Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => setStatus("attending")}
                className={`group relative p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                  status === "attending"
                    ? "border-sage bg-sage/10 shadow-lg shadow-sage/10"
                    : "border-gold/20 hover:border-sage/50 hover:bg-sage/5"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center transition-colors ${
                    status === "attending"
                      ? "bg-sage text-white"
                      : "bg-sage/10 text-sage group-hover:bg-sage/20"
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p className="font-cormorant text-lg sm:text-xl text-navy font-medium">
                  Joyfully Accept
                </p>
                <span className="block text-xs font-outfit text-navy/50 mt-0.5">
                  Will attend with pleasure
                </span>
              </button>

              <button
                onClick={() => setStatus("not_attending")}
                className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                  status === "not_attending"
                    ? "border-rose bg-rose/10 shadow-lg shadow-rose/10"
                    : "border-gold/20 hover:border-rose/50 hover:bg-rose/5"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center transition-colors ${
                    status === "not_attending"
                      ? "bg-rose text-white"
                      : "bg-rose/10 text-rose group-hover:bg-rose/20"
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="font-cormorant text-lg sm:text-xl text-navy font-medium">
                  Regretfully Decline
                </p>
                <span className="block text-xs font-outfit text-navy/50 mt-0.5">
                  Sending love in spirit
                </span>
              </button>
            </div>

            {/* Message */}
            {status && (
              <div className="animate-fade-in-up">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Send your warm wishes, blessings, or notes for the couple (optional)..."
                  className="w-full px-4 py-3 rounded-xl bg-white/60 border border-gold/20 text-navy placeholder-navy/35 font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all resize-none"
                />
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!status || loading}
              className={`w-full inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-outfit text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 ${
                status
                  ? "bg-[#f8df52e1] hover:bg-gold text-[#0D1B3E] cursor-pointer shadow-md shadow-gold/20"
                  : "bg-navy/10 text-navy/40 border border-navy/10 cursor-not-allowed"
              } disabled:opacity-75`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Confirming Attendance...
                </span>
              ) : (
                "Confirm Attendance"
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ────────────────────────────────────────
// Group RSVP (Couple / Family)
// ────────────────────────────────────────

function GroupRsvpForm({ groupMembers }: { groupMembers: RsvpMember[] }) {
  type MemberStatus = "attending" | "not_attending" | null;

  const [memberStatuses, setMemberStatuses] = useState<Record<string, MemberStatus>>(() => {
    const initial: Record<string, MemberStatus> = {};
    for (const member of groupMembers) {
      initial[member.id] = member.currentStatus !== "pending" ? member.currentStatus : null;
    }
    return initial;
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(() =>
    groupMembers.every((m) => m.currentStatus !== "pending")
  );
  const [error, setError] = useState("");

  const setMemberStatus = (memberId: string, status: MemberStatus) => {
    setMemberStatuses((prev) => ({ ...prev, [memberId]: status }));
  };

  const allSelected = Object.values(memberStatuses).every((s) => s !== null);
  const attendingCount = Object.values(memberStatuses).filter((s) => s === "attending").length;

  const handleSubmit = async () => {
    if (!allSelected) return;

    setLoading(true);
    setError("");

    try {
      // Submit batch RSVP for all group members in one request
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: groupMembers.map((member) => ({
            guestId: member.id,
            guestName: member.name,
            rsvpStatus: memberStatuses[member.id],
          })),
          message: message.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit RSVP");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 px-6 bg-cream" id="rsvp">
      <div className="max-w-lg mx-auto text-center">
        {/* Section Title */}
        <p className="font-outfit text-xs sm:text-sm uppercase tracking-[0.25em] text-gold mb-2 font-medium">
          Celebrate With Us
        </p>
        <h2 className="font-cormorant text-3xl sm:text-4xl font-light text-navy mb-2">
          Who Will Be Joining Us?
        </h2>
        <p className="font-outfit text-sm text-navy/60 mb-8 sm:mb-10">
          Please confirm attendance for each member to help us prepare
        </p>

        {submitted ? (
          /* Success State */
          <div className="glass rounded-2xl p-8 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-sage-dark" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>

            <h3 className="font-cormorant text-2xl sm:text-3xl text-navy mb-3 font-medium">
              Thank You for Responding!
            </h3>
            <div className="space-y-2 mb-4">
              {groupMembers.map((member) => {
                const s = memberStatuses[member.id];
                return (
                  <div key={member.id} className="flex items-center justify-center gap-2 font-outfit text-sm">
                    <span className={`w-2 h-2 rounded-full ${s === "attending" ? "bg-sage" : "bg-rose"}`} />
                    <span className="text-navy/80">{member.name}</span>
                    <span className={`text-xs font-medium ${s === "attending" ? "text-sage-dark" : "text-rose"}`}>
                      — {s === "attending" ? "Attending" : "Not Attending"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="font-outfit text-sm text-navy/60 max-w-sm mx-auto">
              {attendingCount > 0
                ? `We can't wait to celebrate with ${attendingCount === groupMembers.length ? "all of you" : "those who can make it"}!`
                : "Your love and blessings will be in our hearts on our special day."}
            </p>

            <button
              onClick={() => {
                setSubmitted(false);
                const reset: Record<string, MemberStatus> = {};
                for (const member of groupMembers) {
                  reset[member.id] = null;
                }
                setMemberStatuses(reset);
              }}
              className="mt-6 font-outfit text-xs text-gold/80 hover:text-gold underline underline-offset-4 transition-colors cursor-pointer"
            >
              Update our response
            </button>
          </div>
        ) : (
          /* Form */
          <div className="glass rounded-2xl p-4 sm:p-7 space-y-5 relative overflow-hidden">
            <SectionLoadingOverlay
              isLoading={loading}
              message="Confirming Attendance..."
              submessage={`Saving responses for ${groupMembers.length} members & notifying the couple`}
              theme="wedding"
              rounded="2xl"
            />
            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-burgundy/10 border border-burgundy/20 text-burgundy text-sm animate-scale-in">
                {error}
              </div>
            )}

            {/* Per-Member RSVP.
                Layout follows the CARD's width (container query), not the viewport: templates
                render this in narrow cards even on desktop, where a side-by-side row would
                squeeze the name down to "S…". */}
            <div className="@container space-y-3">
              {groupMembers.map((member) => {
                const s = memberStatuses[member.id];
                return (
                  <div
                    key={member.id}
                    role="group"
                    aria-label={`RSVP for ${member.name}`}
                    className="flex flex-col @md:flex-row items-stretch @md:items-center justify-between gap-3 p-3.5 @md:p-4 rounded-xl bg-white/70 border border-gold/20 shadow-2xs transition-all"
                  >
                    <div className="text-center @md:text-left min-w-0">
                      <p className="font-cormorant text-xl text-navy font-semibold leading-snug wrap-break-word">
                        {member.name}
                      </p>
                    </div>

                    {/* Buttons: 50/50 grid when narrow, inline when the card is wide */}
                    <div className="grid grid-cols-2 gap-2.5 w-full @md:w-auto @md:flex @md:shrink-0">
                      <button
                        type="button"
                        onClick={() => setMemberStatus(member.id, "attending")}
                        aria-pressed={s === "attending"}
                        className={`w-full @md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold font-outfit tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                          s === "attending"
                            ? "bg-sage text-white shadow-md shadow-sage/30 border border-sage font-bold"
                            : "bg-white/80 hover:bg-sage/10 text-sage-dark border border-sage/35 hover:border-sage shadow-2xs"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => setMemberStatus(member.id, "not_attending")}
                        aria-pressed={s === "not_attending"}
                        className={`w-full @md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold font-outfit tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                          s === "not_attending"
                            ? "bg-rose text-white shadow-md shadow-rose/30 border border-rose font-bold"
                            : "bg-white/80 hover:bg-rose/10 text-rose border border-rose/35 hover:border-rose shadow-2xs"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message */}
            {allSelected && (
              <div className="animate-fade-in-up">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Send your warm wishes, blessings, or notes for the couple (optional)..."
                  className="w-full px-4 py-3 rounded-xl bg-white/60 border border-gold/20 text-navy placeholder-navy/35 font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all resize-none"
                />
              </div>
            )}

            {/* Summary + Submit */}
            {allSelected && (
              <div className="animate-fade-in-up">
                <p className="font-outfit text-xs text-navy/50 mb-3">
                  {attendingCount} of {groupMembers.length} attending
                </p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!allSelected || loading}
              className={`w-full inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-outfit text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 ${
                allSelected
                  ? "bg-[#f8df52e1] hover:bg-gold text-[#0D1B3E] cursor-pointer shadow-md shadow-gold/20"
                  : "bg-navy/10 text-navy/45 border border-navy/10 cursor-not-allowed"
              } disabled:opacity-75`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Confirming Attendance...
                </span>
              ) : allSelected ? (
                "Confirm Attendance"
              ) : (
                `Select Attendance for All Members (${Object.values(memberStatuses).filter((v) => v !== null).length}/${groupMembers.length})`
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
