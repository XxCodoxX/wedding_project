import Image from "next/image";

interface RotatingOrnamentProps {
  /** Path to the ornament image (SVG or PNG) in the public folder */
  src?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Opacity from 0 to 100 (maps to Tailwind opacity classes) */
  opacity?: number;
  /** Additional CSS classes for sizing and overrides (e.g. w-[150vw] md:w-[600px]) */
  className?: string;
}

/**
 * A decorative rotating ornament/mandala component.
 *
 * Positioned absolutely at the top center. Uses CSS transforms to
 * center it and shift it up so the top 40% bleeds off-screen.
 *
 * Uses CSS transform-based rotation (GPU-accelerated) for smooth
 * performance on mobile devices.
 */
export default function RotatingOrnament({
  src = "/mandala-pattern.svg",
  alt = "Decorative ornament",
  opacity = 55,
  className = "w-150vw md:w-150",
}: RotatingOrnamentProps) {
  return (
    <div
      className={`absolute left-1/2 top-0 -translate-x-1/2 translate-y-[-50%] z-1 pointer-events-none aspect-square ${className}`}
      style={{ opacity: opacity / 100 }}
      aria-hidden="true"
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="animate-spin-slow object-contain"
        priority={false}
        draggable={false}
      />
    </div>
  );
}
