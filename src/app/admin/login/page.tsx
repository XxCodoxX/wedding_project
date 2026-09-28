"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SectionLoadingOverlay from "@/components/common/SectionLoadingOverlay";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.location.href = "/admin/events";
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-bg px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-96 sm:h-96 rounded-full bg-admin-accent/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-96 sm:h-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="glass-dark rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <SectionLoadingOverlay
            isLoading={loading}
            message="Authenticating..."
            submessage="Verifying admin credentials & session"
            theme="admin"
            rounded="2xl"
          />
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-admin-accent/10 mb-4">
              <svg className="w-8 h-8 text-admin-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-admin-text">
              Admin Panel
            </h1>
            <p className="text-admin-text-muted text-sm mt-1">
              Wedding Invitation Manager
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-admin-danger/10 border border-admin-danger/20 text-admin-danger text-sm text-center animate-scale-in">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-admin-text-muted mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all"
                placeholder="Enter email"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-admin-text-muted mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-admin-accent text-white font-medium hover:bg-admin-accent-light focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:ring-offset-2 focus:ring-offset-admin-bg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-admin-text-muted/50 text-xs mt-6">
          Protected area • Wedding Invitation Admin
        </p>
      </div>
    </div>
  );
}
