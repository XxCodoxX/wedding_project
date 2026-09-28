import Hero from "@/components/invite/Hero";
import GuestGreeting from "@/components/invite/GuestGreeting";
import RsvpForm from "@/components/invite/RsvpForm";
import EventDetails from "@/components/invite/EventDetails";
import Footer from "@/components/invite/Footer";
import { TemplateProps } from "./registry";

export default function MinimalTemplate({ wedding, guest, isPreview }: TemplateProps) {
  const guestCustomMsg =
    guest?.custom_message && guest.custom_message.trim() !== guest?.guest_name?.trim()
      ? guest.custom_message.trim()
      : null;

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="pt-10">
        <Hero
          coupleName1={wedding.groom_name}
          coupleName2={wedding.bride_name}
          weddingDate={wedding.wedding_date}
          venueName={wedding.venue_name}
          venueLocation={wedding.venue_location}
          mainImageUrl={wedding.main_image_url || undefined}
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Guest Greeting */}
        <div className="text-center mb-20">
          {guest && (
            <GuestGreeting
              guestName={guest.guest_name}
              customMessage={guestCustomMsg || wedding.custom_message}
            />
          )}
          {isPreview && !guest && (
            <GuestGreeting
              guestName="John Doe"
              customMessage={wedding.custom_message || "We are so excited to celebrate with you!"}
            />
          )}
          {!guest && !isPreview && wedding.custom_message && (
            <GuestGreeting
              guestName="Guest"
              customMessage={wedding.custom_message}
            />
          )}
        </div>

        {/* Event Details */}
        <div className="mb-20 border-t border-b border-gray-200 py-10">
          <EventDetails wedding={wedding} />
        </div>

        {/* RSVP Form */}
        <div className={isPreview ? "pointer-events-none opacity-80" : ""}>
          <div className="bg-gray-50 p-10 rounded-3xl">
            <RsvpForm
              guestId={guest?.id || "mock-guest-id"}
              guestName={guest?.guest_name || "John Doe"}
              currentStatus={guest?.rsvp_status || "pending"}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer wedding={wedding} />
    </main>
  );
}
