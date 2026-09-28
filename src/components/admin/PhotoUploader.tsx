"use client";

import { useState, useRef, useCallback } from "react";

interface PhotoUploaderProps {
  existingPhotos?: string[];
  onPhotosChange: (files: File[], removedUrls: string[]) => void;
}

interface PhotoPreview {
  id: string;
  url: string;
  file?: File;
  isExisting: boolean;
}

export default function PhotoUploader({
  existingPhotos = [],
  onPhotosChange,
}: PhotoUploaderProps) {
  const [previews, setPreviews] = useState<PhotoPreview[]>(
    existingPhotos.map((url, i) => ({
      id: `existing-${i}`,
      url,
      isExisting: true,
    }))
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (fileArray.length === 0) return;

      const newPreviews: PhotoPreview[] = fileArray.map((file) => ({
        id: `new-${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file),
        file,
        isExisting: false,
      }));

      const updatedNewFiles = [...newFiles, ...fileArray];
      setNewFiles(updatedNewFiles);
      setPreviews((prev) => [...prev, ...newPreviews]);
      onPhotosChange(updatedNewFiles, removedUrls);
    },
    [newFiles, removedUrls, onPhotosChange]
  );

  const removePhoto = useCallback(
    (preview: PhotoPreview) => {
      setPreviews((prev) => prev.filter((p) => p.id !== preview.id));

      if (preview.isExisting) {
        const updated = [...removedUrls, preview.url];
        setRemovedUrls(updated);
        onPhotosChange(newFiles, updated);
      } else if (preview.file) {
        const updated = newFiles.filter((f) => f !== preview.file);
        setNewFiles(updated);
        onPhotosChange(updated, removedUrls);
        URL.revokeObjectURL(preview.url);
      }
    },
    [newFiles, removedUrls, onPhotosChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-admin-text-muted">
        Photos
      </label>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragOver
            ? "border-admin-accent bg-admin-accent/5 scale-[1.01]"
            : "border-admin-border hover:border-admin-accent/50 hover:bg-admin-border/10"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />

        <svg
          className={`w-10 h-10 mx-auto mb-3 transition-colors ${
            isDragOver ? "text-admin-accent" : "text-admin-text-muted/40"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
          />
        </svg>

        <p className="text-sm text-admin-text-muted">
          <span className="text-admin-accent font-medium">Click to upload</span>{" "}
          or drag and drop
        </p>
        <p className="text-xs text-admin-text-muted/60 mt-1">
          PNG, JPG, WEBP up to 10MB each
        </p>
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {previews.map((preview) => (
            <div
              key={preview.id}
              className="relative group rounded-xl overflow-hidden aspect-square bg-admin-border/20"
            >
              <img
                src={preview.url}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(preview);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-full bg-admin-danger/90 text-white hover:bg-admin-danger transition-all duration-200 transform scale-75 group-hover:scale-100 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Existing badge */}
              {preview.isExisting && (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-admin-accent/80 text-white text-[10px] font-medium">
                  Saved
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
