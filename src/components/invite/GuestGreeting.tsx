import Image from "next/image";

interface GuestGreetingProps {
  guestName: string;
  customMessage?: string | null;
}

export default function GuestGreeting({
  guestName,
  customMessage,
}: GuestGreetingProps) {
  return (
    <section className="relative py-20 px-6 bg-cream">
      <div className="max-w-2xl mx-auto text-center">
        {/* Divider Image */}
        <div className="flex justify-center mb-10">
          <Image
            src="/wedding-divider.jpg"
            alt="Decorative divider"
            width={280}
            height={60}
            className="opacity-80"
          />
        </div>

        {/* Greeting */}
        <p className="font-outfit text-sm uppercase tracking-[0.25em] text-gold mb-4">
          You are cordially invited
        </p>

        <h2 className="font-cormorant text-3xl sm:text-5xl font-light text-navy mb-6">
          Dear{" "}
          <span className="text-burgundy italic">{guestName}</span>
        </h2>

        {/* Message */}
        <p className="font-outfit text-base text-navy/70 leading-relaxed max-w-lg mx-auto mb-6">
          We would be honoured by your presence as we celebrate our love and
          begin our new journey together. Your presence would make our special
          day even more meaningful.
        </p>

        {/* Custom message */}
        {customMessage && (
          <div className="mt-8 relative">
            {/* Quote decorations */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-gold/30 text-5xl font-serif leading-none select-none">
              &ldquo;
            </div>
            <div className="glass rounded-2xl p-6 pt-8 max-w-md mx-auto">
              <p className="font-cormorant text-lg text-navy/80 italic leading-relaxed">
                {customMessage}
              </p>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <span className="block w-20 h-px bg-gold/30" />
          <span className="text-gold text-sm">♥</span>
          <span className="block w-20 h-px bg-gold/30" />
        </div>
      </div>
    </section>
  );
}
