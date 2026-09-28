import ClassicTemplate from "./ClassicTemplate";
import MinimalTemplate from "./MinimalTemplate";
import OrnateTemplate from "./OrnateTemplate";
import type { Wedding, Guest } from "@/lib/supabase";

export interface TemplateProps {
  wedding: Wedding;
  guest?: Guest;
  groupMembers?: Guest[];
  isPreview?: boolean;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  requiresMainImage: boolean;
  requiresGallery: boolean;
  component: React.FC<TemplateProps>;
}

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  {
    id: "classic",
    name: "Classic Elegance",
    description: "A traditional, elegant design with floral accents.",
    requiresMainImage: true,
    requiresGallery: true,
    component: ClassicTemplate,
  },
  {
    id: "minimal",
    name: "Minimalist Modern",
    description: "A clean, typography-focused design without gallery clutter.",
    requiresMainImage: true,
    requiresGallery: false,
    component: MinimalTemplate,
  },
  {
    id: "ornate",
    name: "Royal Gold",
    description: "A premium white-and-gold design with a rotating mandala ornament intro screen.",
    requiresMainImage: false,
    requiresGallery: false,
    component: OrnateTemplate,
  },
];

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.id === id);
}
