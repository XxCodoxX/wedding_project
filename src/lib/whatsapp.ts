import type { Wedding, Guest } from "@/lib/supabase";

export const DEFAULT_WHATSAPP_TEMPLATE = `With hearts full of gratitude and joy, we warmly invite you to join us as we celebrate our wedding, a beautiful beginning to our new chapter together.

Your presence and blessings would make this occasion truly memorable, and it would be our greatest honor to celebrate this special day with you.

Please click the link below to view your digital wedding invitation and kindly confirm your attendance by completing the RSVP:

🔗 {link}

We look forward to sharing this joyous celebration with you and creating beautiful memories together.

With love,
{couple_names} 🤍`;

export interface WhatsAppTemplateVariables {
  guest_name?: string;
  link: string;
  couple_names: string;
  wedding_date?: string;
  venue_name?: string;
}

export const TEMPLATE_PLACEHOLDERS = [
  { token: "{link}", label: "Invite Link", desc: "Unique invitation URL" },
  { token: "{guest_name}", label: "Guest Name", desc: "e.g. The Silva Family" },
  { token: "{couple_names}", label: "Couple Names", desc: "e.g. James & Olivia" },
  { token: "{wedding_date}", label: "Wedding Date", desc: "Formatted celebration date" },
  { token: "{venue_name}", label: "Venue Name", desc: "Ceremony & reception venue" },
];

/**
 * Replaces placeholders in the WhatsApp message template with real values.
 */
export function formatWhatsAppMessage({
  template,
  wedding,
  guest,
  inviteUrl,
}: {
  template?: string | null;
  wedding?: Partial<Wedding> | null;
  guest?: Partial<Guest> | null;
  inviteUrl: string;
}): string {
  const effectiveTemplate = template?.trim() || DEFAULT_WHATSAPP_TEMPLATE;

  const coupleNames =
    wedding?.groom_name && wedding?.bride_name
      ? `${wedding.groom_name} & ${wedding.bride_name}`
      : wedding?.groom_name || wedding?.bride_name || "The Newlyweds";

  const guestName = guest?.group_label || guest?.guest_name || "Honoured Guest";

  let formattedDate = "";
  if (wedding?.wedding_date) {
    try {
      formattedDate = new Date(wedding.wedding_date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      formattedDate = wedding.wedding_date;
    }
  }

  const venueName = wedding?.venue_name || "";

  let result = effectiveTemplate
    .replace(/{link}/g, inviteUrl)
    .replace(/{couple_names}/g, coupleNames)
    .replace(/{guest_name}/g, guestName)
    .replace(/{wedding_date}/g, formattedDate)
    .replace(/{venue_name}/g, venueName);

  // If {link} wasn't in the template for some reason, append it automatically
  if (!result.includes(inviteUrl)) {
    result += `\n\n🔗 ${inviteUrl}`;
  }

  return result.trim();
}

/**
 * Everything needed to send one invitation on WhatsApp: the invite URL, the personalised
 * message, and the WhatsApp URL (opens the guest's chat directly when a phone is saved).
 * Browser-only: uses window.location.origin for the invite link.
 */
export function buildWhatsAppInvite({
  code,
  wedding,
  guest,
}: {
  code: string;
  wedding?: Partial<Wedding> | null;
  guest?: Partial<Guest> | null;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = `${origin}/invite/${code}`;
  const message = formatWhatsAppMessage({
    template: wedding?.whatsapp_message_template,
    wedding,
    guest,
    inviteUrl,
  });
  return { inviteUrl, message, waUrl: getWhatsAppShareUrl(message, guest?.phone ?? undefined) };
}

/**
 * Creates an `https://api.whatsapp.com/send` or `https://wa.me` share URL.
 */
export function getWhatsAppShareUrl(text: string, phone?: string): string {
  const encodedText = encodeURIComponent(text);
  if (phone?.trim()) {
    // Strip non-digit characters from phone
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}
