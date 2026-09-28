"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { UserProfile } from "@/lib/auth";
import ProjectLogo from "@/components/common/ProjectLogo";

interface AdminShellProps {
  children: React.ReactNode;
  initialProfile: UserProfile | null;
}

export default function AdminShell({
  children,
  initialProfile,
}: AdminShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialProfile);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      window.location.href = "/admin/login";
    }
  };

  // Keep state in sync with server-provided profile
  useEffect(() => {
    setUserProfile(initialProfile);
  }, [initialProfile]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // Don't wrap the login page with the sidebar layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const isAdmin = userProfile?.role === "admin";

  const navItems = [
    {
      href: "/admin/events",
      label: "Events",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      ),
      showAlways: true,
    },
    {
      href: "/admin/templates",
      label: "Templates",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
      ),
      showAlways: true,
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      showAlways: false, // admin only
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => item.showAlways || isAdmin
  );

  return (
    <div className="min-h-screen bg-admin-bg flex">
      {/* Mobile Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-admin-bg/95 backdrop-blur-md border-b border-admin-border flex items-center justify-between px-4 py-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl text-admin-text-muted hover:text-admin-text hover:bg-admin-border/30 transition-all"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <Link href="/admin/events" className="hover:opacity-90 transition-opacity">
          <ProjectLogo variant="full" size="sm" />
        </Link>
        <div className="w-10" />
      </div>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar fixed left-0 top-0 z-50 h-full w-64 border-r border-admin-border flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-admin-border flex items-center justify-between">
          <Link href="/admin/events" className="hover:opacity-90 transition-opacity">
            <ProjectLogo variant="full" size="md" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-admin-text-muted hover:text-admin-text hover:bg-admin-border/30 transition-all lg:hidden"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/events" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-admin-accent/15 text-admin-accent-light"
                    : "text-admin-text-muted hover:bg-admin-border/30 hover:text-admin-text"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="p-4 border-t border-admin-border space-y-2">
          {userProfile && (
            <div className="px-4 py-2">
              <p className="text-xs text-admin-text-muted truncate">{userProfile.full_name}</p>
              <p className="text-xs text-admin-text-muted/60 truncate">{userProfile.email}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                isAdmin
                  ? "bg-admin-accent/15 text-admin-accent-light"
                  : "bg-admin-success/15 text-admin-success"
              }`}>
                {userProfile.role}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-admin-text-muted hover:bg-admin-danger/10 hover:text-admin-danger transition-all duration-200 cursor-pointer disabled:opacity-50 text-left"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            {loggingOut ? "Signing out..." : "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
