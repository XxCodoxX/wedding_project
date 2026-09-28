"use client";

import { useState, useEffect } from "react";
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
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Prevent scrolling on first cover screen; allow normal scrolling after opening completes
  useEffect(() => {
    if (!isOpened) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpened]);

  const dateObj = new Date(wedding.wedding_date);
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleOpen = () => {
    if (isFadingOut || isOpened) return;
    setIsFadingOut(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    setTimeout(() => {
      setIsOpened(true);
    }, 700);
  };

  return (
    <div className={`relative ${isPreview ? "h-full w-full" : "min-h-screen"}`}>
      {/* Second Screen (Full Invitation) — fades in when opening */}
      {(isFadingOut || isOpened) && (
        <main className="min-h-screen bg-white animate-fade-in">
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
      )}

      {/* First Screen (Cover / Intro Screen) — fades away gracefully when opened */}
      {!isOpened && (
        <div
          className={`${
            isFadingOut
              ? isPreview
                ? "absolute inset-0 z-40"
                : "fixed inset-0 z-50"
              : isPreview
              ? "h-full w-full"
              : "h-screen max-h-dvh w-full"
          } transition-all duration-700 ease-out ${
            isFadingOut
              ? "opacity-0 scale-[1.03] pointer-events-none"
              : "opacity-100 scale-100"
          }`}
        >
          <IntroScreen
            groomName={wedding.groom_name}
            brideName={wedding.bride_name}
            formattedDate={formattedDate}
            backgroundImage={wedding.main_image_url || "/tamplate_one_background.png"}
            onOpen={handleOpen}
            isPreview={isPreview}
          />
        </div>
      )}
    </div>
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
  isPreview?: boolean;
}

function IntroScreen({
  groomName,
  brideName,
  formattedDate,
  backgroundImage,
  onOpen,
  isPreview,
}: IntroScreenProps) {
  return (
    <section
      className={`relative ${
        isPreview ? "h-full min-h-full" : "h-screen max-h-dvh"
      } flex items-center justify-center overflow-hidden`}
    >
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
        opacity={55}
        className="w-[110vw] sm:w-[75vw] md:w-100"
      />

      {/* Layer 10 — Foreground content */}
      <div className="relative z-10 text-center px-4 sm:px-6 py-4 sm:py-10 md:py-16 max-w-xl mx-auto flex flex-col items-center justify-center">
        {/* Pre-heading */}
        <p
          className="font-outfit text-xs sm:text-sm uppercase tracking-[0.25em] sm:tracking-[0.3em] text-navy/70 mb-2 sm:mb-5 opacity-0 animate-fade-in-up font-medium"
          style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
        >
          You are cordially invited
        </p>

        {/* Decorative line */}
        <div
          className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-6 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
        >
          <span className="block w-8 sm:w-16 h-px bg-gold/50" />
          <span className="text-gold text-sm sm:text-lg">✦</span>
          <span className="block w-8 sm:w-16 h-px bg-gold/50" />
        </div>

        {/* Couple Names */}
        <h1
          className="font-cormorant text-3xl sm:text-5xl md:text-7xl font-light text-navy leading-tight mb-1 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.7s", animationFillMode: "forwards" }}
        >
          {groomName}
        </h1>
        <p
          className="font-cormorant text-xl sm:text-2xl md:text-3xl text-gold-dark italic mb-1 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}
        >
          &amp;
        </p>
        <h1
          className="font-cormorant text-3xl sm:text-5xl md:text-7xl font-light text-navy leading-tight mb-3 sm:mb-6 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.9s", animationFillMode: "forwards" }}
        >
          {brideName}
        </h1>

        {/* Decorative line */}
        <div
          className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-6 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "1.1s", animationFillMode: "forwards" }}
        >
          <span className="block w-8 sm:w-16 h-px bg-gold/50" />
          <span className="text-gold text-sm sm:text-lg">✦</span>
          <span className="block w-8 sm:w-16 h-px bg-gold/50" />
        </div>

        {/* Date */}
        <p
          className="font-outfit text-sm sm:text-base md:text-lg tracking-wider text-navy/80 mb-4 sm:mb-8 opacity-0 animate-fade-in-up font-medium"
          style={{ animationDelay: "1.2s", animationFillMode: "forwards" }}
        >
          {formattedDate}
        </p>

        {/* Open Invitation Button */}
        <button
          onClick={onOpen}
          className="opacity-0 animate-fade-in-up inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-gold text-cream font-outfit text-xs sm:text-sm font-medium tracking-wider uppercase hover:bg-navy-light hover:text-white transition-all duration-300 shadow-lg shadow-navy/25 hover:shadow-navy/40 border border-gold/40 cursor-pointer"
          style={{ animationDelay: "1.5s", animationFillMode: "forwards" }}
        >
          Open Invitation
        </button>
      </div>
    </section>
  );
}
