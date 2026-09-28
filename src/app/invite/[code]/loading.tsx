import Image from "next/image";

export default function InviteLoading() {
  return (
    <main className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center px-6 relative overflow-hidden select-none">
      {/* Golden Ambient Blur Glow */}
      <div className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-gold/15 blur-3xl pointer-events-none animate-pulse-glow" />

      <div className="relative z-10 text-center max-w-sm flex flex-col items-center">
        {/* Animated Rotating Mandala / Ring */}
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          {/* Outer rotating decorative ring */}
          <div className="absolute inset-0 rounded-full border border-gold/30 border-t-gold animate-spin [animation-duration:3s]" />
          {/* Middle counter-rotating ring */}
          <div className="absolute inset-2 rounded-full border border-gold/40 border-b-gold animate-spin [animation-direction:reverse] [animation-duration:2s]" />
          {/* Inner ring */}
          <div className="absolute inset-4 rounded-full border border-dashed border-gold/50 animate-spin [animation-duration:6s]" />
          {/* Center sparkle */}
          <span className="text-gold text-xl animate-pulse">✦</span>
        </div>

        {/* Heading */}
        <p className="font-outfit text-[11px] uppercase tracking-[0.3em] text-gold font-semibold mb-2">
          Royal Wedding Invitation
        </p>
        <h1 className="font-cormorant text-3xl sm:text-4xl font-light text-navy mb-2 tracking-wide">
          Opening Your Invitation
        </h1>
        <p className="font-outfit text-xs text-navy/60 leading-relaxed max-w-xs">
          Please wait while we prepare your personalized card &amp; celebration details...
        </p>

        {/* Shimmering Gold Divider */}
        <div className="mt-8 flex items-center gap-3 w-48">
          <span className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/40 to-gold/70" />
          <span className="text-gold/60 text-xs">✦</span>
          <span className="flex-1 h-px bg-gradient-to-l from-transparent via-gold/40 to-gold/70" />
        </div>

        {/* Shimmer progress line */}
        <div className="mt-6 w-36 h-1 rounded-full bg-gold/20 overflow-hidden relative">
          <div className="absolute inset-0 w-1/2 bg-gold rounded-full animate-shimmer" />
        </div>
      </div>
    </main>
  );
}
