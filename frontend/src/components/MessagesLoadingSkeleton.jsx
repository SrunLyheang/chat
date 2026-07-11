function MessagesLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className={`chat ${index % 2 === 0 ? "chat-start" : "chat-end"}`}
        >
          {/* Avatar */}
          <div className="chat-image avatar">
            <div className="w-10 rounded-full">
              <div className="h-10 w-10 rounded-full bg-surface2 animate-pulse" />
            </div>
          </div>

          {/* Bubble */}
          <div
            className={`relative overflow-hidden rounded-2xl border border-edge/50 bg-surface/70 p-4 backdrop-blur-sm ${index % 2 === 0 ? "w-60" : "w-44"
              }`}
          >
            {/* Shimmer */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-[shimmer_2s_linear_infinite]" />

            <div className="relative space-y-2">
              <div className="h-3 w-full rounded-full bg-surface2" />
              <div className="h-3 w-2/3 rounded-full bg-surface2/80" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MessagesLoadingSkeleton;