"use client";

import { useState } from "react";
import SectionLoadingOverlay from "@/components/common/SectionLoadingOverlay";
import PasswordInput from "@/components/common/PasswordInput";
import AuthCard, { authButtonClass, authInputClass } from "@/components/admin/AuthCard";

const MIN_PASSWORD_LENGTH = 6;

/** Reached from the reset email via /auth/confirm, which signs the user in with a recovery session. */
export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // The API signed every session out; sign in again with the new password.
        window.location.href = "/admin/login?reason=password-reset";
        return;
      }
      setError(data.error || "Could not update your password");
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <AuthCard
      subtitle="Choose a New Password"
      overlay={
        <SectionLoadingOverlay isLoading={loading} message="Updating password..." theme="admin" rounded="2xl" />
      }
    >
      {error && (
        <div role="alert" className="mb-6 p-3 rounded-lg bg-admin-danger/10 border border-admin-danger/20 text-admin-danger text-sm text-center animate-scale-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-admin-text-muted mb-2">
            New Password
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={MIN_PASSWORD_LENGTH}
            className={authInputClass}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            autoComplete="new-password"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-admin-text-muted mb-2">
            Confirm New Password
          </label>
          <PasswordInput
            id="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className={authInputClass}
            placeholder="Repeat the new password"
            autoComplete="new-password"
          />
        </div>

        <button type="submit" disabled={loading} className={authButtonClass}>
          Update Password
        </button>
      </form>
    </AuthCard>
  );
}
