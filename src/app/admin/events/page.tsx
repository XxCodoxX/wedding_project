import { createServerClient } from "@/lib/supabase";
import type { Wedding } from "@/lib/supabase";
import { getUserProfile, getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import DeleteEventButton from "./DeleteEventButton";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/admin/login");
  }

  const profile = await getUserProfile();

  if (!profile) {
    return (
      <div className="glass-dark rounded-2xl p-12 text-center max-w-md mx-auto my-12">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-admin-text mb-2">Account Setup Pending</h2>
        <p className="text-admin-text-muted text-sm mb-6">
          Your account is authenticated, but no profile or role has been configured yet.
        </p>
        <Link
          href="/admin/logout"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent-light transition-all"
        >
          Sign Out
        </Link>
      </div>
    );
  }

  const isAdmin = profile.role === "admin";
  const supabase = createServerClient();

  let weddingList: Wedding[] = [];

  if (isAdmin) {
    // Admin sees all events
    const { data: weddings } = await supabase
      .from("weddings")
      .select("*")
      .order("created_at", { ascending: false });
    weddingList = weddings || [];
  } else {
    // Guest user sees only their assigned event
    if (profile.assigned_wedding_id) {
      const { data: wedding } = await supabase
        .from("weddings")
        .select("*")
        .eq("id", profile.assigned_wedding_id)
        .single();
      if (wedding) {
        weddingList = [wedding];
      }
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-admin-text">
            {isAdmin ? "Events (Weddings)" : "My Event"}
          </h1>
          <p className="text-admin-text-muted text-sm mt-1">
            {isAdmin
              ? "Manage your weddings and their guests"
              : "Manage your assigned wedding event"}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/admin/events/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent-light transition-all duration-200 w-full sm:w-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Event
          </Link>
        )}
      </div>

      {weddingList.length === 0 ? (
        <div className="glass-dark rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-lg font-medium text-admin-text mb-2">
            {isAdmin ? "No events yet" : "No event assigned"}
          </h3>
          <p className="text-admin-text-muted text-sm mb-6">
            {isAdmin
              ? "Start by creating a wedding event to start adding guests."
              : "An admin needs to assign you to a wedding event."}
          </p>
          {isAdmin && (
            <Link
              href="/admin/events/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent-light transition-all duration-200"
            >
              Create Your First Event
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {weddingList.map((wedding) => (
            <div key={wedding.id} className="glass-dark rounded-2xl p-6 flex flex-col h-full hover:bg-admin-border/5 transition-colors">
              <div className="flex-1">
                <h3 className="text-xl font-cormorant font-semibold text-admin-text mb-1">
                  {wedding.groom_name} & {wedding.bride_name}
                </h3>
                <p className="text-sm text-admin-text-muted mb-4">
                  {new Date(wedding.wedding_date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <div className="text-sm text-admin-text-muted mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {wedding.venue_name}
                  </div>
                  <div className="pl-6 text-xs">{wedding.venue_location}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 pt-4 border-t border-admin-border/50">
                <Link
                  href={`/admin/events/${wedding.id}/dashboard`}
                  className="flex-1 text-center py-2 rounded-lg bg-admin-accent/10 text-admin-accent hover:bg-admin-accent hover:text-white transition-all text-sm font-medium"
                >
                  Manage Guests
                </Link>
                <Link
                  href={`/admin/events/${wedding.id}/edit`}
                  className="p-2 rounded-lg bg-admin-border/10 text-admin-text-muted hover:bg-admin-border/30 hover:text-admin-text transition-all"
                  title="Edit Event"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </Link>
                {isAdmin && (
                  <DeleteEventButton weddingId={wedding.id} weddingName={`${wedding.groom_name} & ${wedding.bride_name}`} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
