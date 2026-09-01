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

export const metadata: Metadata = {
  title: "You're Invited! | Wedding Invitation",
  description:
    "You are cordially invited to celebrate our wedding. View your personalized invitation and RSVP.",
};

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

  const typedGuest = guest as Guest & { weddings: Wedding };
  const wedding = typedGuest.weddings;

  const templateDefinition = getTemplateById(wedding.template_id);
  if (!templateDefinition) {
    return <NotFoundPage />;
  }

  const TemplateComponent = templateDefinition.component;

  return (
    <TemplateComponent wedding={wedding} guest={typedGuest} />
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
