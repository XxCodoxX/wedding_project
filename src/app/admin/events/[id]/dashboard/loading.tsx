export default function DashboardLoading() {
  return (
    <div className="animate-fade-in space-y-8 select-none">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="w-16 h-4 bg-admin-border/40 rounded-md animate-pulse" />
        <span className="text-admin-border">/</span>
        <div className="w-36 h-4 bg-admin-border/40 rounded-md animate-pulse" />
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="w-64 h-7 bg-admin-border/50 rounded-xl animate-pulse" />
          <div className="w-48 h-4 bg-admin-border/30 rounded-md animate-pulse" />
        </div>
        <div className="w-36 h-10 bg-admin-accent/20 rounded-xl animate-pulse" />
      </div>

      {/* 5 Stats Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="glass-dark rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-admin-border/40 animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="w-16 h-3 bg-admin-border/40 rounded animate-pulse" />
                <div className="w-10 h-6 bg-admin-border/60 rounded-md animate-pulse" />
              </div>
            </div>
            {/* Shimmer Bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Table Skeleton (Desktop) */}
      <div className="glass-dark rounded-2xl p-6 hidden md:block relative overflow-hidden space-y-4">
        {/* Table header bar */}
        <div className="flex items-center justify-between border-b border-admin-border pb-4">
          <div className="w-32 h-4 bg-admin-border/40 rounded animate-pulse" />
          <div className="w-20 h-4 bg-admin-border/40 rounded animate-pulse" />
          <div className="w-24 h-4 bg-admin-border/40 rounded animate-pulse" />
          <div className="w-20 h-4 bg-admin-border/40 rounded animate-pulse" />
          <div className="w-16 h-4 bg-admin-border/40 rounded animate-pulse" />
        </div>

        {/* 5 Shimmer Rows */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3.5 border-b border-admin-border/40 last:border-b-0"
          >
            <div className="space-y-1.5 w-1/4">
              <div className="w-36 h-4 bg-admin-border/50 rounded animate-pulse" />
              <div className="w-24 h-3 bg-admin-border/30 rounded animate-pulse" />
            </div>
            <div className="w-20 h-6 bg-admin-border/30 rounded-lg animate-pulse" />
            <div className="w-24 h-6 bg-admin-border/30 rounded-lg animate-pulse" />
            <div className="w-28 h-7 bg-admin-border/30 rounded-lg animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-admin-border/30 rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-admin-border/30 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}

        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-shimmer pointer-events-none" />
      </div>

      {/* Cards Skeleton (Mobile) */}
      <div className="space-y-3 md:hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-dark rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-32 h-4 bg-admin-border/50 rounded animate-pulse" />
              <div className="w-16 h-5 bg-admin-border/30 rounded-lg animate-pulse" />
            </div>
            <div className="w-20 h-5 bg-admin-border/30 rounded-lg animate-pulse" />
            <div className="flex items-center justify-between pt-2 border-t border-admin-border/40">
              <div className="w-24 h-6 bg-admin-border/30 rounded animate-pulse" />
              <div className="w-16 h-6 bg-admin-border/30 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
