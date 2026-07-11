function UsersLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="relative overflow-hidden rounded-2xl border border-edge/40 bg-surface/40 p-4"
        >
          {/* Shimmer */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-content/5 to-transparent" />

          <div className="relative flex items-center gap-3">
            {/* Avatar */}
            <div className="h-12 w-12 rounded-full bg-surface2/70" />

            {/* Text */}
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded-full bg-surface2/70" />
              <div className="h-3 w-24 rounded-full bg-surface2/40" />
            </div>

            {/* Badge */}
            <div className="h-6 w-6 rounded-full bg-surface2/50" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default UsersLoadingSkeleton;