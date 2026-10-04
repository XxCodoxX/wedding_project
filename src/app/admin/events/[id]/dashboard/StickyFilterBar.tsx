"use client";

import { useState, type Ref } from "react";
import GuestSearch from "./GuestSearch";

export interface CompactFilter {
  /** Accessible name, e.g. "Filter by RSVP status". */
  label: string;
  value: string;
  options: { value: string; label: string; count: number }[];
  onChange: (value: string) => void;
}

interface StickyFilterBarProps {
  ref?: Ref<HTMLDivElement>;
  /** True once the full filter section has scrolled out of view. */
  stuck: boolean;
  filters: CompactFilter[];
  /** Search + filters currently applied, for the "Clear" button. */
  activeCount: number;
  onQueryChange: () => void;
  onClear: () => void;
  onBackToFilters: () => void;
}

/**
 * Slim copy of the guest filters pinned to the top of the screen while the admin is deep in the
 * table, so searching or filtering doesn't mean scrolling back up. The three chip rows become
 * native <select>s (compact, keyboard and mobile friendly); the search box syncs through the URL.
 */
export default function StickyFilterBar({
  ref,
  stuck,
  filters,
  activeCount,
  onQueryChange,
  onClear,
  onBackToFilters,
}: StickyFilterBarProps) {
  // Stay put while the admin is using the bar, even if the filtered list gets short enough
  // to bring the full filters back on screen — otherwise the focused input would vanish.
  const [hasFocus, setHasFocus] = useState(false);
  const visible = stuck || hasFocus;

  return (
    <div
      ref={ref}
      inert={!visible}
      aria-hidden={!visible}
      onFocus={() => setHasFocus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHasFocus(false);
      }}
      className={`fixed top-16 lg:top-0 left-0 lg:left-64 right-0 z-40 border-b border-admin-border bg-admin-bg/90 backdrop-blur-md shadow-lg shadow-black/20 transition-all duration-200 motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-2">
        <GuestSearch
          id="guest-search-compact"
          shortcut={visible}
          onQueryChange={onQueryChange}
          className="flex-1 min-w-0 sm:flex-none sm:w-64"
        />

        <div className="order-last sm:order-0 w-full sm:w-auto grid grid-cols-3 sm:flex gap-2">
          {filters.map((f) => {
            const active = f.value !== f.options[0]?.value;
            return (
              <select
                key={f.label}
                aria-label={f.label}
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                className={`min-w-0 sm:max-w-48 truncate pl-2.5 pr-7 py-2 rounded-xl bg-admin-bg border text-xs sm:text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-admin-accent/50 transition-colors ${
                  active ? "border-admin-accent text-admin-accent" : "border-admin-border text-admin-text-muted hover:text-admin-text"
                }`}
              >
                {f.options.map((o) => (
                  <option key={o.value} value={o.value} className="bg-admin-card text-admin-text">
                    {o.label} ({o.count})
                  </option>
                ))}
              </select>
            );
          })}
        </div>

        <div className="flex items-center gap-1 sm:ml-auto">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs sm:text-sm text-admin-text-muted hover:text-admin-text hover:bg-admin-border/20 cursor-pointer whitespace-nowrap"
            >
              <span className="px-1.5 py-0.5 rounded-md bg-admin-accent/20 text-admin-accent text-xs">{activeCount}</span>
              <span className="hidden sm:inline">{activeCount === 1 ? "filter" : "filters"} ·</span> Clear
            </button>
          )}
          <button
            type="button"
            onClick={onBackToFilters}
            aria-label="Back to all filters"
            title="Back to all filters"
            className="p-2 rounded-xl text-admin-text-muted hover:text-admin-text hover:bg-admin-border/20 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
