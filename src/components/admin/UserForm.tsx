"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface WeddingOption {
  id: string;
  groom_name: string;
  bride_name: string;
  venue_name?: string;
  wedding_date?: string;
}

interface UserFormProps {
  mode: "create" | "edit";
  profileId?: string;
  initialData?: {
    email: string;
    full_name: string;
    role: string;
    assigned_wedding_id: string | null;
  };
  weddings: WeddingOption[];
  onSubmit: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
}

export default function UserForm({ mode, profileId, initialData, weddings, onSubmit }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(initialData?.role || "guest");
  const [assignedWeddingId, setAssignedWeddingId] = useState(initialData?.assigned_wedding_id || "");
  const [weddingDropdownOpen, setWeddingDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [weddingError, setWeddingError] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Selected wedding object
  const selectedWedding = weddings.find((w) => w.id === assignedWeddingId);

  // Filter weddings by search query
  const filteredWeddings = weddings.filter((w) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const couple = `${w.groom_name} ${w.bride_name}`.toLowerCase();
    const venue = (w.venue_name || "").toLowerCase();
    return couple.includes(q) || venue.includes(q);
  });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setWeddingDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (weddingDropdownOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [weddingDropdownOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (role === "guest" && !assignedWeddingId) {
      setWeddingError(true);
      toast.error("Please select an event to assign to this guest user");
      return;
    }

    setWeddingError(false);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("role", role);
    if (role === "guest") {
      formData.set("assigned_wedding_id", assignedWeddingId);
    } else {
      formData.delete("assigned_wedding_id");
    }

    const result = await onSubmit(formData);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success(mode === "create" ? "User created successfully" : "User updated successfully");
      router.push("/admin/users");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-dark rounded-2xl p-6 sm:p-8 max-w-2xl space-y-6">
      {/* Full Name */}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-admin-text-muted mb-2">
          Full Name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          defaultValue={initialData?.full_name || ""}
          className="w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all"
          placeholder="e.g. John Doe"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-admin-text-muted mb-2">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          disabled={mode === "edit"}
          defaultValue={initialData?.email || ""}
          className="w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="e.g. user@example.com"
        />
        {mode === "edit" && (
          <p className="text-xs text-admin-text-muted mt-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-admin-text-muted/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Email cannot be changed once created
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-admin-text-muted mb-2">
          {mode === "create" ? "Password" : "New Password (leave blank to keep current)"}
        </label>
        <input
          id="password"
          name={mode === "create" ? "password" : "new_password"}
          type="password"
          required={mode === "create"}
          minLength={6}
          className="w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all"
          placeholder={mode === "create" ? "At least 6 characters" : "Enter new password to change"}
        />
      </div>

      {/* Modern Role Selection Cards */}
      <div>
        <label className="block text-sm font-medium text-admin-text-muted mb-3">
          Account Role
        </label>
        <input type="hidden" name="role" value={role} />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Guest Role Card */}
          <div
            onClick={() => {
              setRole("guest");
              setWeddingError(false);
            }}
            className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 relative ${
              role === "guest"
                ? "bg-admin-accent/15 border-admin-accent shadow-md shadow-admin-accent/10"
                : "bg-admin-bg/60 border-admin-border hover:border-admin-border/80 hover:bg-admin-border/10"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
                  role === "guest" ? "bg-admin-accent/25 text-white" : "bg-admin-border/30 text-admin-text-muted"
                }`}>
                  👤
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-admin-text">Guest</h4>
                  <p className="text-xs text-admin-text-muted mt-0.5">Assigned to one specific event</p>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                role === "guest"
                  ? "border-admin-accent bg-admin-accent"
                  : "border-admin-border bg-transparent"
              }`}>
                {role === "guest" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-admin-text-muted/80">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-admin-success" />
              Can edit assigned event & manage its guests
            </div>
          </div>

          {/* Admin Role Card */}
          <div
            onClick={() => {
              setRole("admin");
              setWeddingError(false);
            }}
            className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 relative ${
              role === "admin"
                ? "bg-admin-accent/15 border-admin-accent shadow-md shadow-admin-accent/10"
                : "bg-admin-bg/60 border-admin-border hover:border-admin-border/80 hover:bg-admin-border/10"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
                  role === "admin" ? "bg-admin-accent/25 text-white" : "bg-admin-border/30 text-admin-text-muted"
                }`}>
                  🛡️
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-admin-text">Admin</h4>
                  <p className="text-xs text-admin-text-muted mt-0.5">Full system administrator</p>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                role === "admin"
                  ? "border-admin-accent bg-admin-accent"
                  : "border-admin-border bg-transparent"
              }`}>
                {role === "admin" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-admin-text-muted/80">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-admin-accent-light" />
              Full access to events, templates & user management
            </div>
          </div>
        </div>
      </div>

      {/* Modern Custom Dropdown: Assigned Wedding (only for guest role) */}
      {role === "guest" && (
        <div ref={dropdownRef} className="relative">
          <label className="block text-sm font-medium text-admin-text-muted mb-2">
            Assign Wedding Event <span className="text-admin-danger">*</span>
          </label>
          <input type="hidden" name="assigned_wedding_id" value={assignedWeddingId} />

          {/* Dropdown Trigger Button */}
          <button
            type="button"
            onClick={() => setWeddingDropdownOpen(!weddingDropdownOpen)}
            className={`w-full px-4 py-3 rounded-xl bg-admin-bg border text-left flex items-center justify-between transition-all cursor-pointer ${
              weddingError
                ? "border-admin-danger ring-2 ring-admin-danger/30"
                : weddingDropdownOpen
                ? "border-admin-accent ring-2 ring-admin-accent/30"
                : "border-admin-border hover:border-admin-border/80"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-lg">💍</span>
              {selectedWedding ? (
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-admin-text truncate">
                    {selectedWedding.groom_name} & {selectedWedding.bride_name}
                  </div>
                  {(selectedWedding.venue_name || selectedWedding.wedding_date) && (
                    <div className="text-xs text-admin-text-muted truncate mt-0.5">
                      {selectedWedding.venue_name}
                      {selectedWedding.venue_name && selectedWedding.wedding_date ? " • " : ""}
                      {selectedWedding.wedding_date &&
                        new Date(selectedWedding.wedding_date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-sm text-admin-text-muted/60">Select an event to assign…</span>
              )}
            </div>

            <div className="flex items-center gap-2 pl-3">
              {selectedWedding && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssignedWeddingId("");
                  }}
                  className="p-1 rounded-md text-admin-text-muted hover:text-admin-text hover:bg-admin-border/40 transition-colors"
                  title="Clear selection"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              )}
              <svg
                className={`w-4 h-4 text-admin-text-muted transition-transform duration-200 ${
                  weddingDropdownOpen ? "rotate-180 text-admin-accent" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Dropdown Popover Menu */}
          {weddingDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-admin-card border border-admin-border shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150">
              {/* Search input if more than 3 weddings */}
              {weddings.length > 3 && (
                <div className="p-2 border-b border-admin-border/50 mb-1">
                  <div className="relative">
                    <svg
                      className="w-4 h-4 text-admin-text-muted absolute left-3 top-1/2 -translate-y-1/2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search weddings by couple or venue…"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/60 focus:outline-none focus:border-admin-accent"
                    />
                  </div>
                </div>
              )}

              {/* Options List */}
              <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                {weddings.length === 0 ? (
                  <div className="p-4 text-center text-xs text-admin-text-muted">
                    No wedding events created yet.
                  </div>
                ) : filteredWeddings.length === 0 ? (
                  <div className="p-4 text-center text-xs text-admin-text-muted">
                    No events found matching &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  filteredWeddings.map((w) => {
                    const isSelected = w.id === assignedWeddingId;
                    return (
                      <div
                        key={w.id}
                        onClick={() => {
                          setAssignedWeddingId(w.id);
                          setWeddingDropdownOpen(false);
                          setWeddingError(false);
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? "bg-admin-accent/20 text-admin-accent-light border border-admin-accent/30 font-medium"
                            : "hover:bg-admin-border/30 text-admin-text"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm truncate">
                            {w.groom_name} & {w.bride_name}
                          </div>
                          {(w.venue_name || w.wedding_date) && (
                            <div className="text-xs text-admin-text-muted truncate mt-0.5">
                              {w.venue_name}
                              {w.venue_name && w.wedding_date ? " • " : ""}
                              {w.wedding_date &&
                                new Date(w.wedding_date).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                            </div>
                          )}
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-admin-accent flex items-center justify-center text-white text-xs ml-3">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {weddingError && (
            <p className="text-xs text-admin-danger mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Please select a wedding event to assign to this guest user
            </p>
          )}

          <p className="text-xs text-admin-text-muted mt-1.5">
            This guest user will only have access to view, edit, and manage guests for this event.
          </p>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-admin-border/50">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-admin-accent text-white font-medium hover:bg-admin-accent-light focus:outline-none focus:ring-2 focus:ring-admin-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{mode === "create" ? "Creating User…" : "Saving Changes…"}</span>
            </>
          ) : (
            <span>{mode === "create" ? "Create User" : "Save Changes"}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 rounded-xl bg-admin-border/20 text-admin-text-muted font-medium hover:bg-admin-border/40 hover:text-admin-text transition-all duration-200 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
