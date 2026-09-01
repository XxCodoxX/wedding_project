import Image from "next/image";

interface RotatingOrnamentProps {
  /** Path to the ornament image (SVG or PNG) in the public folder */
  src?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Size in pixels — controls width & height of the ornament */
  size?: number;
  /** Opacity from 0 to 100 (maps to Tailwind opacity classes) */
  opacity?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A decorative rotating ornament/mandala component.
 *
 * Positioned absolutely and centered horizontally. The top half bleeds
 * off-screen so only the bottom portion is visible — creating an
 * elegant decorative header effect.
 *
 * Uses CSS transform-based rotation (GPU-accelerated) for smooth
 * performance on mobile devices.
 *
 * @example
 * ```tsx
 * <RotatingOrnament size={600} opacity={50} />
 * ```
 */
export default function RotatingOrnament({
  src = "/mandala-pattern.svg",
  alt = "Decorative ornament",
  size = 500,
  opacity = 55,
  className = "",
}: RotatingOrnamentProps) {
  return (
    <div
      className={`absolute left-1/2 z-[1] pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        top: -(size * 0.4),
        marginLeft: -(size / 2),
        opacity: opacity / 100,
      }}
      aria-hidden="true"
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="animate-spin-slow w-full h-full"
        priority={false}
        draggable={false}
      />
    </div>
  );
}
