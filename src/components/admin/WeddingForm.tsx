"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import TemplatePreviewModal from "./TemplatePreviewModal";
import PhotoUploader from "./PhotoUploader";
import { TEMPLATE_REGISTRY, TemplateDefinition } from "@/templates/registry";
import type { AgendaItem } from "@/lib/supabase";

const DEFAULT_AGENDA: AgendaItem[] = [
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

// Helper to convert 12-hour formatted time (e.g. "10:30 AM") to 24-hour "HH:mm" for HTML time input
function parseTo24Hour(timeStr: string): string {
  if (!timeStr) return "";
  const trimmed = timeStr.trim();
  const match12 = trimmed.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)?/i);
  if (match12 && match12[3]) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2];
    const modifier = match12[3].toUpperCase();
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }
  const match24 = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)/);
  if (match24) {
    return `${match24[1].padStart(2, "0")}:${match24[2]}`;
  }
  return "";
}

// Helper to format 24-hour "HH:mm" to 12-hour "hh:mm AM/PM"
function formatTo12Hour(time24: string): string {
  if (!time24) return "";
  const parts = time24.split(":");
  if (parts.length < 2) return time24;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return time24;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
}

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
    custom_message?: string | null;
    agenda_items?: AgendaItem[] | null;
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
  const [customMessage, setCustomMessage] = useState(initialData?.custom_message || "");
  const [mainImageUrl, setMainImageUrl] = useState(initialData?.main_image_url || "");
  const [templateId, setTemplateId] = useState(initialData?.template_id || TEMPLATE_REGISTRY[0].id);
  
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(() => {
    if (initialData?.agenda_items && Array.isArray(initialData.agenda_items) && initialData.agenda_items.length > 0) {
      return initialData.agenda_items;
    }
    if (mode === "create") {
      return DEFAULT_AGENDA;
    }
    return [];
  });

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
        setMainImageUrl("");
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

  const handleAgendaChange = (index: number, field: keyof AgendaItem, value: string) => {
    setAgendaItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddAgendaItem = () => {
    setAgendaItems((prev) => [
      ...prev,
      { time: "03:00 PM", title: "New Event", description: "" },
    ]);
  };

  const handleRemoveAgendaItem = (index: number) => {
    setAgendaItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveAgendaItem = (index: number, direction: "up" | "down") => {
    setAgendaItems((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

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
      formData.set("custom_message", customMessage);
      if (mainImageUrl) formData.set("main_image_url", mainImageUrl);
      formData.set("agenda_items", JSON.stringify(agendaItems));

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-admin-text-muted mb-2">
              Invitation Letter / Custom Message <span className="text-admin-text-muted/40">(optional)</span>
            </label>
            <textarea
              rows={4}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Write a heartfelt invitation message or letter to your guests..."
              className="w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all resize-y"
            />
            <p className="text-xs text-admin-text-muted/60 mt-1.5">
              This message appears in the invitation letter section. If an individual guest has their own custom message assigned, their personalized message will take precedence.
            </p>
          </div>

          {/* ── Wedding Agenda Section ── */}
          <div className="pt-4 border-t border-admin-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-lg font-medium text-admin-text">Wedding Day Agenda</h3>
                <p className="text-xs text-admin-text-muted mt-0.5">
                  Set the timeline of events to display on the invitation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAgendaItems(DEFAULT_AGENDA)}
                className="text-xs font-medium text-admin-accent hover:text-admin-accent-light px-3 py-1.5 rounded-lg border border-admin-accent/30 hover:border-admin-accent/50 bg-admin-accent/5 transition-all cursor-pointer self-start sm:self-auto"
              >
                Load Default Schedule
              </button>
            </div>

            <div className="space-y-3">
              {agendaItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-admin-bg border border-admin-border space-y-3 relative group transition-all hover:border-admin-accent/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-admin-accent uppercase tracking-wider">
                      Event #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveAgendaItem(idx, "up")}
                        className="p-1.5 rounded-lg text-admin-text-muted hover:text-admin-text hover:bg-admin-border/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        title="Move Up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={idx === agendaItems.length - 1}
                        onClick={() => handleMoveAgendaItem(idx, "down")}
                        className="p-1.5 rounded-lg text-admin-text-muted hover:text-admin-text hover:bg-admin-border/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        title="Move Down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAgendaItem(idx)}
                        className="p-1.5 rounded-lg text-admin-danger/70 hover:text-admin-danger hover:bg-admin-danger/10 transition-all ml-1 cursor-pointer"
                        title="Remove Event"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-admin-text-muted mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={parseTo24Hour(item.time)}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            handleAgendaChange(idx, "time", formatTo12Hour(val));
                          }
                        }}
                        style={{ colorScheme: "dark" }}
                        className="w-full px-3 py-2 rounded-lg bg-admin-card border border-admin-border text-admin-text text-sm focus:outline-none focus:ring-1 focus:ring-admin-accent cursor-pointer hover:border-admin-accent/70 transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-admin-text-muted mb-1">
                        Event Title
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleAgendaChange(idx, "title", e.target.value)}
                        placeholder="e.g. The Wedding Ceremony"
                        className="w-full px-3 py-2 rounded-lg bg-admin-card border border-admin-border text-admin-text text-sm placeholder-admin-text-muted/50 focus:outline-none focus:ring-1 focus:ring-admin-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-admin-text-muted mb-1">
                      Description <span className="text-admin-text-muted/50">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleAgendaChange(idx, "description", e.target.value)}
                      placeholder="e.g. Sacred marriage rites, exchange of vows & rings"
                      className="w-full px-3 py-2 rounded-lg bg-admin-card border border-admin-border text-admin-text text-sm placeholder-admin-text-muted/50 focus:outline-none focus:ring-1 focus:ring-admin-accent"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddAgendaItem}
                className="w-full py-2.5 rounded-xl border border-dashed border-admin-border hover:border-admin-accent text-admin-text-muted hover:text-admin-accent text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer bg-admin-border/10 hover:bg-admin-accent/5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Add Agenda Item</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-admin-border">
            <h3 className="text-lg font-medium text-admin-text mb-4">Design & Media</h3>
            <label className="block text-sm font-medium text-admin-text-muted mb-2">
              Template <span className="text-admin-danger">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-start mb-6">
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                required
                className="w-full sm:flex-1 px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all appearance-none"
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
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-admin-text-muted">Main Couple Photo</h4>
                    <p className="text-xs text-admin-text-muted/60">Upload an image file or provide a direct image URL.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-admin-text-muted/80 mb-1.5">
                      Photo URL <span className="text-admin-text-muted/40">(optional, or upload file below)</span>
                    </label>
                    <input
                      type="url"
                      value={mainImageUrl}
                      onChange={(e) => setMainImageUrl(e.target.value)}
                      placeholder="https://.../photo.jpg"
                      className="w-full px-4 py-2.5 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all text-sm mb-3"
                    />
                  </div>

                  <PhotoUploader
                    existingPhotos={mainImageUrl && !removedMainUrl ? [mainImageUrl] : (initialData?.main_image_url && !removedMainUrl ? [initialData.main_image_url] : [])}
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-6">
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
            custom_message: customMessage || null,
            agenda_items: agendaItems,
            main_image_url: newMainFile ? URL.createObjectURL(newMainFile) : (mainImageUrl || initialData?.main_image_url || null),
            gallery_image_urls: initialData?.gallery_image_urls || [],
          }}
        />
      )}
    </>
  );
}
