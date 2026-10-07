"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { Wedding } from "@/lib/supabase";
import type { ExistingInvitation } from "@/lib/guest-import";
import type { GuestCategory } from "@/lib/guest-category";
import AdminModal from "@/components/admin/AdminModal";

// Lazy-load: the importer (and its CSV/Excel parsers) only downloads when the modal is opened.
const GuestImport = dynamic(() => import("@/components/admin/GuestImport"), {
  ssr: false,
  loading: () => <div className="h-64 rounded-2xl bg-admin-border/10 animate-pulse" />,
});

interface ImportGuestsButtonProps {
  weddingId: string;
  wedding: Partial<Wedding>;
  existing: ExistingInvitation[];
  categories: Pick<GuestCategory, "id" | "name" | "is_default">[];
}

export default function ImportGuestsButton({ weddingId, wedding, existing, categories }: ImportGuestsButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  // Refresh the guest list behind the modal as soon as invitations are created.
  const handleImported = useCallback(() => router.refresh(), [router]);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-admin-accent/40 text-admin-accent text-sm font-medium hover:bg-admin-accent/10 transition-all duration-200 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        Import CSV / Excel
      </button>

      <AdminModal
        open={open}
        onClose={close}
        busy={busy}
        title="Import Guests"
        description="Upload a CSV or Excel file to create many invitations at once. You'll see a preview before anything is saved."
      >
        <GuestImport
          weddingId={weddingId}
          wedding={wedding}
          existing={existing}
          categories={categories}
          onImported={handleImported}
          onBusyChange={setBusy}
          onClose={close}
        />
      </AdminModal>
    </>
  );
}
