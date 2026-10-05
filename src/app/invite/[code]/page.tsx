import { Metadata } from "next";
import { cache, type ReactNode } from "react";
import { decryptGuestId } from "@/lib/crypto";
import { createServerClient } from "@/lib/supabase";
import type { Guest, Wedding } from "@/lib/supabase";
import { TEMPLATE_COMPONENTS } from "@/templates/components";
import Image from "next/image";
import { after } from "next/server";
import { cookies, headers } from "next/headers";
import { hasAdminSessionCookie, isLinkPreviewBot, isPrefetchRequest } from "@/lib/invite-tracking";
import { isInviteExpired } from "@/lib/invite-expiry";

interface PageProps {
  params: Promise<{ code: string }>;
}

interface InviteData {
  guest: Guest;
  wedding: Wedding;
  groupMembers: Guest[];
}

/**
 * Load the guest, their wedding and (for couples/families) the group members.
 * Memoized per request, so generateMetadata and the page share one set of queries.
 */
const getInvite = cache(async function getInvite(guestId: string): Promise<InviteData | null> {
  const supabase = createServerClient();
  const { data: guest, error } = await supabase
    .from("guests")
    .select("*, weddings(*)")
    .eq("id", guestId)
    .single();

  if (error || !guest || !guest.weddings) return null;

  const rawWeddings = (guest as { weddings: Wedding | Wedding[] }).weddings;
  const wedding = Array.isArray(rawWeddings) ? rawWeddings[0] : rawWeddings;
  if (!wedding) return null;

  const typedGuest = guest as Guest;
  let groupMembers: Guest[] = [];
  if (typedGuest.group_id) {
    const { data: members } = await supabase
      .from("guests")
      .select("*")
      .eq("group_id", typedGuest.group_id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });
    groupMembers = (members as Guest[]) || [];
  }

  return { guest: typedGuest, wedding, groupMembers };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const guestId = decryptGuestId(code);
  if (!guestId) {
    return {
      title: "Wedding Invitation",
      description: "You are cordially invited to celebrate our wedding.",
    };
  }

  try {
    const invite = await getInvite(guestId);
    if (invite) {
      const { guest, wedding } = invite;
      const couple =
        wedding.groom_name && wedding.bride_name
          ? `${wedding.groom_name} & ${wedding.bride_name}`
          : "Wedding Invitation";
      const guestName = guest.group_label || guest.guest_name;
      const title = `${couple} - Wedding Invitation`;
      const description = `We warmly invite you to join us in celebrating our wedding. Please click to view your invitation and RSVP.`;
      // Couple's cover photo if set, otherwise the branded card. Never leave this empty:
      // page-level openGraph replaces the layout's, and WhatsApp then falls back to the favicon.
      const imageUrl: string = wedding.main_image_url || "/default-og.png";

      return {
        title,
        description,
        openGraph: {
          title,
          description: guestName ? `Specially prepared for ${guestName}. ${description}` : description,
          images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [imageUrl],
        },
      };
    }
  } catch {
    // fallback
  }

  return {
    title: "Wedding Invitation",
    description: "You are cordially invited to celebrate our wedding.",
  };
}

export default async function InvitePage({ params }: PageProps) {
  const { code } = await params;

  // Decrypt the invite code
  const guestId = decryptGuestId(code);

  if (!guestId) {
    return <NotFoundPage />;
  }

  const invite = await getInvite(guestId);
  if (!invite) {
    return <NotFoundPage />;
  }
  const { guest: typedGuest, wedding, groupMembers } = invite;

  // Links close INVITE_GRACE_DAYS after the wedding. Not counted as an open — nothing to track.
  if (isInviteExpired(wedding.wedding_date)) {
    return <InviteEndedPage wedding={wedding} />;
  }

  const TemplateComponent = TEMPLATE_COMPONENTS[wedding.template_id];
  if (!TemplateComponent) {
    return <NotFoundPage />;
  }

  // Record the open AFTER the response is sent, so tracking never slows the invitation down.
  // Request data must be read here — Server Components can't read headers/cookies inside after().
  const [requestHeaders, requestCookies] = await Promise.all([headers(), cookies()]);
  const shouldTrack =
    !isLinkPreviewBot(requestHeaders.get("user-agent")) &&
    !isPrefetchRequest(requestHeaders) &&
    !hasAdminSessionCookie(requestCookies.getAll().map((c) => c.name));

  if (shouldTrack) {
    const supabase = createServerClient();
    after(async () => {
      const { error: trackError } = await supabase.rpc("record_invite_open", { p_guest_id: typedGuest.id });
      // Missing function (migration 12 not run) must never break the invitation — just log.
      if (trackError) console.warn("record_invite_open failed:", trackError.message);
    });
  }

  return (
    <TemplateComponent
      wedding={wedding}
      guest={typedGuest}
      groupMembers={groupMembers.length > 0 ? groupMembers : undefined}
      inviteCode={code}
    />
  );
}

// ---------- Not Found / Ended Pages ----------
function NotFoundPage() {
  return (
    <MessagePage title="Invitation Not Found">
      We couldn&apos;t find this invitation. Please check the link you
      received and try again. If you believe this is an error, please
      contact the couple directly.
    </MessagePage>
  );
}

function InviteEndedPage({ wedding }: { wedding: Wedding }) {
  const couple =
    wedding.groom_name && wedding.bride_name ? `${wedding.groom_name} & ${wedding.bride_name}` : "the couple";
  return (
    <MessagePage title="This Celebration Has Passed">
      Thank you for being part of {couple}&apos;s special day. This invitation
      is no longer active, and RSVPs have closed.
    </MessagePage>
  );
}

function MessagePage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <Image
            src="/wedding-divider.jpg"
            alt="Decorative divider"
            width={200}
            height={45}
            className="opacity-60"
          />
        </div>
        <h1 className="font-cormorant text-4xl text-navy mb-4">
          {title}
        </h1>
        <p className="font-outfit text-navy/60 text-sm leading-relaxed">
          {children}
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className="block w-12 h-px bg-gold/30" />
          <span className="text-gold/40 text-sm">✦</span>
          <span className="block w-12 h-px bg-gold/30" />
        </div>
      </div>
    </main>
  );
}
