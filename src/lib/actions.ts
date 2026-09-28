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
  const customMessage = (formData.get("custom_message") as string) || null;
  const whatsappTemplate = (formData.get("whatsapp_message_template") as string) || null;
  const rawAgenda = (formData.get("agenda_items") as string) || null;
  let agendaItems: any[] | null = null;
  if (rawAgenda) {
    try {
      agendaItems = JSON.parse(rawAgenda);
    } catch {
      agendaItems = null;
    }
  }

  if (!groomName?.trim() || !brideName?.trim() || !weddingDate || !venueName?.trim() || !venueLocation?.trim() || !templateId?.trim()) {
    return { error: "All required fields must be filled" };
  }

  // Insert wedding first to get ID
  const basePayload = {
    groom_name: groomName.trim(),
    bride_name: brideName.trim(),
    wedding_date: weddingDate,
    venue_name: venueName.trim(),
    venue_location: venueLocation.trim(),
    location_url: locationUrl?.trim() || null,
    template_id: templateId,
  };

  let insertPayload: Record<string, any> = {
    ...basePayload,
    custom_message: customMessage?.trim() || null,
    whatsapp_message_template: whatsappTemplate?.trim() || null,
  };
  if (agendaItems && Array.isArray(agendaItems)) {
    insertPayload.agenda_items = agendaItems;
  }

  let { data: wedding, error: insertError } = await supabase
    .from("weddings")
    .insert(insertPayload)
    .select()
    .single();

  if (insertError && (insertError.code === "PGRST204" || insertError.code === "42703" || insertError.message?.includes("agenda_items"))) {
    if (agendaItems && agendaItems.length > 0) {
      return {
        error: "Database column 'agenda_items' is missing. Please run supabase/08_add_agenda_items_to_weddings.sql in your Supabase SQL Editor.",
      };
    }
    const retry = await supabase
      .from("weddings")
      .insert({ ...basePayload, custom_message: customMessage?.trim() || null })
      .select()
      .single();
    wedding = retry.data;
    insertError = retry.error;
  }

  if (insertError && (insertError.code === "PGRST204" || insertError.code === "42703" || insertError.message?.includes("custom_message"))) {
    if (customMessage?.trim()) {
      return {
        error: "Database column 'custom_message' is missing. Please run supabase/07_add_custom_message_to_weddings.sql in your Supabase SQL Editor.",
      };
    }
    const retry = await supabase.from("weddings").insert(basePayload).select().single();
    wedding = retry.data;
    insertError = retry.error;
  }

  if (insertError && (insertError.code === "PGRST204" || insertError.code === "42703" || insertError.message?.includes("whatsapp_message_template"))) {
    delete insertPayload.whatsapp_message_template;
    const retry = await supabase.from("weddings").insert(insertPayload).select().single();
    wedding = retry.data;
    insertError = retry.error;
  }

  if (insertError || !wedding) {
    return { error: insertError?.message || "Failed to create wedding" };
  }

  const formMainImageUrl = (formData.get("main_image_url") as string) || null;

  // Handle file uploads
  const mainImageUrls = await uploadWeddingPhotos(supabase, wedding.id, formData, "main_image");
  const galleryImageUrls = await uploadWeddingPhotos(supabase, wedding.id, formData, "gallery_images");

  const effectiveMainImageUrl = mainImageUrls.length > 0 ? mainImageUrls[0] : (formMainImageUrl?.trim() || null);

  if (effectiveMainImageUrl || galleryImageUrls.length > 0) {
    const { error: updateError } = await supabase
      .from("weddings")
      .update({
        main_image_url: effectiveMainImageUrl,
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
  const customMessage = (formData.get("custom_message") as string) || null;
  const whatsappTemplate = (formData.get("whatsapp_message_template") as string) || null;
  const formMainImageUrl = formData.has("main_image_url") ? (formData.get("main_image_url") as string) : null;
  const rawAgenda = (formData.get("agenda_items") as string) || null;
  let agendaItems: any[] | null = null;
  if (rawAgenda) {
    try {
      agendaItems = JSON.parse(rawAgenda);
    } catch {
      agendaItems = null;
    }
  }
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
  if (formMainImageUrl !== null) {
    mainImageUrl = formMainImageUrl.trim() || null;
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

  const baseUpdate = {
    groom_name: groomName.trim(),
    bride_name: brideName.trim(),
    wedding_date: weddingDate,
    venue_name: venueName.trim(),
    venue_location: venueLocation.trim(),
    location_url: locationUrl?.trim() || null,
    template_id: templateId,
    main_image_url: mainImageUrl,
    gallery_image_urls: allGalleryPhotos,
  };

  let updatePayload: Record<string, any> = {
    ...baseUpdate,
    custom_message: customMessage?.trim() || null,
    whatsapp_message_template: whatsappTemplate?.trim() || null,
  };
  if (agendaItems !== null) {
    updatePayload.agenda_items = agendaItems;
  }

  let { error } = await supabase
    .from("weddings")
    .update(updatePayload)
    .eq("id", weddingId);

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message?.includes("whatsapp_message_template"))) {
    delete updatePayload.whatsapp_message_template;
    const retry = await supabase.from("weddings").update(updatePayload).eq("id", weddingId);
    error = retry.error;
  }

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message?.includes("agenda_items"))) {
    if (agendaItems && agendaItems.length > 0) {
      return {
        error: "Database column 'agenda_items' is missing. Please run supabase/08_add_agenda_items_to_weddings.sql in your Supabase SQL Editor.",
      };
    }
    const retry = await supabase
      .from("weddings")
      .update({ ...baseUpdate, custom_message: customMessage?.trim() || null })
      .eq("id", weddingId);
    error = retry.error;
  }

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message?.includes("custom_message"))) {
    if (customMessage?.trim()) {
      return {
        error: "Database column 'custom_message' is missing. Please run supabase/07_add_custom_message_to_weddings.sql in your Supabase SQL Editor.",
      };
    }
    const retry = await supabase.from("weddings").update(baseUpdate).eq("id", weddingId);
    error = retry.error;
  }

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
  const invitationType = (formData.get("invitation_type") as string) || "individual";
  const groupLabel = (formData.get("group_label") as string) || null;
  const membersJson = (formData.get("members") as string) || null;

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

  // ---------- Individual invitation ----------
  if (invitationType === "individual") {
    const { data: guest, error: insertError } = await supabase
      .from("guests")
      .insert({
        wedding_id: weddingId,
        guest_name: guestName.trim(),
        custom_message: customMessage?.trim() || null,
        invitation_type: "individual",
        group_id: null,
        group_label: null,
        is_primary: true,
      })
      .select()
      .single();

    if (insertError || !guest) {
      return { error: insertError?.message || "Failed to create guest" };
    }

    revalidatePath(`/admin/events/${weddingId}/dashboard`);
    return { success: true, guestId: guest.id };
  }

  // ---------- Couple or Family invitation ----------
  let members: string[] = [];
  if (membersJson) {
    try {
      members = JSON.parse(membersJson);
    } catch {
      return { error: "Invalid members data" };
    }
  }

  if (invitationType === "couple" && members.length !== 2) {
    return { error: "Couple invitation requires exactly 2 members" };
  }
  if (invitationType === "family" && members.length < 2) {
    return { error: "Family invitation requires at least 2 members" };
  }

  // Validate all members have names
  const trimmedMembers = members.map((m) => m.trim()).filter(Boolean);
  if (trimmedMembers.length !== members.length) {
    return { error: "All member names are required" };
  }

  const effectiveGroupLabel = groupLabel?.trim() || guestName.trim();
  const groupId = crypto.randomUUID();

  // Insert all members in one batch
  const memberRows = trimmedMembers.map((memberName, idx) => ({
    wedding_id: weddingId,
    guest_name: memberName,
    custom_message: idx === 0 ? (customMessage?.trim() || null) : null,
    invitation_type: invitationType,
    group_id: groupId,
    group_label: effectiveGroupLabel,
    is_primary: idx === 0,
  }));

  const { data: insertedGuests, error: insertError } = await supabase
    .from("guests")
    .insert(memberRows)
    .select();

  if (insertError || !insertedGuests || insertedGuests.length === 0) {
    return { error: insertError?.message || "Failed to create guest group" };
  }

  const primaryGuest = insertedGuests.find((g: any) => g.is_primary) || insertedGuests[0];

  revalidatePath(`/admin/events/${weddingId}/dashboard`);
  return { success: true, guestId: primaryGuest.id };
}

// ---------- Update Guest ----------
export async function updateGuest(guestId: string, formData: FormData) {
  const supabase = createServerClient();

  const weddingId = formData.get("wedding_id") as string;
  const guestName = formData.get("guest_name") as string;
  const customMessage = (formData.get("custom_message") as string) || null;
  const invitationType = (formData.get("invitation_type") as string) || "individual";
  const groupLabel = (formData.get("group_label") as string) || null;
  const membersJson = (formData.get("members") as string) || null;

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

  // ---------- Individual invitation ----------
  if (invitationType === "individual") {
    // First, get the existing guest to check if it was previously a group
    const { data: existing } = await supabase
      .from("guests")
      .select("group_id")
      .eq("id", guestId)
      .single();

    // If converting from group to individual, delete other group members
    if (existing?.group_id) {
      await supabase
        .from("guests")
        .delete()
        .eq("group_id", existing.group_id)
        .neq("id", guestId);
    }

    const { error: updateError } = await supabase
      .from("guests")
      .update({
        guest_name: guestName.trim(),
        custom_message: customMessage?.trim() || null,
        invitation_type: "individual",
        group_id: null,
        group_label: null,
        is_primary: true,
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

  // ---------- Couple or Family invitation ----------
  let members: { id?: string; name: string }[] = [];
  if (membersJson) {
    try {
      members = JSON.parse(membersJson);
    } catch {
      return { error: "Invalid members data" };
    }
  }

  if (invitationType === "couple" && members.length !== 2) {
    return { error: "Couple invitation requires exactly 2 members" };
  }
  if (invitationType === "family" && members.length < 2) {
    return { error: "Family invitation requires at least 2 members" };
  }

  // Get existing guest to find current group_id
  const { data: existing } = await supabase
    .from("guests")
    .select("group_id")
    .eq("id", guestId)
    .single();

  const effectiveGroupLabel = groupLabel?.trim() || guestName.trim();
  const groupId = existing?.group_id || crypto.randomUUID();

  // Get existing group members
  let existingMemberIds: string[] = [];
  if (existing?.group_id) {
    const { data: existingMembers } = await supabase
      .from("guests")
      .select("id")
      .eq("group_id", existing.group_id);
    existingMemberIds = (existingMembers || []).map((m: any) => m.id);
  }

  // Figure out which members to keep, add, or remove
  const incomingIds = members.filter((m) => m.id).map((m) => m.id as string);
  const toDelete = existingMemberIds.filter((id) => id !== guestId && !incomingIds.includes(id));
  const toInsert = members.filter((m) => !m.id);
  const toUpdate = members.filter((m) => m.id);

  // Delete removed members
  if (toDelete.length > 0) {
    await supabase.from("guests").delete().in("id", toDelete);
  }

  // Update existing members
  for (const member of toUpdate) {
    const isPrimary = member.id === guestId;
    await supabase
      .from("guests")
      .update({
        guest_name: member.name.trim(),
        custom_message: isPrimary ? (customMessage?.trim() || null) : null,
        invitation_type: invitationType,
        group_id: groupId,
        group_label: effectiveGroupLabel,
        is_primary: isPrimary,
      })
      .eq("id", member.id!);
  }

  // Insert new members
  if (toInsert.length > 0 && targetWeddingId) {
    const newRows = toInsert.map((m) => ({
      wedding_id: targetWeddingId!,
      guest_name: m.name.trim(),
      custom_message: null,
      invitation_type: invitationType,
      group_id: groupId,
      group_label: effectiveGroupLabel,
      is_primary: false,
    }));
    await supabase.from("guests").insert(newRows);
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

  // Fetch the guest to find group_id and wedding_id
  const { data: guest } = await supabase
    .from("guests")
    .select("wedding_id, group_id")
    .eq("id", guestId)
    .single();

  if (!targetWeddingId) {
    targetWeddingId = guest?.wedding_id;
  }

  if (targetWeddingId) {
    const hasAccess = await canAccessWedding(targetWeddingId);
    if (!hasAccess) {
      return { error: "Unauthorized: You don't have access to this event" };
    }
  }

  // If this guest is part of a group, delete all group members
  if (guest?.group_id) {
    const { error } = await supabase
      .from("guests")
      .delete()
      .eq("group_id", guest.group_id);

    if (error) {
      return { error: error.message };
    }
  } else {
    // Delete just this individual guest
    const { error } = await supabase.from("guests").delete().eq("id", guestId);

    if (error) {
      return { error: error.message };
    }
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
