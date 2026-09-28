"use client";

import { useState, ReactNode, useEffect } from "react";
import Image from "next/image";
import { Great_Vibes, Cinzel } from "next/font/google";
import RotatingOrnament from "@/components/invite/RotatingOrnament";
import EventDetails from "@/components/invite/EventDetails";
import PhotoGallery from "@/components/invite/PhotoGallery";
import RsvpForm from "@/components/invite/RsvpForm";
import { TemplateProps } from "./registry";

const script = Great_Vibes({ subsets: ["latin"], weight: "400", display: "swap" });
const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });

/**
 * Ornate Template — "Royal Gold"
 *
 * Cover screen (IntroScreen) matches original design.
 * Tapping "Open Invitation" reveals the second screen (InvitationScreen)
 * with a solid fixed background (image + rotating mandala) and full invitation details.
 */
export default function OrnateTemplate({ wedding, guest, isPreview }: TemplateProps) {
  const [isOpened, setIsOpened] = useState(false);

  const dateObj = new Date(wedding.wedding_date);
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const backgroundImage = wedding.main_image_url || "/tamplate_one_background.png";

  if (!isOpened) {
    return (
      <IntroScreen
        groomName={wedding.groom_name}
        brideName={wedding.bride_name}
        formattedDate={formattedDate}
        backgroundImage={backgroundImage}
        onOpen={() => {
          setIsOpened(true);
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "instant" });
          }
        }}
        isPreview={isPreview}
      />
    );
  }

  return (
    <InvitationScreen
      wedding={wedding}
      guest={guest}
      isPreview={isPreview}
      backgroundImage={backgroundImage}
      dateObj={dateObj}
    />
  );
}

// ─────────────────────────────────────────────
// Second Screen (Full Invitation)
// ─────────────────────────────────────────────

interface InvitationScreenProps {
  wedding: TemplateProps["wedding"];
  guest: TemplateProps["guest"];
  isPreview?: boolean;
  backgroundImage: string;
  dateObj: Date;
}

function InvitationScreen({ wedding, guest, isPreview, backgroundImage, dateObj }: InvitationScreenProps) {
  const venueName = wedding.venue_name || (wedding as any).venue;
  const venueAddress = wedding.venue_location || (wedding as any).venue_address || (wedding as any).location;
  const mapUrl =
    wedding.location_url ||
    (wedding as any).map_url ||
    (wedding as any).google_maps_url ||
    (venueName
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [venueName, venueAddress].filter(Boolean).join(", ")
        )}`
      : undefined);

  const guestName = guest?.guest_name ?? (isPreview ? "John Doe" : undefined);
  const guestCustomMsg =
    guest?.custom_message && guest.custom_message.trim() !== guest?.guest_name?.trim()
      ? guest.custom_message.trim()
      : null;

  const letter =
    guestCustomMsg ||
    wedding.custom_message ||
    (isPreview
      ? "We are so excited to celebrate our special day with you! Your presence and prayers mean the world to us."
      : "We would be truly honoured to have you with us as we celebrate our love and begin our new journey together.");

  const initials = `${wedding.groom_name?.[0] ?? ""}${wedding.bride_name?.[0] ?? ""}`.toUpperCase();

  const month = dateObj.toLocaleDateString(undefined, { month: "long" });
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  const longDate = dateObj.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const shortDate = dateObj
    .toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .replace(",", " ·");

  // Google Calendar Link
  const calTitle = encodeURIComponent(`${wedding.groom_name} & ${wedding.bride_name}'s Wedding`);
  const calStart = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const calEnd = new Date(dateObj.getTime() + 5 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
  const calLocation = encodeURIComponent([venueName, venueAddress].filter(Boolean).join(", "));
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=${calStart}/${calEnd}&details=${encodeURIComponent("We look forward to celebrating with you!")}&location=${calLocation}`;

  // Wedding Day Agenda / Itinerary Items
  interface AgendaItem {
    time: string;
    title: string;
    description: string;
  }

  const defaultAgenda: AgendaItem[] = [
    {
      time: "09:30 AM",
      title: "Guest Arrival & Welcome",
      description: "Warm welcome with traditional refreshments as family and friends gather.",
    },
    {
      time: "10:30 AM",
      title: "The Wedding Ceremony",
      description: "Sacred marriage rites, traditional blessings, and the joyful exchange of vows.",
    },
    {
      time: "12:00 PM",
      title: "Photography & Celebration",
      description: "Capturing memories with the newlyweds followed by celebratory toasts.",
    },
    {
      time: "01:00 PM",
      title: "The Wedding Feast",
      description: "A grand banquet lunch served in celebration of our union.",
    },
    {
      time: "02:30 PM",
      title: "Cake Cutting & Farewell",
      description: "Cutting of the wedding cake, sharing gratitude, and joyous send-off.",
    },
  ];

  const agendaItems: AgendaItem[] =
    wedding.agenda_items && Array.isArray(wedding.agenda_items) && wedding.agenda_items.length > 0
      ? wedding.agenda_items
      : defaultAgenda;

  return (
    <div className={`relative ${isPreview ? "h-full w-full overflow-hidden" : "min-h-screen"} bg-transparent selection:bg-[#a8823f]/20`}>
      {/* ── Solid Fixed Background: Exact same as first screen ── */}
      <div className={`${isPreview ? "absolute" : "fixed"} inset-0 z-0 pointer-events-none overflow-hidden select-none`}>
        <Image
          src={backgroundImage}
          alt="Wedding background"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Soft white overlay for readability (same as first screen) */}
        <div className="absolute inset-0 bg-white/20" />

        {/* Rotating mandala ornament at top center (same as first screen) */}
        <RotatingOrnament
          src="/mandala-pattern.svg"
          opacity={55}
          className="w-[110vw] sm:w-[75vw] md:w-100"
        />
      </div>

      {/* ── Transparent scrollable content div (transparent bg, all content scrolls over background) ── */}
      <div className={`relative z-10 w-full bg-transparent ${isPreview ? "h-full overflow-y-auto" : "min-h-screen"}`}>
        <div className="mx-auto max-w-md px-4 py-8 sm:py-12 flex flex-col gap-10 sm:gap-14 animate-fade-in text-[#0D1B3E]">
        {/* ── 1. Hero Card ── */}
        <Card className="px-5 sm:px-8 pt-8 pb-8 text-center relative overflow-hidden">
          <div className="absolute top-2 left-2 text-[#D4AF37]/45 text-xs select-none">✦</div>
          <div className="absolute top-2 right-2 text-[#D4AF37]/45 text-xs select-none">✦</div>
          <div className="absolute bottom-2 left-2 text-[#D4AF37]/45 text-xs select-none">✦</div>
          <div className="absolute bottom-2 right-2 text-[#D4AF37]/45 text-xs select-none">✦</div>

          <p className="font-cormorant text-2xl sm:text-3xl font-semibold text-[#1A2F6C] tracking-wide">ශ්‍රී සුභ මංගලම් !</p>
          <p className={`${cinzel.className} text-[11px] sm:text-xs tracking-[0.25em] text-[#D4AF37] mt-1 font-semibold`}>
            SRI SUBA MANGALAM!
          </p>

          <p className={`${cinzel.className} text-[11px] sm:text-xs tracking-[0.2em] text-[#D4AF37] mt-6 uppercase font-medium`}>
            You are invited to the wedding of
          </p>
          <Diamond withLines className="mt-3 opacity-85" />

          {/* Couple Names */}
          <h1 className={`${script.className} text-6xl sm:text-7xl leading-[1.05] mt-4 text-[#1A2F6C] drop-shadow-xs`}>
            {wedding.groom_name}
          </h1>
          <p className={`${script.className} text-4xl text-[#D4AF37] my-0.5`}>&amp;</p>
          <h1 className={`${script.className} text-6xl sm:text-7xl leading-[1.05] text-[#1A2F6C] drop-shadow-xs`}>
            {wedding.bride_name}
          </h1>

          {/* Couple Photo (if main_image_url provided) */}
          {wedding.main_image_url && (
            <div className="relative mx-auto my-6 w-40 h-52 sm:w-48 sm:h-60 rounded-t-full rounded-b-2xl overflow-hidden border-[3px] border-[#D4AF37]/40 shadow-lg shadow-[#1A2F6C]/15 bg-[#FFFFFF]">
              <Image
                src={wedding.main_image_url}
                alt={`${wedding.groom_name} & ${wedding.bride_name}`}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 border border-[#D4AF37]/40 rounded-t-full rounded-b-2xl pointer-events-none" />
            </div>
          )}

          {/* Date Strip */}
          <div className="mt-7 border-y border-[#D4AF37]/35 py-3.5 grid grid-cols-3 items-center bg-[#FFFFFF]/80 rounded-lg">
            <span className={`${cinzel.className} text-xs tracking-[0.18em] font-bold uppercase text-[#D4AF37]`}>
              {month}
            </span>
            <span className={`${cinzel.className} text-4xl sm:text-5xl font-bold text-[#1A2F6C]`}>
              {day}
            </span>
            <span className={`${cinzel.className} text-xs tracking-[0.18em] font-bold uppercase text-[#D4AF37]`}>
              {year}
            </span>
          </div>

          <p className="font-cormorant text-xl font-semibold text-[#0D1B3E] mt-4">{longDate}</p>

          {/* Add to Calendar Button */}
          <div className="mt-4 flex justify-center">
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-[#f8df52e1] hover:bg-gold text-[#0D1B3E] font-outfit text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer"
            >
              <CalendarIcon /> ADD TO CALENDAR
            </a>
          </div>

          <p className={`${cinzel.className} text-xs sm:text-sm tracking-[0.15em] text-[#0D1B3E]/80 mt-6 leading-relaxed font-medium`}>
            REQUEST THE HONOUR OF YOUR PRESENCE
          </p>

          {guestName && (
            <div className="flex items-center gap-3 mt-4">
              <span className="flex-1 h-px bg-linear-to-r from-transparent to-[#D4AF37]/50" />
              <span className="font-cormorant text-lg sm:text-xl text-[#1A2F6C] font-semibold px-3 py-0.5 rounded-md bg-[#FFFFFF] border border-[#D4AF37]/35 shadow-xs">
                {guestName}
              </span>
              <span className="flex-1 h-px bg-linear-to-l from-transparent to-[#D4AF37]/50" />
            </div>
          )}

          <p className="font-cormorant italic text-[#0D1B3E]/70 mt-3">At their wedding celebration</p>

          {/* Couple Anime Illustration */}
          <div className="mt-6 flex justify-center">
            <div className="relative w-52 sm:w-60 aspect-1086/1448 drop-shadow-[0_16px_28px_rgba(26,47,108,0.22)] transition-transform duration-300 hover:scale-[1.02]">
              <Image
                src="/couple_photos_anime.png"
                alt={`${wedding.groom_name} & ${wedding.bride_name}`}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 208px, 240px"
              />
            </div>
          </div>
        </Card>

        {/* ── 2. Countdown ── */}
        <section className="text-center">
          <SectionTitle>UNTIL WE MEET</SectionTitle>
          <Diamond withLines className="mt-2" />
          <p className="font-cormorant text-[#0D1B3E]/80 mt-2 font-medium">
            {dateObj.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <Countdown target={dateObj.getTime()} />
          <p className="font-cormorant italic text-[#0D1B3E]/70 mt-4 text-base">
            We can&apos;t wait to celebrate with you!
          </p>
        </section>

        {/* ── 3. Letter from the Couple ── */}
        <div className="relative -rotate-1 transition-transform hover:rotate-0 duration-300">
          <Seal initials={initials} className="absolute -top-4 right-4 z-10" size="sm" />
          <div
            className="relative bg-[#FFFFFF] border border-[#D4AF37]/35 rounded-xl shadow-[0_18px_40px_-18px_rgba(26,47,108,0.22)] px-6 pt-8 pb-7 overflow-hidden"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(212,175,55,0.12) 31px, rgba(212,175,55,0.12) 32px)",
            }}
          >
            {/* Folded paper corner shadow */}
            <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none">
              <div className="w-0 h-0 border-t-32 border-t-[#F9F9F6] border-r-32 border-r-transparent drop-shadow-xs" />
            </div>

            <p className={`${cinzel.className} text-[11px] tracking-[0.2em] text-[#D4AF37] font-semibold pl-4`}>
              A PERSONAL NOTE
            </p>
            <p className={`${script.className} text-3xl sm:text-4xl mt-3 text-[#1A2F6C]`}>
              Dearest {guest?.guest_name ? guest.guest_name : "Honoured Guest"},
            </p>
            <p className="font-cormorant text-lg sm:text-xl leading-8 mt-3 text-[#0D1B3E]/90 first-letter:float-left first-letter:text-5xl first-letter:leading-[0.85] first-letter:mr-0.5 first-letter:font-semibold first-letter:text-[#D4AF37]">
              {letter}
            </p>
            <div className="mt-6 pt-2 border-t border-[#D4AF37]/30 text-right">
              <p className="font-cormorant italic text-sm text-[#0D1B3E]/70">With our deepest love &amp; gratitude,</p>
              <p className={`${script.className} text-2xl sm:text-3xl text-[#1A2F6C] mt-1`}>
                {wedding.groom_name} &amp; {wedding.bride_name}
              </p>
            </div>
          </div>
        </div>

        {/* ── 4. Wedding Agenda ── */}
        <Card className="px-5 sm:px-7 py-7 relative overflow-hidden">
          {/* Subtle Corner Accents */}
          <div className="absolute top-2.5 left-2.5 text-[#D4AF37]/45 text-xs select-none">✦</div>
          <div className="absolute top-2.5 right-2.5 text-[#D4AF37]/45 text-xs select-none">✦</div>
          <div className="absolute bottom-2.5 left-2.5 text-[#D4AF37]/45 text-xs select-none">✦</div>
          <div className="absolute bottom-2.5 right-2.5 text-[#D4AF37]/45 text-xs select-none">✦</div>

          <div className="text-center mb-6">
            <SectionTitle>ORDER OF EVENTS</SectionTitle>
            <h2 className="font-cormorant text-2xl sm:text-3xl font-semibold text-[#1A2F6C] mt-1">
              Wedding Day Agenda
            </h2>
            <Diamond withLines className="mt-2.5 opacity-85" />
            <p className="font-cormorant italic text-sm sm:text-base text-[#0D1B3E]/70 mt-2">
              Join us throughout our special day for moments of joy and celebration
            </p>
          </div>

          {/* Timeline Items */}
          <div className="relative pl-6 sm:pl-8 space-y-5 sm:space-y-6 before:absolute before:left-2.5 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-linear-to-b before:from-[#D4AF37] before:via-[#FFD700] before:to-[#D4AF37]/30">
            {agendaItems.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Node icon */}
                <span className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-[#FFFFFF] border-2 border-[#D4AF37] flex items-center justify-center text-[10px] text-[#1A2F6C] font-bold shadow-xs transition-transform group-hover:scale-110">
                  ✦
                </span>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                  <span className={`${cinzel.className} text-[11px] sm:text-xs font-bold text-[#D4AF37] tracking-wider uppercase bg-[#FFFFFF] px-2.5 py-0.5 rounded border border-[#D4AF37]/40 shadow-2xs self-start sm:self-auto`}>
                    {item.time}
                  </span>
                  <h3 className="font-cormorant text-lg sm:text-xl font-bold text-[#1A2F6C]">
                    {item.title}
                  </h3>
                </div>
                <p className="font-cormorant text-sm sm:text-base text-[#0D1B3E]/80 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* ── 5. Venue Ticket ── */}
        {venueName ? (
          <div className="relative flex bg-[#FFFFFF] border border-[#D4AF37]/35 rounded-2xl shadow-[0_18px_40px_-18px_rgba(26,47,108,0.22)] overflow-hidden">
            {/* Ticket Stub (Left) */}
            <div className="w-14 sm:w-16 shrink-0 bg-[#1A2F6C] flex flex-col items-center justify-between py-5 border-r-2 border-dashed border-[#D4AF37]/40 relative">
              {/* Perforation Cutouts */}
              <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#FFFFFF] border border-[#D4AF37]/35 z-10" />
              <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-[#FFFFFF] border border-[#D4AF37]/35 z-10" />

              <span
                className={`${cinzel.className} text-[11px] tracking-[0.28em] text-[#F9F9F6] font-bold`}
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                ADMIT ONE
              </span>
              <span className="w-6 h-8 opacity-40 bg-[repeating-linear-gradient(90deg,#F9F9F6_0_2px,transparent_2px_4px)] mt-4" />
            </div>

            {/* Ticket Body (Right) */}
            <div className="p-5 sm:p-6 min-w-0 flex-1 flex flex-col justify-between">
              <div>
                <p className={`${cinzel.className} text-[10px] sm:text-[11px] tracking-[0.2em] text-[#D4AF37] font-semibold uppercase`}>
                  WEDDING VENUE
                </p>
                <p className="font-cormorant text-2xl sm:text-3xl font-bold mt-1 text-[#1A2F6C] leading-tight">
                  {venueName}
                </p>
                {venueAddress && (
                  <p className="font-cormorant text-base sm:text-lg text-[#0D1B3E]/80 mt-1 leading-snug">
                    {venueAddress}
                  </p>
                )}
                <p className={`${cinzel.className} text-xs tracking-[0.12em] text-[#D4AF37] mt-3 uppercase font-medium`}>
                  {shortDate}
                </p>
              </div>

              {mapUrl && (
                <div className="mt-4 pt-3 border-t border-[#D4AF37]/25">
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-[#f8df52e1] hover:bg-gold text-[#0D1B3E] font-outfit text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer"
                  >
                    <PinIcon /> OPEN IN MAPS
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Card className="overflow-hidden p-6">
            <EventDetails wedding={wedding} />
          </Card>
        )}

        {/* ── 5. Photo Gallery ── */}
        {(wedding.gallery_image_urls?.length ?? 0) > 0 && (
          <Card className="overflow-hidden p-4 sm:p-6">
            <div className="text-center mb-4">
              <SectionTitle>CAPTURED MOMENTS</SectionTitle>
              <Diamond withLines className="mt-2" />
            </div>
            <div className="ornate-gallery-wrap">
              <PhotoGallery photos={wedding.gallery_image_urls || []} />
            </div>
          </Card>
        )}

        {/* ── 6. RSVP Envelope ── */}
        <div className="relative pt-8">
          <div className="absolute top-0 left-0 right-0 h-14 bg-[#FFFFFF] border border-[#D4AF37]/35 [clip-path:polygon(0_100%,50%_0,100%_100%)] shadow-xs" />
          <Seal initials={initials} className="absolute top-3 left-1/2 -translate-x-1/2 z-20" size="sm" />

          <div className="relative bg-[#FFFFFF]/90 border border-[#D4AF37]/35 rounded-2xl px-3 sm:px-4 pb-4 pt-10 shadow-[0_18px_40px_-18px_rgba(26,47,108,0.22)]">
            <p className={`${cinzel.className} text-center text-xs tracking-[0.2em] text-[#D4AF37] mb-3 font-semibold`}>
              KINDLY RESPOND
            </p>
            <div className={`bg-[#FFFFFF] rounded-xl border border-[#D4AF37]/25 overflow-hidden ${isPreview ? "pointer-events-none opacity-85" : ""}`}>
              <div className="ornate-rsvp-compact">
                <RsvpForm
                  guestId={guest?.id || "mock-guest-id"}
                  guestName={guest?.guest_name || "John Doe"}
                  currentStatus={guest?.rsvp_status || "pending"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 7. Closing Blessing ── */}
        <section className="text-center pb-8 pt-4">
          <Seal initials={initials} className="mx-auto" />
          <p className={`${cinzel.className} text-xs font-semibold tracking-[0.2em] text-[#D4AF37] mt-4`}>
            WITH LOVE &amp; BLESSINGS
          </p>
          <Diamond withLines className="mt-2" />
          <p className="font-cormorant text-lg sm:text-xl leading-relaxed mt-3 px-4 text-[#0D1B3E]/85">
            Your presence on our sacred day is the greatest gift and blessing we could cherish.
          </p>
          <p className={`${script.className} text-5xl sm:text-6xl mt-6 text-[#1A2F6C]`}>
            {wedding.groom_name}
            <span className="text-[#D4AF37] mx-2">&amp;</span>
            {wedding.bride_name}
          </p>

          <div className="mt-8">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-[#f8df52e1] hover:bg-gold text-[#0D1B3E] font-outfit text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer"
            >
              ↑ BACK TO TOP
            </button>
          </div>
        </section>
      </div>

      {/* Scoped CSS for nested components */}
      <style jsx global>{`
        .ornate-rsvp-compact section {
          padding-top: 1.5rem !important;
          padding-bottom: 1.5rem !important;
          padding-left: 1rem !important;
          padding-right: 1rem !important;
          background: transparent !important;
        }
        .ornate-rsvp-compact section p.text-gold {
          display: none !important;
        }
        .ornate-gallery-wrap section {
          padding-top: 0.5rem !important;
          padding-bottom: 0.5rem !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          background: transparent !important;
        }
        .ornate-gallery-wrap section > div > div.text-center {
          display: none !important;
        }
      `}</style>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared Micro Components
// ─────────────────────────────────────────────

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-[#FFFFFF]/95 backdrop-blur-sm border border-[#D4AF37]/35 rounded-2xl shadow-[0_18px_40px_-18px_rgba(26,47,108,0.22)] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`${cinzel.className} text-xs sm:text-sm font-semibold tracking-[0.22em] text-[#D4AF37] uppercase ${className}`}>
      {children}
    </p>
  );
}

function Diamond({ withLines, className = "" }: { withLines?: boolean; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {withLines && <span className="w-10 sm:w-14 h-px bg-linear-to-r from-transparent to-[#D4AF37]/70" />}
      <span className="w-2 h-2 rotate-45 bg-[#D4AF37] shadow-xs" />
      {withLines && <span className="w-10 sm:w-14 h-px bg-linear-to-l from-transparent to-[#D4AF37]/70" />}
    </div>
  );
}

function Seal({ initials, className = "", size = "md" }: { initials: string; className?: string; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "w-10 h-10 text-xs" : "w-16 h-16 text-base";
  return (
    <div
      className={`${dims} ${cinzel.className} rounded-full bg-[#1A2F6C] text-[#F9F9F6] font-bold flex items-center justify-center tracking-widest shadow-[0_6px_16px_rgba(26,47,108,0.35)] ring-2 ring-[#D4AF37] ring-offset-1 ring-offset-[#1A2F6C] outline outline-dashed -outline-offset-4 outline-[#D4AF37]/70 ${className}`}
    >
      {initials}
    </div>
  );
}

function Countdown({ target }: { target: number }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const s = left === null ? 0 : Math.floor(left / 1000);
  const units = [
    { label: "DAYS", value: Math.floor(s / 86400) },
    { label: "HRS", value: Math.floor((s % 86400) / 3600) },
    { label: "MIN", value: Math.floor((s % 3600) / 60) },
    { label: "SEC", value: s % 60 },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3.5 mt-5 max-w-xs sm:max-w-sm mx-auto">
      {units.map((u) => (
        <div key={u.label} className="flex flex-col items-center">
          <div className="aspect-square w-full rounded-2xl bg-[#FFFFFF]/95 border border-[#D4AF37]/35 flex items-center justify-center shadow-sm relative overflow-hidden group">
            <span className={`${cinzel.className} text-xl sm:text-2xl font-bold text-[#1A2F6C]`}>
              {left === null ? "–" : String(u.value).padStart(2, "0")}
            </span>
          </div>
          <span className={`${cinzel.className} text-[9px] sm:text-[10px] tracking-[0.18em] text-[#D4AF37] mt-1.5 font-semibold`}>
            {u.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Intro / Landing Cover Screen
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
        isPreview ? "h-full min-h-full" : "min-h-screen"
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
          className="font-outfit text-xs sm:text-sm uppercase tracking-[0.25em] sm:tracking-[0.3em] text-[#0D1B3E]/80 mb-2 sm:mb-5 opacity-0 animate-fade-in-up font-medium"
          style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
        >
          You are cordially invited
        </p>

        {/* Decorative line */}
        <div
          className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-6 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
        >
          <span className="block w-8 sm:w-16 h-px bg-[#D4AF37]/50" />
          <span className="text-[#D4AF37] text-sm sm:text-lg">✦</span>
          <span className="block w-8 sm:w-16 h-px bg-[#D4AF37]/50" />
        </div>

        {/* Couple Names */}
        <h1
          className="font-cormorant text-3xl sm:text-5xl md:text-7xl font-light text-[#1A2F6C] leading-tight mb-1 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.7s", animationFillMode: "forwards" }}
        >
          {groomName}
        </h1>
        <p
          className="font-cormorant text-xl sm:text-2xl md:text-3xl text-[#D4AF37] italic mb-1 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}
        >
          &amp;
        </p>
        <h1
          className="font-cormorant text-3xl sm:text-5xl md:text-7xl font-light text-[#1A2F6C] leading-tight mb-3 sm:mb-6 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.9s", animationFillMode: "forwards" }}
        >
          {brideName}
        </h1>

        {/* Decorative line */}
        <div
          className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-6 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "1.1s", animationFillMode: "forwards" }}
        >
          <span className="block w-8 sm:w-16 h-px bg-[#D4AF37]/50" />
          <span className="text-[#D4AF37] text-sm sm:text-lg">✦</span>
          <span className="block w-8 sm:w-16 h-px bg-[#D4AF37]/50" />
        </div>

        {/* Date */}
        <p
          className="font-outfit text-sm sm:text-base md:text-lg tracking-wider text-[#0D1B3E]/85 mb-4 sm:mb-8 opacity-0 animate-fade-in-up font-medium"
          style={{ animationDelay: "1.2s", animationFillMode: "forwards" }}
        >
          {formattedDate}
        </p>

        {/* Open Invitation Button */}
        <button
          onClick={onOpen}
          className="opacity-0 animate-fade-in-up inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-[#f8df52e1] hover:bg-gold text-[#0D1B3E] font-outfit text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer"
          style={{ animationDelay: "1.5s", animationFillMode: "forwards" }}
        >
          Open Invitation
        </button>
      </div>
    </section>
  );
}
