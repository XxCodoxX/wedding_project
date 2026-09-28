export default function EventsLoading() {
  return (
    <div className="animate-fade-in space-y-8 select-none">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="w-48 h-7 bg-admin-border/50 rounded-xl animate-pulse" />
          <div className="w-64 h-4 bg-admin-border/30 rounded-md animate-pulse" />
        </div>
        <div className="w-32 h-10 bg-admin-accent/20 rounded-xl animate-pulse" />
      </div>

      {/* Grid of Event Card Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="glass-dark rounded-2xl p-6 flex flex-col h-64 relative overflow-hidden justify-between"
          >
            <div className="space-y-3">
              {/* Couple Name skeleton */}
              <div className="w-3/4 h-6 bg-admin-border/60 rounded-lg animate-pulse" />
              {/* Date skeleton */}
              <div className="w-1/2 h-4 bg-admin-border/35 rounded animate-pulse" />
              {/* Venue skeleton */}
              <div className="w-2/3 h-4 bg-admin-border/25 rounded animate-pulse" />
            </div>

            {/* Bottom Actions skeleton */}
            <div className="pt-4 border-t border-admin-border/40 flex items-center justify-between">
              <div className="w-24 h-8 bg-admin-accent/15 rounded-lg animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-admin-border/30 rounded-lg animate-pulse" />
                <div className="w-8 h-8 bg-admin-border/30 rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Shimmer sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-shimmer pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
