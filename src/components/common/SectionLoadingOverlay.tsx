"use client";

interface SectionLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  submessage?: string;
  theme?: "admin" | "wedding";
  rounded?: "xl" | "2xl" | "3xl" | "full" | "none";
}

export default function SectionLoadingOverlay({
  isLoading,
  message = "Loading...",
  submessage,
  theme = "admin",
  rounded = "2xl",
}: SectionLoadingOverlayProps) {
  if (!isLoading) return null;

  const roundedClasses = {
    none: "rounded-none",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    full: "rounded-full",
  }[rounded];

  if (theme === "wedding") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 ${roundedClasses} bg-[#FFF8F0]/85 backdrop-blur-md animate-fade-in select-none`}
      >
        {/* Decorative Golden Ambient Glow */}
        <div className="absolute w-36 h-36 rounded-full bg-gold/15 blur-2xl pointer-events-none animate-pulse-glow" />

        {/* Wedding Ring / Mandala Spinner */}
        <div className="relative mb-4 flex items-center justify-center">
          {/* Outer rotating ring */}
          <div className="w-14 h-14 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
          {/* Inner counter-rotating ring */}
          <div className="absolute w-10 h-10 rounded-full border border-gold/30 border-b-gold/80 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
          {/* Center sparkle */}
          <span className="absolute text-gold text-xs animate-pulse">✦</span>
        </div>

        {/* Message */}
        <p className="font-cormorant text-xl font-semibold text-navy tracking-wide text-center">
          {message}
        </p>

        {submessage && (
          <p className="font-outfit text-xs text-navy/60 mt-1 max-w-xs text-center leading-relaxed">
            {submessage}
          </p>
        )}

        {/* Subtle Shimmer Bar */}
        <div className="mt-4 w-28 h-1 rounded-full bg-gold/20 overflow-hidden relative">
          <div className="absolute inset-0 w-1/2 bg-gold/70 rounded-full animate-shimmer" />
        </div>
      </div>
    );
  }

  // Admin Dark Theme
  return (
    <div
      role="status"
      aria-live="polite"
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 ${roundedClasses} bg-admin-bg/80 backdrop-blur-md animate-fade-in select-none`}
    >
      {/* Accent Glow */}
      <div className="absolute w-36 h-36 rounded-full bg-admin-accent/15 blur-2xl pointer-events-none animate-pulse-glow" />

      {/* Modern Circular Spinner with Glowing Trail */}
      <div className="relative mb-4 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-admin-accent/20 border-t-admin-accent border-r-admin-accent/80 animate-spin" />
        <div className="absolute w-7 h-7 rounded-full bg-admin-accent/10 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-admin-accent animate-ping" />
        </div>
      </div>

      {/* Message */}
      <p className="text-sm font-semibold text-admin-text tracking-wide text-center">
        {message}
      </p>

      {submessage && (
        <p className="text-xs text-admin-text-muted/80 mt-1 max-w-xs text-center leading-relaxed">
          {submessage}
        </p>
      )}

      {/* Progress Track */}
      <div className="mt-4 w-32 h-1 rounded-full bg-admin-border overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-admin-accent to-transparent animate-shimmer" />
      </div>
    </div>
  );
}
