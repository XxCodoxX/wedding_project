import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Baked in at build time, so the admin can see which commit is live (see AdminShell).
  // Release versions live in git tags / GitHub Releases (semantic-release); Vercel builds before
  // the tag exists, so the commit SHA is what identifies a build. Empty in local dev.
  env: {
    NEXT_PUBLIC_COMMIT_SHA: (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
