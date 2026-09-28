export default function GuestEditLoading() {
  return (
    <div className="animate-fade-in space-y-6 max-w-2xl select-none">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="w-16 h-4 bg-admin-border/40 rounded animate-pulse" />
        <span className="text-admin-border">/</span>
        <div className="w-24 h-4 bg-admin-border/40 rounded animate-pulse" />
        <span className="text-admin-border">/</span>
        <div className="w-20 h-4 bg-admin-border/40 rounded animate-pulse" />
      </div>

      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="w-48 h-7 bg-admin-border/50 rounded-xl animate-pulse" />
        <div className="w-64 h-4 bg-admin-border/30 rounded-md animate-pulse" />
      </div>

      {/* Form Card Skeleton */}
      <div className="glass-dark rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Type selector skeleton */}
        <div className="space-y-2">
          <div className="w-24 h-4 bg-admin-border/40 rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-admin-border/25 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Input skeletons */}
        <div className="space-y-2">
          <div className="w-28 h-4 bg-admin-border/40 rounded animate-pulse" />
          <div className="w-full h-11 bg-admin-border/30 rounded-xl animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="w-32 h-4 bg-admin-border/40 rounded animate-pulse" />
          <div className="w-full h-24 bg-admin-border/30 rounded-xl animate-pulse" />
        </div>

        {/* Action buttons skeleton */}
        <div className="flex gap-3 pt-2">
          <div className="w-32 h-11 bg-admin-accent/20 rounded-xl animate-pulse" />
          <div className="w-20 h-11 bg-admin-border/30 rounded-xl animate-pulse" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-shimmer pointer-events-none" />
      </div>
    </div>
  );
}
