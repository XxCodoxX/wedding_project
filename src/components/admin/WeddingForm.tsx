"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import TemplatePreviewModal from "./TemplatePreviewModal";
import PhotoUploader from "./PhotoUploader";
import { TEMPLATE_REGISTRY, TemplateDefinition } from "@/templates/registry";

interface WeddingFormProps {
  mode: "create" | "edit";
  weddingId?: string;
  initialData?: {
    groom_name: string;
    bride_name: string;
    wedding_date: string;
    venue_name: string;
    venue_location: string;
    location_url: string | null;
    template_id: string;
    main_image_url: string | null;
    gallery_image_urls: string[];
  };
  onSubmit: (formData: FormData) => Promise<{ success?: boolean; error?: string; weddingId?: string }>;
}

export default function WeddingForm({
  mode,
  weddingId,
  initialData,
  onSubmit,
}: WeddingFormProps) {
  const [groomName, setGroomName] = useState(initialData?.groom_name || "");
  const [brideName, setBrideName] = useState(initialData?.bride_name || "");
  const [weddingDate, setWeddingDate] = useState(initialData?.wedding_date || "");
  const [venueName, setVenueName] = useState(initialData?.venue_name || "");
  const [venueLocation, setVenueLocation] = useState(initialData?.venue_location || "");
  const [locationUrl, setLocationUrl] = useState(initialData?.location_url || "");
  const [templateId, setTemplateId] = useState(initialData?.template_id || TEMPLATE_REGISTRY[0].id);
  
  const [newMainFile, setNewMainFile] = useState<File | null>(null);
  const [removedMainUrl, setRemovedMainUrl] = useState<string | null>(null);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [removedGalleryUrls, setRemovedGalleryUrls] = useState<string[]>([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  const selectedTemplate = TEMPLATE_REGISTRY.find((t) => t.id === templateId) as TemplateDefinition;

  const handleMainPhotoChange = useCallback(
    (files: File[], removed: string[]) => {
      setNewMainFile(files.length > 0 ? files[files.length - 1] : null);
      if (removed.length > 0) {
        setRemovedMainUrl(removed[removed.length - 1]);
      } else if (files.length > 0) {
        setRemovedMainUrl(initialData?.main_image_url || null);
      }
    },
    [initialData]
  );

  const handleGalleryPhotosChange = useCallback(
    (files: File[], removed: string[]) => {
      setNewGalleryFiles(files);
      setRemovedGalleryUrls(removed);
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("groom_name", groomName);
      formData.set("bride_name", brideName);
      formData.set("wedding_date", weddingDate);
      formData.set("venue_name", venueName);
      formData.set("venue_location", venueLocation);
      formData.set("template_id", templateId);
      if (locationUrl) formData.set("location_url", locationUrl);

      if (selectedTemplate.requiresMainImage) {
        if (newMainFile) {
          formData.append("main_image", newMainFile);
        }
        if (removedMainUrl) {
          formData.set("removed_main_image", JSON.stringify([removedMainUrl]));
        }
      }

      if (selectedTemplate.requiresGallery) {
        for (const file of newGalleryFiles) {
          formData.append("gallery_images", file);
        }
        if (removedGalleryUrls.length > 0) {
          formData.set("removed_gallery_images", JSON.stringify(removedGalleryUrls));
        }
      }

      const result = await onSubmit(formData);

      if (result.error) {
        toast.error(result.error);
        setError(result.error);
      } else if (result.success) {
        toast.success(mode === "create" ? "Event created successfully!" : "Event updated successfully!");
        if (mode === "create") {
          router.push("/admin/events");
        } else {
          router.push(`/admin/events/${weddingId}/dashboard`);
        }
      }
    } catch {
      const errorMsg = "An unexpected error occurred";
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-2xl space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-admin-danger/10 border border-admin-danger/20 text-admin-danger text-sm animate-scale-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-admin-text-muted mb-2">
                Groom Name <span className="text-admin-danger">*</span>
              </label>
              <input
                type="text"
                value={groomName}
                onChange={(e) => setGroomName(e.target.value)}
                required
                placeholder="e.g. James"
                className="w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-admin-text-muted mb-2">
                Bride Name <span className="text-admin-danger">*</span>
              </label>
              <input
                type="text"
                value={brideName}
                onChange={(e) => setBrideName(e.target.value)}
                required
                placeholder="e.g. Sarah"
                className="w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-text-muted mb-2">
              Wedding Date <span className="text-admin-danger">*</span>
            </label>
            <input
              type="date"
              value={weddingDate}
              onChange={(e) => setWeddingDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-text-muted mb-2">
              Venue Name <span className="text-admin-danger">*</span>
            </label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              required
              placeholder="e.g. The Grand Ballroom"
              className="w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-text-muted mb-2">
              Venue Location <span className="text-admin-danger">*</span>
            </label>
            <input
              type="text"
              value={venueLocation}
              onChange={(e) => setVenueLocation(e.target.value)}
              required
              placeholder="e.g. The Ritz-Carlton • New York City"
              className="w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-text-muted mb-2">
              Location URL (Google Maps) <span className="text-admin-text-muted/40">(optional)</span>
            </label>
            <input
              type="url"
              value={locationUrl}
              onChange={(e) => setLocationUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all"
            />
          </div>

          <div className="pt-4 border-t border-admin-border">
            <h3 className="text-lg font-medium text-admin-text mb-4">Design & Media</h3>
            <label className="block text-sm font-medium text-admin-text-muted mb-2">
              Template <span className="text-admin-danger">*</span>
            </label>
            <div className="flex gap-4 items-start mb-6">
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                required
                className="flex-1 px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all appearance-none"
              >
                {TEMPLATE_REGISTRY.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="px-4 py-3 rounded-xl bg-admin-border/30 text-admin-text font-medium hover:bg-admin-border/50 transition-all"
              >
                Preview View
              </button>
            </div>
            {selectedTemplate && (
              <p className="text-xs text-admin-text-muted mb-6">
                {selectedTemplate.description}
              </p>
            )}

            <div className="space-y-6">
              {selectedTemplate.requiresMainImage && (
                <div>
                  <div className="mb-2">
                    <h4 className="text-sm font-medium text-admin-text-muted">Main Couple Photo</h4>
                    <p className="text-xs text-admin-text-muted/60">This image usually appears in the Hero section.</p>
                  </div>
                  <PhotoUploader
                    existingPhotos={initialData?.main_image_url && !removedMainUrl ? [initialData.main_image_url] : []}
                    onPhotosChange={handleMainPhotoChange}
                  />
                </div>
              )}

              {selectedTemplate.requiresGallery && (
                <div>
                  <div className="mb-2">
                    <h4 className="text-sm font-medium text-admin-text-muted">Photo Gallery</h4>
                    <p className="text-xs text-admin-text-muted/60">Upload multiple photos to display in the gallery section.</p>
                  </div>
                  <PhotoUploader
                    existingPhotos={initialData?.gallery_image_urls || []}
                    onPhotosChange={handleGalleryPhotosChange}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-admin-accent text-white font-medium hover:bg-admin-accent-light focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:ring-offset-2 focus:ring-offset-admin-bg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              {loading ? "Saving..." : mode === "create" ? "Create Event" : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/events")}
              className="px-6 py-3 rounded-xl text-admin-text-muted hover:text-admin-text hover:bg-admin-border/20 transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {showPreview && selectedTemplate && (
        <TemplatePreviewModal
          onClose={() => setShowPreview(false)}
          template={selectedTemplate}
          weddingDetails={{
            groomName,
            brideName,
            weddingDate,
            venueName,
            venueLocation,
            locationUrl,
            main_image_url: newMainFile ? URL.createObjectURL(newMainFile) : (initialData?.main_image_url || null),
            gallery_image_urls: initialData?.gallery_image_urls || [],
          }}
        />
      )}
    </>
  );
}
