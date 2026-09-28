"use server";

import { createServerClient } from "@/lib/supabase";
import { createAuthServerClient } from "@/lib/supabase-auth";
import { getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Admin-only: Create a new user with Supabase Auth + user_profiles entry.
 */
export async function createUser(formData: FormData) {
  const currentUser = await getUserProfile();
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Unauthorized: Admin access required" };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const role = formData.get("role") as string;
  const assignedWeddingId = (formData.get("assigned_wedding_id") as string) || null;

  if (!email?.trim() || !password?.trim() || !fullName?.trim()) {
    return { error: "Email, password, and full name are required" };
  }

  if (role !== "admin" && role !== "guest") {
    return { error: "Role must be 'admin' or 'guest'" };
  }

  if (role === "guest" && !assignedWeddingId) {
    return { error: "Please select an event to assign to this guest user" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  // Create user in Supabase Auth using the auth server client
  const supabaseAuth = await createAuthServerClient();
  const supabase = createServerClient();

  // Use service role client to create admin user
  const { createClient } = await import("@supabase/supabase-js");
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: email.trim(),
    password: password.trim(),
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { error: authError?.message || "Failed to create user" };
  }

  // Create profile entry
  const { error: profileError } = await supabase
    .from("user_profiles")
    .insert({
      auth_user_id: authData.user.id,
      email: email.trim(),
      full_name: fullName.trim(),
      role,
      assigned_wedding_id: role === "guest" ? assignedWeddingId : null,
    });

  if (profileError) {
    // Rollback: delete the auth user if profile creation fails
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Admin-only: Update an existing user's profile.
 */
export async function updateUser(profileId: string, formData: FormData) {
  const currentUser = await getUserProfile();
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Unauthorized: Admin access required" };
  }

  const fullName = formData.get("full_name") as string;
  const role = formData.get("role") as string;
  const assignedWeddingId = (formData.get("assigned_wedding_id") as string) || null;
  const newPassword = (formData.get("new_password") as string) || "";

  if (!fullName?.trim()) {
    return { error: "Full name is required" };
  }

  if (role !== "admin" && role !== "guest") {
    return { error: "Role must be 'admin' or 'guest'" };
  }

  if (role === "guest" && !assignedWeddingId) {
    return { error: "Please select an event to assign to this guest user" };
  }

  const supabase = createServerClient();

  // Get the profile to find the auth user id
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("auth_user_id")
    .eq("id", profileId)
    .single();

  if (!profile) {
    return { error: "User not found" };
  }

  // Update profile
  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({
      full_name: fullName.trim(),
      role,
      assigned_wedding_id: role === "guest" ? assignedWeddingId : null,
    })
    .eq("id", profileId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Update password if provided
  if (newPassword.trim()) {
    if (newPassword.length < 6) {
      return { error: "Password must be at least 6 characters" };
    }

    const { createClient } = await import("@supabase/supabase-js");
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: passwordError } = await adminClient.auth.admin.updateUserById(
      profile.auth_user_id,
      { password: newPassword.trim() }
    );

    if (passwordError) {
      return { error: `Profile updated but password change failed: ${passwordError.message}` };
    }
  }

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Admin-only: Delete a user (both profile and auth account).
 */
export async function deleteUser(profileId: string) {
  const currentUser = await getUserProfile();
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Unauthorized: Admin access required" };
  }

  const supabase = createServerClient();

  // Get the profile to find the auth user id
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("auth_user_id")
    .eq("id", profileId)
    .single();

  if (!profile) {
    return { error: "User not found" };
  }

  // Prevent admin from deleting themselves
  if (profile.auth_user_id === currentUser.auth_user_id) {
    return { error: "You cannot delete your own account" };
  }

  // Delete from user_profiles (cascade from auth.users won't work via service role delete)
  const { error: profileError } = await supabase
    .from("user_profiles")
    .delete()
    .eq("id", profileId);

  if (profileError) {
    return { error: profileError.message };
  }

  // Delete from Supabase Auth
  const { createClient } = await import("@supabase/supabase-js");
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  await adminClient.auth.admin.deleteUser(profile.auth_user_id);

  revalidatePath("/admin/users");
  return { success: true };
}
