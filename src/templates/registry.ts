import type { Wedding, Guest } from "@/lib/supabase";

// Metadata only. The template components live in ./components so that admin screens
// importing this list (forms, grids) don't bundle every invitation design.

export interface TemplateProps {
  wedding: Wedding;
  guest?: Guest;
  groupMembers?: Guest[];
  isPreview?: boolean;
  /** Encrypted invite code from the URL; the RSVP API uses it to authorise the response. Absent in previews. */
  inviteCode?: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  requiresMainImage: boolean;
  requiresGallery: boolean;
}

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  {
    id: "classic",
    name: "Classic Elegance",
    description: "A traditional, elegant design with floral accents.",
    requiresMainImage: true,
    requiresGallery: true,
  },
  {
    id: "minimal",
    name: "Minimalist Modern",
    description: "A clean, typography-focused design without gallery clutter.",
    requiresMainImage: true,
    requiresGallery: false,
  },
  {
    id: "ornate",
    name: "Royal Gold",
    description: "A premium white-and-gold design with a rotating mandala ornament intro screen.",
    requiresMainImage: false,
    requiresGallery: false,
  },
];

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.id === id);
}
