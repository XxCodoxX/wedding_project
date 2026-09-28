import { createServerClient } from "@/lib/supabase";
import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import DeleteUserButton from "./DeleteUserButton";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const profile = await getUserProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/admin/events");
  }

  const supabase = createServerClient();

  const { data: users, error } = await supabase
    .from("user_profiles")
    .select("*, weddings:assigned_wedding_id(id, groom_name, bride_name)")
    .order("created_at", { ascending: false });

  const userList = users || [];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-admin-text">User Management</h1>
          <p className="text-admin-text-muted text-sm mt-1">
            Manage admin and guest user accounts
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent-light transition-all duration-200 w-full sm:w-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add User
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-admin-danger/10 border border-admin-danger/20 text-admin-danger text-sm mb-6">
          Failed to load users: {error.message}
        </div>
      )}

      {userList.length === 0 ? (
        <div className="glass-dark rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-admin-text mb-2">
            No users yet
          </h3>
          <p className="text-admin-text-muted text-sm mb-6">
            Add users and assign them to wedding events.
          </p>
          <Link
            href="/admin/users/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-medium hover:bg-admin-accent-light transition-all duration-200"
          >
            Add Your First User
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="glass-dark rounded-2xl overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-admin-border">
                    <th className="text-left text-xs font-medium text-admin-text-muted uppercase tracking-wider px-6 py-4">
                      User
                    </th>
                    <th className="text-left text-xs font-medium text-admin-text-muted uppercase tracking-wider px-6 py-4">
                      Role
                    </th>
                    <th className="text-left text-xs font-medium text-admin-text-muted uppercase tracking-wider px-6 py-4">
                      Assigned Event
                    </th>
                    <th className="text-left text-xs font-medium text-admin-text-muted uppercase tracking-wider px-6 py-4">
                      Created
                    </th>
                    <th className="text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider px-6 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border/50">
                  {userList.map((user: any) => (
                    <tr key={user.id} className="hover:bg-admin-border/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-admin-text">{user.full_name}</div>
                        <div className="text-xs text-admin-text-muted">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4 text-sm text-admin-text-muted">
                        {user.weddings ? (
                          <span className="text-admin-text">
                            {user.weddings.groom_name} & {user.weddings.bride_name}
                          </span>
                        ) : user.role === "guest" ? (
                          <span className="text-admin-warning text-xs">Not assigned</span>
                        ) : (
                          <span className="text-admin-text-muted text-xs">All events</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-admin-text-muted">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/users/${user.id}/edit`}
                            className="p-2 rounded-lg text-admin-text-muted hover:text-admin-accent hover:bg-admin-accent/10 transition-all"
                            title="Edit User"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </Link>
                          <DeleteUserButton profileId={user.id} userName={user.full_name} authUserId={user.auth_user_id} currentAuthUserId={profile.auth_user_id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {userList.map((user: any) => (
              <div key={user.id} className="glass-dark rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-admin-text">{user.full_name}</div>
                    <div className="text-xs text-admin-text-muted">{user.email}</div>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
                {user.role === "guest" && (
                  <div className="text-xs text-admin-text-muted mb-3">
                    Event: {user.weddings ? (
                      <span className="text-admin-text">{user.weddings.groom_name} & {user.weddings.bride_name}</span>
                    ) : (
                      <span className="text-admin-warning">Not assigned</span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-admin-border/50">
                  <span className="text-xs text-admin-text-muted">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/users/${user.id}/edit`}
                      className="p-2 rounded-lg text-admin-text-muted hover:text-admin-accent hover:bg-admin-accent/10 transition-all"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </Link>
                    <DeleteUserButton profileId={user.id} userName={user.full_name} authUserId={user.auth_user_id} currentAuthUserId={profile.auth_user_id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    admin: {
      label: "Admin",
      classes: "bg-admin-accent/15 text-admin-accent-light border-admin-accent/25",
    },
    guest: {
      label: "Guest",
      classes: "bg-admin-success/15 text-admin-success border-admin-success/25",
    },
  };

  const { label, classes } = config[role] || config.guest;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${classes}`}>
      {label}
    </span>
  );
}
