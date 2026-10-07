"use client";

import { memo, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Guest, Wedding } from "@/lib/supabase";
import DeleteGuestButton from "./DeleteGuestButton";
import CopyLinkButtonClient from "./CopyLinkButtonClient";
import InviteStatusCell from "./InviteStatusCell";
import GuestSearch from "./GuestSearch";
import RsvpControl from "./RsvpControl";
import StickyFilterBar, { type CompactFilter } from "./StickyFilterBar";
import { matchesSearch, parseSearchQuery } from "@/lib/guest-search";
import { getInviteStatus, parseInviteFilter, type InviteFilter } from "@/lib/invite-tracking";
import { matchesSideFilter, parseSideFilter, sideLabel, type GuestSide, type SideFilter } from "@/lib/guest-side";
import { matchesRsvpFilter, parseRsvpFilter, type RsvpFilter } from "@/lib/rsvp-filter";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, paginate, parsePage, parsePageSize, type PageSize } from "@/lib/pagination";
import GuestPagination from "./GuestPagination";

/** One invitation row (a group, or an individual guest). Built on the server — the invite code needs the secret key. */
export interface GuestGroup {
  type: "individual" | "couple" | "family";
  label: string;
  primaryGuest: Guest;
  members: Guest[];
  inviteCode: string;
}

interface GuestTableProps {
  weddingId: string;
  wedding: Wedding;
  groups: GuestGroup[];
  /** People (not invitations) in the whole list, for the side summary line. */
  totalPeople: number;
}

const statusOf = (g: GuestGroup) => getInviteStatus(g.primaryGuest);
const sideOf = (g: GuestGroup) => g.primaryGuest.guest_side ?? null;
const matchesDelivery = (g: GuestGroup, f: InviteFilter) => f === "all" || statusOf(g) === f;
const matchesSide = (g: GuestGroup, f: SideFilter) => matchesSideFilter(sideOf(g), f);
const matchesRsvp = (g: GuestGroup, f: RsvpFilter) => matchesRsvpFilter(g.members, f);

/** Scroll so the top of the results sits just under the sticky bar — only ever up, never down. */
function scrollResultsUnderBar(results: HTMLElement | null, bar: HTMLElement | null) {
  if (!results || !bar) return;
  // offsetTop/offsetHeight ignore the bar's slide-in transform, so this is right even while it's still hidden.
  const top = window.scrollY + results.getBoundingClientRect().top - (bar.offsetTop + bar.offsetHeight) - 12;
  if (top < window.scrollY) window.scrollTo({ top });
}

/**
 * Filters (search, delivery, side, RSVP) run in the browser against the already-loaded guest list.
 * The URL is still the source of truth (shareable, survives refresh, kept by live updates), but it's
 * updated with the native History API, which Next.js syncs into useSearchParams WITHOUT a server
 * round trip — so switching tabs is instant instead of re-running auth + queries + the loading skeleton.
 */
export default function GuestTable({ weddingId, wedding, groups, totalPeople }: GuestTableProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = parseInviteFilter(searchParams.get("filter") ?? undefined);
  const sideFilter = parseSideFilter(searchParams.get("side") ?? undefined);
  const rsvpFilter = parseRsvpFilter(searchParams.get("rsvp") ?? undefined);
  const urlQuery = parseSearchQuery(searchParams.get("q") ?? undefined);
  // Typing stays responsive on big lists; the table catches up a frame later.
  const query = useDeferredValue(urlQuery);

  // Pre-built search haystacks, so filtering doesn't rebuild them on every keystroke.
  const searchable = useMemo(
    () =>
      groups.map((g) => ({
        group: g,
        inv: { label: g.label, memberNames: g.members.map((m) => m.guest_name), phone: g.primaryGuest.phone },
      })),
    [groups]
  );

  const searchedGroups = useMemo(
    () => (query ? searchable.filter((s) => matchesSearch(s.inv, query)).map((s) => s.group) : groups),
    [searchable, groups, query]
  );

  // Each filter's counts follow the search AND the other filters, so the numbers always add up.
  // Counts are people (guests), not invitations: a family of 4 counts as 4.
  const { visibleGroups, deliveryCounts, sideCounts, rsvpCounts } = useMemo(() => {
    const countBy = <T extends string>(
      tabs: readonly { value: T }[],
      base: GuestGroup[],
      peopleIn: (g: GuestGroup, value: T) => number
    ) =>
      Object.fromEntries(tabs.map((t) => [t.value, base.reduce((n, g) => n + peopleIn(g, t.value), 0)])) as Record<T, number>;

    // Delivery and side belong to the whole invitation, so every member counts.
    const allMembersIf =
      <T,>(matches: (g: GuestGroup, value: T) => boolean) =>
      (g: GuestGroup, value: T) =>
        matches(g, value) ? g.members.length : 0;
    // RSVP is per person: only members with that status count, so a split family isn't counted under both answers.
    const membersWithRsvp = (g: GuestGroup, value: RsvpFilter) =>
      value === "all" ? g.members.length : g.members.filter((m) => m.rsvp_status === value).length;

    // Groups passing every filter except the one being counted.
    const exceptDelivery = searchedGroups.filter((g) => matchesSide(g, sideFilter) && matchesRsvp(g, rsvpFilter));
    const exceptSide = searchedGroups.filter((g) => matchesDelivery(g, filter) && matchesRsvp(g, rsvpFilter));
    const exceptRsvp = searchedGroups.filter((g) => matchesDelivery(g, filter) && matchesSide(g, sideFilter));

    return {
      visibleGroups: exceptRsvp.filter((g) => matchesRsvp(g, rsvpFilter)),
      deliveryCounts: countBy(DELIVERY_TABS, exceptDelivery, allMembersIf(matchesDelivery)),
      sideCounts: countBy(SIDE_TABS, exceptSide, allMembersIf(matchesSide)),
      rsvpCounts: countBy(RSVP_TABS, exceptRsvp, membersWithRsvp),
    };
  }, [searchedGroups, filter, sideFilter, rsvpFilter]);

  // ---------- Pagination (client-side slice of the filtered list) ----------
  const pageSize = parsePageSize(searchParams.get("per"));
  const pageWindow = paginate(visibleGroups.length, parsePage(searchParams.get("page")), pageSize);
  const pageGroups = useMemo(
    () => visibleGroups.slice(pageWindow.start, pageWindow.end),
    [visibleGroups, pageWindow.start, pageWindow.end]
  );

  const peopleBySide = useMemo(() => {
    let groom = 0;
    let bride = 0;
    for (const g of groups) {
      for (const m of g.members) {
        if (m.guest_side === "groom") groom++;
        else if (m.guest_side === "bride") bride++;
      }
    }
    return { groom, bride };
  }, [groups]);
  const peopleWithoutSide = totalPeople - peopleBySide.groom - peopleBySide.bride;

  // ---------- Sticky filter bar ----------
  const hasGuests = groups.length > 0;
  const filterSectionRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  // After filtering from the bar, the results get at least a screen of height so they can always be
  // scrolled up under the bar — even when only a couple of rows match. Filtering from the top resets it.
  const [padResults, setPadResults] = useState(false);
  const scrollPendingRef = useRef(false);

  // The bar shows once the full filter section has scrolled out above the viewport.
  useEffect(() => {
    const section = filterSectionRef.current;
    if (!section) return;
    // -64px = the mobile header the bar sits under (on desktop the bar just appears slightly sooner).
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0)),
      { rootMargin: "-64px 0px 0px 0px" }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [hasGuests]);

  // Filtering or paging from deep in the list: once the new results render, bring their top up under the bar.
  const resultsKey = `${filter}|${sideFilter}|${rsvpFilter}|${urlQuery}|${pageWindow.page}|${pageSize}`;
  useLayoutEffect(() => {
    if (!scrollPendingRef.current) return;
    scrollPendingRef.current = false;
    scrollResultsUnderBar(resultsRef.current, barRef.current);
  }, [resultsKey]);

  const afterBarChange = () => {
    setPadResults(true);
    const urlChanged = new URLSearchParams(window.location.search).toString() !== searchParams.toString();
    if (urlChanged) scrollPendingRef.current = true; // wait for the filtered render
    else scrollResultsUnderBar(resultsRef.current, barRef.current); // e.g. Enter on the same search
  };

  const applyFromBar = (next: { filter?: InviteFilter; side?: SideFilter; rsvp?: RsvpFilter; q?: string }) => {
    window.history.pushState(null, "", hrefFor(next));
    afterBarChange();
  };

  const backToFilters = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    filterSectionRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    // Moving focus out of the bar lets it hide; the main search is the natural next stop.
    document.getElementById("guest-search")?.focus({ preventScroll: true });
  };

  const activeFilterCount = [filter !== "all", sideFilter !== "all", rsvpFilter !== "all", urlQuery !== ""].filter(Boolean).length;

  const compactFilters: CompactFilter[] = [
    {
      label: "Filter by invitation delivery",
      value: filter,
      options: DELIVERY_TABS.map((t) => ({
        value: t.value,
        label: t.value === "all" ? "All invites" : t.label,
        count: deliveryCounts[t.value],
      })),
      onChange: (v) => applyFromBar({ filter: parseInviteFilter(v) }),
    },
    {
      label: "Filter by guest side",
      value: sideFilter,
      options: SIDE_TABS.map((t) => ({
        value: t.value,
        label: t.value === "groom" || t.value === "bride" ? sideLabel(t.value, wedding) : t.label,
        count: sideCounts[t.value],
      })),
      onChange: (v) => applyFromBar({ side: parseSideFilter(v) }),
    },
    {
      label: "Filter by RSVP status",
      value: rsvpFilter,
      options: RSVP_TABS.map((t) => ({ value: t.value, label: t.label, count: rsvpCounts[t.value] })),
      onChange: (v) => applyFromBar({ rsvp: parseRsvpFilter(v) }),
    },
  ];

  const hrefFor = (next: { filter?: InviteFilter; side?: SideFilter; rsvp?: RsvpFilter; q?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    const set = (key: string, value: string, empty: string) =>
      value && value !== empty ? params.set(key, value) : params.delete(key);
    if (next.side !== undefined) set("side", next.side, "all");
    if (next.rsvp !== undefined) set("rsvp", next.rsvp, "all");
    if (next.filter !== undefined) set("filter", next.filter, "all");
    if (next.q !== undefined) set("q", next.q, "");
    // A different filter or search is a different list — start it from page 1.
    params.delete("page");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const hrefForPage = (page: number, per: PageSize = pageSize) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    if (per !== DEFAULT_PAGE_SIZE) params.set("per", String(per));
    else params.delete("per");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const navigateToPage = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    window.history.pushState(null, "", e.currentTarget.href);
    scrollPendingRef.current = true; // the pager sits under the table — bring the new page's top into view
  };

  // Keep the first invitation on screen in view: row 26 at 25/page → page 1 at 50/page.
  const changePageSize = (per: PageSize) => {
    window.history.pushState(null, "", hrefForPage(Math.floor(pageWindow.start / per) + 1, per));
    scrollPendingRef.current = true;
  };

  // Plain clicks update the URL in place; ctrl/cmd/middle-click still open a new tab via the real href.
  const navigate = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    window.history.pushState(null, "", e.currentTarget.href);
    setPadResults(false);
  };

  if (groups.length === 0) {
    return (
      <div className="glass-dark rounded-2xl p-12 text-center">
        <div className="text-5xl mb-4">💌</div>
        <h3 className="text-lg font-medium text-admin-text mb-2">No guests yet</h3>
        <p className="text-admin-text-muted text-sm mb-6">
          Start by adding your first invitation — individual, couple, or family.
        </p>
        <Link
          href={`/admin/events/${weddingId}/guests/new`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent-light transition-all duration-200"
        >
          Add Your First Invitation
        </Link>
      </div>
    );
  }

  return (
    <>
      <StickyFilterBar
        ref={barRef}
        stuck={stuck}
        filters={compactFilters}
        activeCount={activeFilterCount}
        onQueryChange={afterBarChange}
        onClear={() => applyFromBar({ filter: "all", side: "all", rsvp: "all", q: "" })}
        onBackToFilters={backToFilters}
      />

      <div ref={filterSectionRef} className="scroll-mt-20 lg:scroll-mt-8">
        {/* Search + delivery filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-6">
          <nav aria-label="Filter by invitation delivery" className="flex flex-wrap gap-2 order-2 lg:order-1">
            {DELIVERY_TABS.map((tab) => {
              const active = filter === tab.value;
              return (
                <a
                  key={tab.value}
                  href={hrefFor({ filter: tab.value })}
                  onClick={navigate}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm border transition-all ${
                    active
                      ? "border-admin-accent bg-admin-accent/10 text-admin-accent"
                      : "border-admin-border text-admin-text-muted hover:text-admin-text hover:border-admin-accent/40"
                  }`}
                >
                  <span aria-hidden>{tab.icon}</span>
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-md text-xs ${active ? "bg-admin-accent/20" : "bg-admin-border/30"}`}>
                    {deliveryCounts[tab.value]}
                  </span>
                </a>
              );
            })}
          </nav>
          <div className="order-1 lg:order-2">
            <GuestSearch shortcut={!stuck} onQueryChange={() => setPadResults(false)} />
          </div>
        </div>

        {/* Side filter (bride's / groom's side) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 -mt-2">
          <nav aria-label="Filter by guest side" className="flex flex-wrap gap-2">
            {SIDE_TABS.map((tab) => {
              const active = sideFilter === tab.value;
              const label = tab.value === "groom" || tab.value === "bride" ? sideLabel(tab.value, wedding) : tab.label;
              return (
                <a
                  key={tab.value}
                  href={hrefFor({ side: tab.value })}
                  onClick={navigate}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm border transition-all ${
                    active
                      ? tab.activeClasses
                      : "border-admin-border text-admin-text-muted hover:text-admin-text hover:border-admin-accent/40"
                  }`}
                >
                  <span aria-hidden>{tab.icon}</span>
                  {label}
                  <span className={`px-1.5 py-0.5 rounded-md text-xs ${active ? "bg-black/10" : "bg-admin-border/30"}`}>
                    {sideCounts[tab.value]}
                  </span>
                </a>
              );
            })}
          </nav>
          <p className="text-xs text-admin-text-muted">
            People: <span className="text-sky-400 font-medium">{peopleBySide.groom}</span> groom&apos;s side ·{" "}
            <span className="text-pink-400 font-medium">{peopleBySide.bride}</span> bride&apos;s side
            {peopleWithoutSide > 0 && <> · {peopleWithoutSide} not set</>}
          </p>
        </div>

        {/* RSVP filter */}
        <nav aria-label="Filter by RSVP status" className="flex flex-wrap gap-2 mb-6 -mt-2">
          {RSVP_TABS.map((tab) => {
            const active = rsvpFilter === tab.value;
            return (
              <a
                key={tab.value}
                href={hrefFor({ rsvp: tab.value })}
                onClick={navigate}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm border transition-all ${
                  active
                    ? tab.activeClasses
                    : "border-admin-border text-admin-text-muted hover:text-admin-text hover:border-admin-accent/40"
                }`}
              >
                <span aria-hidden>{tab.icon}</span>
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-md text-xs ${active ? "bg-black/10" : "bg-admin-border/30"}`}>
                  {rsvpCounts[tab.value]}
                </span>
              </a>
            );
          })}
        </nav>
      </div>

      <div ref={resultsRef} className={padResults ? "min-h-screen" : undefined}>
        {query && (
          <p className="text-sm text-admin-text-muted -mt-3 mb-4" aria-live="polite">
            {visibleGroups.length} of {groups.length} invitation{groups.length === 1 ? "" : "s"} match &ldquo;{query}&rdquo;
          </p>
        )}

        {visibleGroups.length === 0 ? (
          <div className="glass-dark rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3" aria-hidden>{filter === "not_sent" && !query && sideFilter === "all" && rsvpFilter === "all" ? "🎉" : "🔍"}</div>
            <p className="text-admin-text-muted text-sm">
              {query
                ? <>No invitations match &ldquo;{query}&rdquo;{filter !== "all" || sideFilter !== "all" || rsvpFilter !== "all" ? " in this filter" : ""}.</>
                : filter === "not_sent" && sideFilter === "all" && rsvpFilter === "all"
                  ? "Every invitation has been sent."
                  : "No invitations match this filter."}
            </p>
            {query && (
              <a
                href={hrefFor({ q: "" })}
                onClick={navigate}
                className="inline-block mt-4 text-sm text-admin-accent hover:underline"
              >
                Clear search
              </a>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="glass-dark rounded-2xl overflow-hidden hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-admin-border">
                      {["Guest / Group", "Type", "Side", "RSVP Status", "Invite", "Invite Link", "Created"].map((h) => (
                        <th key={h} className="text-left text-xs font-medium text-admin-text-muted uppercase tracking-wider px-6 py-4">
                          {h}
                        </th>
                      ))}
                      <th className="text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider px-6 py-4">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border/50">
                    {pageGroups.map((group) => (
                      <GuestRow key={group.primaryGuest.id} group={group} wedding={wedding} weddingId={weddingId} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 md:hidden">
              {pageGroups.map((group) => (
                <GuestCard key={group.primaryGuest.id} group={group} wedding={wedding} weddingId={weddingId} />
              ))}
            </div>

            {/* Small lists don't need a pager at all. */}
            {visibleGroups.length > PAGE_SIZES[0] && (
              <GuestPagination
                window={pageWindow}
                total={visibleGroups.length}
                pageSize={pageSize}
                hrefForPage={hrefForPage}
                onNavigate={navigateToPage}
                onPageSizeChange={changePageSize}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

const DELIVERY_TABS: { value: InviteFilter; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "💌" },
  { value: "not_sent", label: "Not sent", icon: "○" },
  { value: "sent", label: "Sent, not opened", icon: "📤" },
  { value: "opened", label: "Opened", icon: "👀" },
];

const SIDE_TABS: { value: SideFilter; label: string; icon: string; activeClasses: string }[] = [
  { value: "all", label: "All sides", icon: "💞", activeClasses: "border-admin-accent bg-admin-accent/10 text-admin-accent" },
  { value: "groom", label: "Groom's side", icon: "🤵", activeClasses: "border-sky-500 bg-sky-500/10 text-sky-400" },
  { value: "bride", label: "Bride's side", icon: "👰", activeClasses: "border-pink-500 bg-pink-500/10 text-pink-400" },
  { value: "unassigned", label: "Not set", icon: "➖", activeClasses: "border-admin-accent bg-admin-accent/10 text-admin-accent" },
];

const RSVP_TABS: { value: RsvpFilter; label: string; icon: string; activeClasses: string }[] = [
  { value: "all", label: "All RSVPs", icon: "📋", activeClasses: "border-admin-accent bg-admin-accent/10 text-admin-accent" },
  { value: "attending", label: "Attending", icon: "✅", activeClasses: "border-admin-success bg-admin-success/10 text-admin-success" },
  { value: "not_attending", label: "Not attending", icon: "❌", activeClasses: "border-admin-danger bg-admin-danger/10 text-admin-danger" },
  { value: "pending", label: "Pending", icon: "⏳", activeClasses: "border-admin-warning bg-admin-warning/10 text-admin-warning" },
];

// ---------- Rows (memoized: switching filters only mounts/unmounts rows, never re-renders kept ones) ----------

interface RowProps {
  group: GuestGroup;
  wedding: Wedding;
  weddingId: string;
}

const GuestRow = memo(function GuestRow({ group, wedding, weddingId }: RowProps) {
  return (
    <tr className="hover:bg-admin-border/10 transition-colors">
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-admin-text">{group.label}</div>
        {group.type !== "individual" && (
          <div className="text-xs text-admin-text-muted mt-1">
            <MemberList members={group.members} />
          </div>
        )}
        {group.primaryGuest.custom_message && group.type === "individual" && (
          <div className="text-xs text-admin-text-muted truncate max-w-50">{group.primaryGuest.custom_message}</div>
        )}
        <RsvpWish group={group} className="max-w-64" />
      </td>
      <td className="px-6 py-4">
        <TypeBadge type={group.type} count={group.members.length} />
      </td>
      <td className="px-6 py-4">
        <SideBadge side={sideOf(group)} wedding={wedding} />
      </td>
      <td className="px-6 py-4">
        <GroupRsvp group={group} />
      </td>
      <td className="px-6 py-4">
        <InviteStatusCell guest={group.primaryGuest} />
      </td>
      <td className="px-6 py-4">
        <CopyLinkButtonClient code={group.inviteCode} wedding={wedding} guest={group.primaryGuest} />
      </td>
      <td className="px-6 py-4 text-sm text-admin-text-muted">
        {new Date(group.primaryGuest.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <RowActions group={group} weddingId={weddingId} />
        </div>
      </td>
    </tr>
  );
});

const GuestCard = memo(function GuestCard({ group, wedding, weddingId }: RowProps) {
  return (
    <div className="glass-dark rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-sm font-medium text-admin-text truncate">{group.label}</div>
            <TypeBadge type={group.type} count={group.members.length} />
          </div>
          {group.primaryGuest.guest_side && (
            <div className="mb-1">
              <SideBadge side={group.primaryGuest.guest_side} wedding={wedding} />
            </div>
          )}
          {group.type !== "individual" && (
            <div className="text-xs text-admin-text-muted mt-1">
              <MemberList members={group.members} />
            </div>
          )}
          <RsvpWish group={group} />
        </div>
        <GroupRsvp group={group} />
      </div>
      <div className="mb-3">
        <InviteStatusCell guest={group.primaryGuest} />
      </div>
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-admin-border/50">
        <div className="flex items-center gap-2">
          <CopyLinkButtonClient code={group.inviteCode} wedding={wedding} guest={group.primaryGuest} />
          <span className="text-xs text-admin-text-muted">
            {new Date(group.primaryGuest.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <RowActions group={group} weddingId={weddingId} />
        </div>
      </div>
    </div>
  );
});

function RowActions({ group, weddingId }: { group: GuestGroup; weddingId: string }) {
  return (
    <>
      <Link
        href={`/admin/events/${weddingId}/guests/${group.primaryGuest.id}/edit`}
        className="p-2 rounded-lg text-admin-text-muted hover:text-admin-accent hover:bg-admin-accent/10 transition-all"
        title="Edit"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      </Link>
      <DeleteGuestButton guestId={group.primaryGuest.id} guestName={group.label} />
    </>
  );
}

function MemberList({ members }: { members: Guest[] }) {
  return (
    <div className="space-y-0.5">
      {members.map((m) => (
        <div key={m.id} className="flex items-center gap-1.5">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              m.rsvp_status === "attending"
                ? "bg-admin-success"
                : m.rsvp_status === "not_attending"
                  ? "bg-admin-danger"
                  : "bg-admin-warning"
            }`}
          />
          {m.guest_name}
        </div>
      ))}
    </div>
  );
}

/** The wishes the guest wrote with their RSVP (a group shares one message). */
function RsvpWish({ group, className = "" }: { group: GuestGroup; className?: string }) {
  const message = group.members.find((m) => m.rsvp_message)?.rsvp_message;
  if (!message) return null;

  return (
    <blockquote
      title={message}
      className={`mt-1.5 flex gap-1.5 text-xs italic text-admin-text-muted ${className}`}
    >
      <span aria-hidden className="not-italic">💌</span>
      <span className="line-clamp-2 break-words">
        <span className="sr-only">RSVP message: </span>
        {message}
      </span>
    </blockquote>
  );
}

function GroupRsvp({ group }: { group: GuestGroup }) {
  return <RsvpControl members={group.members} isGroup={group.type !== "individual"} />;
}

function TypeBadge({ type, count }: { type: string; count: number }) {
  const config: Record<string, { icon: string; label: string; classes: string }> = {
    individual: {
      icon: "👤",
      label: "Individual",
      classes: "bg-admin-accent/10 text-admin-accent border-admin-accent/20",
    },
    couple: {
      icon: "👫",
      label: "Couple",
      classes: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    family: {
      icon: "👨‍👩‍👧‍👦",
      label: `Family (${count})`,
      classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
  };

  const { icon, label, classes } = config[type] || config.individual;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-medium border ${classes}`}
    >
      <span className="text-xs">{icon}</span> {label}
    </span>
  );
}

function SideBadge({
  side,
  wedding,
}: {
  side: GuestSide | null;
  wedding: Pick<Wedding, "groom_name" | "bride_name">;
}) {
  if (!side) {
    return <span className="text-xs text-admin-text-muted/60">Not set</span>;
  }

  const config: Record<GuestSide, { icon: string; classes: string }> = {
    groom: { icon: "🤵", classes: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
    bride: { icon: "👰", classes: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  };
  const { icon, classes } = config[side];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-medium border whitespace-nowrap ${classes}`}
      title={side === "groom" ? "Groom's side" : "Bride's side"}
    >
      <span className="text-xs" aria-hidden>{icon}</span> {sideLabel(side, wedding)}
    </span>
  );
}
