import ProjectLogo from "@/components/common/ProjectLogo";

/** Centered card layout shared by the signed-out admin pages (login, forgot/reset password). */
export default function AuthCard({
  subtitle,
  overlay,
  children,
}: {
  subtitle: string;
  /** Rendered inside the card, above the content (e.g. a loading overlay). */
  overlay?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-bg px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-96 sm:h-96 rounded-full bg-admin-accent/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-96 sm:h-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="glass-dark rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {overlay}
          <div className="flex flex-col items-center text-center mb-8">
            <ProjectLogo variant="full" size="lg" className="mb-2" />
            <p className="text-admin-text-muted text-xs tracking-wider uppercase mt-1">{subtitle}</p>
          </div>
          {children}
        </div>

        <p className="text-center text-admin-text-muted/50 text-xs mt-6">
          Protected area • Wedding Invitation Admin
        </p>
      </div>
    </div>
  );
}

export const authInputClass =
  "w-full px-4 py-3 rounded-xl bg-admin-bg border border-admin-border text-admin-text placeholder-admin-text-muted/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:border-admin-accent transition-all";

export const authButtonClass =
  "w-full py-3 px-4 rounded-xl bg-admin-accent text-white font-medium hover:bg-admin-accent-light focus:outline-none focus:ring-2 focus:ring-admin-accent/50 focus:ring-offset-2 focus:ring-offset-admin-bg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer";
