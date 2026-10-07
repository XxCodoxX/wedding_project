"use client";

import { useState, useTransition, type FormEvent } from "react";
import toast from "react-hot-toast";
import { createGuestCategory, updateGuestCategory, deleteGuestCategory } from "@/lib/category-actions";
import { CATEGORY_NAME_MAX, type GuestCategory } from "@/lib/guest-category";

export interface GuestGroupRow extends GuestCategory {
  guestCount: number;
}

const inputClasses =
  "w-full px-4 py-2.5 rounded-xl bg-admin-bg border border-admin-border text-admin-text text-sm placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all";

/** Create, rename and delete guest groups. Each action revalidates the page, so the list refreshes itself. */
export default function GuestGroupManager({ groups }: { groups: GuestGroupRow[] }) {
  const [newName, setNewName] = useState("");
  const [creating, startCreate] = useTransition();
  const defaultGroup = groups.find((g) => g.is_default);

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    startCreate(async () => {
      const result = await createGuestCategory(newName);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Group "${newName.trim()}" added`);
      setNewName("");
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleCreate} className="glass-dark rounded-2xl p-5">
        <label htmlFor="new-group" className="block text-sm font-medium text-admin-text-muted mb-2">
          New group
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="new-group"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={CATEGORY_NAME_MAX}
            required
            placeholder='e.g. "Family", "Office friends"'
            className={inputClasses}
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {creating ? "Adding…" : "Add Group"}
          </button>
        </div>
      </form>

      <div className="glass-dark rounded-2xl overflow-hidden">
        <ul className="divide-y divide-admin-border/50" aria-label="Guest groups">
          {groups.map((group) => (
            <GroupItem key={group.id} group={group} defaultName={defaultGroup?.name ?? "the default group"} />
          ))}
        </ul>
      </div>

      <p className="text-xs text-admin-text-muted">
        <strong className="text-admin-text">{defaultGroup?.name ?? "The default group"}</strong> is used when no group
        is picked and can&apos;t be deleted. Deleting another group moves its guests there.
      </p>
    </div>
  );
}

function GroupItem({ group, defaultName }: { group: GuestGroupRow; defaultName: string }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const cancelEdit = () => {
    setEditing(false);
    setName(group.name);
  };

  const handleRename = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim() === group.name) return cancelEdit();
    startTransition(async () => {
      const result = await updateGuestCategory(group.id, name);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Group renamed");
      setEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteGuestCategory(group.id);
      if ("error" in result) {
        toast.error(result.error);
        setConfirmingDelete(false);
        return;
      }
      toast.success(
        result.moved ? `"${group.name}" deleted — ${result.moved} guest${result.moved === 1 ? "" : "s"} moved to ${defaultName}` : `"${group.name}" deleted`
      );
    });
  };

  if (editing) {
    return (
      <li className="px-5 py-3">
        <form onSubmit={handleRename} className="flex flex-col sm:flex-row gap-2">
          <label htmlFor={`rename-${group.id}`} className="sr-only">
            Group name
          </label>
          <input
            id={`rename-${group.id}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && cancelEdit()}
            maxLength={CATEGORY_NAME_MAX}
            required
            autoFocus
            className={inputClasses}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending || !name.trim()}
              className="px-4 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent-light disabled:opacity-50 transition-all cursor-pointer"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={pending}
              className="px-4 py-2.5 rounded-xl text-admin-text-muted text-sm hover:text-admin-text hover:bg-admin-border/20 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-admin-border/10 transition-colors">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-admin-text truncate">{group.name}</span>
          {group.is_default && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider bg-admin-accent/15 text-admin-accent-light">
              Default
            </span>
          )}
        </div>
        <p className="text-xs text-admin-text-muted">
          {group.guestCount} guest{group.guestCount === 1 ? "" : "s"}
        </p>
      </div>

      {confirmingDelete ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-xs text-admin-text-muted">
            {group.guestCount > 0 ? `Move ${group.guestCount} to ${defaultName} and delete?` : "Delete?"}
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-admin-danger hover:bg-red-600 disabled:opacity-50 transition-all cursor-pointer"
          >
            {pending ? "Deleting…" : "Delete"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            disabled={pending}
            className="px-3 py-1.5 rounded-lg text-xs text-admin-text-muted hover:text-admin-text hover:bg-admin-border/20 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setName(group.name);
              setEditing(true);
            }}
            className="p-2 rounded-lg text-admin-text-muted hover:text-admin-accent hover:bg-admin-accent/10 transition-all cursor-pointer"
            aria-label={`Rename ${group.name}`}
            title="Rename"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
          {!group.is_default && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="p-2 rounded-lg text-admin-text-muted hover:text-admin-danger hover:bg-admin-danger/10 transition-all cursor-pointer"
              aria-label={`Delete ${group.name}`}
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      )}
    </li>
  );
}
