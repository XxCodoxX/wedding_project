import Hero from "@/components/invite/Hero";
import GuestGreeting from "@/components/invite/GuestGreeting";
import PhotoGallery from "@/components/invite/PhotoGallery";
import RsvpForm from "@/components/invite/RsvpForm";
import EventDetails from "@/components/invite/EventDetails";
import Footer from "@/components/invite/Footer";
import { TemplateProps } from "./registry";

export default function ClassicTemplate({ wedding, guest, isPreview }: TemplateProps) {
  const guestCustomMsg =
    guest?.custom_message && guest.custom_message.trim() !== guest?.guest_name?.trim()
      ? guest.custom_message.trim()
      : null;

  return (
    <main className="min-h-screen bg-cream">
      {/* Hero Section */}
      <Hero
        coupleName1={wedding.groom_name}
        coupleName2={wedding.bride_name}
        weddingDate={wedding.wedding_date}
        venueName={wedding.venue_name}
        venueLocation={wedding.venue_location}
        mainImageUrl={wedding.main_image_url || undefined}
      />

      {/* Guest Greeting */}
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

      {/* Event Details */}
      <EventDetails wedding={wedding} />

      {/* Photo Gallery */}
      <PhotoGallery photos={wedding.gallery_image_urls || []} />

      {/* RSVP Form */}
      <div className={isPreview ? "pointer-events-none opacity-80" : ""}>
        <RsvpForm
          guestId={guest?.id || "mock-guest-id"}
          guestName={guest?.guest_name || "John Doe"}
          currentStatus={guest?.rsvp_status || "pending"}
        />
      </div>

      {/* Footer */}
      <Footer wedding={wedding} />
    </main>
  );
}
