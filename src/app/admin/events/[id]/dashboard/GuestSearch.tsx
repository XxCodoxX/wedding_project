"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MAX_SEARCH_LENGTH } from "@/lib/guest-search";

const DEBOUNCE_MS = 300;

/**
 * Search box for the guest table. Writes the query to the URL (?q=…) so the server
 * filters the table, the delivery-filter tabs keep it, and live refreshes preserve it.
 */
export default function GuestSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [value, setValue] = useState(urlQuery);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the box in sync when the URL changes ELSEWHERE (back button, "Clear search" link).
  // URL changes we pushed ourselves are ignored, or they'd overwrite characters typed since.
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  const [pushedQuery, setPushedQuery] = useState(urlQuery);
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    if (urlQuery !== pushedQuery) {
      setValue(urlQuery);
      setPushedQuery(urlQuery);
    }
  }

  const pushQuery = (next: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const params = new URLSearchParams(window.location.search); // latest, not the render-time snapshot
    const trimmed = next.trim();
    setPushedQuery(trimmed);
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const onChange = (next: string) => {
    setValue(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => pushQuery(next), DEBOUNCE_MS);
  };

  const clear = () => {
    setValue("");
    pushQuery("");
    inputRef.current?.focus();
  };

  // "/" focuses the search (like GitHub/Gmail), unless the user is already typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key !== "/" || target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div role="search" className="relative w-full sm:w-80">
      <label htmlFor="guest-search" className="sr-only">Search guests</label>
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input
        ref={inputRef}
        id="guest-search"
        type="search"
        value={value}
        maxLength={MAX_SEARCH_LENGTH}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") pushQuery(value); // search immediately
          if (e.key === "Escape" && value) {
            e.preventDefault();
            clear();
          }
        }}
        placeholder="Search name, member or phone…"
        autoComplete="off"
        spellCheck={false}
        className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-admin-bg border border-admin-border text-sm text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all [&::-webkit-search-cancel-button]:hidden"
      />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {isPending && (
          <svg className="animate-spin h-3.5 w-3.5 text-admin-text-muted" viewBox="0 0 24 24" aria-label="Searching">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {value ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="p-1 rounded-md text-admin-text-muted hover:text-admin-text hover:bg-admin-border/20 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded border border-admin-border text-[10px] text-admin-text-muted font-mono" aria-hidden>
            /
          </kbd>
        )}
      </div>
    </div>
  );
}
