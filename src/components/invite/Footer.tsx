import type { Wedding } from "@/lib/supabase";

export default function Footer({ wedding }: { wedding: Partial<Wedding> }) {
  const dateObj = wedding.wedding_date ? new Date(wedding.wedding_date) : new Date();
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <footer className="py-12 px-6 bg-navy text-center">
      <div className="max-w-lg mx-auto">
        <p className="font-cormorant text-3xl text-cream/90 mb-2">
          {wedding.groom_name} & {wedding.bride_name}
        </p>
        <p className="font-outfit text-sm text-cream/40 mb-6">
          {formattedDate} • {wedding.venue_location}
        </p>
        <div className="flex items-center justify-center gap-4">
          <span className="block w-12 h-px bg-gold/30" />
          <span className="text-gold/50 text-sm">♥</span>
          <span className="block w-12 h-px bg-gold/30" />
        </div>
        <p className="font-outfit text-xs text-cream/20 mt-8">
          Made with love
        </p>
      </div>
    </footer>
  );
}
