"use client";

import { useState } from "react";
import { TEMPLATE_REGISTRY, TemplateDefinition } from "@/templates/registry";
import TemplatePreviewModal from "@/components/admin/TemplatePreviewModal";

export default function TemplateGrid() {
  const [previewTemplate, setPreviewTemplate] = useState<TemplateDefinition | null>(null);

  const mockWeddingDetails = {
    groomName: "James",
    brideName: "Sarah",
    weddingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    venueName: "The Grand Plaza",
    venueLocation: "123 Elegance Blvd, New York, NY",
    locationUrl: "https://maps.google.com",
    main_image_url: null,
    gallery_image_urls: [],
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {TEMPLATE_REGISTRY.map((template) => (
          <div
            key={template.id}
            className="group bg-admin-bg rounded-2xl border border-admin-border overflow-hidden hover:shadow-lg hover:border-admin-accent/30 transition-all duration-300 flex flex-col"
          >
            <div className="p-6 flex-1 flex flex-col">
              <button
                onClick={() => setPreviewTemplate(template)}
                className="text-left focus:outline-none"
              >
                <h3 className="text-lg font-semibold text-admin-text mb-2 group-hover:text-admin-accent transition-colors">
                  {template.name}
                  <span className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </span>
                </h3>
              </button>
              <p className="text-admin-text-muted text-sm mb-4 flex-1">
                {template.description}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-admin-border/50">
                {template.requiresMainImage && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-admin-accent/10 text-admin-accent">
                    Supports Main Image
                  </span>
                )}
                {template.requiresGallery && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-admin-accent/10 text-admin-accent">
                    Supports Gallery
                  </span>
                )}
                {!template.requiresMainImage && !template.requiresGallery && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-admin-border/50 text-admin-text-muted">
                    No Images Required
                  </span>
                )}
              </div>
            </div>
            
            <div className="px-6 pb-6 pt-2">
               <button
                  onClick={() => setPreviewTemplate(template)}
                  className="w-full py-2.5 rounded-xl bg-admin-border/30 text-admin-text text-sm font-medium hover:bg-admin-border hover:text-admin-accent transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview Template
               </button>
            </div>
          </div>
        ))}
      </div>

      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          weddingDetails={mockWeddingDetails}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </>
  );
}
