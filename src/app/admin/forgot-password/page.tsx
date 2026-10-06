"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SectionLoadingOverlay from "@/components/common/SectionLoadingOverlay";
import AuthCard, { authButtonClass, authInputClass } from "@/components/admin/AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSent(true);
      } else {
        setError(data.error || "Could not send the reset email");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      subtitle="Reset Password"
      overlay={
        <SectionLoadingOverlay
          isLoading={loading}
          message="Sending reset link..."
          theme="admin"
          rounded="2xl"
        />
      }
    >
      {sent ? (
        <div role="status" className="space-y-5 text-center animate-scale-in">
          <p className="text-admin-text">
            If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a link to reset
            your password.
          </p>
          <p className="text-admin-text-muted text-sm">
            Open the link in this browser. It can only be used once and expires after an hour. Check your spam
            folder if it doesn&apos;t arrive in a few minutes.
          </p>
        </div>
      ) : (
        <>
          {!error && (
            <Suspense>
              <InvalidLinkNotice />
            </Suspense>
          )}

          {error && (
            <div role="alert" className="mb-6 p-3 rounded-lg bg-admin-danger/10 border border-admin-danger/20 text-admin-danger text-sm text-center animate-scale-in">
              {error}
            </div>
          )}

          <p className="text-admin-text-muted text-sm text-center mb-6">
            Enter your account email and we&apos;ll send you a link to choose a new password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-admin-text-muted mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={authInputClass}
                placeholder="Enter email"
                autoComplete="email"
                autoFocus
              />
            </div>

            <button type="submit" disabled={loading} className={authButtonClass}>
              Send Reset Link
            </button>
          </form>
        </>
      )}

      <p className="text-center text-sm mt-6">
        <Link href="/admin/login" className="text-admin-accent hover:text-admin-accent-light transition-colors">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}

/** Shown when /auth/confirm rejected the email link (expired, already used, or opened in another browser). */
function InvalidLinkNotice() {
  if (useSearchParams().get("error") !== "invalid-link") return null;

  return (
    <div role="status" className="mb-6 p-3 rounded-lg bg-admin-warning/10 border border-admin-warning/20 text-admin-warning text-sm text-center">
      That reset link is invalid or has expired. Please request a new one.
    </div>
  );
}
