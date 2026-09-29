"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  /** While true, Escape / backdrop / ✕ are ignored (e.g. an import or save is in flight). */
  busy?: boolean;
  /** Tailwind max-width class for the panel. */
  maxWidth?: string;
  children: ReactNode;
}

/**
 * Admin modal built on the native <dialog> element: focus trap, Escape-to-close,
 * top-layer rendering and screen-reader semantics come from the browser.
 */
export default function AdminModal({
  open,
  onClose,
  title,
  description,
  busy = false,
  maxWidth = "max-w-5xl",
  children,
}: AdminModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Sync the `open` prop with the imperative dialog API.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Lock page scroll while open (native <dialog> doesn't).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const requestClose = () => {
    if (!busy) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault(); // parent owns `open`; route Escape through requestClose
        requestClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) requestClose(); // backdrop click
      }}
      className={`m-auto w-[calc(100%-2rem)] ${maxWidth} max-h-[calc(100dvh-2rem)] p-0 rounded-2xl border border-admin-border bg-admin-bg text-admin-text shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm animate-scale-in`}
    >
      <div className="flex flex-col max-h-[calc(100dvh-2rem)]">
        <header className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-admin-border">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-admin-text">
              {title}
            </h2>
            {description && <p className="text-admin-text-muted text-sm mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={busy}
            aria-label="Close"
            className="p-2 rounded-lg text-admin-text-muted hover:text-admin-text hover:bg-admin-border/20 disabled:opacity-40 transition-all cursor-pointer shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Children mount only while open, so each open starts from a clean state. */}
        <div className="overflow-y-auto px-5 sm:px-6 py-5">{open && children}</div>
      </div>
    </dialog>
  );
}
