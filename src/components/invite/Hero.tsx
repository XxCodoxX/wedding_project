import Image from "next/image";

interface HeroProps {
  coupleName1: string;
  coupleName2: string;
  weddingDate: string;
  venueName: string;
  venueLocation: string;
  mainImageUrl?: string;
}

export default function Hero({
  coupleName1,
  coupleName2,
  weddingDate,
  venueName,
  venueLocation,
  mainImageUrl,
}: HeroProps) {
  const dateObj = new Date(weddingDate);
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Extract weekday, day, month, year for styling if possible, otherwise use standard string
  const weekday = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString(undefined, { month: 'long' });
  const year = dateObj.getFullYear();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={mainImageUrl || "/wedding-hero-bg.jpg"}
          alt="Wedding background"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Subtle cream overlay for text readability */}
        <div className="absolute inset-0 bg-cream/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 py-8 sm:py-14 md:py-20 max-w-xl mx-auto">
        {/* Pre-heading */}
        <p
          className="font-outfit text-xs sm:text-sm uppercase tracking-[0.25em] sm:tracking-[0.3em] text-burgundy/70 mb-3 sm:mb-6 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
        >
          Together with their families
        </p>

        {/* Decorative line */}
        <div
          className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-8 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
        >
          <span className="block w-10 sm:w-16 h-px bg-gold/50" />
          <span className="text-gold text-base sm:text-lg">✦</span>
          <span className="block w-10 sm:w-16 h-px bg-gold/50" />
        </div>

        {/* Couple Names */}
        <h1
          className="font-cormorant text-3xl sm:text-6xl md:text-7xl font-light text-navy leading-tight mb-1 sm:mb-2 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}
        >
          {coupleName1}
        </h1>
        <p
          className="font-cormorant text-xl sm:text-3xl text-gold italic mb-1 sm:mb-2 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.7s", animationFillMode: "forwards" }}
        >
          &
        </p>
        <h1
          className="font-cormorant text-3xl sm:text-6xl md:text-7xl font-light text-navy leading-tight mb-4 sm:mb-8 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}
        >
          {coupleName2}
        </h1>

        {/* Decorative line */}
        <div
          className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-8 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "1s", animationFillMode: "forwards" }}
        >
          <span className="block w-10 sm:w-16 h-px bg-gold/50" />
          <span className="text-gold text-base sm:text-lg">✦</span>
          <span className="block w-10 sm:w-16 h-px bg-gold/50" />
        </div>

        {/* Date */}
        <p
          className="font-outfit text-sm sm:text-lg tracking-wider text-navy/80 mb-1 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "1.1s", animationFillMode: "forwards" }}
        >
          {weekday}, the {day} of {month}
        </p>
        <p
          className="font-outfit text-xs sm:text-sm tracking-wider text-navy/60 mb-4 sm:mb-6 opacity-0 animate-fade-in-up uppercase"
          style={{ animationDelay: "1.2s", animationFillMode: "forwards" }}
        >
          {year}
        </p>

        {/* Venue */}
        <div
          className="opacity-0 animate-fade-in-up"
          style={{ animationDelay: "1.3s", animationFillMode: "forwards" }}
        >
          <p className="font-cormorant text-lg sm:text-2xl text-burgundy mb-0.5 sm:mb-1">
            {venueName}
          </p>
          <p className="font-outfit text-xs sm:text-sm text-navy/60">
            {venueLocation}
          </p>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in animate-float"
          style={{ animationDelay: "2s", animationFillMode: "forwards" }}
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-gold/60"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
