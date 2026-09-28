"use client";

import { useState } from "react";

interface RsvpFormProps {
  guestId: string;
  guestName: string;
  currentStatus: "pending" | "attending" | "not_attending";
}

export default function RsvpForm({
  guestId,
  guestName,
  currentStatus,
}: RsvpFormProps) {
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
          <div className="glass rounded-2xl p-8 space-y-6">
            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-burgundy/10 border border-burgundy/20 text-burgundy text-sm animate-scale-in">
                {error}
              </div>
            )}

            {/* Status Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setStatus("attending")}
                className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
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
              className={`w-full inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full font-outfit text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 ${
                status
                  ? "bg-[#f8df52e1] hover:bg-gold text-[#0D1B3E] cursor-pointer"
                  : "bg-navy/10 text-navy/30 cursor-not-allowed"
              } disabled:opacity-50`}
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
