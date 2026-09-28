import { Metadata } from "next";
import { decryptGuestId } from "@/lib/crypto";
import { createServerClient } from "@/lib/supabase";
import type { Guest, Wedding } from "@/lib/supabase";
import { getTemplateById } from "@/templates/registry";
import Image from "next/image";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const guestId = decryptGuestId(code);
  if (!guestId) {
    return {
      title: "Wedding Invitation",
      description: "You are cordially invited to celebrate our wedding.",
      openGraph: {
        title: "Wedding Invitation",
        description: "You are cordially invited to celebrate our wedding.",
        images: ["/default-og.png"],
      },
    };
  }

  try {
    const supabase = createServerClient();
    const { data: guest } = await supabase
      .from("guests")
      .select("guest_name, group_label, wedding_id, weddings(*)")
      .eq("id", guestId)
      .single();

    if (guest) {
      let wedding: Partial<Wedding> | null = null;
      if (guest.weddings) {
        const rawWedding = (guest as any).weddings;
        wedding = Array.isArray(rawWedding) ? rawWedding[0] : rawWedding;
      } else if (guest.wedding_id) {
        const { data: directWedding } = await supabase
          .from("weddings")
          .select("*")
          .eq("id", guest.wedding_id)
          .single();
        wedding = directWedding;
      }

      const couple =
        wedding?.groom_name && wedding?.bride_name
          ? `${wedding.groom_name} & ${wedding.bride_name}`
          : wedding?.groom_name || wedding?.bride_name || "Wedding Invitation";

      const guestName = guest.group_label || guest.guest_name;
      const title = `${couple} — Wedding Invitation`;
      const description = guestName
        ? `Specially prepared for ${guestName}. We warmly invite you to join us in celebrating our wedding. Please click to view your invitation and RSVP.`
        : `We warmly invite you to join us in celebrating our wedding. Please click to view your invitation and RSVP.`;

      // Use wedding cover photo if available; otherwise use the luxury gold wedding rings card
      const imageUrl = wedding?.main_image_url || "/default-og.png";

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          images: [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: title,
            },
          ],
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
  } catch (e) {
    console.error("Error generating invite metadata:", e);
  }

  return {
    title: "Wedding Invitation",
    description: "You are cordially invited to celebrate our wedding.",
    openGraph: {
      title: "Wedding Invitation",
      description: "You are cordially invited to celebrate our wedding.",
      images: ["/default-og.png"],
    },
  };
}

export default async function InvitePage({ params }: PageProps) {
  const { code } = await params;

  // Decrypt the invite code
  const guestId = decryptGuestId(code);

  if (!guestId) {
    return <NotFoundPage />;
  }

  // Fetch guest and their associated wedding from database
  const supabase = createServerClient();
  const { data: guest, error } = await supabase
    .from("guests")
    .select("*, weddings(*)")
    .eq("id", guestId)
    .single();

  if (error || !guest || !guest.weddings) {
    return <NotFoundPage />;
  }

  const rawWeddings = (guest as any).weddings;
  const wedding: Wedding = Array.isArray(rawWeddings) ? rawWeddings[0] : rawWeddings;

  if (!wedding) {
    return <NotFoundPage />;
  }

  const typedGuest = guest as Guest;

  // Fetch group members if this is a couple/family invitation
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

  const templateDefinition = getTemplateById(wedding.template_id);
  if (!templateDefinition) {
    return <NotFoundPage />;
  }

  const TemplateComponent = templateDefinition.component;

  return (
    <TemplateComponent
      wedding={wedding}
      guest={typedGuest}
      groupMembers={groupMembers.length > 0 ? groupMembers : undefined}
    />
  );
}

// ---------- Not Found Page ----------
function NotFoundPage() {
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
          Invitation Not Found
        </h1>
        <p className="font-outfit text-navy/60 text-sm leading-relaxed">
          We couldn&apos;t find this invitation. Please check the link you
          received and try again. If you believe this is an error, please
          contact the couple directly.
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
