"use client";

import { useState } from "react";
import Image from "next/image";
import RotatingOrnament from "@/components/invite/RotatingOrnament";
import GuestGreeting from "@/components/invite/GuestGreeting";
import EventDetails from "@/components/invite/EventDetails";
import PhotoGallery from "@/components/invite/PhotoGallery";
import RsvpForm from "@/components/invite/RsvpForm";
import Footer from "@/components/invite/Footer";
import { TemplateProps } from "./registry";

/**
 * Ornate Template — "Royal Gold"
 *
 * A premium, white-and-gold themed wedding invitation template featuring
 * a full-screen intro/landing screen with a slowly rotating mandala ornament,
 * followed by the standard invitation sections.
 *
 * The intro screen acts as a "cover page" that guests see first.
 * Tapping "Open Invitation" reveals the full invitation content.
 */
export default function OrnateTemplate({ wedding, guest, isPreview }: TemplateProps) {
  const [isOpened, setIsOpened] = useState(false);

  const dateObj = new Date(wedding.wedding_date);
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (!isOpened) {
    return (
      <IntroScreen
        groomName={wedding.groom_name}
        brideName={wedding.bride_name}
        formattedDate={formattedDate}
        backgroundImage={wedding.main_image_url || "/tamplate_one_background.png"}
        onOpen={() => setIsOpened(true)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Guest Greeting */}
      {guest && (
        <GuestGreeting
          guestName={guest.guest_name}
          customMessage={guest.custom_message}
        />
      )}
      {isPreview && !guest && (
        <GuestGreeting
          guestName="John Doe"
          customMessage="We are so excited to celebrate with you!"
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

// ─────────────────────────────────────────────
// Intro / Landing Screen
// ─────────────────────────────────────────────

interface IntroScreenProps {
  groomName: string;
  brideName: string;
  formattedDate: string;
  backgroundImage: string;
  onOpen: () => void;
}

function IntroScreen({
  groomName,
  brideName,
  formattedDate,
  backgroundImage,
  onOpen,
}: IntroScreenProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Layer 0 — Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage}
          alt="Wedding background"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Soft white overlay for readability */}
        <div className="absolute inset-0 bg-white/20" />
      </div>

      {/* Layer 1 — Rotating mandala ornament */}
      <RotatingOrnament
        src="/mandala-pattern.svg"
        size={600}
        opacity={55}
      />

      {/* Layer 10 — Foreground content */}
      <div className="relative z-10 text-center px-6 py-20 max-w-xl mx-auto">
        {/* Pre-heading */}
        <p
          className="font-outfit text-sm uppercase tracking-[0.3em] text-white/80 mb-6 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
        >
          You are cordially invited
        </p>

        {/* Decorative line */}
        <div
          className="flex items-center justify-center gap-4 mb-8 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
        >
          <span className="block w-16 h-px bg-gold/60" />
          <span className="text-gold text-lg">✦</span>
          <span className="block w-16 h-px bg-gold/60" />
        </div>

        {/* Couple Names */}
        <h1
          className="font-cormorant text-5xl sm:text-6xl md:text-7xl font-light text-white leading-tight mb-2 opacity-0 animate-fade-in-up drop-shadow-lg"
          style={{ animationDelay: "0.7s", animationFillMode: "forwards" }}
        >
          {groomName}
        </h1>
        <p
          className="font-cormorant text-2xl sm:text-3xl text-gold italic mb-2 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}
        >
          &amp;
        </p>
        <h1
          className="font-cormorant text-5xl sm:text-6xl md:text-7xl font-light text-white leading-tight mb-8 opacity-0 animate-fade-in-up drop-shadow-lg"
          style={{ animationDelay: "0.9s", animationFillMode: "forwards" }}
        >
          {brideName}
        </h1>

        {/* Decorative line */}
        <div
          className="flex items-center justify-center gap-4 mb-8 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "1.1s", animationFillMode: "forwards" }}
        >
          <span className="block w-16 h-px bg-gold/60" />
          <span className="text-gold text-lg">✦</span>
          <span className="block w-16 h-px bg-gold/60" />
        </div>

        {/* Date */}
        <p
          className="font-outfit text-base sm:text-lg tracking-wider text-white/90 mb-10 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "1.2s", animationFillMode: "forwards" }}
        >
          {formattedDate}
        </p>

        {/* Open Invitation Button */}
        <button
          onClick={onOpen}
          className="opacity-0 animate-fade-in-up inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gold text-white font-outfit text-sm font-medium tracking-wider uppercase hover:bg-gold-dark transition-all duration-300 shadow-lg shadow-gold/30 hover:shadow-gold/50 cursor-pointer"
          style={{ animationDelay: "1.5s", animationFillMode: "forwards" }}
        >
          Open Invitation
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </button>
      </div>
    </section>
  );
}
