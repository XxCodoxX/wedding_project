import type { Wedding } from "@/lib/supabase";

export default function EventDetails({ wedding }: { wedding: Partial<Wedding> }) {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <p className="font-outfit text-sm uppercase tracking-[0.25em] text-gold mb-3">
            The Details
          </p>
          <h2 className="font-cormorant text-3xl sm:text-4xl font-light text-navy">
            Wedding Day Schedule
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <TimelineCard
            time="3:00 PM"
            title="The Ceremony"
            description="Join us as we exchange our vows in an intimate ceremony surrounded by our loved ones."
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            }
          />
          <TimelineCard
            time="5:00 PM"
            title="Cocktail Hour"
            description="Enjoy drinks and hors d'oeuvres while we capture some memories with our photographer."
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            }
          />
          <TimelineCard
            time="7:00 PM"
            title="Reception & Dinner"
            description="Dance the night away and celebrate with dinner, toasts, and joyful moments together."
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
            }
          />
        </div>

        {wedding.location_url && (
          <div className="mt-14 text-center">
            <a
              href={wedding.location_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-gold/30 text-gold font-outfit text-sm font-medium hover:bg-gold/5 hover:border-gold/50 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              View on Google Maps
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function TimelineCard({
  time,
  title,
  description,
  icon,
}: {
  time: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center group">
      <div className="w-16 h-16 rounded-2xl bg-cream mx-auto mb-4 flex items-center justify-center text-gold group-hover:bg-gold/10 transition-colors duration-300">
        {icon}
      </div>
      <p className="font-outfit text-sm text-gold font-medium mb-1">{time}</p>
      <h3 className="font-cormorant text-xl text-navy mb-2">{title}</h3>
      <p className="font-outfit text-sm text-navy/60 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
