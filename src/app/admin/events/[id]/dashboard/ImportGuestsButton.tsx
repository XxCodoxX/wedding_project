"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { Wedding } from "@/lib/supabase";

// Lazy-load: the importer (and its CSV/Excel parsers) only downloads when the modal is opened.
const GuestImport = dynamic(() => import("@/components/admin/GuestImport"), {
  ssr: false,
  loading: () => <div className="h-64 rounded-2xl bg-admin-border/10 animate-pulse" />,
});

interface ImportGuestsButtonProps {
  weddingId: string;
  wedding: Partial<Wedding>;
  existingNames: string[];
}

export default function ImportGuestsButton({ weddingId, wedding, existingNames }: ImportGuestsButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const openModal = () => {
    setOpen(true);
    dialogRef.current?.showModal();
  };

  const closeModal = useCallback(() => {
    if (busyRef.current) return; // never abandon an import mid-flight
    dialogRef.current?.close();
  }, []);

  const handleBusyChange = useCallback((busy: boolean) => {
    busyRef.current = busy;
  }, []);

  // Refresh the guest list behind the modal as soon as invitations are created.
  const handleImported = useCallback(() => router.refresh(), [router]);

  // Lock page scroll while the modal is open (native <dialog> doesn't do this).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-haspopup="dialog"
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-admin-accent/40 text-admin-accent text-sm font-medium hover:bg-admin-accent/10 transition-all duration-200 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        Import CSV / Excel
      </button>

      {/* Native <dialog>: focus trap, Escape-to-close and top-layer rendering for free. */}
      <dialog
        ref={dialogRef}
        aria-labelledby="import-guests-title"
        onClose={() => setOpen(false)}
        onCancel={(e) => {
          if (busyRef.current) e.preventDefault(); // block Escape while importing
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal(); // backdrop click
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-5xl max-h-[calc(100dvh-2rem)] p-0 rounded-2xl border border-admin-border bg-admin-bg text-admin-text shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm animate-scale-in"
      >
        <div className="flex flex-col max-h-[calc(100dvh-2rem)]">
          <header className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-admin-border">
            <div>
              <h2 id="import-guests-title" className="text-lg font-semibold text-admin-text">
                Import Guests
              </h2>
              <p className="text-admin-text-muted text-sm mt-0.5">
                Upload a CSV or Excel file to create many invitations at once. You&apos;ll see a preview before anything is saved.
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              className="p-2 rounded-lg text-admin-text-muted hover:text-admin-text hover:bg-admin-border/20 transition-all cursor-pointer shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div className="overflow-y-auto px-5 sm:px-6 py-5">
            {/* Mounted only while open, so every open starts from a clean state. */}
            {open && (
              <GuestImport
                weddingId={weddingId}
                wedding={wedding}
                existingNames={existingNames}
                onImported={handleImported}
                onBusyChange={handleBusyChange}
                onClose={closeModal}
              />
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
