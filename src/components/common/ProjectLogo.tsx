"use client";

import { useId } from "react";

interface ProjectLogoProps {
  variant?: "icon" | "full" | "horizontal";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  theme?: "dark" | "light" | "gold";
}

export default function ProjectLogo({
  variant = "full",
  size = "md",
  className = "",
  theme = "dark",
}: ProjectLogoProps) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");

  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  }[size];

  const titleSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-3xl",
  }[size];

  const subtitleSizes = {
    sm: "text-[9px] tracking-[0.2em]",
    md: "text-[10px] tracking-[0.25em]",
    lg: "text-xs tracking-[0.3em]",
    xl: "text-sm tracking-[0.35em]",
  }[size];

  // SVG Icon Element with unique IDs per instance
  const LogoIcon = (
    <div
      className={`relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-sm ${iconSizes}`}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Radiant 24K Gold Gradient */}
          <linearGradient id={`goldGrad-${uid}`} x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF9D2" />
            <stop offset="25%" stopColor="#FFD54F" />
            <stop offset="55%" stopColor="#FFB300" />
            <stop offset="85%" stopColor="#FFA000" />
            <stop offset="100%" stopColor="#FFE082" />
          </linearGradient>

          {/* Brilliant Cut Diamond Gradient */}
          <linearGradient id={`diamondGrad-${uid}`} x1="32" y1="8" x2="32" y2="25" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#E3F2FD" />
            <stop offset="100%" stopColor="#90CAF9" />
          </linearGradient>

          {/* Soft Glow */}
          <filter id={`glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Badge Background */}
        <rect
          width="64"
          height="64"
          rx="16"
          fill={theme === "light" ? "#1B2A4A" : "#131722"}
        />
        <rect
          width="62"
          height="62"
          x="1"
          y="1"
          rx="15"
          fill="none"
          stroke={`url(#goldGrad-${uid})`}
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />

        {/* Left Ring - Brilliant Gold */}
        <circle
          cx="25.5"
          cy="38.5"
          r="13.5"
          stroke={`url(#goldGrad-${uid})`}
          strokeWidth="4.5"
          fill="none"
        />

        {/* Right Ring - Brilliant Gold */}
        <circle
          cx="38.5"
          cy="38.5"
          r="13.5"
          stroke={`url(#goldGrad-${uid})`}
          strokeWidth="4.5"
          fill="none"
        />

        {/* Interlocking Arch Overlap (Left ring over right ring at top intersection) */}
        <path
          d="M 32 25.5 A 13.5 13.5 0 0 1 39 36"
          stroke={`url(#goldGrad-${uid})`}
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Diamond Mount Prongs */}
        <path
          d="M27 20 L32 23 L37 20"
          stroke={`url(#goldGrad-${uid})`}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="32" cy="23.5" r="2" fill={`url(#goldGrad-${uid})`} />

        {/* Brilliant Cut Diamond Facets */}
        <path
          d="M26.5 14 L37.5 14 L42 19 L32 27 L22 19 Z"
          fill={`url(#diamondGrad-${uid})`}
          filter={`url(#glow-${uid})`}
        />
        <path
          d="M26.5 14 L32 19 L37.5 14 M32 19 L32 27 M22 19 L42 19 M26.5 14 L32 27 M37.5 14 L32 27"
          stroke="#FFFFFF"
          strokeWidth="0.8"
          strokeOpacity="0.95"
          fill="none"
        />

        {/* Top Diamond Sparkle Star (✦) */}
        <path
          d="M32 6 L33.4 10.5 L38 11.5 L33.4 12.5 L32 17 L30.6 12.5 L26 11.5 L30.6 10.5 Z"
          fill="#FFFFFF"
          filter={`url(#glow-${uid})`}
        />
        <circle cx="32" cy="11.5" r="1" fill="#FFF9D2" />

        {/* Ambient Corner Sparkles */}
        <path
          d="M48 20 L48.8 22.5 L51 23 L48.8 23.5 L48 26 L47.2 23.5 L45 23 L47.2 22.5 Z"
          fill="#FFD54F"
        />
        <path
          d="M14 26 L14.6 28 L16.5 28.5 L14.6 29 L14 31 L13.4 29 L11.5 28.5 L13.4 28 Z"
          fill="#FFD54F"
          opacity="0.8"
        />
      </svg>
    </div>
  );

  if (variant === "icon") {
    return <div className={`inline-flex items-center ${className}`}>{LogoIcon}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {LogoIcon}
      <div className="flex flex-col text-left">
        <span
          className={`font-cormorant font-bold leading-tight tracking-wide ${
            theme === "light" ? "text-navy" : "text-admin-text"
          } ${titleSizes}`}
        >
          WEDDING
        </span>
        <span
          className={`font-outfit font-semibold uppercase text-gold leading-none mt-0.5 ${subtitleSizes}`}
        >
          Invitations &amp; RSVP
        </span>
      </div>
    </div>
  );
}
