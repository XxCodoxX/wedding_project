"use server";

import { createServerClient } from "@/lib/supabase";
import { getUserProfile, canAccessWedding } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ---------- Create Wedding ----------
export async function createWedding(formData: FormData) {
  const profile = await getUserProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Unauthorized: Only admins can create events" };
  }

  const supabase = createServerClient();

  const groomName = formData.get("groom_name") as string;
  const brideName = formData.get("bride_name") as string;
  const weddingDate = formData.get("wedding_date") as string;
  const venueName = formData.get("venue_name") as string;
  const venueLocation = formData.get("venue_location") as string;
  const locationUrl = (formData.get("location_url") as string) || null;
  const templateId = formData.get("template_id") as string;

  if (!groomName?.trim() || !brideName?.trim() || !weddingDate || !venueName?.trim() || !venueLocation?.trim() || !templateId?.trim()) {
    return { error: "All required fields must be filled" };
  }

  // Insert wedding first to get ID
  const { data: wedding, error: insertError } = await supabase
    .from("weddings")
    .insert({
      groom_name: groomName.trim(),
      bride_name: brideName.trim(),
      wedding_date: weddingDate,
      venue_name: venueName.trim(),
      venue_location: venueLocation.trim(),
      location_url: locationUrl?.trim() || null,
      template_id: templateId,
    })
    .select()
    .single();

  if (insertError || !wedding) {
    return { error: insertError?.message || "Failed to create wedding" };
  }

  // Handle file uploads
  const mainImageUrls = await uploadWeddingPhotos(supabase, wedding.id, formData, "main_image");
  const galleryImageUrls = await uploadWeddingPhotos(supabase, wedding.id, formData, "gallery_images");

  if (mainImageUrls.length > 0 || galleryImageUrls.length > 0) {
    const { error: updateError } = await supabase
      .from("weddings")
      .update({
        main_image_url: mainImageUrls.length > 0 ? mainImageUrls[0] : null,
        gallery_image_urls: galleryImageUrls,
      })
      .eq("id", wedding.id);

    if (updateError) {
      console.error("Failed to update wedding images:", updateError);
    }
  }

  revalidatePath("/admin/events");
  return { success: true, weddingId: wedding.id };
}

// ---------- Update Wedding ----------
export async function updateWedding(weddingId: string, formData: FormData) {
  const hasAccess = await canAccessWedding(weddingId);
  if (!hasAccess) {
    return { error: "Unauthorized: You don't have access to this event" };
  }

  const supabase = createServerClient();

  const groomName = formData.get("groom_name") as string;
  const brideName = formData.get("bride_name") as string;
  const weddingDate = formData.get("wedding_date") as string;
  const venueName = formData.get("venue_name") as string;
  const venueLocation = formData.get("venue_location") as string;
  const locationUrl = (formData.get("location_url") as string) || null;
  const templateId = formData.get("template_id") as string;
  const removedMainJson = formData.get("removed_main_image") as string;
  const removedGalleryJson = formData.get("removed_gallery_images") as string;

  if (!groomName?.trim() || !brideName?.trim() || !weddingDate || !venueName?.trim() || !venueLocation?.trim() || !templateId?.trim()) {
    return { error: "All required fields must be filled" };
  }

  // Get existing wedding
  const { data: existing } = await supabase
    .from("weddings")
    .select("main_image_url, gallery_image_urls")
    .eq("id", weddingId)
    .single();

  let mainImageUrl = existing?.main_image_url;
  let galleryImageUrls = existing?.gallery_image_urls || [];

  // Remove deleted photos from storage
  await handleRemovedUrls(supabase, removedMainJson);
  await handleRemovedUrls(supabase, removedGalleryJson);

  if (removedMainJson && JSON.parse(removedMainJson).length > 0) {
    mainImageUrl = null;
  }
  if (removedGalleryJson) {
    const removedUrls = JSON.parse(removedGalleryJson);
    galleryImageUrls = galleryImageUrls.filter((u: string) => !removedUrls.includes(u));
  }

  // Upload new photos
  const newMainUrls = await uploadWeddingPhotos(supabase, weddingId, formData, "main_image");
  const newGalleryUrls = await uploadWeddingPhotos(supabase, weddingId, formData, "gallery_images");

  if (newMainUrls.length > 0) {
    mainImageUrl = newMainUrls[0];
  }
  const allGalleryPhotos = [...galleryImageUrls, ...newGalleryUrls];

  const { error } = await supabase
    .from("weddings")
    .update({
      groom_name: groomName.trim(),
      bride_name: brideName.trim(),
      wedding_date: weddingDate,
      venue_name: venueName.trim(),
      venue_location: venueLocation.trim(),
      location_url: locationUrl?.trim() || null,
      template_id: templateId,
      main_image_url: mainImageUrl,
      gallery_image_urls: allGalleryPhotos,
    })
    .eq("id", weddingId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${weddingId}/edit`);
  return { success: true };
}

// ---------- Delete Wedding ----------
export async function deleteWedding(weddingId: string) {
  const profile = await getUserProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Unauthorized: Only admins can delete events" };
  }

  const supabase = createServerClient();

  // Delete all photos in the wedding's storage folder
  const folderPath = `wedding-${weddingId}`;
  const { data: files } = await supabase.storage
    .from("invite-photos")
    .list(folderPath);

  if (files && files.length > 0) {
    const filePaths = files.map((f) => `${folderPath}/${f.name}`);
    await supabase.storage.from("invite-photos").remove(filePaths);
  }

  // Guests are deleted via ON DELETE CASCADE in the database.
  const { error } = await supabase.from("weddings").delete().eq("id", weddingId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/events");
  return { success: true };
}

// ---------- Create Guest ----------
export async function createGuest(formData: FormData) {
  const weddingId = formData.get("wedding_id") as string;
  const guestName = formData.get("guest_name") as string;
  const customMessage = (formData.get("custom_message") as string) || null;

  if (!weddingId?.trim()) {
    return { error: "Wedding ID is required" };
  }

  const hasAccess = await canAccessWedding(weddingId);
  if (!hasAccess) {
    return { error: "Unauthorized: You don't have access to this event" };
  }

  if (!guestName?.trim()) {
    return { error: "Guest name is required" };
  }

  const supabase = createServerClient();

  // Insert guest row
  const { data: guest, error: insertError } = await supabase
    .from("guests")
    .insert({
      wedding_id: weddingId,
      guest_name: guestName.trim(),
      custom_message: customMessage?.trim() || null,
    })
    .select()
    .single();

  if (insertError || !guest) {
    return { error: insertError?.message || "Failed to create guest" };
  }

  revalidatePath(`/admin/events/${weddingId}/dashboard`);
  return { success: true, guestId: guest.id };
}

// ---------- Update Guest ----------
export async function updateGuest(guestId: string, formData: FormData) {
  const supabase = createServerClient();

  const weddingId = formData.get("wedding_id") as string;
  const guestName = formData.get("guest_name") as string;
  const customMessage = (formData.get("custom_message") as string) || null;

  let targetWeddingId = weddingId;
  if (!targetWeddingId) {
    const { data: guest } = await supabase
      .from("guests")
      .select("wedding_id")
      .eq("id", guestId)
      .single();
    targetWeddingId = guest?.wedding_id;
  }

  if (targetWeddingId) {
    const hasAccess = await canAccessWedding(targetWeddingId);
    if (!hasAccess) {
      return { error: "Unauthorized: You don't have access to this event" };
    }
  }

  if (!guestName?.trim()) {
    return { error: "Guest name is required" };
  }

  // Update guest row
  const { error: updateError } = await supabase
    .from("guests")
    .update({
      guest_name: guestName.trim(),
      custom_message: customMessage?.trim() || null,
    })
    .eq("id", guestId);

  if (updateError) {
    return { error: updateError.message };
  }

  if (targetWeddingId) {
    revalidatePath(`/admin/events/${targetWeddingId}/dashboard`);
    revalidatePath(`/admin/events/${targetWeddingId}/guests/${guestId}/edit`);
  }
  return { success: true, guestId };
}

// ---------- Delete Guest ----------
export async function deleteGuest(guestId: string, weddingId?: string) {
  const supabase = createServerClient();

  let targetWeddingId = weddingId;
  if (!targetWeddingId) {
    const { data: guest } = await supabase
      .from("guests")
      .select("wedding_id")
      .eq("id", guestId)
      .single();
    targetWeddingId = guest?.wedding_id;
  }

  if (targetWeddingId) {
    const hasAccess = await canAccessWedding(targetWeddingId);
    if (!hasAccess) {
      return { error: "Unauthorized: You don't have access to this event" };
    }
  }

  // Delete the guest row
  const { error } = await supabase.from("guests").delete().eq("id", guestId);

  if (error) {
    return { error: error.message };
  }

  if (targetWeddingId) {
    revalidatePath(`/admin/events/${targetWeddingId}/dashboard`);
  }
  return { success: true };
}


// ---------- Helper: Handle Removed URLs ----------
async function handleRemovedUrls(
  supabase: ReturnType<typeof createServerClient>,
  removedUrlsJson: string | undefined
) {
  if (!removedUrlsJson) return;
  try {
    const removedUrls: string[] = JSON.parse(removedUrlsJson);
    for (const url of removedUrls) {
      // Extract the path from the full URL
      const pathMatch = url.match(/invite-photos\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from("invite-photos").remove([pathMatch[1]]);
      }
    }
  } catch {
    console.error("Failed to parse removed URLs");
  }
}


// ---------- Helper: Upload Photos ----------
async function uploadWeddingPhotos(
  supabase: ReturnType<typeof createServerClient>,
  weddingId: string,
  formData: FormData,
  fieldName: string
): Promise<string[]> {
  const photos = formData.getAll(fieldName) as File[];
  const urls: string[] = [];

  for (const photo of photos) {
    if (!photo || photo.size === 0) continue;

    const ext = photo.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `wedding-${weddingId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("invite-photos")
      .upload(path, photo, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(`Failed to upload ${photo.name}:`, uploadError);
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("invite-photos").getPublicUrl(path);

    urls.push(publicUrl);
  }

  return urls;
}
