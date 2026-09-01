"use client";

import { useState } from "react";
import { deleteWedding } from "@/lib/actions";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function DeleteEventButton({
  weddingId,
  weddingName,
}: {
  weddingId: string;
  weddingName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteWedding(weddingId);
    if (result.error) {
      toast.error(`Failed to delete: ${result.error}`);
      setDeleting(false);
      setConfirming(false);
    } else {
      toast.success("Event deleted successfully");
      router.refresh();
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 rounded-lg bg-admin-danger/10 text-admin-danger hover:bg-admin-danger hover:text-white transition-all text-xs font-medium"
        >
          {deleting ? "Deleting..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="p-2 rounded-lg bg-admin-border/10 text-admin-text-muted hover:bg-admin-border/30 hover:text-admin-text transition-all text-xs font-medium"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-2 rounded-lg text-admin-text-muted hover:text-admin-danger hover:bg-admin-danger/10 transition-all"
      title="Delete Event"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    </button>
  );
}
