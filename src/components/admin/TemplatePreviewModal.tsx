import { useEffect } from "react";
import { TemplateDefinition } from "@/templates/registry";

interface TemplatePreviewModalProps {
  onClose: () => void;
  template: TemplateDefinition;
  weddingDetails: {
    groomName: string;
    brideName: string;
    weddingDate: string;
    venueName: string;
    venueLocation: string;
    locationUrl: string | null;
    main_image_url: string | null;
    gallery_image_urls: string[];
  };
}

export default function TemplatePreviewModal({
  onClose,
  template,
  weddingDetails,
}: TemplatePreviewModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const mockWedding = {
    ...weddingDetails,
    id: "mock-wedding",
    groom_name: weddingDetails.groomName || "Groom",
    bride_name: weddingDetails.brideName || "Bride",
    wedding_date: weddingDetails.weddingDate || new Date().toISOString(),
    venue_name: weddingDetails.venueName || "Venue Name",
    venue_location: weddingDetails.venueLocation || "Venue Location",
    location_url: weddingDetails.locationUrl || null,
    template_id: template.id,
    created_at: new Date().toISOString(),
  };

  const TemplateComponent = template.component;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-cream">
      {/* Top Bar */}
      <div className="bg-admin-bg border-b border-admin-border p-4 flex items-center justify-between shadow-sm z-50">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-admin-accent/10 text-admin-accent text-xs font-medium rounded-full uppercase tracking-wider">
            Preview Mode
          </span>
          <h2 className="text-sm font-medium text-admin-text">
            {template.name} Template
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-admin-border/50 text-admin-text-muted hover:bg-admin-border hover:text-admin-text transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Preview Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <TemplateComponent wedding={mockWedding as any} isPreview={true} />
      </div>
    </div>
  );
}
