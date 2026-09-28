import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://wedding-project-blond.vercel.app")
  ),
  title: "Wedding Invitation",
  description:
    "You are cordially invited to celebrate our special day. View your personalized wedding invitation.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/logo-icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/logo-icon.svg",
  },
  openGraph: {
    title: "Wedding Invitation",
    description: "You are cordially invited to celebrate our special day. View your personalized wedding invitation.",
    images: [
      {
        url: "/default-og.png",
        width: 1200,
        height: 630,
        alt: "Wedding Invitation",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wedding Invitation",
    description: "You are cordially invited to celebrate our special day. View your personalized wedding invitation.",
    images: ["/default-og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FFF8F0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-outfit" suppressHydrationWarning>
        {children}
        <Toaster position="bottom-center" toastOptions={{ style: { maxWidth: '90vw' } }} />
      </body>
    </html>
  );
}
